import pkg from 'whatsapp-web.js';
const { Client: WAClient, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import fetch from 'node-fetch';

// Inisialisasi WA Bot
const waClient = new WAClient({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  }
});

// Path file subscriber
const SUBSCRIBERS_FILE = 'subscribers.txt';
let subscribers = [];

// Load daftar subscriber dari file
if (fs.existsSync(SUBSCRIBERS_FILE)) {
  subscribers = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8')
    .split('\n').map(line => line.trim()).filter(Boolean);  
}

// Simpan subscriber ke file
function saveSubscribers() {
  fs.writeFileSync(SUBSCRIBERS_FILE + '.tmp', subscribers.join('\n'));
  fs.renameSync(SUBSCRIBERS_FILE + '.tmp', SUBSCRIBERS_FILE);
}

// Validasi format nomor WA
function isValidNumber(number) {
  return number.endsWith('@c.us') || number.endsWith('@s.whatsapp.net');
}

// URL Supabase & Header API
function getTodayTimestamp() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

const urls = {
  gear: `https://vextbzatpprnksyutbcp.supabase.co/rest/v1/growagarden_stock?select=*&type=eq.gear_stock&active=eq.true&created_at=gte.${encodeURIComponent(getTodayTimestamp())}&order=created_at.desc`,
  cosmetics: `https://vextbzatpprnksyutbcp.supabase.co/rest/v1/growagarden_stock?select=*&type=eq.cosmetics_stock&active=eq.true&created_at=gte.${encodeURIComponent(getTodayTimestamp())}&order=created_at.desc`,
  egg: `https://vextbzatpprnksyutbcp.supabase.co/rest/v1/growagarden_stock?select=*&type=eq.egg_stock&active=eq.true&created_at=gte.${encodeURIComponent(getTodayTimestamp())}&order=created_at.desc`,
  seeds: `https://vextbzatpprnksyutbcp.supabase.co/rest/v1/growagarden_stock?select=*&type=eq.seeds_stock&active=eq.true&created_at=gte.${encodeURIComponent(getTodayTimestamp())}&order=created_at.desc`
};

const headers = {
  'accept': '*/*',
  'accept-profile': 'public',
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZleHRiemF0cHBybmtzeXV0YmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxODQwODEsImV4cCI6MjA2Mjc2MDA4MX0.NKrxJnejTBezJ9R1uKE1B1bTp6Pgq5SMiqpAokCC_-o',
  'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZleHRiemF0cHBybmtzeXV0YmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxODQwODEsImV4cCI6MjA2Mjc2MDA4MX0.NKrxJnejTBezJ9R1uKE1B1bTp6Pgq5SMiqpAokCC_-o',
  'x-client-info': 'supabase-js-web/2.49.4'
};

// Format teks stok
function formatSection(title, data, icon = '', showTitle = true) {
    if (!Array.isArray(data) || data.length === 0) return '';
  
    let output = '';
    if (showTitle) output += `*${icon} ${title}*\n`; // pakai emoji, aman
    data.forEach(item => {
      const name = `${icon} ${item.display_name}`;
      const multiplier = `${item.multiplier}x`;
      output += `* ${name} (${multiplier})\n`;
    });
    output += '\n';
    return output;
  }

