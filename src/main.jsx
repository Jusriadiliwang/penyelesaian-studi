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
  Send,
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
  const [menuLoading, setMenuLoading] = useState(false);
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
  const [taskFile, setTaskFile] = useState(null);
  const [taskFilePreview, setTaskFilePreview] = useState("");

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
        clearAllData();
        setLoading(false);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!profile) return;

    if (activeMenu === "tugas") loadTasks(profile);
    if (activeMenu === "jadwal") loadSchedules(profile);
    if (activeMenu === "file") loadMaterials();
    if (activeMenu === "mahasiswa" && profile.role === "admin") loadStudents();
  }, [activeMenu, selectedStudentId, profile?.id]);

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

  function clearAllData() {
    setProfile(null);
    setTasks([]);
    setSchedules([]);
    setMaterials([]);
    setStudents([]);
    setLoginEmail("");
    setLoginPassword("");
  }

  async function loadProfile(user) {
  setLoading(true);

  try {
    let { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      const newProfile = {
        id: user.id,
        nama: user.user_metadata?.nama || "Mahasiswa",
        nim: user.user_metadata?.nim || "-",
        email: user.email,
        role: user.user_metadata?.role || "mahasiswa",
        last_login: new Date().toISOString(),
      };

      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        setAuthMessage("Profil belum tersedia. Silakan coba login ulang atau hubungi admin.");
        setLoading(false);
        return;
      }

      data = createdProfile;
    }

    // Tampilkan halaman dulu supaya tidak lama loading
    setProfile(data);
    setLoading(false);

    // Update login dan data lain dimuat di belakang
    updateLastLogin(user.id);

    if (data.role === "admin") {
      loadStudents();
    }

    loadTasks(data);
  } catch (err) {
    console.error("Gagal memuat profil:", err);
    setAuthMessage("Gagal memuat profil. Periksa koneksi internet atau Supabase.");
    setLoading(false);
  }
}
  async function updateLastLogin(userId) {
    await supabase
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", userId);
  }

  async function loadStudents() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    setStudents(data || []);
  }

  async function loadTasks(currentProfile = profile) {
    if (!currentProfile) return;
    setMenuLoading(true);

    let query = supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (currentProfile.role === "admin") {
      query = query.eq("dikirim_admin", true);
      if (selectedStudentId !== "all") query = query.eq("user_id", selectedStudentId);
    } else {
      query = query.eq("user_id", currentProfile.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      alert("Gagal memuat tugas: " + error.message);
    }

    setTasks(data || []);
    setMenuLoading(false);
  }

  async function loadSchedules(currentProfile = profile) {
    if (!currentProfile) return;
    setMenuLoading(true);

    let query = supabase
      .from("schedules")
      .select("*")
      .order("created_at", { ascending: false });

    if (currentProfile.role === "admin") {
      if (selectedStudentId !== "all") query = query.eq("user_id", selectedStudentId);
    } else {
      query = query.eq("user_id", currentProfile.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      alert("Gagal memuat jadwal: " + error.message);
    }

    setSchedules(data || []);
    setMenuLoading(false);
  }

  async function loadMaterials() {
    setMenuLoading(true);

    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Gagal memuat file tugas admin: " + error.message);
    }

    setMaterials(data || []);
    setMenuLoading(false);
  }

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
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setAuthMessage(error.message);
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profileData) {
      const newProfile = {
        id: data.user.id,
        nama: data.user.user_metadata?.nama || "Mahasiswa",
        nim: data.user.user_metadata?.nim || "-",
        email: data.user.email,
        role: data.user.user_metadata?.role || "mahasiswa",
        last_login: new Date().toISOString(),
      };

      const { data: createdProfile, error: createProfileError } = await supabase
        .from("profiles")
        .insert(newProfile)
        .select()
        .single();

      if (createProfileError) {
        setAuthMessage("Profil gagal dibuat otomatis: " + createProfileError.message);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      setProfile(createdProfile);
      await loadTasks(createdProfile);
      setLoading(false);
      return;
    }

    if (authMode === "admin" && profileData.role !== "admin") {
      setAuthMessage("Akun ini bukan admin. Silakan login sebagai mahasiswa.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (authMode === "mahasiswa" && profileData.role === "admin") {
      setAuthMessage("Akun ini adalah admin. Silakan login melalui menu Admin.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    await updateLastLogin(data.user.id);

    const updatedProfile = {
      ...profileData,
      last_login: new Date().toISOString(),
    };

    setProfile(updatedProfile);

    if (updatedProfile.role === "admin") await loadStudents();
    await loadTasks(updatedProfile);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    clearAllData();
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

    const maxSize = 8 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Ukuran file terlalu besar. Maksimal 8 MB.");
      return;
    }

    setTaskFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setTaskFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setTaskFilePreview("");
    }
  }

  async function addTask(e, modeSimpan = "akun") {
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

    if (taskMode === "lainnya" && !customTaskTitle.trim()) {
      alert("Nama tugas lain harus diisi.");
      return;
    }

    let uploadedFileUrl = "";
    let uploadedFileName = "";
    let uploadedFileType = "";

    if (taskFile) {
      const safeName = taskFile.name.replace(/\s+/g, "-").toLowerCase();
      const filePath = `${profile.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("student-task-files")
        .upload(filePath, taskFile);

      if (uploadError) {
        alert("Gagal upload file tugas: " + uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("student-task-files")
        .getPublicUrl(filePath);

      uploadedFileUrl = publicUrlData.publicUrl;
      uploadedFileName = taskFile.name;
      uploadedFileType = taskFile.type || "file";
    }

    const isKirimAdmin = modeSimpan === "admin";
    const course = taskMode === "matakuliah" ? getCourse(taskKode) : null;

    const taskData = {
      user_id: profile.id,
      kode: taskMode === "matakuliah" ? course.kode : "LAINNYA",
      mata_kuliah: taskMode === "matakuliah" ? course.nama : customTaskTitle,
      sks: taskMode === "matakuliah" ? course.sks : Number(customTaskSks || 0),
      tugas: taskName,
      nama_tugas: taskName,
      status: taskStatus,
      catatan: taskNote,
      foto: uploadedFileUrl,
      file_url: uploadedFileUrl,
      file_name: uploadedFileName,
      file_type: uploadedFileType,
      dikirim_admin: isKirimAdmin,
      jenis_simpan: modeSimpan,
      tanggal_kirim: isKirimAdmin ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from("tasks").insert(taskData);

    if (error) {
      alert("Gagal menyimpan tugas: " + error.message);
      return;
    }

    alert(isKirimAdmin ? "Tugas berhasil dikirim ke admin." : "Tugas berhasil disimpan di akun.");

    setTaskName("");
    setTaskStatus("belum");
    setTaskNote("");
    setTaskFile(null);
    setTaskFilePreview("");
    setCustomTaskTitle("");
    setCustomTaskSks(0);

    await loadTasks(profile);
  }

  async function sendExistingTaskToAdmin(item) {
    const { error } = await supabase
      .from("tasks")
      .update({
        dikirim_admin: true,
        jenis_simpan: "admin",
        tanggal_kirim: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      alert("Gagal mengirim tugas ke admin: " + error.message);
      return;
    }

    alert("Tugas berhasil dikirim ke admin.");
    await loadTasks(profile);
  }

  async function updateTaskStatus(id, status) {
    const { error } = await supabase.from("tasks").update({ status }).eq("id", id);

    if (error) {
      alert("Gagal mengubah status: " + error.message);
      return;
    }

    await loadTasks(profile);
  }

  async function deleteTask(id) {
    const ok = confirm("Yakin ingin menghapus tugas ini?");
    if (!ok) return;

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      alert("Gagal menghapus tugas: " + error.message);
      return;
    }

    await loadTasks(profile);
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

    await loadSchedules(profile);
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

    await loadSchedules(profile);
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

    await loadMaterials();
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

    await loadMaterials();
  }

  const filteredTasks = useMemo(() => {
    const keyword = search.toLowerCase();

    return tasks.filter((item) => {
      return (
        item.kode?.toLowerCase().includes(keyword) ||
        item.mata_kuliah?.toLowerCase().includes(keyword) ||
        item.tugas?.toLowerCase().includes(keyword) ||
        item.nama_tugas?.toLowerCase().includes(keyword) ||
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

  function isImageFile(item) {
    const url = item.file_url || item.foto || "";
    const type = item.file_type || "";

    return (
      url &&
      (type.startsWith("image/") ||
        url.startsWith("data:image") ||
        url.includes(".jpg") ||
        url.includes(".jpeg") ||
        url.includes(".png") ||
        url.includes(".webp"))
    );
  }

  function isPdfFile(item) {
    const url = item.file_url || "";
    const type = item.file_type || "";
    return url && (type === "application/pdf" || url.includes(".pdf"));
  }

  function exportPdf() {
    const gambarDariTugas = tasks
      .filter((item) => isImageFile(item))
      .map((item) => ({
        judul: item.tugas || item.nama_tugas || "Gambar Tugas",
        deskripsi: item.catatan || "-",
        sumber: item.mata_kuliah || "-",
        statusKirim: item.dikirim_admin ? "Sudah dikirim ke admin" : "Tersimpan di akun",
        url: item.file_url || item.foto,
      }));

    const filePdfDariTugas = tasks
      .filter((item) => isPdfFile(item))
      .map((item) => ({
        judul: item.tugas || item.nama_tugas || "PDF Tugas",
        deskripsi: item.catatan || "-",
        sumber: item.mata_kuliah || "-",
        statusKirim: item.dikirim_admin ? "Sudah dikirim ke admin" : "Tersimpan di akun",
        namaFile: item.file_name || "File PDF",
        url: item.file_url,
      }));

    if (gambarDariTugas.length === 0 && filePdfDariTugas.length === 0) {
      alert("Belum ada gambar atau PDF yang tersimpan.");
      return;
    }

    const htmlGambar = gambarDariTugas
      .map((item, index) => {
        return `
          <div class="pdfImageCard">
            <h2>Gambar ${index + 1}</h2>
            <p><b>Judul:</b> ${item.judul}</p>
            <p><b>Sumber:</b> ${item.sumber}</p>
            <p><b>Status:</b> ${item.statusKirim}</p>
            <p><b>Deskripsi:</b> ${item.deskripsi}</p>
            <img src="${item.url}" />
          </div>
        `;
      })
      .join("");

    const htmlPdf = filePdfDariTugas
      .map((item, index) => {
        return `
          <div class="pdfFileCard">
            <h2>PDF ${index + 1}</h2>
            <p><b>Judul:</b> ${item.judul}</p>
            <p><b>Sumber:</b> ${item.sumber}</p>
            <p><b>Status:</b> ${item.statusKirim}</p>
            <p><b>Deskripsi:</b> ${item.deskripsi}</p>
            <p><b>Nama file:</b> ${item.namaFile}</p>
            <p><b>Link:</b> ${item.url}</p>
          </div>
        `;
      })
      .join("");

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan File Tugas</title>
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
            .pdfImageCard,
            .pdfFileCard {
              page-break-inside: avoid;
              border: 1px solid #d1d5db;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 24px;
            }
            .pdfImageCard p,
            .pdfFileCard p {
              margin: 6px 0;
              font-size: 14px;
              word-break: break-word;
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
          <h1>Laporan File dan Gambar Tugas</h1>
          ${htmlGambar}
          ${filePdfDariTugas.length > 0 ? `<h1>Daftar PDF Tugas</h1>${htmlPdf}` : ""}
          <div class="footer">di buat pada 30-05-2026 if rpl 6-a</div>
          <script>
            const images = Array.from(document.images);
            Promise.all(
              images.map((img) => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                  img.onload = resolve;
                  img.onerror = resolve;
                });
              })
            ).then(() => {
              setTimeout(() => {
                window.focus();
                window.print();
              }, 500);
            });
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return (
      <div className="authPage">
        <div className="authCard">
          <h1>Konfigurasi Supabase belum ada</h1>
          <p>Buat file <b>.env</b>, lalu isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading">Memuat profil pengguna...</div>;

  if (!session || !profile) {
    return (
      <div className="loginPage">
        <section className="loginHero">
          <GraduationCap size={42} />
          <h1>Penyelesaian Studi</h1>
        </section>

        <section className="loginBox">
          <div className="tabRow">
            <button className={authMode === "mahasiswa" ? "active" : ""} onClick={() => setAuthMode("mahasiswa")}>
              <User size={17} /> Mahasiswa
            </button>
            <button className={authMode === "admin" ? "active" : ""} onClick={() => setAuthMode("admin")}>
              <ShieldCheck size={17} /> Admin
            </button>
            <button className={authMode === "registrasi" ? "active" : ""} onClick={() => setAuthMode("registrasi")}>
              Registrasi
            </button>
          </div>

          {authMode === "registrasi" ? (
            <form onSubmit={handleRegister} className="authForm">
              <h2>Registrasi Mahasiswa</h2>
              <input type="text" placeholder="Nama lengkap" value={regNama} onChange={(e) => setRegNama(e.target.value)} />
              <input type="text" placeholder="NIM" value={regNim} onChange={(e) => setRegNim(e.target.value)} />
              <input type="email" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              <input type="password" placeholder="Password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
              <button type="submit">Daftar & Kirim Verifikasi</button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="authForm">
              <h2>{authMode === "admin" ? "Login Admin" : "Login Mahasiswa"}</h2>
              <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              <button type="submit"><LogIn size={17} /> Login</button>
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
          <p>Halo, {profile.nama}. Role akun: <b>{profile.role}</b></p>
        </div>

        <div className="heroActions">
          <button onClick={exportPdf}><Download size={17} /> PDF</button>
          <button onClick={logout}><LogOut size={17} /> Logout</button>
        </div>
      </header>

      {profile.role === "admin" && (
        <>
          <section className="card">
            <h2>Panel Admin</h2>
            <p>Lihat tugas yang sudah dikirim mahasiswa ke admin.</p>
            <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
              <option value="all">Semua mahasiswa</option>
              {students.filter((student) => student.role === "mahasiswa").map((student) => (
                <option key={student.id} value={student.id}>{student.nama} - {student.nim} - {student.email}</option>
              ))}
            </select>
          </section>
        </>
      )}

      <section className="statsGrid">
        <div className="statCard"><p>Total Tugas</p><h2>{totalTasks}</h2></div>
        <div className="statCard"><p>Tugas Selesai</p><h2>{totalDone}</h2></div>
        <div className="statCard"><p>Belum Selesai</p><h2>{totalNotDone}</h2></div>
        <div className="statCard"><p>Progres SKS</p><h2>{sksPercent}%</h2></div>
      </section>

      <section className="card">
        <div className="progressHeader">
          <h2>Grafik Progres Penyelesaian</h2>
          <span>{percent}% tugas selesai</span>
        </div>
        <div className="chartBlock">
          <div className="donut" style={{ background: `conic-gradient(#2563eb ${percent * 3.6}deg, #ffedd5 0deg)` }}>
            <div><b>{percent}%</b><span>Selesai</span></div>
          </div>
          <div className="bars">
            <ProgressBar label="Selesai" value={totalDone} max={Math.max(totalTasks, 1)} color="#2563eb" suffix={`${totalDone} tugas`} />
            <ProgressBar label="Belum selesai" value={totalNotDone} max={Math.max(totalTasks, 1)} color="#f97316" suffix={`${totalNotDone} tugas`} />
            <ProgressBar label="SKS selesai" value={doneSks} max={totalSks} color="#16a34a" suffix={`${doneSks} dari ${totalSks} SKS`} />
          </div>
        </div>
      </section>

      <div className="menuTabs fourTabs">
        <button className={activeMenu === "tugas" ? "active" : ""} onClick={() => setActiveMenu("tugas")}>Tugas</button>
        <button className={activeMenu === "jadwal" ? "active" : ""} onClick={() => setActiveMenu("jadwal")}>Jadwal Kuliah</button>
        <button className={activeMenu === "file" ? "active" : ""} onClick={() => setActiveMenu("file")}>File Tugas</button>
        {profile.role === "admin" && (
          <button className={activeMenu === "mahasiswa" ? "active" : ""} onClick={() => setActiveMenu("mahasiswa")}>Mahasiswa</button>
        )}
      </div>

      {menuLoading && <div className="message">Memuat data...</div>}

      {activeMenu === "mahasiswa" && profile.role === "admin" && (
        <section className="card">
          <div className="sectionTitle"><Users size={22} /><h2>Daftar Mahasiswa Registrasi</h2></div>
          {students.filter((student) => student.role === "mahasiswa").length === 0 ? (
            <p className="empty">Belum ada mahasiswa yang registrasi.</p>
          ) : (
            <div className="scheduleGrid">
              {students.filter((student) => student.role === "mahasiswa").map((student) => (
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
              <div className="sectionTitle"><Plus size={22} /><h2>Tambah Tugas</h2></div>

              <form className="formGrid">
                <select value={taskMode} onChange={(e) => setTaskMode(e.target.value)}>
                  <option value="matakuliah">Tugas berdasarkan mata kuliah</option>
                  <option value="lainnya">Tugas lain tanpa kode mata kuliah</option>
                </select>

                {taskMode === "matakuliah" ? (
                  <select value={taskKode} onChange={(e) => setTaskKode(e.target.value)}>
                    {daftarMataKuliahAwal.map((mk) => <option key={mk.kode} value={mk.kode}>{mk.nama}</option>)}
                  </select>
                ) : (
                  <>
                    <input type="text" placeholder="Nama tugas lain, contoh: Proposal, Sertifikat, Organisasi" value={customTaskTitle} onChange={(e) => setCustomTaskTitle(e.target.value)} />
                    <input type="number" min="0" placeholder="SKS jika ada, isi 0 jika bukan mata kuliah" value={customTaskSks} onChange={(e) => setCustomTaskSks(e.target.value)} />
                  </>
                )}

                <input type="text" placeholder="Nama tugas, contoh: Laporan, PPT, Program, UAS" value={taskName} onChange={(e) => setTaskName(e.target.value)} />

                <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)}>
                  <option value="belum">Belum Selesai</option>
                  <option value="selesai">Selesai</option>
                </select>

                <textarea placeholder="Catatan tugas" value={taskNote} onChange={(e) => setTaskNote(e.target.value)} />

                <label className="uploadBox">
                  <Upload size={18} />
                  {taskFile ? taskFile.name : "Upload foto / PDF / file tugas"}
                  <input type="file" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar" onChange={handlePhotoUpload} hidden />
                </label>

                {taskFilePreview && <img src={taskFilePreview} alt="Preview bukti" className="previewImage" loading="lazy" />}

                {taskMode === "matakuliah" && (
                  <div className="courseInfo"><BookOpen size={18} /><b>{getCourse(taskKode)?.kode}</b> — {getCourse(taskKode)?.nama} | {getCourse(taskKode)?.sks} SKS</div>
                )}

                <div className="twoCols">
                  <button type="button" onClick={(e) => addTask(e, "akun")}><Save size={17} /> Simpan di Akun</button>
                  <button type="button" onClick={(e) => addTask(e, "admin")}><Send size={17} /> Kirim ke Admin</button>
                </div>
              </form>
            </section>
          )}

          {profile.role === "admin" && (
            <section className="card adminInfo">
              <h2>Tugas Masuk dari Mahasiswa</h2>
              <p>Admin hanya melihat tugas yang sudah dikirim mahasiswa melalui tombol <b>Kirim ke Admin</b>.</p>
            </section>
          )}

          <input className="searchInput" placeholder="Cari kode, mata kuliah, atau nama tugas..." value={search} onChange={(e) => setSearch(e.target.value)} />

          <section className="listGrid">
            <TaskList title="Daftar Tugas Belum Selesai" data={tasksNotDone} profile={profile} getStudentName={getStudentName} onStatus={updateTaskStatus} onDelete={deleteTask} onSendAdmin={sendExistingTaskToAdmin} targetStatus="selesai" />
            <TaskList title="Daftar Tugas Selesai" data={tasksDone} profile={profile} getStudentName={getStudentName} onStatus={updateTaskStatus} onDelete={deleteTask} onSendAdmin={sendExistingTaskToAdmin} targetStatus="belum" />
          </section>
        </>
      )}

      {activeMenu === "jadwal" && (
        <>
          {profile.role === "admin" && (
            <section className="card">
              <div className="sectionTitle"><CalendarDays size={22} /><h2>Kirim Jadwal Kuliah ke Semua Mahasiswa</h2></div>
              <p className="hint">Jadwal hanya bisa dibuat oleh admin dan akan dikirim otomatis ke semua mahasiswa yang terdaftar.</p>
              <form onSubmit={addScheduleByAdmin} className="formGrid">
                <select value={scheduleKode} onChange={(e) => setScheduleKode(e.target.value)}>
                  {daftarMataKuliahAwal.map((mk) => <option key={mk.kode} value={mk.kode}>{mk.nama}</option>)}
                </select>
                <select value={scheduleHari} onChange={(e) => setScheduleHari(e.target.value)}>
                  {hariList.map((hari) => <option key={hari} value={hari}>{hari}</option>)}
                </select>
                <div className="twoCols">
                  <input type="time" value={scheduleMulai} onChange={(e) => setScheduleMulai(e.target.value)} />
                  <input type="time" value={scheduleSelesai} onChange={(e) => setScheduleSelesai(e.target.value)} />
                </div>
                <input type="text" placeholder="Ruangan / kelas / link Zoom" value={scheduleRuangan} onChange={(e) => setScheduleRuangan(e.target.value)} />
                <input type="text" placeholder="Nama dosen" value={scheduleDosen} onChange={(e) => setScheduleDosen(e.target.value)} />
                <textarea placeholder="Catatan jadwal" value={scheduleCatatan} onChange={(e) => setScheduleCatatan(e.target.value)} />
                <button type="submit"><Save size={17} /> Kirim Jadwal</button>
              </form>
            </section>
          )}

          {profile.role === "mahasiswa" && (
            <section className="card adminInfo"><h2>Jadwal Kuliah Saya</h2><p>Jadwal kuliah di bawah ini dikirim oleh admin.</p></section>
          )}

          <ScheduleList data={schedules} profile={profile} getStudentName={getStudentName} onDelete={deleteSchedule} />
        </>
      )}

      {activeMenu === "file" && (
        <>
          {profile.role === "admin" && (
            <section className="card">
              <div className="sectionTitle"><Upload size={22} /><h2>Kirim File / Foto Tugas</h2></div>
              <p className="hint">File yang dikirim admin akan tampil di akun mahasiswa dan bisa diunduh.</p>
              <form onSubmit={uploadMaterialByAdmin} className="formGrid">
                <input type="text" placeholder="Judul file tugas" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} />
                <textarea placeholder="Deskripsi tugas" value={materialDescription} onChange={(e) => setMaterialDescription(e.target.value)} />
                <label className="uploadBox">
                  <Upload size={18} />
                  {materialFile ? materialFile.name : "Upload file/foto tugas"}
                  <input type="file" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar" onChange={(e) => setMaterialFile(e.target.files?.[0] || null)} hidden />
                </label>
                <button type="submit"><Save size={17} /> Kirim File Tugas</button>
              </form>
            </section>
          )}

          {profile.role === "mahasiswa" && (
            <section className="card adminInfo"><h2>File Tugas dari Admin</h2><p>File di bawah ini dikirim oleh admin. Silakan unduh dan kerjakan sesuai instruksi.</p></section>
          )}

          <MaterialList data={materials} profile={profile} onDelete={deleteMaterial} />
        </>
      )}

      <footer className="footerCredit">di buat pada 30-05-2026 if rpl 6-a</footer>
    </div>
  );
}

function ProgressBar({ label, value, max, color, suffix }) {
  const width = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="progressItem">
      <div className="progressLineTop"><b>{label}</b><span>{suffix}</span></div>
      <div className="progressTrack"><div style={{ width: `${width}%`, background: color }} /></div>
    </div>
  );
}

function TaskList({ title, data, profile, getStudentName, onStatus, onDelete, onSendAdmin, targetStatus }) {
  function showImage(item) {
    const url = item.file_url || item.foto || "";
    const type = item.file_type || "";
    return url && (type.startsWith("image/") || url.startsWith("data:image") || url.includes(".jpg") || url.includes(".jpeg") || url.includes(".png") || url.includes(".webp"));
  }

  return (
    <div className="tableCard">
      <div className="tableHeader">
        <div className="sectionTitle small"><ClipboardList size={22} /><h2>{title}</h2></div>
        <span className="badge">{data.length} tugas</span>
      </div>

      {data.length === 0 ? (
        <p className="empty">Belum ada data.</p>
      ) : (
        <div className="cardList">
          {data.map((item) => (
            <div className="taskCard" key={item.id}>
              {profile.role === "admin" && <p className="studentTag"><Eye size={14} />{getStudentName(item.user_id)}</p>}

              <div className="taskTop">
                <b>{item.kode}</b>
                <span className={item.status === "selesai" ? "status selesai" : "status belum"}>{item.status === "selesai" ? "Selesai" : "Belum"}</span>
              </div>

              <h3>{item.mata_kuliah}</h3>
              <p><b>Tugas:</b> {item.tugas || item.nama_tugas}</p>
              <p><b>SKS:</b> {item.sks}</p>
              <p><b>Status Kirim:</b> {item.dikirim_admin ? "Sudah dikirim ke admin" : "Tersimpan di akun"}</p>

              {item.catatan && <p><b>Catatan:</b> {item.catatan}</p>}

              {showImage(item) && <img src={item.file_url || item.foto} alt="Bukti tugas" className="proofImage" loading="lazy" />}

              {item.file_url && (
                <div className="fileBox">
                  <p><b>File:</b> {item.file_name || "File tugas"}</p>
                  <p><b>Tipe:</b> {item.file_type || "-"}</p>
                  <a className="downloadBtn" href={item.file_url} target="_blank" rel="noreferrer" download><Download size={16} /> Download File</a>
                </div>
              )}

              <div className="actionRow">
                {profile.role === "mahasiswa" && (
                  <>
                    <button className={targetStatus === "selesai" ? "softBtn" : "softBtn orange"} onClick={() => onStatus(item.id, targetStatus)}>
                      {targetStatus === "selesai" ? <CheckCircle size={16} /> : <Circle size={16} />}
                      {targetStatus === "selesai" ? "Tandai Selesai" : "Tandai Belum"}
                    </button>

                    {!item.dikirim_admin && (
                      <button className="softBtn" onClick={() => onSendAdmin(item)}><Send size={16} /> Kirim ke Admin</button>
                    )}
                  </>
                )}

                <button className="dangerBtn" onClick={() => onDelete(item.id)}><Trash2 size={16} /> Hapus</button>
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
      <div className="sectionTitle"><CalendarDays size={22} /><h2>{profile.role === "admin" ? "Daftar Jadwal Kuliah Mahasiswa" : "Jadwal Kuliah dari Admin"}</h2></div>

      {data.length === 0 ? (
        <p className="empty">Belum ada jadwal kuliah.</p>
      ) : (
        <div className="scheduleGrid">
          {data.map((item) => (
            <div className="scheduleCard" key={item.id}>
              {profile.role === "admin" && <p className="studentTag"><User size={14} />{getStudentName(item.user_id)}</p>}
              <h3>{item.mata_kuliah}</h3>
              <p><b>Kode:</b> {item.kode}</p>
              <p><b>Hari/Jam:</b> {item.hari}, {item.mulai} - {item.selesai}</p>
              <p><b>SKS:</b> {item.sks}</p>
              <p><b>Dosen:</b> {item.dosen || "-"}</p>
              <p><b>Ruangan/Zoom:</b> {item.ruangan || "-"}</p>
              {item.catatan && <p><b>Catatan:</b> {item.catatan}</p>}
              {profile.role === "admin" && <button className="dangerBtn" onClick={() => onDelete(item.id)}><Trash2 size={16} /> Hapus Jadwal</button>}
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
      <div className="sectionTitle"><FileText size={22} /><h2>Daftar File Tugas</h2></div>

      {data.length === 0 ? (
        <p className="empty">Belum ada file tugas dari admin.</p>
      ) : (
        <div className="scheduleGrid">
          {data.map((item) => (
            <div className="scheduleCard" key={item.id}>
              <h3>{item.title}</h3>
              {item.description && <p><b>Deskripsi:</b> {item.description}</p>}
              <p><b>Nama file:</b> {item.file_name}</p>
              <p><b>Tipe:</b> {item.file_type || "-"}</p>

              {item.file_type?.startsWith("image/") && <img src={item.file_url} alt={item.title} className="proofImage" loading="lazy" />}

              <div className="actionRow">
                <a className="downloadBtn" href={item.file_url} target="_blank" rel="noreferrer" download><Download size={16} /> Download</a>
                {profile.role === "admin" && <button className="dangerBtn" onClick={() => onDelete(item.id)}><Trash2 size={16} /> Hapus</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
