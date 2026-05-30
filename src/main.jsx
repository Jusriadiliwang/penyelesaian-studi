import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen,
  CalendarDays,
  CheckCircle,
  Circle,
  ClipboardList,
  Download,
  Eye,
  FileText,
  GraduationCap,
  LogIn,
  LogOut,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import "./style.css";

const daftarMataKuliahAwal = [
  { kode: "CW6552021664", nama: "Praktikum Aplikasi Komputasi Bergerak", sks: 1 },
  { kode: "CW6552021675", nama: "Praktikum Microservices: Design and Implementation", sks: 1 },
  { kode: "CW6552021679", nama: "Praktikum Scalable Systems Design", sks: 1 },
  { kode: "CW6552021681", nama: "Praktikum Mobile and Cross-Platform Development", sks: 1 },
  { kode: "CW6552022440", nama: "Sistem Terdistribusi", sks: 2 },
  { kode: "CW6552022661", nama: "Legal Aspek Produk Teknologi Informasi dan Komunikasi", sks: 2 },
  { kode: "CW6552022662", nama: "Algoritma Pemrograman Paralel", sks: 2 },
  { kode: "CW6552022663", nama: "Aplikasi Komputasi Bergerak", sks: 2 },
  { kode: "CW6552022665", nama: "Teknologi Game", sks: 2 },
  { kode: "CW6552022674", nama: "Microservices: Design and Implementation", sks: 2 },
  { kode: "CW6552022678", nama: "Scalable Systems Design", sks: 2 },
  { kode: "CW6552022680", nama: "Mobile and Cross-Platform Development", sks: 2 },
  { kode: "CW6552023676", nama: "Secure Software Development Lifecycle (DevSecOps)", sks: 2 },
  { kode: "CW6552023677", nama: "Advanced Software Testing and Quality Assurance", sks: 2 },
];

