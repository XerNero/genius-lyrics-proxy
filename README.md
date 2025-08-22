# genius-lyrics-proxy

Vercel serverless proxy untuk mengambil lirik dari Genius dan mengembalikan **plain text**.

- **ENV yang diperlukan**: `GENIUS_TOKEN` (Client Access Token Genius, bukan Client Secret)
- **Endpoint**: `GET /api/lyrics?title=Judul&artist=Artis`
- **Output**: `text/plain; charset=utf-8`

## 1) Persiapan
- Node.js 18+
- Akun Vercel + Vercel CLI (`npm i -g vercel`)
- Token Genius (Client Access Token) dari dashboard Genius

## 2) Setup Lokal
```bash
# Install dependency
npm install

# Buat file .env.local atau export variabel saat dev
# Vercel dev otomatis membaca .env.local
# Isi GENIUS_TOKEN dengan Client Access Token Genius
# Contoh .env.local:
# GENIUS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Jalankan lokal (port default 3000)
vercel dev
```

### Test Lokal
```bash
curl "http://localhost:3000/api/lyrics?title=Shape of You&artist=Ed Sheeran" -H "Accept: text/plain"
```
Harus mengembalikan lirik dalam bentuk plain text. Jika kosong, akan mengembalikan `Lyrics not found`.

## 3) Deploy ke Vercel
```bash
# Inisialisasi project (ikuti prompt)
vercel

# Tambahkan ENV di Vercel (Production)
vercel env add GENIUS_TOKEN production
# Paste Client Access Token Genius Anda

# (Opsional) Tambahkan juga untuk Preview/Development
vercel env add GENIUS_TOKEN preview
vercel env add GENIUS_TOKEN development

# Deploy ke production
vercel --prod
```
Setelah deploy, Anda akan mendapatkan domain, misal: `https://genius-lyrics-proxy.vercel.app`.

### Test di Production
```bash
curl "https://genius-lyrics-proxy.vercel.app/api/lyrics?title=Anti-Hero&artist=Taylor Swift" -H "Accept: text/plain"
```

## 4) Integrasi dengan plugin spotifyInfoLyrics
Plugin ini hanya perlu endpoint yang mengembalikan lirik sebagai plain text. Gunakan base URL deploy Vercel Anda.

- **HTTP Method**: GET
- **Endpoint**: `/api/lyrics`
- **Query params**:
  - `title`: judul lagu
  - `artist`: nama artis
- **Response**: `text/plain; charset=utf-8`
- **CORS**: sudah diizinkan (`Access-Control-Allow-Origin: *`)

### Contoh konfigurasi
- **Base URL**: `https://genius-lyrics-proxy.vercel.app`
- **Template request**: `/api/lyrics?title={title}&artist={artist}`

### Contoh request nyata
```bash
GET https://genius-lyrics-proxy.vercel.app/api/lyrics?title=Blinding%20Lights&artist=The%20Weeknd
```
Response body akan berupa lirik full dalam plain text.

## 5) Catatan & Troubleshooting
- Jika menerima `Missing GENIUS_TOKEN`, pastikan ENV sudah diset di Vercel/`.env.local`.
- Jika `Lyrics not found`, kemungkinan struktur halaman berbeda atau hasil pencarian tidak cocok. Coba variasi judul/artist yang lebih spesifik.
- Endpoint ini melakukan scraping HTML Genius untuk mengambil lirik dari beberapa container `Lyrics__Container`. Fallback lama juga disertakan.
- Rate-limit: gunakan dengan wajar agar tidak terkena pembatasan.

## Struktur Proyek
```
genius-lyrics-proxy/
  package.json
  api/
    lyrics.js
  .gitignore
  vercel.json
  README.md
```
"# genius-lyrics-proxy" 
"# genius-lyrics-proxy" 
"# genius-lyrics-proxy" 
