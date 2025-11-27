# 🎮 Fake ML Generator

Web app untuk membuat fake profile picture Mobile Legends dengan rate limiting 100 request per hari.

## ✨ Features

- 🖼️ Upload gambar (drag & drop / click)
- ✍️ Input username custom (max 20 karakter)
- 📥 Auto download hasil
- 👀 Preview hasil generate
- 🎨 Animated background dengan parallax effect
- 📱 Responsive design
- ⚡ Serverless architecture
- 🔒 Rate limiting: 100 generate per hari per IP
- 🚀 Deploy gratis di Vercel

## 📁 Struktur Project

```
fake-ml-generator/
├── api/
│   ├── generate.js          # Main serverless function
│   └── download.js          # Optional download endpoint
├── public/
│   └── index.html           # Frontend UI
├── vercel.json              # Vercel configuration
├── package.json             # Dependencies
└── README.md                # Dokumentasi
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Buka http://localhost:3000

### 3. Deploy ke Vercel

**Via GitHub (Recommended):**

1. Push ke GitHub
2. Import ke Vercel: https://vercel.com/new
3. Deploy! ✨

**Via Vercel CLI:**

```bash
npm i -g vercel
vercel --prod
```

## 🔧 API Endpoints

### GET /api/generate

Cek rate limit info

**Response:**
```json
{
  "limit": 100,
  "remaining": 95,
  "used": 5,
  "resetAt": "2025-11-28T00:00:00.000Z",
  "resetIn": 43200
}
```

### POST /api/generate

Generate fake ML profile

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `image`: File (JPG, PNG, GIF, WebP)
  - `username`: String (max 20 char)

**Response:**
- Success: PNG image (binary)
- Error 429: Rate limit exceeded
```json
{
  "error": "Rate limit exceeded",
  "message": "Limit harian tercapai! Coba lagi dalam 12j 30m",
  "limit": 100,
  "remaining": 0
}
```

### GET /api/download (Optional)

Download image dari URL

**Query Params:**
- `imageUrl`: URL gambar
- `filename`: Nama file (optional)

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript
- Glassmorphism design
- SVG icons (no emoji)

**Backend:**
- Vercel Serverless Functions
- Node.js (ESM modules)
- Rate limiting dengan in-memory storage

**Dependencies:**
- `node-fetch`: HTTP client
- `form-data`: Multipart form handling

## ⚙️ Configuration

### Rate Limiting

Edit di `api/generate.js`:

```javascript
// Ubah limit dari 100 ke angka lain
if (limitInfo.count >= 100) { // <-- Ubah angka ini
  // ...
}

// Ubah durasi reset dari 24 jam
const resetTime = now + (24 * 60 * 60 * 1000); // <-- Ubah durasi
```

### Timeout

Edit di `vercel.json`:

```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30  // Max 30 detik untuk hobby plan
    }
  }
}
```

## 🎨 Customization

### Ganti Background

Edit di `public/index.html` line ~39:

```css
background-image: url('YOUR_IMAGE_URL_HERE');
```

### Ubah Warna Theme

Edit gradient colors di `public/index.html`:

```css
/* Primary button gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Overlay gradient */
background: linear-gradient(135deg, rgba(30, 20, 60, 0.75), rgba(60, 30, 80, 0.65));
```

## 📊 Rate Limit Logic

- **Storage**: In-memory Map (reset saat redeploy)
- **Identifier**: Client IP address
- **Limit**: 100 requests per 24 jam
- **Reset**: Otomatis setelah 24 jam
- **Cleanup**: Auto cleanup setiap 1 jam

## 🐛 Troubleshooting

**Rate Limit Tidak Reset:**
- Rate limit pakai in-memory storage
- Reset saat Vercel redeploy
- Untuk persistent storage, pakai Redis/Database

**CORS Error:**
- Pastikan CORS headers sudah diset
- Check `Access-Control-Allow-Origin: *`

**Upload Failed:**
- Max file size: 10MB (Vercel limit)
- Supported: JPG, PNG, GIF, WebP

**External API Error:**
- API zenzxz.my.id mungkin down
- Check status API external
- Coba lagi beberapa saat

## 📈 Upgrade Options

**Persistent Rate Limiting:**
- Pakai Vercel KV (Redis)
- Pakai Upstash Redis
- Pakai database (PostgreSQL, MongoDB)

**Advanced Features:**
- User authentication
- Custom templates
- Batch processing
- API key system

## 📄 License

MIT License - Bebas dipakai dan dimodifikasi!

## 👨‍💻 Author

Made with ❤️ by **Ditzz**

---

## 🙏 Credits

- Background image: Anime sunset aesthetic
- External API: api.zenzxz.my.id
- Hosting: Vercel

## 📞 Support

Ada bug atau saran? Silakan buat issue atau PR!

Happy coding! 🚀