const hariList = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authMode, setAuthMode] = useState("mahasiswa");
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regNama, setRegNama] = useState("");
  const [regNim, setRegNim] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("all");

  const [tasks, setTasks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [taskMode, setTaskMode] = useState("matakuliah");
  const [taskKode, setTaskKode] = useState(daftarMataKuliahAwal[0].kode);
  const [customTaskTitle, setCustomTaskTitle] = useState("");
  const [customTaskSks, setCustomTaskSks] = useState(0);
  const [taskName, setTaskName] = useState("");
  const [taskStatus, setTaskStatus] = useState("belum");
  const [taskNote, setTaskNote] = useState("");
  const [taskPhoto, setTaskPhoto] = useState("");

  const [scheduleKode, setScheduleKode] = useState(daftarMataKuliahAwal[0].kode);
  const [scheduleHari, setScheduleHari] = useState("Senin");
  const [scheduleMulai, setScheduleMulai] = useState("08:00");
  const [scheduleSelesai, setScheduleSelesai] = useState("09:40");
  const [scheduleRuangan, setScheduleRuangan] = useState("");
  const [scheduleDosen, setScheduleDosen] = useState("");
  const [scheduleCatatan, setScheduleCatatan] = useState("");

  const [materialTitle, setMaterialTitle] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [materialFile, setMaterialFile] = useState(null);

  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] = useState("tugas");

  useEffect(() => {
    initAuth();

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      if (newSession?.user) {
        loadProfile(newSession.user);
      } else {
        setProfile(null);
        setTasks([]);
        setSchedules([]);
        setMaterials([]);
        setStudents([]);
        setLoading(false);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  async function initAuth() {
    setLoading(true);

    const { data } = await supabase.auth.getSession();
    setSession(data.session);

    if (data.session?.user) {
      await loadProfile(data.session.user);
    } else {
      setLoading(false);
    }
  }

  async function loadProfile(user) {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      setAuthMessage("Profil pengguna belum ditemukan. Pastikan supabase-schema.sql sudah dijalankan.");
      setLoading(false);
      return;
    }

    setProfile(data);
    await loadData(data);
    setLoading(false);
  }

  async function updateLastLogin(userId) {
    await supabase
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", userId);
  }

  async function loadData(currentProfile = profile) {
    if (!currentProfile) return;

    const { data: materialData } = await supabase
      .from("materials")
      .select("*")
      .order("created_at", { ascending: false });

    setMaterials(materialData || []);

    if (currentProfile.role === "admin") {
      const { data: studentData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      setStudents(studentData || []);

      let taskQuery = supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      let scheduleQuery = supabase
        .from("schedules")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedStudentId !== "all") {
        taskQuery = taskQuery.eq("user_id", selectedStudentId);
        scheduleQuery = scheduleQuery.eq("user_id", selectedStudentId);
      }

      const { data: taskData } = await taskQuery;
      const { data: scheduleData } = await scheduleQuery;

      setTasks(taskData || []);
      setSchedules(scheduleData || []);
    } else {
      const { data: taskData } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", currentProfile.id)
        .order("created_at", { ascending: false });

      const { data: scheduleData } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", currentProfile.id)
        .order("created_at", { ascending: true });

      setTasks(taskData || []);
      setSchedules(scheduleData || []);
    }
  }

  useEffect(() => {
    if (profile?.role === "admin") {
      loadData(profile);
    }
  }, [selectedStudentId]);

  async function handleRegister(e) {
    e.preventDefault();
    setAuthMessage("");

    if (!regNama || !regNim || !regEmail || !regPassword) {
      setAuthMessage("Semua data registrasi harus diisi.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          nama: regNama,
          nim: regNim,
          role: "mahasiswa",
        },
      },
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("Registrasi berhasil. Silakan cek email dan klik link verifikasi.");
    setRegNama("");
    setRegNim("");
    setRegEmail("");
    setRegPassword("");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profileData) {
      setAuthMessage("Profil tidak ditemukan. Jalankan supabase-schema.sql terlebih dahulu.");
      await supabase.auth.signOut();
      return;
    }

    if (authMode === "admin" && profileData.role !== "admin") {
      setAuthMessage("Akun ini bukan admin. Silakan login sebagai mahasiswa.");
      await supabase.auth.signOut();
      return;
    }

    if (authMode === "mahasiswa" && profileData.role === "admin") {
      setAuthMessage("Akun ini adalah admin. Silakan login melalui menu Admin.");
      await supabase.auth.signOut();
      return;
    }

    await updateLastLogin(data.user.id);

    setProfile({
      ...profileData,
      last_login: new Date().toISOString(),
    });

    await loadData(profileData);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setTasks([]);
    setSchedules([]);
    setMaterials([]);
    setStudents([]);
    setLoginEmail("");
    setLoginPassword("");
  }

  function getStudentName(userId) {
    const student = students.find((item) => item.id === userId);
    if (!student) return "-";
    return `${student.nama} (${student.nim})`;
  }

  function formatDateTime(value) {
    if (!value) return "Belum pernah login";
    return new Date(value).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function getCourse(kode) {
    return daftarMataKuliahAwal.find((item) => item.kode === kode);
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 900 * 1024) {
      alert("Ukuran foto terlalu besar. Maksimal 900 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTaskPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function addTask(e) {
    e.preventDefault();

    if (!profile) return;

    if (profile.role === "admin") {
      alert("Admin hanya memantau data. Tugas dibuat oleh mahasiswa.");
      return;
    }

    if (!taskName.trim()) {
      alert("Nama tugas harus diisi.");
      return;
    }

    let taskData = {};

    if (taskMode === "matakuliah") {
      const course = getCourse(taskKode);

      taskData = {
        user_id: profile.id,
        kode: course.kode,
        mata_kuliah: course.nama,
        sks: course.sks,
        tugas: taskName,
        status: taskStatus,
        catatan: taskNote,
        foto: taskPhoto,
      };
    } else {
      if (!customTaskTitle.trim()) {
        alert("Nama kategori tugas lain harus diisi.");
        return;
      }

      taskData = {
        user_id: profile.id,
        kode: "LAINNYA",
        mata_kuliah: customTaskTitle,
        sks: Number(customTaskSks || 0),
        tugas: taskName,
        status: taskStatus,
        catatan: taskNote,
        foto: taskPhoto,
      };
    }

    const { error } = await supabase.from("tasks").insert(taskData);

    if (error) {
      alert("Gagal menyimpan tugas: " + error.message);
      return;
    }

    setTaskName("");
    setTaskStatus("belum");
    setTaskNote("");
    setTaskPhoto("");
    setCustomTaskTitle("");
    setCustomTaskSks(0);

    await loadData(profile);
  }

  async function updateTaskStatus(id, status) {
    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("Gagal mengubah status: " + error.message);
      return;
    }

    await loadData(profile);
  }

  async function deleteTask(id) {
    const ok = confirm("Yakin ingin menghapus tugas ini?");
    if (!ok) return;

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      alert("Gagal menghapus tugas: " + error.message);
      return;
    }

    await loadData(profile);
  }

  async function addScheduleByAdmin(e) {
    e.preventDefault();

    if (profile?.role !== "admin") {
      alert("Hanya admin yang bisa mengirim jadwal kuliah.");
      return;
    }

    const mahasiswaList = students.filter((student) => student.role === "mahasiswa");

    if (mahasiswaList.length === 0) {
      alert("Belum ada mahasiswa yang terdaftar.");
      return;
    }

    const course = getCourse(scheduleKode);

    const dataJadwal = mahasiswaList.map((student) => ({
      user_id: student.id,
      kode: course.kode,
      mata_kuliah: course.nama,
      sks: course.sks,
      hari: scheduleHari,
      mulai: scheduleMulai,
      selesai: scheduleSelesai,
      ruangan: scheduleRuangan,
      dosen: scheduleDosen,
      catatan: scheduleCatatan,
    }));

    const { error } = await supabase.from("schedules").insert(dataJadwal);

    if (error) {
      alert("Gagal mengirim jadwal: " + error.message);
      return;
    }

    alert("Jadwal kuliah berhasil dikirim ke semua mahasiswa.");

    setScheduleKode(daftarMataKuliahAwal[0].kode);
    setScheduleHari("Senin");
    setScheduleMulai("08:00");
    setScheduleSelesai("09:40");
    setScheduleRuangan("");
    setScheduleDosen("");
    setScheduleCatatan("");

    await loadData(profile);
  }

  async function deleteSchedule(id) {
    if (profile?.role !== "admin") {
      alert("Hanya admin yang bisa menghapus jadwal.");
      return;
    }

    const ok = confirm("Yakin ingin menghapus jadwal ini?");
    if (!ok) return;

    const { error } = await supabase.from("schedules").delete().eq("id", id);

    if (error) {
      alert("Gagal menghapus jadwal: " + error.message);
      return;
    }

    await loadData(profile);
  }

  async function uploadMaterialByAdmin(e) {
    e.preventDefault();

    if (profile?.role !== "admin") {
      alert("Hanya admin yang bisa mengirim file tugas.");
      return;
    }

    if (!materialTitle.trim()) {
      alert("Judul file tugas harus diisi.");
      return;
    }

    if (!materialFile) {
      alert("Pilih file atau foto tugas terlebih dahulu.");
      return;
    }

    const safeName = materialFile.name.replace(/\s+/g, "-").toLowerCase();
    const filePath = `admin-files/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("task-files")
      .upload(filePath, materialFile);

    if (uploadError) {
      alert("Gagal upload file: " + uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("task-files")
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("materials").insert({
      title: materialTitle,
      description: materialDescription,
      file_name: materialFile.name,
      file_url: publicUrlData.publicUrl,
      file_type: materialFile.type || "file",
      created_by: profile.id,
    });

    if (insertError) {
      alert("Gagal menyimpan data file: " + insertError.message);
      return;
    }

    alert("File tugas berhasil dikirim ke mahasiswa.");

    setMaterialTitle("");
    setMaterialDescription("");
    setMaterialFile(null);

    await loadData(profile);
  }

  async function deleteMaterial(id) {
    if (profile?.role !== "admin") {
      alert("Hanya admin yang bisa menghapus file tugas.");
      return;
    }

    const ok = confirm("Yakin ingin menghapus file tugas ini?");
    if (!ok) return;

    const { error } = await supabase.from("materials").delete().eq("id", id);

    if (error) {
      alert("Gagal menghapus file: " + error.message);
      return;
    }

    await loadData(profile);
  }

  const filteredTasks = useMemo(() => {
    const keyword = search.toLowerCase();

    return tasks.filter((item) => {
      return (
        item.kode?.toLowerCase().includes(keyword) ||
        item.mata_kuliah?.toLowerCase().includes(keyword) ||
        item.tugas?.toLowerCase().includes(keyword) ||
        item.catatan?.toLowerCase().includes(keyword)
      );
    });
  }, [tasks, search]);

  const tasksDone = filteredTasks.filter((item) => item.status === "selesai");
  const tasksNotDone = filteredTasks.filter((item) => item.status !== "selesai");

  const totalTasks = tasks.length;
  const totalDone = tasks.filter((item) => item.status === "selesai").length;
  const totalNotDone = tasks.filter((item) => item.status !== "selesai").length;
  const percent = totalTasks === 0 ? 0 : Math.round((totalDone / totalTasks) * 100);

  const totalSks = daftarMataKuliahAwal.reduce((sum, item) => sum + item.sks, 0);
  const doneSks = tasks
    .filter((item) => item.status === "selesai")
    .reduce((sum, item) => sum + Number(item.sks || 0), 0);

  const sksPercent = totalSks === 0 ? 0 : Math.round((doneSks / totalSks) * 100);

  function exportPdf() {
  const gambarDariTugas = tasks
    .filter((item) => item.file_url && item.file_type?.startsWith("image/"))
    .map((item) => ({
      judul: item.tugas || item.nama_tugas || "Gambar Tugas",
      deskripsi: item.catatan || "-",
      sumber: item.mata_kuliah || "-",
      url: item.file_url,
    }));

  const gambarDariAdmin = materials
    .filter((item) => item.file_url && item.file_type?.startsWith("image/"))
    .map((item) => ({
      judul: item.title || "File dari Admin",
      deskripsi: item.description || "-",
      sumber: "File Tugas Admin",
      url: item.file_url,
    }));

  const gambarTugas = [...gambarDariTugas, ...gambarDariAdmin];

  if (gambarTugas.length === 0) {
    alert("Belum ada gambar yang diupload. PDF hanya dibuat dari file gambar/foto.");
    return;
  }

  const htmlGambar = gambarTugas
    .map((item, index) => {
      return `
        <div class="pdfImageCard">
          <h2>Gambar ${index + 1}</h2>
          <p><b>Judul:</b> ${item.judul}</p>
          <p><b>Sumber:</b> ${item.sumber}</p>
          <p><b>Deskripsi:</b> ${item.deskripsi}</p>
          <img src="${item.url}" />
        </div>
      `;
    })
    .join("");

  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>PDF Gambar Tugas</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: white;
            color: #111827;
            padding: 24px;
          }

          h1 {
            text-align: center;
            margin-bottom: 24px;
          }

          .pdfImageCard {
            page-break-inside: avoid;
            border: 1px solid #d1d5db;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
          }

          .pdfImageCard h2 {
            margin: 0 0 10px;
            font-size: 20px;
          }

          .pdfImageCard p {
            margin: 6px 0;
            font-size: 14px;
          }

          .pdfImageCard img {
            width: 100%;
            max-height: 850px;
            object-fit: contain;
            margin-top: 14px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
          }

          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <h1>Laporan Gambar Tugas</h1>
        ${htmlGambar}
        <div class="footer">jusry 30-05-2026</div>
      </body>
    </html>
  `);

  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 700);
}

  if (loading) {
    return <div className="loading">Memuat profil pengguna...</div>;
  }

  if (!session || !profile) {
    return (
      <div className="loginPage">
        <section className="loginHero">
          <GraduationCap size={42} />
          <h1>Penyelesaian Studi</h1>
        </section>

        <section className="loginBox">
          <div className="tabRow">
            <button
              className={authMode === "mahasiswa" ? "active" : ""}
              onClick={() => {
                setAuthMode("mahasiswa");
                setAuthMessage("");
              }}
            >
              <User size={17} />
              Mahasiswa
            </button>

            <button
              className={authMode === "admin" ? "active" : ""}
              onClick={() => {
                setAuthMode("admin");
                setAuthMessage("");
              }}
            >
              <ShieldCheck size={17} />
              Admin
            </button>

            <button
              className={authMode === "registrasi" ? "active" : ""}
              onClick={() => {
                setAuthMode("registrasi");
                setAuthMessage("");
              }}
            >
              Registrasi
            </button>
          </div>

          {authMode === "registrasi" ? (
            <form onSubmit={handleRegister} className="authForm">
              <h2>Registrasi Mahasiswa</h2>

              <input
                type="text"
                placeholder="Nama lengkap"
                value={regNama}
                onChange={(e) => setRegNama(e.target.value)}
              />

              <input
                type="text"
                placeholder="NIM"
                value={regNim}
                onChange={(e) => setRegNim(e.target.value)}
              />

              <input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />

              <button type="submit">Daftar & Kirim Verifikasi</button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="authForm">
              <h2>{authMode === "admin" ? "Login Admin" : "Login Mahasiswa"}</h2>

              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />

              <button type="submit">
                <LogIn size={17} />
                Login
              </button>
            </form>
          )}

          {authMessage && <div className="message">{authMessage}</div>}
        </section>
      </div>
    );
  }

  return (
    <div className="page" id="printArea">
      <header className="hero">
        <div>
          <p className="miniLabel">Menu Penyelesaian Studi</p>
          <h1>Checklist Tugas dan Mata Kuliah</h1>
          <p>
            Halo, {profile.nama}. Role akun: <b>{profile.role}</b>
          </p>
        </div>

        <div className="heroActions">
          <button onClick={exportPdf}>
            <Download size={17} />
            PDF
          </button>

          <button onClick={logout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      {profile.role === "admin" && (
        <>
          <section className="card">
            <h2>Panel Admin</h2>
            <p>Lihat data semua mahasiswa atau pilih satu mahasiswa.</p>

            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="all">Semua mahasiswa</option>
              {students
                .filter((student) => student.role === "mahasiswa")
                .map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.nama} - {student.nim} - {student.email}
                  </option>
                ))}
            </select>
          </section>

          <section className="card">
            <div className="sectionTitle">
              <Users size={22} />
              <h2>Daftar Mahasiswa Registrasi</h2>
            </div>

            {students.filter((student) => student.role === "mahasiswa").length === 0 ? (
              <p className="empty">Belum ada mahasiswa yang registrasi.</p>
            ) : (
              <div className="scheduleGrid">
                {students
                  .filter((student) => student.role === "mahasiswa")
                  .map((student) => (
                    <div className="scheduleCard" key={student.id}>
                      <h3>{student.nama}</h3>
                      <p><b>NIM:</b> {student.nim}</p>
                      <p><b>Email:</b> {student.email}</p>
                      <p><b>Role:</b> {student.role}</p>
                      <p><b>Registrasi:</b> {formatDateTime(student.created_at)}</p>
                      <p><b>Login Terakhir:</b> {formatDateTime(student.last_login)}</p>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </>
      )}

      <section className="statsGrid">
        <div className="statCard">
          <p>Total Tugas</p>
          <h2>{totalTasks}</h2>
        </div>

        <div className="statCard">
          <p>Tugas Selesai</p>
          <h2>{totalDone}</h2>
        </div>

        <div className="statCard">
          <p>Belum Selesai</p>
          <h2>{totalNotDone}</h2>
        </div>

        <div className="statCard">
          <p>Progres SKS</p>
          <h2>{sksPercent}%</h2>
        </div>
      </section>

      <section className="card">
        <div className="progressHeader">
          <h2>Grafik Progres Penyelesaian</h2>
          <span>{percent}% tugas selesai</span>
        </div>

        <div className="chartBlock">
          <div
            className="donut"
            style={{
              background: `conic-gradient(#2563eb ${percent * 3.6}deg, #ffedd5 0deg)`,
            }}
          >
            <div>
              <b>{percent}%</b>
              <span>Selesai</span>
            </div>
          </div>

          <div className="bars">
            <ProgressBar label="Selesai" value={totalDone} max={Math.max(totalTasks, 1)} color="#2563eb" suffix={`${totalDone} tugas`} />
            <ProgressBar label="Belum selesai" value={totalNotDone} max={Math.max(totalTasks, 1)} color="#f97316" suffix={`${totalNotDone} tugas`} />
            <ProgressBar label="SKS selesai" value={doneSks} max={totalSks} color="#16a34a" suffix={`${doneSks} dari ${totalSks} SKS`} />
          </div>
        </div>
      </section>

      <div className="menuTabs fourTabs">
        <button
          className={activeMenu === "tugas" ? "active" : ""}
          onClick={() => setActiveMenu("tugas")}
        >
          Tugas
        </button>

        <button
          className={activeMenu === "jadwal" ? "active" : ""}
          onClick={() => setActiveMenu("jadwal")}
        >
          Jadwal Kuliah
        </button>

        <button
          className={activeMenu === "file" ? "active" : ""}
          onClick={() => setActiveMenu("file")}
        >
          File Tugas
        </button>

        {profile.role === "admin" && (
          <button
            className={activeMenu === "mahasiswa" ? "active" : ""}
            onClick={() => setActiveMenu("mahasiswa")}
          >
            Mahasiswa
          </button>
        )}
      </div>

      {activeMenu === "mahasiswa" && profile.role === "admin" && (
        <section className="card">
          <div className="sectionTitle">
            <Users size={22} />
            <h2>Daftar Mahasiswa</h2>
          </div>

          {students.filter((student) => student.role === "mahasiswa").length === 0 ? (
            <p className="empty">Belum ada mahasiswa yang registrasi.</p>
          ) : (
            <div className="scheduleGrid">
              {students
                .filter((student) => student.role === "mahasiswa")
                .map((student) => (
                  <div className="scheduleCard" key={student.id}>
                    <h3>{student.nama}</h3>
                    <p><b>NIM:</b> {student.nim}</p>
                    <p><b>Email:</b> {student.email}</p>
                    <p><b>Role:</b> {student.role}</p>
                    <p><b>Registrasi:</b> {formatDateTime(student.created_at)}</p>
                    <p><b>Login Terakhir:</b> {formatDateTime(student.last_login)}</p>
                  </div>
                ))}
            </div>
          )}
        </section>
      )}

      {activeMenu === "tugas" && (
        <>
          {profile.role === "mahasiswa" && (
            <section className="card">
              <div className="sectionTitle">
                <Plus size={22} />
                <h2>Tambah Tugas</h2>
              </div>

              <form onSubmit={addTask} className="formGrid">
                <select value={taskMode} onChange={(e) => setTaskMode(e.target.value)}>
                  <option value="matakuliah">Tugas berdasarkan mata kuliah</option>
                  <option value="lainnya">Tugas lain tanpa kode mata kuliah</option>
                </select>

                {taskMode === "matakuliah" ? (
                  <select value={taskKode} onChange={(e) => setTaskKode(e.target.value)}>
                    {daftarMataKuliahAwal.map((mk) => (
                      <option key={mk.kode} value={mk.kode}>
                        {mk.nama}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Nama tugas lain, contoh: Tugas organisasi, Proposal, Sertifikat"
                      value={customTaskTitle}
                      onChange={(e) => setCustomTaskTitle(e.target.value)}
                    />

                    <input
                      type="number"
                      min="0"
                      placeholder="SKS jika ada, isi 0 jika bukan mata kuliah"
                      value={customTaskSks}
                      onChange={(e) => setCustomTaskSks(e.target.value)}
                    />
                  </>
                )}

                <input
                  type="text"
                  placeholder="Nama tugas, contoh: Laporan, PPT, Program, UAS"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />

                <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)}>
                  <option value="belum">Belum Selesai</option>
                  <option value="selesai">Selesai</option>
                </select>

                <textarea
                  placeholder="Catatan tugas, contoh: kumpul minggu depan atau revisi BAB 2"
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                />

                <label className="uploadBox">
                  <Upload size={18} />
                  Upload foto bukti / catatan
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                </label>

                {taskPhoto && <img src={taskPhoto} alt="Preview bukti" className="previewImage" />}

                {taskMode === "matakuliah" && (
                  <div className="courseInfo">
                    <BookOpen size={18} />
                    <b>{getCourse(taskKode)?.kode}</b> — {getCourse(taskKode)?.nama} | {getCourse(taskKode)?.sks} SKS
                  </div>
                )}

                <button type="submit">
                  <Save size={17} />
                  Simpan Tugas
                </button>
              </form>
            </section>
          )}

          {profile.role === "admin" && (
            <section className="card adminInfo">
              <h2>Mode Admin</h2>
              <p>
                Admin dapat memantau tugas mahasiswa, tetapi tugas dibuat oleh mahasiswa masing-masing.
                Untuk jadwal kuliah, admin dapat mengirim jadwal melalui menu <b>Jadwal Kuliah</b>.
              </p>
            </section>
          )}

          <input
            className="searchInput"
            placeholder="Cari kode, mata kuliah, atau nama tugas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <section className="listGrid">
            <TaskList
              title="Daftar Tugas Belum Selesai"
              data={tasksNotDone}
              profile={profile}
              getStudentName={getStudentName}
              onStatus={updateTaskStatus}
              onDelete={deleteTask}
              targetStatus="selesai"
            />

            <TaskList
              title="Daftar Tugas Selesai"
              data={tasksDone}
              profile={profile}
              getStudentName={getStudentName}
              onStatus={updateTaskStatus}
              onDelete={deleteTask}
              targetStatus="belum"
            />
          </section>
        </>
      )}

      {activeMenu === "jadwal" && (
        <>
          {profile.role === "admin" && (
            <section className="card">
              <div className="sectionTitle">
                <CalendarDays size={22} />
                <h2>Kirim Jadwal Kuliah ke Semua Mahasiswa</h2>
              </div>

              <p className="hint">
                Jadwal hanya bisa dibuat oleh admin dan akan dikirim otomatis ke semua mahasiswa yang terdaftar.
              </p>

              <form onSubmit={addScheduleByAdmin} className="formGrid">
                <select value={scheduleKode} onChange={(e) => setScheduleKode(e.target.value)}>
                  {daftarMataKuliahAwal.map((mk) => (
                    <option key={mk.kode} value={mk.kode}>
                      {mk.nama}
                    </option>
                  ))}
                </select>

                <select value={scheduleHari} onChange={(e) => setScheduleHari(e.target.value)}>
                  {hariList.map((hari) => (
                    <option key={hari} value={hari}>
                      {hari}
                    </option>
                  ))}
                </select>

                <div className="twoCols">
                  <input
                    type="time"
                    value={scheduleMulai}
                    onChange={(e) => setScheduleMulai(e.target.value)}
                  />

                  <input
                    type="time"
                    value={scheduleSelesai}
                    onChange={(e) => setScheduleSelesai(e.target.value)}
                  />
                </div>

                <input
                  type="text"
                  placeholder="Ruangan / kelas / link Zoom"
                  value={scheduleRuangan}
                  onChange={(e) => setScheduleRuangan(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Nama dosen"
                  value={scheduleDosen}
                  onChange={(e) => setScheduleDosen(e.target.value)}
                />

                <textarea
                  placeholder="Catatan jadwal, contoh: bawa laptop / kelas online"
                  value={scheduleCatatan}
                  onChange={(e) => setScheduleCatatan(e.target.value)}
                />

                <button type="submit">
                  <Save size={17} />
                  Kirim Jadwal
                </button>
              </form>
            </section>
          )}

          {profile.role === "mahasiswa" && (
            <section className="card adminInfo">
              <h2>Jadwal Kuliah Saya</h2>
              <p>Jadwal kuliah di bawah ini dikirim oleh admin.</p>
            </section>
          )}

          <ScheduleList
            data={schedules}
            profile={profile}
            getStudentName={getStudentName}
            onDelete={deleteSchedule}
          />
        </>
      )}

      {activeMenu === "file" && (
        <>
          {profile.role === "admin" && (
            <section className="card">
              <div className="sectionTitle">
                <Upload size={22} />
                <h2>Kirim File / Foto Tugas</h2>
              </div>

              <p className="hint">
                File yang dikirim admin akan tampil di akun mahasiswa dan bisa diunduh.
              </p>

              <form onSubmit={uploadMaterialByAdmin} className="formGrid">
                <input
                  type="text"
                  placeholder="Judul file tugas, contoh: Tugas Pertemuan 1"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                />

                <textarea
                  placeholder="Deskripsi tugas, contoh: Kerjakan laporan dan kumpulkan minggu depan"
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                />

                <label className="uploadBox">
                  <Upload size={18} />
                  {materialFile ? materialFile.name : "Upload file/foto tugas"}
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                    onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
                    hidden
                  />
                </label>

                <button type="submit">
                  <Save size={17} />
                  Kirim File Tugas
                </button>
              </form>
            </section>
          )}

          {profile.role === "mahasiswa" && (
            <section className="card adminInfo">
              <h2>File Tugas dari Admin</h2>
              <p>
                File di bawah ini dikirim oleh admin. Silakan unduh dan kerjakan sesuai instruksi.
              </p>
            </section>
          )}

          <MaterialList
            data={materials}
            profile={profile}
            onDelete={deleteMaterial}
          />
        </>
      )}
      <footer className="footerCredit">
      di buat pada  30-05-2026 if rpl 6-a
    </footer>
    </div>
  );
}

function ProgressBar({ label, value, max, color, suffix }) {
  const width = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="progressItem">
      <div className="progressLineTop">
        <b>{label}</b>
        <span>{suffix}</span>
      </div>

      <div className="progressTrack">
        <div style={{ width: `${width}%`, background: color }} />
      </div>
    </div>
  );
}

function TaskList({
  title,
  data,
  profile,
  getStudentName,
  onStatus,
  onDelete,
  targetStatus,
}) {
  return (
    <div className="tableCard">
      <div className="tableHeader">
        <div className="sectionTitle small">
          <ClipboardList size={22} />
          <h2>{title}</h2>
        </div>

        <span className="badge">{data.length} tugas</span>
      </div>

      {data.length === 0 ? (
        <p className="empty">Belum ada data.</p>
      ) : (
        <div className="cardList">
          {data.map((item) => (
            <div className="taskCard" key={item.id}>
              {profile.role === "admin" && (
                <p className="studentTag">
                  <Eye size={14} />
                  {getStudentName(item.user_id)}
                </p>
              )}

              <div className="taskTop">
                <b>{item.kode}</b>
                <span className={item.status === "selesai" ? "status selesai" : "status belum"}>
                  {item.status === "selesai" ? "Selesai" : "Belum"}
                </span>
              </div>

              <h3>{item.mata_kuliah}</h3>

              <p>
                <b>Tugas:</b> {item.tugas}
              </p>

              <p>
                <b>SKS:</b> {item.sks}
              </p>

              {item.catatan && (
                <p>
                  <b>Catatan:</b> {item.catatan}
                </p>
              )}

              {item.foto && <img src={item.foto} alt="Bukti tugas" className="proofImage" />}

              <div className="actionRow">
                {profile.role === "mahasiswa" && (
                  <button
                    className={targetStatus === "selesai" ? "softBtn" : "softBtn orange"}
                    onClick={() => onStatus(item.id, targetStatus)}
                  >
                    {targetStatus === "selesai" ? <CheckCircle size={16} /> : <Circle size={16} />}
                    {targetStatus === "selesai" ? "Tandai Selesai" : "Tandai Belum"}
                  </button>
                )}

                <button className="dangerBtn" onClick={() => onDelete(item.id)}>
                  <Trash2 size={16} />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleList({ data, profile, getStudentName, onDelete }) {
  return (
    <section className="card">
      <div className="sectionTitle">
        <CalendarDays size={22} />
        <h2>{profile.role === "admin" ? "Daftar Jadwal Kuliah Mahasiswa" : "Jadwal Kuliah dari Admin"}</h2>
      </div>

      {data.length === 0 ? (
        <p className="empty">Belum ada jadwal kuliah.</p>
      ) : (
        <div className="scheduleGrid">
          {data.map((item) => (
            <div className="scheduleCard" key={item.id}>
              {profile.role === "admin" && (
                <p className="studentTag">
                  <User size={14} />
                  {getStudentName(item.user_id)}
                </p>
              )}

              <h3>{item.mata_kuliah}</h3>

              <p><b>Kode:</b> {item.kode}</p>
              <p><b>Hari/Jam:</b> {item.hari}, {item.mulai} - {item.selesai}</p>
              <p><b>SKS:</b> {item.sks}</p>
              <p><b>Dosen:</b> {item.dosen || "-"}</p>
              <p><b>Ruangan/Zoom:</b> {item.ruangan || "-"}</p>

              {item.catatan && <p><b>Catatan:</b> {item.catatan}</p>}

              {profile.role === "admin" && (
                <button className="dangerBtn" onClick={() => onDelete(item.id)}>
                  <Trash2 size={16} />
                  Hapus Jadwal
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MaterialList({ data, profile, onDelete }) {
  return (
    <section className="card">
      <div className="sectionTitle">
        <FileText size={22} />
        <h2>Daftar File Tugas</h2>
      </div>

      {data.length === 0 ? (
        <p className="empty">Belum ada file tugas dari admin.</p>
      ) : (
        <div className="scheduleGrid">
          {data.map((item) => (
            <div className="scheduleCard" key={item.id}>
              <h3>{item.title}</h3>

              {item.description && (
                <p>
                  <b>Deskripsi:</b> {item.description}
                </p>
              )}

              <p>
                <b>Nama file:</b> {item.file_name}
              </p>

              <p>
                <b>Tipe:</b> {item.file_type || "-"}
              </p>

              {item.file_type?.startsWith("image/") && (
                <img
                  src={item.file_url}
                  alt={item.title}
                  className="proofImage"
                />
              )}

              <div className="actionRow">
                <a
                  className="downloadBtn"
                  href={item.file_url}
                  target="_blank"
                  rel="noreferrer"
                  download
                >
                  <Download size={16} />
                  Download
                </a>

                {profile.role === "admin" && (
                  <button
                    className="dangerBtn"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 size={16} />
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);