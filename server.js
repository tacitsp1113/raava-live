const express = require('express');
const cors = require('cors');
const { getLiveEvents, FIXED_CHANNELS, resolveM3u8FromUrl, resolveChannelStream } = require('./services/streamtp');

const app = express();
const PORT = process.env.PORT || 7001;

app.use(cors());
app.use((req, res, next) => {
  console.log(`[RAAVA LIVE] ${req.method} ${req.url}`);
  next();
});

const MANIFEST = {
  id: 'org.raava.live',
  version: '1.0.1',
  name: 'RAAVA LIVE',
  description: 'Deportes y Televisión en Vivo (Fútbol, F1, ESPN, TUDN, Star+)',
  logo: 'https://raw.githubusercontent.com/tacitsp1113/raava-str/main/logo.png',
  background: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1920&q=80',
  resources: ['catalog', 'meta', 'stream'],
  types: ['tv'],
  idPrefixes: ['raava_'],
  catalogs: [
    {
      type: 'tv',
      id: 'raava_live_agenda',
      name: '⚽ Partidos y Eventos de Hoy'
    },
    {
      type: 'tv',
      id: 'raava_live_channels',
      name: '📺 Canales 24/7 (ESPN, TUDN, Max)'
    }
  ]
};

// 1. Manifiesto Stremio
app.get('/manifest.json', (req, res) => {
  res.json(MANIFEST);
});

// 2. Catálogos Stremio
app.get('/catalog/tv/:id.json', async (req, res) => {
  const { id } = req.params;

  if (id === 'raava_live_channels') {
    const metas = FIXED_CHANNELS.map(ch => ({
      id: ch.id,
      type: 'tv',
      name: ch.name,
      poster: 'https://raw.githubusercontent.com/tacitsp1113/raava-str/main/logo.png',
      posterShape: 'square',
      description: `Señal deportiva en vivo 24/7 • ${ch.name}`,
      genres: ['Deportes', 'En Vivo']
    }));
    return res.json({ metas });
  }

  if (id === 'raava_live_agenda') {
    const events = await getLiveEvents();
    const metas = events.map(ev => ({
      id: ev.id,
      type: 'tv',
      name: `[${ev.time || 'HOY'}] ${ev.title}`,
      poster: 'https://raw.githubusercontent.com/tacitsp1113/raava-str/main/logo.png',
      posterShape: 'landscape',
      description: `🏆 ${ev.category} | 📡 ${ev.channelName} (${ev.quality})`,
      genres: [ev.category, 'En Vivo']
    }));
    return res.json({ metas });
  }

  res.json({ metas: [] });
});

// 3. Metadatos de un Canal o Evento
app.get('/meta/tv/:id.json', async (req, res) => {
  const { id } = req.params;

  if (id.startsWith('raava_ch_')) {
    const ch = FIXED_CHANNELS.find(c => c.id === id);
    if (ch) {
      return res.json({
        meta: {
          id: ch.id,
          type: 'tv',
          name: ch.name,
          poster: 'https://raw.githubusercontent.com/tacitsp1113/raava-str/main/logo.png',
          description: `Transmisión oficial de ${ch.name} en directo 24/7`,
          genres: ['Deportes', 'En Vivo'],
          videos: [
            {
              id: ch.id,
              title: `Señal en Directo: ${ch.name}`,
              released: new Date().toISOString()
            }
          ]
        }
      });
    }
  }

  if (id.startsWith('raava_tp_')) {
    const events = await getLiveEvents();
    const ev = events.find(e => e.id === id);
    if (ev) {
      return res.json({
        meta: {
          id: ev.id,
          type: 'tv',
          name: `[${ev.time}] ${ev.title}`,
          poster: 'https://raw.githubusercontent.com/tacitsp1113/raava-str/main/logo.png',
          description: `Competición: ${ev.category}\nCanal: ${ev.channelName}\nCalidad: ${ev.quality}`,
          genres: [ev.category, 'Deportes'],
          videos: [
            {
              id: ev.id,
              title: `Transmisión en Vivo • ${ev.channelName}`,
              released: new Date().toISOString()
            }
          ]
        }
      });
    }
  }

  res.json({ meta: null });
});