// Ambil data stok lengkap
async function getStockText() {
  try {
    const [gearRes, cosmeticsRes, eggRes, seedsRes] = await Promise.all([
      fetch(urls.gear, { headers }),
      fetch(urls.cosmetics, { headers }),
      fetch(urls.egg, { headers }),
      fetch(urls.seeds, { headers })
    ]);

    if (![gearRes, cosmeticsRes, eggRes, seedsRes].every(res => res.ok)) {
      throw new Error('Gagal mengambil data dari server.');
    }

    const [gear, cosmetics, egg, seeds] = await Promise.all([
      gearRes.json(), cosmeticsRes.json(), eggRes.json(), seedsRes.json()
    ]);

    let text = `📊 *Grow a Garden Stock Update*\n\n`;
    text += `🛠️ *Gear Stock* (Update tiap 5 menit)\n${formatSection('Gear', gear, '🛠️', false)}`;
    text += `🌟 *Cosmetics Stock* (Update tiap 4 jam)\n${formatSection('Cosmetics', cosmetics, '⭐', false)}`;
    text += `🥚 *Egg Stock* (Update tiap 30 menit)\n${formatSection('Egg', egg, '🥚', false)}`;
    text += `🌱 *Seeds Stock* (Update tiap 5 menit)\n${formatSection('Seeds', seeds, '🌱', false)}`;

    return text;

  } catch (err) {
    console.error('Error getStockText:', err);
    return '⚠️ Gagal mengambil data stok. Silakan coba lagi nanti.';
  }
}

// Timestamp UTC
function getTimestamp() {
  return new Date().toLocaleString('en-GB', { timeZone: 'UTC' }) + ' UTC';
}

// QR Code WA
waClient.on('qr', qr => qrcode.generate(qr, { small: true }));

// WA Bot Ready
waClient.on('ready', () => {
  console.log('✅ WhatsApp Bot aktif!');
  isWhatsAppReady = true;
});

// Status WhatsApp Web
let isWhatsAppReady = false;

// Handle pesan masuk
waClient.on('message', async msg => {
  const sender = msg.from;
  const command = msg.body.trim().toLowerCase();

  const allowedCategories = {
    gear: { type: 'gear_stock', icon: '🛠️', label: 'Gear' },
    seeds: { type: 'seeds_stock', icon: '🌱', label: 'Seeds' },
    egg: { type: 'egg_stock', icon: '🥚', label: 'Egg' },
    cosmetics: { type: 'cosmetics_stock', icon: '⭐', label: 'Cosmetics' }
  };

  if (command === '.getstock') {
    if (isValidNumber(sender) && !subscribers.includes(sender)) {
      subscribers.push(sender);
      saveSubscribers();
      msg.reply('✅ Kamu berlangganan update stok otomatis.');
    } else {
      msg.reply('ℹ️ Kamu sudah terdaftar.');
    }
    waClient.sendMessage(sender, await getStockText());

  } else if (command === '.stopstock') {
    const idx = subscribers.indexOf(sender);
    if (idx !== -1) {
      subscribers.splice(idx, 1);
      saveSubscribers();
      msg.reply('❌ Berhenti berlangganan update stok.');
    } else {
      msg.reply('Kamu belum berlangganan.');
    }

  } else if (command === '.help') {
    msg.reply(
        `🌿 *Grow a Garden Stock Bot Help*\n\n` +
        `📦 *.getstock* — Berlangganan update stok otomatis\n` +
        `🛑 *.stopstock* — Berhenti berlangganan\n` +
        `🔍 *.get [kategori]* — Lihat stok kategori (ketik *.get* untuk daftar)\n` +
        `ℹ️ *.help* — Tampilkan bantuan`
      );

  } else if (command.startsWith('.get')) {
    const parts = command.split(' ');
    if (parts.length === 1) {
      msg.reply(`Kategori stok:\n` +
        Object.keys(allowedCategories).map(cat => `- ${cat}`).join('\n') +
        `\nGunakan *.get [kategori]* untuk cek stok tertentu.`
      );
    } else {
        const cat = parts[1];

        if (!allowedCategories[cat]) {
          const availableCategories = Object.keys(allowedCategories)
            .map(c => `- ${c}`)
            .join('\n');
        
          msg.reply(
            `Kategori *'${cat}'* tidak valid.\n\n` +
            `✅ Kategori tersedia:\n${availableCategories}`
          );
        } else {
          try {
            const { type, icon, label } = allowedCategories[cat];
            const url = `https://vextbzatpprnksyutbcp.supabase.co/rest/v1/growagarden_stock?select=*&type=eq.${type}&active=eq.true&created_at=gte.${encodeURIComponent(getTodayTimestamp())}&order=created_at.desc`;
        
            const res = await fetch(url, { headers });
            const data = await res.json();
        
            if (!Array.isArray(data) || data.length === 0) {
              msg.reply(`⚠️ Stok *${label}* kosong.`);
            } else {
              const stockText = formatSection(label, data, icon, false);
              msg.reply(`${stockText}Update: ${getTimestamp()}`);
            }
        
          } catch (err) {
            console.error('Error get category stock:', err);
            msg.reply('⚠️ Gagal mengambil stok, coba lagi.');
          }
        }
    }
  } else {
    msg.reply(
      `🌿 *Grow a Garden Stock Bot*\n\n` +
      `*.getstock* — Berlangganan update otomatis\n` +
      `*.stopstock* — Berhenti berlangganan\n` +
      `*.get [kategori]* — Cek stok kategori\n` +
      `*.help* — Bantuan`
    );

    if (isValidNumber(sender) && !subscribers.includes(sender)) {
      msg.reply(`Ketik *.getstock* untuk mulai berlangganan update stok.`);
    }
  }
});

