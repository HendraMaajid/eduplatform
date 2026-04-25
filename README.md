# 📚 EduPlatform — Course Management System

<div align="center">

**Platform pembelajaran online dengan manajemen kursus, quiz, assignment, dan sertifikat.**

[![Go](https://img.shields.io/badge/Go-1.26-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 📋 Daftar Isi

- [Tentang Project](#-tentang-project)
- [Tech Stack](#-tech-stack)
- [Fitur](#-fitur)
- [Struktur Project](#-struktur-project)
- [Prerequisites](#-prerequisites)
- [Setup & Instalasi](#-setup--instalasi)
  - [1. Setup Database Supabase](#1-setup-database-supabase)
  - [1b. Setup Database Lokal (Rekomendasi untuk Dev)](#1b-setup-database-postgresql-lokal-rekomendasi-untuk-development)
  - [2. Setup Backend (Go)](#2-setup-backend-go)
  - [3. Setup Frontend (Next.js)](#3-setup-frontend-nextjs)
- [Menjalankan Project](#-menjalankan-project)
- [Struktur Repository](#-struktur-repository)
- [API Endpoints](#-api-endpoints)
- [Role & Hak Akses](#-role--hak-akses)
- [Screenshots](#-screenshots)

---

## 🎯 Tentang Project

**EduPlatform** adalah platform Learning Management System (LMS) full-stack yang dibangun dengan Go (Gin) sebagai backend API dan Next.js sebagai frontend. Platform ini mendukung multi-role (Admin, Teacher, Student) dengan fitur lengkap mulai dari manajemen kursus, modul pembelajaran, quiz interaktif, assignment submission, hingga generate sertifikat.

> **Catatan:** Repository ini adalah gabungan dari frontend dan backend. Untuk deployment, masing-masing folder di-deploy secara terpisah:
> - **Frontend** → Vercel (repo private terpisah)
> - **Backend** → Railway (repo private terpisah)

---

## 🛠 Tech Stack

### Backend
| Teknologi | Keterangan |
|-----------|------------|
| **Go 1.26** | Bahasa pemrograman backend |
| **Gin** | HTTP web framework |
| **GORM** | ORM untuk PostgreSQL |
| **PostgreSQL** | Database (via Supabase) |
| **JWT** | Autentikasi token-based |
| **godotenv** | Environment variable management |

### Frontend
| Teknologi | Keterangan |
|-----------|------------|
| **Next.js 16** | React framework (App Router) |
| **React 19** | UI library |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS 4** | Utility-first CSS framework |
| **shadcn/ui** | Component library |
| **NextAuth v4** | Authentication (Google OAuth) |
| **next-intl** | Internationalization (ID/EN) |
| **Zustand** | State management |
| **React Hook Form + Zod** | Form handling & validation |
| **Recharts** | Chart & dashboard visualization |
| **Lucide React** | Icon library |

---

## ✨ Fitur

### 🏠 Landing Page
- Hero section dengan statistik platform
- Daftar kursus populer (data real-time dari API)
- Kategori kursus (Mobile Dev, Web Dev, UI/UX, Data Science, DevOps)
- Dark/Light mode toggle
- Responsive design

### 🔐 Autentikasi
- Login & Register dengan email/password
- Google OAuth login
- JWT token-based authentication
- Role-based access control (RBAC)

### 👨‍🎓 Dashboard Student
- **Browse Kursus** — Jelajahi dan enroll kursus yang tersedia
- **Kursus Saya** — Lihat kursus yang sudah di-enroll beserta progress
- **Detail Kursus** — Akses modul, quiz, dan assignment
- **Modul Learning** — Baca materi dengan rich content (HTML)
- **Quiz** — Kerjakan quiz interaktif dengan timer dan auto-grading
- **Assignment** — Upload file submission untuk tugas
- **Sertifikat** — Generate & download sertifikat (PDF) setelah menyelesaikan kursus
- **Riwayat Pembayaran** — Lihat riwayat transaksi
- **Notifikasi** — Notifikasi real-time untuk update kursus

### 👨‍🏫 Dashboard Teacher
- **Manajemen Kursus** — Buat dan kelola kursus
- **Manajemen Modul** — Tambah, edit, hapus modul pembelajaran
- **Manajemen Quiz** — Buat quiz dengan multiple choice & essay
- **Manajemen Assignment** — Buat tugas dengan deadline
- **Grading** — Nilai submission assignment dari siswa
- **Upload File** — Upload thumbnail kursus dan attachment modul

### 👨‍💼 Dashboard Admin
- **Dashboard Overview** — Statistik platform (total user, kursus, enrollment)
- **Manajemen User** — CRUD user dengan role assignment
- **Manajemen Teacher** — Kelola daftar instruktur
- **Manajemen Kursus** — Full control semua kursus (edit, hapus, publish)
- **Recent Enrollments** — Monitor enrollment terbaru
- **Settings** — Pengaturan platform

### 🌐 Internasionalisasi (i18n)
- Bahasa Indonesia 🇮🇩
- English 🇺🇸

---

## 📁 Struktur Project

```
project-course/
├── backend/                    # Go Backend API
│   ├── cmd/
│   │   └── main.go            # Entry point & route definitions
│   ├── internal/
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── handler/           # Request handlers (controllers)
│   │   │   ├── auth.go        # Login & Register
│   │   │   ├── course.go      # CRUD Kursus
│   │   │   ├── dashboard.go   # Dashboard statistics
│   │   │   ├── enrollment_submission.go
│   │   │   ├── notification.go
│   │   │   ├── quiz_assignment.go
│   │   │   ├── upload.go      # File upload handler
│   │   │   └── user.go        # User management
│   │   ├── middleware/        # Auth & CORS middleware
│   │   ├── model/             # GORM models (database schema)
│   │   ├── seed/              # Database seeder
│   │   └── service/           # Business logic layer
│   ├── pkg/
│   │   └── database/          # Database connection
│   ├── public/
│   │   └── uploads/           # Uploaded files (thumbnails, etc.)
│   ├── .env.example           # Contoh environment variables
│   ├── go.mod
│   └── go.sum
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx       # Landing page
│   │   │   ├── login/         # Login page
│   │   │   ├── api/auth/      # NextAuth API route
│   │   │   └── dashboard/
│   │   │       ├── admin/     # Admin pages
│   │   │       ├── teacher/   # Teacher pages
│   │   │       └── student/   # Student pages
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── i18n/              # i18n configuration
│   │   └── lib/               # Utilities & API client
│   ├── messages/              # Translation files (id.json, en.json)
│   ├── public/                # Static assets
│   ├── .env.example           # Contoh environment variables
│   └── package.json
│
├── .gitignore                 # Root gitignore
└── README.md                  # Dokumentasi ini
```

---

## 📦 Prerequisites

Pastikan sudah terinstall di sistem Anda:

| Software | Versi Minimum | Link Download |
|----------|---------------|---------------|
| **Go** | 1.26+ | [golang.org/dl](https://golang.org/dl/) |
| **Node.js** | 18+ (disarankan 20+) | [nodejs.org](https://nodejs.org/) |
| **npm** | 9+ | (bundled with Node.js) |
| **Git** | 2.0+ | [git-scm.com](https://git-scm.com/) |
| **PostgreSQL** | 14+ (opsional, untuk dev lokal) | [postgresql.org](https://www.postgresql.org/download/) |

---

## 🚀 Setup & Instalasi

### 1. Setup Database Supabase

1. **Buat akun Supabase** di [supabase.com](https://supabase.com) (gratis)

2. **Buat project baru**:
   - Klik **"New Project"**
   - Isi nama project (contoh: `edu-platform`)
   - Set **database password** (⚠️ simpan password ini, akan dipakai nanti!)
   - Pilih region terdekat (contoh: `Southeast Asia (Singapore)`)
   - Klik **"Create new project"**

3. **Dapatkan Connection URL**:
   - Buka **Project Settings** → **Database**
   - Scroll ke bagian **"Connection string"**
   - Pilih tab **"URI"**
   - Copy connection string-nya, formatnya seperti:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
     ```
   - Ganti `[YOUR-PASSWORD]` dengan password database yang tadi Anda buat

   > ⚠️ **Penting:** Jika password mengandung karakter khusus (`@`, `!`, `$`, `/`, dll.), pastikan sudah di-URL encode. Contoh: `!` → `%21`, `/` → `%2F`, `$` → `%24`

---

### 1b. Setup Database PostgreSQL Lokal (Rekomendasi untuk Development)

> ⚡ **Kenapa pakai database lokal?** Supabase berjalan di cloud (remote server), sehingga setiap query memiliki **network latency ~90-300ms**. Dengan database lokal, query yang sama hanya butuh **<1ms**. Ini membuat pengalaman development jauh lebih cepat dan responsif.

| Database | Query Sederhana | Query Kompleks | Keterangan |
|----------|----------------|----------------|------------|
| **Supabase (Remote)** | ~90-200ms | ~250-500ms | Tergantung jarak ke server |
| **PostgreSQL Lokal** | <1ms | 1-5ms | ⚡ Instan |

#### Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**Arch Linux:**
```bash
sudo pacman -S postgresql
sudo -u postgres initdb -D /var/lib/postgres/data
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### Buat Database

```bash
# Cek apakah PostgreSQL sudah berjalan
pg_isready

# Buat database baru untuk development
psql -U postgres -c "CREATE DATABASE educourse_dev;"
```

> Jika mendapat error `role "username" does not exist`, gunakan `psql -U postgres` untuk connect sebagai user postgres.

#### Konfigurasi Backend

Edit file `backend/.env`, ganti `DATABASE_URL` ke database lokal:

```env
# ===== PostgreSQL LOKAL (CEPAT - untuk development) =====
DATABASE_URL=postgresql://postgres@localhost:5432/educourse_dev?sslmode=disable

# ===== SUPABASE (REMOTE - untuk production) =====
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

PORT=8080
JWT_SECRET=ganti-dengan-secret-key-yang-aman
FRONTEND_URL=http://localhost:3000
```

> ⚠️ **Penting:** Jika PostgreSQL lokal Anda memiliki password, format URL-nya:
> ```
> postgresql://postgres:PASSWORD@localhost:5432/educourse_dev?sslmode=disable
> ```

Setelah diganti, jalankan backend seperti biasa:
```bash
cd backend
go run cmd/main.go
```

Backend akan otomatis membuat semua tabel dan menjalankan seeder di database lokal.

#### Cara Switch antara Lokal dan Supabase

Cukup comment/uncomment baris `DATABASE_URL` di `backend/.env`:

```env
# Pakai LOKAL (development):
DATABASE_URL=postgresql://postgres@localhost:5432/educourse_dev?sslmode=disable
# DATABASE_URL=postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres

# Pakai SUPABASE (production/testing):
# DATABASE_URL=postgresql://postgres@localhost:5432/educourse_dev?sslmode=disable
DATABASE_URL=postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres
```

> 📌 **Catatan:** Data di database lokal dan Supabase terpisah. Saat pertama kali switch, backend akan auto-migrate dan seed ulang data dummy.

---

### 2. Setup Backend (Go)

```bash
# Masuk ke folder backend
cd backend

# Copy file environment
cp .env.example .env
```

Edit file `backend/.env` dengan konfigurasi Anda:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
PORT=8080
JWT_SECRET=ganti-dengan-secret-key-yang-aman
FRONTEND_URL=http://localhost:3000
```

| Variable | Keterangan |
|----------|------------|
| `DATABASE_URL` | Connection string dari Supabase (langkah sebelumnya) |
| `PORT` | Port untuk backend server (default: 8080) |
| `JWT_SECRET` | Secret key untuk JWT token (ganti dengan string random yang panjang) |
| `FRONTEND_URL` | URL frontend untuk CORS (default: http://localhost:3000) |

```bash
# Download dependencies
go mod download

# Jalankan backend
go run cmd/main.go
```

> ✅ Jika berhasil, akan muncul: `Server starting on port 8080`
>
> Backend akan otomatis:
> - Membuat tabel-tabel di database (auto-migrate)
> - Menjalankan seeder untuk data dummy

### 3. Setup Frontend (Next.js)

```bash
# Masuk ke folder frontend
cd frontend

# Copy file environment
cp .env.example .env.local
```

Edit file `frontend/.env.local`:

```env
# NextAuth
NEXTAUTH_SECRET=ganti-dengan-secret-random
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (opsional, untuk login Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080
```

| Variable | Keterangan |
|----------|------------|
| `NEXTAUTH_SECRET` | Secret untuk NextAuth session. Generate dengan: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL aplikasi frontend |
| `GOOGLE_CLIENT_ID` | Client ID dari Google Cloud Console (opsional) |
| `GOOGLE_CLIENT_SECRET` | Client Secret dari Google Cloud Console (opsional) |
| `NEXT_PUBLIC_API_URL` | URL backend API |

#### Setup Google OAuth (Opsional)

Jika ingin mengaktifkan login dengan Google:

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru atau pilih yang sudah ada
3. Navigasi ke **APIs & Services** → **Credentials**
4. Klik **Create Credentials** → **OAuth 2.0 Client ID**
5. Pilih **Web application**
6. Tambahkan **Authorized redirect URI**:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Copy **Client ID** dan **Client Secret** ke `.env.local`

```bash
# Install dependencies
npm install

# Jalankan frontend
npm run dev
```

> ✅ Jika berhasil, buka [http://localhost:3000](http://localhost:3000) di browser

---

## 🏃 Menjalankan Project

Untuk menjalankan full project, Anda perlu **2 terminal**:

### Terminal 1 — Backend
```bash
cd backend
go run cmd/main.go
```
Backend berjalan di: `http://localhost:8080`

### Terminal 2 — Frontend
```bash
cd frontend
npm run dev
```
Frontend berjalan di: `http://localhost:3000`

---

## 🔌 API Endpoints

### Public
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/register` | Register user baru |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/courses` | Daftar semua kursus |
| `GET` | `/api/courses/:id` | Detail kursus |
| `GET` | `/api/courses/:id/modules` | Modul dalam kursus |
| `GET` | `/api/courses/:id/quizzes` | Quiz dalam kursus |
| `GET` | `/api/courses/:id/assignments` | Assignment dalam kursus |

### Protected (Butuh Login)
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `GET` | `/api/users/me` | Profil user saat ini |
| `GET` | `/api/notifications` | Daftar notifikasi |
| `GET` | `/api/dashboard/student` | Dashboard student |
| `GET` | `/api/enrollments` | Enrollment saya |
| `POST` | `/api/courses/:id/enroll` | Enroll ke kursus |
| `POST` | `/api/quizzes/:id/submit` | Submit jawaban quiz |
| `POST` | `/api/assignments/:id/submit` | Submit assignment |
| `POST` | `/api/courses/:id/certificates` | Generate sertifikat |

### Teacher Only
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `POST` | `/api/courses` | Buat kursus baru |
| `POST` | `/api/courses/:id/modules` | Tambah modul |
| `POST` | `/api/courses/:id/quizzes` | Buat quiz |
| `POST` | `/api/courses/:id/assignments` | Buat assignment |
| `POST` | `/api/submissions/:id/grade` | Nilai submission |
| `POST` | `/api/upload` | Upload file |

### Admin Only
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `GET` | `/api/dashboard/admin` | Dashboard admin |
| `GET` | `/api/users` | Semua users |
| `POST` | `/api/users` | Buat user |
| `PUT` | `/api/users/:id` | Update user |
| `DELETE` | `/api/users/:id` | Hapus user |
| `PUT` | `/api/courses/:id` | Update kursus |
| `DELETE` | `/api/courses/:id` | Hapus kursus |

---

## 🔑 Role & Hak Akses

| Role | Akses |
|------|-------|
| **Student** | Browse kursus, enroll, belajar modul, kerjakan quiz/assignment, download sertifikat |
| **Teacher** | Semua akses student + buat & kelola kursus, modul, quiz, assignment, grading |
| **Admin** | Semua akses teacher + kelola user, kelola semua kursus, dashboard admin |
| **Super Admin** | Semua akses admin (highest privilege) |

---

## 📷 Screenshots

### Landing Page
![Landing Page](image/home.png)

### Dashboard Siswa
![Dashboard Siswa](image/image.png)

### Dashboard Pengajar
![Dashboard Pengajar](image/pengajar.png)

### Dashboard Admin
![Dashboard Admin](image/admin.png)

### Dashboard Super Admin
![Dashboard Super Admin](image/superadmin.png)

---

## 🤝 Contributing

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b feature/fitur-baru`)
3. Commit perubahan (`git commit -m 'feat: tambah fitur baru'`)
4. Push ke branch (`git push origin feature/fitur-baru`)
5. Buat Pull Request

---

## 📄 License

Project ini dibuat untuk keperluan pembelajaran.

---

<div align="center">

**Made with ❤️ by Hendra Maajid**

</div>