// 4. Extracción y entrega de Streams en Vivo
app.get('/stream/tv/:id.json', async (req, res) => {
  const { id } = req.params;
  const streams = [];

  try {
    if (id.startsWith('raava_ch_')) {
      const ch = FIXED_CHANNELS.find(c => c.id === id);
      if (ch) {
        const resolved = await resolveChannelStream(ch.stream);
        if (resolved && resolved.streamUrl) {
          streams.push({
            title: `🔴 EN VIVO • ${ch.name}\n📡 Señal Directa HD`,
            url: resolved.streamUrl,
            behaviorHints: {
              notWebReady: false,
              proxyHeaders: {
                request: {
                  'Referer': resolved.referer,
                  'Origin': resolved.origin,
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
              }
            }
          });
        }
      }
    } else if (id.startsWith('raava_tp_')) {
      const events = await getLiveEvents();
      const ev = events.find(e => e.id === id);
      if (ev && ev.rawUrl) {
        const resolved = await resolveM3u8FromUrl(ev.rawUrl);
        if (resolved && resolved.streamUrl) {
          streams.push({
            title: `🔴 EN VIVO • ${ev.channelName}\n🏆 ${ev.category} (${ev.quality})`,
            url: resolved.streamUrl,
            behaviorHints: {
              notWebReady: false,
              proxyHeaders: {
                request: {
                  'Referer': resolved.referer,
                  'Origin': resolved.origin,
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
              }
            }
          });
        }
      }
    }
  } catch (err) {
    console.error('Error generating live stream:', err.message);
  }

  res.json({ streams });
});

// 5. Landing Page Interactiva
app.get('/', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const manifestUrl = `${protocol}://${host}/manifest.json`;
  const stremioUrl = `stremio://${host}/manifest.json`;

  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RAAVA LIVE • Deportes y TV en Vivo</title>
      <link rel="icon" type="image/png" href="https://raw.githubusercontent.com/tacitsp1113/raava-str/main/logo.png">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background: radial-gradient(circle at top, #0f172a, #020617); color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 48px 36px; max-width: 520px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .logo { width: 110px; height: 110px; border-radius: 50%; margin: 0 auto 24px; display: block; filter: drop-shadow(0 0 24px rgba(56, 189, 248, 0.4)); }
        h1 { font-size: 2.2rem; font-weight: 800; margin-bottom: 8px; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p { color: #94a3b8; font-size: 1rem; line-height: 1.5; margin-bottom: 32px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; width: 100%; background: linear-gradient(135deg, #0284c7, #2563eb); color: white; text-decoration: none; padding: 16px 28px; border-radius: 14px; font-weight: 700; font-size: 1.1rem; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4); }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.6); }
        .features { margin-top: 32px; text-align: left; background: rgba(15, 23, 42, 0.6); padding: 20px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.05); }
        .feature-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: #cbd5e1; font-size: 0.95rem; }
        .feature-item:last-child { margin-bottom: 0; }
        .dot { width: 8px; height: 8px; background: #38bdf8; border-radius: 50%; }
        .manifest-box { margin-top: 24px; padding: 12px; background: rgba(0,0,0,0.4); border-radius: 8px; font-size: 0.8rem; color: #64748b; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="card">
        <img class="logo" src="https://raw.githubusercontent.com/tacitsp1113/raava-str/main/logo.png" alt="Raava Live">
        <h1>RAAVA LIVE</h1>
        <p>Deportes y Televisión en Directo sin cortes ni activaciones diarias de Discord.</p>
        
        <a class="btn" href="${stremioUrl}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          Instalar en Stremio
        </a>

        <div class="features">
          <div class="feature-item"><div class="dot"></div><span><strong>Fórmula 1 y WRC:</strong> Transmisiones en vivo HD.</span></div>
          <div class="feature-item"><div class="dot"></div><span><strong>Fútbol y Champions:</strong> Partidos del día actualizados.</span></div>
          <div class="feature-item"><div class="dot"></div><span><strong>Canales 24/7:</strong> ESPN, TUDN, Fox Sports y Star+.</span></div>
          <div class="feature-item"><div class="dot"></div><span><strong>100% Libre:</strong> Sin tokens ni renovación cada 24 horas.</span></div>
        </div>

        <div class="manifest-box">
          ${manifestUrl}
        </div>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`[RAAVA LIVE] Servidor corriendo en puerto ${PORT}`);
  console.log(`[RAAVA LIVE] Manifiesto: http://127.0.0.1:${PORT}/manifest.json`);
});
