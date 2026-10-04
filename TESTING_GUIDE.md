# Dexa Group HRIS - Testing Guide

Panduan langkah demi langkah untuk menjalankan dan mengetest aplikasi HRIS (Employee Web & Admin Web).

---

## 1. Persiapan & Prasyarat

Pastikan Anda sudah meng-install aplikasi berikut di mesin Anda:

| Alat          | Versi Minimum | Keterangan                                                    |
|---------------|---------------|---------------------------------------------------------------|
| Docker        | v24+          | Untuk menjalankan container PostgreSQL & RabbitMQ              |
| Node.js       | v18+          | Direkomendasikan v20 LTS (https://nodejs.org/)                 |
| npm           | v9+           | Sudah termasuk dalam installer Node.js                         |
| (Opsional) Docker Compose | v2+ | Biasanya sudah include di Docker Desktop                   |

Kredensial default untuk pengetesan:
- **Akun Admin (HRD)**: `admin@dexa-group.com` / `admin123`
- **Akun Karyawan (Employee)**: `budi.santoso@dexa-group.com` / `employee123`

---

## 2. Jalankan Infrastruktur (Docker)

Kita akan menjalankan 3 container: Database Utama, Database Audit, dan RabbitMQ sebagai message broker.

1. Buka **Terminal / CMD** baru dan masuk ke direktori utama proyek:
   ```bash
   cd d:\technical-test-hris-dexa-group\hris
   ```

2. Jalankan perintah berikut untuk start seluruh service (akan otomatis pull image jika belum ada):
   ```bash
   docker compose up -d
   ```

3. Tunggu sekitar 15-30 detik, lalu pastikan ketiga container **sehat (healthy)**:
   ```bash
   docker compose ps
   ```
   ✅ Hasil yang diharapkan: Status untuk `hris-postgres-main`, `hris-postgres-audit`, dan `hris-rabbitmq` adalah `Up (healthy)`.

   > Jika masih `starting`, tunggu beberapa saat lalu cek ulang.

---

## 3. Setup & Jalankan Backend (NestJS)

1. Buka **Terminal baru** (Tab 2) dan masuk ke direktori `backend`:
   ```bash
   cd d:\technical-test-hris-dexa-group\hris\backend
   ```

2. Install dependencies (jika pertama kali):
   ```bash
   npm install
   ```

3. Generate Prisma Client dan Push Schema ke Database:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

4. Jalankan **Seeder** untuk memasukkan data awal (Admin & Employee):
   ```bash
   npm run seed
   ```
   ✅ Jika berhasil, Anda akan melihat log "Database seeded successfully" atau data user yang dibuat.

5. Jalankan server Backend dalam mode Development:
   ```bash
   npm run start:dev
   ```
   ✅ Backend berjalan di: **http://localhost:3000**
   > Biasanya akan muncul log `Nest application successfully started` di terminal.

---

## 4. Jalankan Aplikasi Frontend

Kita membutuhkan dua terminal terpisah untuk Employee Web dan Admin Web.

### 4.1. Jalankan Employee Web (Port 5173)
Buka **Terminal baru (Tab 3)**:
```bash
cd d:\technical-test-hris-dexa-group\hris\frontend\employee-web
npm install   # Jalankan jika pertama kali
npm run dev
```
✅ Akses: **http://localhost:5173**

### 4.2. Jalankan Admin Web (Port 5174)
Buka **Terminal baru (Tab 4)**:
```bash
cd d:\technical-test-hris-dexa-group\hris\frontend\admin-web
npm install   # Jalankan jika pertama kali
npm run dev
```
✅ Akses: **http://localhost:5174**

---

## 5. Skenario Testing - Employee Web (http://localhost:5173)

### 5.1. Test Login Employee
1. Buka `http://localhost:5173`
2. Masukkan kredensial:
   - Email: `budi.santoso@dexa-group.com`
   - Password: `employee123`
3. Klik **Sign In**
4. ✅ Harusnya Anda otomatis masuk dan dialihkan ke halaman **Attendance**.

### 5.2. Test Check-in (Absen Masuk)
1. Pastikan Anda berada di tab **Attendance** (ikon jam di Bottom Nav).
2. Lihat status tombol. Jika hari ini belum check-in:
   - Klik tombol **Check In** (warna biru/hijau).
   - Berikan izin Lokasi (Location Permission) jika diminta oleh browser.
3. ✅ Setelah sukses:
   - Muncul toast "Check-in successful".
   - Status tombol berubah menjadi **Check Out**.
   - Waktu check-in muncul di ringkasan.

### 5.3. Test Check-out (Absen Pulang)
1. Masih di halaman Attendance.
2. Klik tombol **Check Out** (warna merah/oranye).
3. ✅ Setelah sukses:
   - Muncul toast notifikasi berhasil.
   - Waktu check-out tercatat.

### 5.4. Test Lihat Riwayat Kehadiran (History)
1. Klik tab **History** (ikon kalender) di Bottom Nav.
2. ✅ Anda akan melihat list riwayat Check-in dan Check-out yang tadi dilakukan.
3. Coba buka **Bottom Sheet Filter** dengan menggeser ke atas atau mengklik area filter.
4. Ubah rentang tanggal dan klik terapkan.
5. ✅ Data list dan summary (Total Records, Check-in, Check-out) menyesuaikan filter.

### 5.5. Test Ubah Profil & Upload Foto
1. Klik tab **Profile** di Bottom Nav.
2. Coba klik foto profil untuk mengunggah foto baru (gunakan file gambar).
3. ✅ Foto pratinjau berubah. Simpan perubahan dengan klik tombol **Update Profile**.
4. Coba ubah **Phone** atau **Position**.
5. ✅ Muncul pesan berhasil "Profile updated successfully".

---

## 6. Skenario Testing - Admin Web (http://localhost:5174)

### 6.1. Test Login Admin (HRD)
1. Buka `http://localhost:5174`
2. Masukkan kredensial:
   - Email: `admin@dexa-group.com`
   - Password: `admin123`
3. Klik **Sign In**
4. ✅ Harusnya masuk ke Dashboard.

### 6.2. Test Dashboard (Lihat Statistik)
1. Pastikan ada **4 Stat Card** (Total Employees, Present Today, Late Today, Absent Today).
2. Gulir ke bawah ke bagian **Recent Activity / Activity Log**.
3. ✅ Aktivitas Check-in/Check-out dari Employee Budi Santoso yang tadi dilakukan akan muncul di list ini (secara real-time jika menggunakan Socket.io).

### 6.3. Test Monitoring Kehadiran (Attendance Monitoring)
1. Klik menu **Attendance** di Sidebar kiri.
2. ✅ Terdapat 3 kolom filter: `From Date`, `To Date`, dan kolom `Search`.
3. Coba ketik keyword "Budi" di kolom Search.
4. ✅ List tabel otomatis memfilter hanya data yang mengandung kata "Budi".
5. Cek Summary Stat Card (4 buah kartu warna pastel) di atas tabel:
   - Pastikan angka totalnya sesuai dengan jumlah data riil.

### 6.4. Test Manajemen Karyawan (Employees Management)
1. Klik menu **Employees** di Sidebar kiri.
2. ✅ Terdapat kolom **Search** dan tombol **Add Employee**.
3. **Test Tambah Karyawan Baru**:
   - Klik tombol **Add Employee** (Merah).
   - Isi form: `Name`, `Email`, `Position`, dll.
   - Pilih Role: `EMPLOYEE`.
   - Isi Password: `test123`.
   - Klik **Save**.
4. ✅ Karyawan baru muncul di tabel paling atas.
5. **Test Edit Karyawan**:
   - Klik ikon **Edit** (pensil) di baris karyawan yang baru dibuat.
   - Ubah `Position` menjadi "Staff IT".
   - Simpan.
6. ✅ Data berubah di tabel.
7. **Test Hapus Karyawan**:
   - Klik ikon **Hapus** (sampah) -> Konfirmasi hapus.
8. ✅ Data menghilang dari tabel.

---

## 7. Test Fitur Tambahan

### 7.1. Test Real-time Notification via Socket.io
1. Buka **Admin Web** di Browser A (Login sebagai Admin).
2. Buka **Employee Web** di Browser B (Login sebagai Budi Santoso).
3. Di Browser B (Employee), lakukan **Check In**.
4. ✅ Di Browser A (Admin), seharusnya akan muncul **Toast Notifikasi** di pojok kanan atas secara otomatis bahwa ada aktivitas baru. Data di Dashboard Activity Log juga bertambah otomatis tanpa di-refresh.

### 7.2. Test Dual Database (Audit Trail)
Untuk memastikan audit logging berjalan:
1. Buka database `hris_audit` (port 5433) menggunakan PgAdmin / DBeaver.
   - Host: `localhost`
   - Port: `5433`
   - User: `dexa_audit`
   - Password: `dexa-audit-password-2026`
2. Lihat tabel `AuditLog` (atau nama tabel log yang sesuai).
3. ✅ Setiap aksi CRUD Employee atau Check-in/out yang Anda lakukan tadi harus menghasilkan baris log baru di database ini.

---

## 8. Troubleshooting

**Q: Error "Container unhealthy"?**
- Jalankan `docker compose restart`
- Atau hapus volume lama: `docker compose down -v` lalu `docker compose up -d` lagi.

**Q: Error "prisma client not found"?**
- Jalankan ulang `npm run prisma:generate` di folder backend.

**Q: Login gagal "Invalid credentials"?**
- Pastikan Anda menjalankan `npm run seed` di backend.
- Pastikan tidak ada typo (ingat email case-sensitive tidak terlalu masalah, tapi password HARUS persis: `admin123` atau `employee123`).

**Q: Halaman 404 saat Refresh Browser di Admin Web?**
- Pastikan Vite Dev Server masih berjalan. Fitur `historyApiFallback` di `vite.config.ts` seharusnya menangani ini, namun jika masalah muncul, navigasikan kembali dari root `http://localhost:5174`.

---

## 🎉 Selesai

Jika semua skenario di atas berhasil dilewati, berarti aplikasi HRIS berfungsi dengan baik! Selamat mencoba.
