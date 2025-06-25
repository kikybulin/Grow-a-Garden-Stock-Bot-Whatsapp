# Grow a Garden WhatsApp Notification Stock Bot

Bot WhatsApp untuk monitoring dan notifikasi stok Grow a Garden (Gear, Seeds, Egg, Cosmetics) berbasis Supabase. Otomatis broadcast update ke subscriber via WhatsApp.

## Fitur

- Cek stok real-time via WhatsApp command
- Berlangganan update stok otomatis (broadcast)
- Kategori: Gear, Seeds, Egg, Cosmetics
- Jadwal update otomatis (Gear/Seeds: 5 menit, Egg: 30 menit, Cosmetics: 4 jam)
- QR code login WhatsApp Web
- CRUD subscriber (otomatis via command)
- Tidak ada integrasi Discord (meski dependensi discord.js ada di package.json, tidak dipakai)

## Command WhatsApp

- `.getstock` — Berlangganan update stok otomatis
- `.stopstock` — Berhenti berlangganan
- `.get [kategori]` — Lihat stok kategori (`gear`, `seeds`, `egg`, `cosmetics`)
- `.help` — Bantuan

## Instalasi

1. **Clone repo & install dependencies**
   ```bash
   git clone <repo-url>
   cd ch
   npm install
   ```

2. **Jalankan bot**
   ```bash
   node wa-stock-bot.js
   ```
   Scan QR code di terminal dengan WhatsApp.

3. **(Opsional) Edit path Chromium di wa-stock-bot.js**  
   Ubah `executablePath` jika tidak pakai Linux/WSL.

## Dependensi

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [qrcode-terminal](https://www.npmjs.com/package/qrcode-terminal)
- [node-fetch](https://www.npmjs.com/package/node-fetch)
- (Tercantum: discord.js, tapi tidak dipakai)

## Catatan

- File subscriber: `subscribers.txt`
- API key Supabase hardcoded (ganti jika perlu)
- Bot hanya berjalan jika WhatsApp Web aktif
