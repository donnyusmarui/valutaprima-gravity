# Rancangan Aplikasi Jual Beli Valuta Asing (Valas) Digital

## Daftar Isi
1. [Konteks & Latar Belakang](#1-konteks--latar-belakang)
2. [Peran Pengguna](#2-peran-pengguna)
3. [Daftar Screen Aplikasi](#3-daftar-screen-aplikasi)
4. [Alur Utama (Success Path)](#4-alur-utama-success-path)
5. [Invoice, Receipt, Notifikasi, dan Riwayat Transaksi](#5-invoice-receipt-notifikasi-dan-riwayat-transaksi)
6. [Arsitektur Teknis Singkat](#6-arsitektur-teknis-singkat)
7. [User Spec](#7-user-spec)

---

## 1. Konteks & Latar Belakang

Aplikasi ini mendigitalisasi proses jual beli valuta asing (valas) yang sebelumnya dilakukan secara manual di money changer fisik. Alur bisnis inti (KYC, verifikasi, otorisasi berjenjang) dipertahankan, namun ditambah lapisan digital berupa:

- **Customer Authentication** menggunakan **Google OAuth 2.0** untuk pendaftaran dan login.
- **Payment Gateway Midtrans** untuk pemrosesan pembayaran non-tunai.
- **Webhook idempotent** untuk mencegah duplikasi pemrosesan notifikasi pembayaran dari Midtrans.
- Alur persetujuan berjenjang: **verifikasi oleh Teller** lalu **otorisasi oleh Supervisor** sebelum transaksi dieksekusi.
- Dokumen pasca-transaksi otomatis: **invoice, receipt, notifikasi**, dan **riwayat transaksi**.

---

## 2. Peran Pengguna

| Peran | Tanggung Jawab Utama |
|---|---|
| **Customer** | Mendaftar/login via Google OAuth 2.0; mengajukan transaksi jual/beli valas; mengunggah dokumen KYC; melakukan pembayaran via Midtrans (transaksi beli) atau menerima pembayaran (transaksi jual); menerima invoice/receipt/notifikasi; mengakses riwayat transaksi. |
| **Teller/Kasir** | Memverifikasi KYC customer (identitas, keaslian dokumen, PEP screening); memverifikasi keaslian fisik uang/valas (jika ada opsi setor fisik); menginput dan mereview detail transaksi sebelum diteruskan ke Supervisor. |
| **Supervisor/Manager** | Mereview transaksi (limit nominal, kepatuhan AML, kewajaran); mengecek ketersediaan stok valas untuk transaksi beli; menyetujui atau menolak transaksi; memberikan otorisasi final sebelum sistem mengunci kurs dan memproses pembayaran. |
| **Sistem/Backend** | Mengelola autentikasi OAuth; menyimpan dan memvalidasi data KYC; menghitung estimasi kurs; mengunci kurs/stok setelah otorisasi; berkomunikasi dengan Midtrans API; memproses webhook secara idempotent; menerbitkan invoice/receipt; mengirim notifikasi; menghasilkan laporan. |
| **Payment Gateway/Midtrans** (aktor eksternal) | Memproses pembayaran customer; mengirim callback/webhook status pembayaran (pending, success, failed) ke backend sistem. |

---

## 3. Daftar Screen Aplikasi

| Nama Screen | Peran Pengguna | Tahap Proses | Fungsi Utama | Integrasi Teknis |
|---|---|---|---|---|
| Login/Registrasi | Customer | Registrasi & Login | Autentikasi via akun Google | Google OAuth 2.0 API |
| Dashboard Kurs | Customer, Sistem | Permulaan & Informasi | Menampilkan kurs BUY/SELL real-time dan ketersediaan valas | Internal Rate API |
| Form Upload KYC | Customer | KYC & Verifikasi Identitas | Upload KTP/paspor, isi data diri | Internal Storage/OCR API (opsional) |
| Panel Review KYC | Teller | KYC & Verifikasi Identitas | Verifikasi dokumen, PEP screening, tentukan profil risiko | Internal DB, Watchlist API |
| Form Transaksi | Customer | Penentuan Transaksi | Input jenis transaksi, mata uang, nominal | Internal Rate Calculation API |
| Estimasi Transaksi | Customer, Sistem | Penentuan Transaksi | Menampilkan kurs berlaku, total, dan charge | Internal API |
| Panel Cek Stok | Supervisor | Verifikasi & Cek Stok | Cek ketersediaan stok per denominasi, tawarkan alternatif | Internal Inventory API |
| Panel Review Transaksi | Supervisor | Otorisasi | Review limit, AML check, kewajaran transaksi | Internal Compliance Engine |
| Screen Otorisasi | Supervisor | Otorisasi | Approve/reject transaksi dengan token/password | Internal Auth Service |
| Checkout Pembayaran | Customer | Pembayaran via Midtrans | Redirect ke Midtrans Snap untuk pembayaran | Midtrans Snap API |
| Handler Webhook | Sistem | Konfirmasi & Webhook | Menerima notifikasi status pembayaran, cek idempotency key | Midtrans Webhook, Redis/DB Lock |
| Halaman Status Transaksi | Customer | Pencatatan & Update | Menampilkan status real-time transaksi | Internal API |
| Invoice Viewer | Customer | Pencatatan & Update | Menampilkan/download invoice | Internal PDF Generator |
| Receipt Viewer | Customer | Pencatatan & Update | Menampilkan/download bukti pembayaran | Internal PDF Generator |
| Pusat Notifikasi | Customer | Notifikasi | Menampilkan riwayat notifikasi in-app | Firebase Cloud Messaging/Email API |
| Riwayat Transaksi | Customer | Riwayat Transaksi | List, filter, cari transaksi sebelumnya | Internal DB Query API |
| Dashboard Laporan | Supervisor, Sistem | Laporan & Pelaporan | Laporan transaksi, kas & stok, AML (CTR/STR) | Internal Reporting Engine |

---

## 4. Alur Utama (Success Path)

1. **Customer** login menggunakan akun Google via OAuth 2.0.
   Output: sesi customer terautentikasi dan token akses diterbitkan.

2. **Customer** melihat dashboard kurs; **Sistem** menampilkan kurs BUY/SELL real-time dan stok valas.
   Output: informasi kurs tersedia untuk pengambilan keputusan.

3. **Customer** mengunggah dokumen KYC; **Teller** memverifikasi identitas, keaslian dokumen, dan profil risiko; **Sistem** memvalidasi terhadap database dan watchlist.
   Output: status KYC valid.

4. **Customer** mengisi form transaksi (jenis, mata uang, nominal); **Sistem** menghitung estimasi kurs, nominal rupiah, dan charge.
   Output: estimasi transaksi ditampilkan ke customer.

5. **Supervisor** mengecek ketersediaan stok valas (untuk transaksi beli).
   Output: stok dinyatakan mencukupi.

6. **Supervisor** mereview transaksi (limit, AML, kewajaran) dan memberikan otorisasi via token; **Sistem** mengunci kurs dan stok, menerbitkan nomor referensi transaksi.
   Output: transaksi terotorisasi dan terkunci.

7. **Customer** diarahkan ke halaman checkout dan menyelesaikan pembayaran melalui **Midtrans**.
   Output: pembayaran diproses oleh payment gateway.

8. **Midtrans** mengirim webhook status pembayaran ke **Sistem**; sistem memvalidasi idempotency key untuk mencegah duplikasi pemrosesan.
   Output: status pembayaran "success" tercatat sekali secara konsisten.

9. **Sistem** menerbitkan invoice dan receipt, lalu mengirim notifikasi ke **Customer** (email/push) bahwa transaksi berhasil.
   Output: invoice/receipt tersedia dan customer menerima konfirmasi.

10. **Sistem** mencatat transaksi ke riwayat customer dan memperbarui laporan kas/stok/AML.
    Output: transaksi selesai (SELESAI), tercatat penuh, dan siap diaudit.

---

## 5. Invoice, Receipt, Notifikasi, dan Riwayat Transaksi

### 5.1 Invoice

Diterbitkan segera setelah Supervisor mengotorisasi transaksi (langkah 6), sebelum pembayaran dikonfirmasi — berfungsi sebagai tagihan resmi.

| Field | Keterangan |
|---|---|
| Nomor invoice | Unik, format contoh `INV-YYYYMMDD-XXXX` |
| Tanggal terbit | Timestamp saat invoice dibuat |
| ID & nama customer | Identitas pemohon transaksi |
| Jenis transaksi | Jual atau beli valas |
| Mata uang & nominal | Mata uang asing dan jumlah |
| Kurs terkunci | Kurs yang sudah di-lock sistem |
| Biaya/charge | Biaya tambahan jika ada |
| Total tagihan | Nominal akhir yang harus dibayar |
| Status pembayaran | pending / paid |

### 5.2 Receipt

Diterbitkan setelah webhook Midtrans mengonfirmasi pembayaran sukses (langkah 8–9) — berfungsi sebagai bukti pelunasan, bukan tagihan.

| Field | Keterangan |
|---|---|
| Nomor receipt | Terhubung ke nomor invoice terkait |
| Tanggal & waktu pembayaran | Timestamp konfirmasi dari Midtrans |
| Metode pembayaran | Dari respons Midtrans (VA, kartu kredit, e-wallet, dll.) |
| Jumlah dibayarkan | Nominal aktual yang diterima |
| Transaction ID Midtrans | Nomor referensi transaksi dari payment gateway |

### 5.3 Notifikasi

| Titik Pemicu | Channel |
|---|---|
| Transaksi diajukan | In-app |
| Menunggu otorisasi Supervisor | In-app / push |
| Transaksi disetujui, menunggu pembayaran | Email + push (berisi link checkout) |
| Pembayaran diterima/dikonfirmasi | Email + push (berisi invoice/receipt) |
| Transaksi selesai / gagal | Email + in-app |

Channel dipilih berdasarkan urgensi: push notification untuk aksi yang butuh respons cepat, email untuk dokumen resmi seperti invoice/receipt.

### 5.4 Riwayat Transaksi

**Struktur data per baris:**

| Kolom | Keterangan |
|---|---|
| Nomor referensi | ID unik transaksi |
| Tanggal transaksi | Timestamp pengajuan |
| Jenis | Jual / beli |
| Mata uang | Kode mata uang (USD, EUR, dll.) |
| Nominal | Jumlah transaksi |
| Kurs | Kurs yang digunakan |
| Status | pending / approved / paid / completed / rejected |
| Dokumen | Tautan ke invoice/receipt |

**Fitur filter/pencarian:** rentang tanggal, jenis transaksi, mata uang, status, dan kolom pencarian berdasarkan nomor referensi.

---

## 6. Arsitektur Teknis Singkat

- **Autentikasi:** Google OAuth 2.0 (Authorization Code Flow) untuk login customer.
- **Payment Gateway:** Midtrans Snap API untuk checkout; Midtrans Core API untuk status transaksi.
- **Webhook Idempotency:** setiap notifikasi Midtrans diverifikasi menggunakan kombinasi `order_id` + `transaction_status` yang disimpan di tabel/log idempotency key (misalnya di Redis atau tabel database dengan unique constraint) sebelum diproses, agar notifikasi duplikat tidak memicu update ganda pada saldo/stok.
- **Dokumen:** invoice dan receipt dihasilkan sebagai PDF menggunakan generator internal (misalnya library PDF di backend), disimpan di storage (S3/Google Cloud Storage), dan tautannya dikirim melalui notifikasi.
- **Notifikasi:** kombinasi email (SMTP/SendGrid) dan push notification (Firebase Cloud Messaging) sesuai jenis event.
- **Database:** menyimpan entitas utama — Customer, KYC, Transaksi, Invoice, Receipt, Notifikasi, Log Otorisasi, dan Log Webhook — dengan relasi one-to-many antara Transaksi dan dokumen turunannya (invoice/receipt/notifikasi).

---

## 7. User Spec


```text
════════════════════════════════════════════════
 USER SPEC — ✏️ HANYA BAGIAN INI YANG DIUBAH
════════════════════════════════════════════════

NAMA APLIKASI : valutaprima-gravity
GITHUB REPO   : https://github.com/donnyusmarui/valutaprima-gravity.git
DATABASE URL  : (disimpan di .env — JANGAN tulis di sini)
NETLIFY SITE ID : (disimpan di .env)
GIT EMAIL     : donny.yusmar@ui.ac.id
GIT USERNAME  : donnyusmarui
```
