import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userIds, title, body, url } = req.body;

    if (!userIds || userIds.length === 0) {
      return res.status(400).json({ error: "userIds kosong" });
    }

    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const payload = JSON.stringify({
      title: title || "Penyelesaian Studi",
      body: body || "Ada pesan baru dari admin.",
      url: url || "/",
    });

    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    );

    return res.status(200).json({ success: true, total: subscriptions.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}