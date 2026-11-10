# Corporate Kickoff & End-of-Year Reporting System — Ekasurya Group

Scaffold full-stack: **Next.js (App Router) + Tailwind** (frontend), **Express + Prisma + Socket.io** (backend), **PostgreSQL**, dijalankan via **Docker Compose**. Branding sudah diset untuk **Ekasurya Group** (logo monogram + warna korporat), tinggal ganti di `frontend/components/Branding.jsx` kalau mau diubah.

## Menjalankan

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker-compose up --build
```

- Frontend: http://localhost:3000/login
- Backend health check: http://localhost:4000/health

Saat backend pertama kali start, migrasi Prisma & seed data akan otomatis jalan (lihat `backend/Dockerfile`).

## Akun demo (password semua: `password123`)
| Role | Email |
|---|---|
| Super Admin | superadmin@kickoff.local |
| Department Manager | manager.sales@kickoff.local |
| Department Contributor | contributor.sales@kickoff.local |

## Struktur fitur yang sudah ada di scaffold ini
- **Auth**: login, refresh token (`/api/auth/refresh`), logout, self-service reset password (request + confirm).
- **RBAC**: middleware `requireRole` (SUPER_ADMIN, DEPARTMENT_MANAGER, DEPARTMENT_CONTRIBUTOR) + scope per plant/departemen untuk Contributor.
- **Dynamic Department**: CRUD + toggle aktif/nonaktif oleh Super Admin (`/admin/departments`), tanpa hardcode — frontend otomatis fetch daftar aktif.
- **Multi-Plant**: model `Plant`, termasuk opsi "Holding (Konsolidasi)".
- **Report (RGT + Achievement + Challenge/Opportunity)**: unique per (year, plant, department), ada `deadlineAt` + endpoint `lock-expired` untuk deadline lock, alur review (approve / revision request) oleh Manager.
- **Attachment**: upload file ke report (`multer`, disimpan di `backend/uploads`).
- **Threaded Comment**: revisi note antar Manager–Contributor per report.
- **Audit Log**: dicatat di setiap aksi penting (login, create/update report, approve, CRUD department), bisa dilihat Super Admin lewat `/api/audit-logs`.
- **Real-time (Socket.io)**: event `report_updated`, `department_updated`, `comment_added` — dashboard & presentation mode auto-update tanpa refresh.
- **Year Switcher**: dropdown tahun di dashboard & presentation mode.
- **Presentation Mode**: 4 slide inti (Theme, Achievement, Challenges & Opportunities dengan plant+department switcher, Planning & Target) di `/presentation`, dark corporate theme.

- **Form Input Laporan (Contributor)**: halaman `/report` — isi achievement, revenue mingguan, ARPU/CLV/CAC, tantangan/peluang, RGT tahun depan, upload lampiran, otomatis terkunci kalau status LOCKED/APPROVED.
- **Chart Achievement**: slide 2 presentation mode kini render bar chart revenue mingguan & donut chart % target secara live dari data report (CSS/inline, tanpa library eksternal), plus kartu ARPU/CLV/CAC per departemen.
- **Audit Log UI**: halaman `/admin/audit-logs` (Super Admin) — tabel siapa/aksi/entitas/waktu, filter per jenis aksi, auto-refresh via Socket.io.
- **Job Scheduler Otomatis**: `node-cron` jalan tiap jam (`backend/src/jobs/lockScheduler.js`), otomatis mengunci report yang lewat deadline tanpa perlu trigger manual.
- **Export PDF/Excel**: `GET /api/reports/export?year=&plantId=&departmentId=&format=xlsx|pdf` — tombol "Export Excel"/"Export PDF" di dashboard, bisa difilter per plant/departemen/tahun.
- **Custom Branding — Ekasurya Group**: logo monogram + nama holding di `frontend/components/Branding.jsx`, tampil di login, dashboard, presentation mode, dan header dokumen PDF export.

## Yang perlu dikembangkan lanjut (belum full di scaffold ini)
- Upload logo perusahaan asli (saat ini masih monogram SVG "ES" — tinggal ganti jadi `<img>` file logo Ekasurya Group yang sebenarnya).
- Halaman UI untuk kelola user (create/assign role & plant/departemen) — saat ini hanya lewat seed/DB langsung.
- Notifikasi email saat approve/revision-request atau reset password (saat ini token reset password dikembalikan langsung di response, dev-only).

## Struktur folder
```
kickoff-eoy-system/
├── docker-compose.yml
├── backend/        (Express + Prisma + Socket.io)
│   ├── prisma/schema.prisma
│   └── src/{routes,controllers,middleware,sockets,utils,config}
└── frontend/       (Next.js App Router + Tailwind)
    ├── app/{login,dashboard,admin/departments,presentation}
    └── lib/{api.js,socket.js}
```