// Kirim update stok otomatis
async function sendSectionToAll(title, url, icon, intervalText) {
  if (!isWhatsAppReady) {
    console.log(`⏳ WhatsApp belum siap, skip kirim ${title}`);
    return;
  }
  
  try {
    const res = await fetch(url, { headers });
    const data = await res.json();
    if (!data.length) return;
    const message = `${icon} ${title} Stock ${intervalText}\n\n${formatSection(title, data, icon, false)}Update: ${getTimestamp()}`;
    for (const number of subscribers) {
      try {
        await waClient.sendMessage(number, message);
        await new Promise(res => setTimeout(res, 500));
        console.log(`✅ ${title} terkirim ke ${number}`);
      } catch (err) {
        console.error(`Gagal kirim ke ${number}:`, err);
      }
    }
  } catch (err) {
    console.error(`Gagal ambil data ${title}:`, err);
  }
}

// Jadwal sinkron sesuai update Supabase
function scheduleAtMinuteInterval(fn, intervalMinutes) {
  const now = new Date();
  const msNow = now.getTime();
  const next = new Date(now);
  next.setSeconds(0, 0);
  let nextMinute = now.getMinutes() + 1;
  while (nextMinute % intervalMinutes !== 0) nextMinute++;
  next.setMinutes(nextMinute);
  let delay = next - now;
  if (delay < 0) delay += intervalMinutes * 60 * 1000;
  setTimeout(() => {
    fn();
    setInterval(fn, intervalMinutes * 60 * 1000);
  }, delay);
}

function scheduleAtHourInterval(fn, intervalHours) {
  const now = new Date();
  const msNow = now.getTime();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  let nextHour = now.getHours() + 1;
  while (nextHour % intervalHours !== 0) nextHour++;
  next.setHours(nextHour);
  let delay = next - now;
  if (delay < 0) delay += intervalHours * 60 * 60 * 1000;
  setTimeout(() => {
    fn();
    setInterval(fn, intervalHours * 60 * 60 * 1000);
  }, delay);
}

// Seeds & Gear: tiap 5 menit sinkron
scheduleAtMinuteInterval(() => sendSectionToAll('Seeds', urls.seeds, '🌱', '(Update tiap 5 menit)'), 5);
scheduleAtMinuteInterval(() => sendSectionToAll('Gear', urls.gear, '🛠️', '(Update tiap 5 menit)'), 5);
// Egg: tiap 30 menit sinkron
scheduleAtMinuteInterval(() => sendSectionToAll('Egg', urls.egg, '🥚', '(Update tiap 30 menit)'), 30);
// Cosmetics: tiap 4 jam sinkron
scheduleAtHourInterval(() => sendSectionToAll('Cosmetics', urls.cosmetics, '⭐', '(Update tiap 4 jam)'), 4);

// Inisialisasi WA Bot
waClient.initialize();
