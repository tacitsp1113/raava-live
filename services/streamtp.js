const axios = require('axios');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

let eventsCache = [];
let lastFetch = 0;
const CACHE_TTL = 90000; // 90 seconds
const streamCache = new Map(); // Cache resolved m3u8 URLs

function formatChannelName(rawStream) {
  if (!rawStream) return 'Canal en Vivo';
  const s = rawStream.toLowerCase();
  if (s === 'espn') return 'ESPN';
  if (s === 'espnmx') return 'ESPN México';
  if (s === 'espn2') return 'ESPN 2';
  if (s === 'espn3') return 'ESPN 3';
  if (s === 'espn4') return 'ESPN 4';
  if (s === 'espn5') return 'ESPN 5';
  if (s === 'espn6') return 'ESPN 6';
  if (s === 'espn7') return 'ESPN 7';
  if (s === 'espndeportes') return 'ESPN Deportes';
  if (s.startsWith('disney')) return `Disney+ / Star+ ${s.replace('disney', '')}`;
  if (s.startsWith('max')) return `TNT Sports / Max ${s.replace('max', '')}`;
  if (s === 'tudnmx') return 'TUDN México';
  if (s === 'tudnus') return 'TUDN USA';
  if (s === 'azteca7') return 'Azteca 7';
  if (s.includes('canal5')) return 'Canal 5';
  if (s === 'winplus') return 'Win Sports+';
  if (s === 'winsports') return 'Win Sports';
  if (s === 'fox1ar') return 'Fox Sports';
  if (s === 'tntsportscl') return 'TNT Sports Chile';
  if (s === 'dsports2') return 'DSports 2';
  return rawStream.toUpperCase();
}

function getEventPoster(category, title = '') {
  const c = (category || '').toLowerCase();
  const t = (title || '').toLowerCase();

  if (c.includes('f1') || c.includes('motor') || t.includes('formula') || t.includes('rally') || t.includes('wrc')) {
    return 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80';
  }
  if (c.includes('basket') || c.includes('nba') || t.includes('nba')) {
    return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80';
  }
  if (c.includes('tennis') || t.includes('atp') || t.includes('wta')) {
    return 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80';
  }
  if (c.includes('fight') || c.includes('ufc') || c.includes('box')) {
    return 'https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=600&q=80';
  }
  // Default Football / Soccer
  return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80';
}

async function getLiveEvents() {
  const now = Date.now();
  if (eventsCache.length > 0 && now - lastFetch < CACHE_TTL) {
    return eventsCache;
  }

  try {
    const url = 'https://streamtp-golden1.click/events.json';
    const resp = await axios.get(url, {
      headers: { ...HEADERS, 'Referer': 'https://streamtp-golden1.click/' },
      timeout: 7000
    });

    if (Array.isArray(resp.data)) {
      eventsCache = resp.data.map((item, idx) => {
        const streamParam = item.url && item.url.includes('stream=')
          ? item.url.split('stream=')[1]
          : item.url;
        const channelName = formatChannelName(streamParam);
        const poster = getEventPoster(item.category, item.title);

        return {
          id: `raava_tp_${idx}`,
          title: item.title || 'Evento en Vivo',
          category: item.category || 'Deportes',
          time: item.time || '',
          quality: item.quality || 'HD',
          channelName,
          rawUrl: item.url,
          streamParam,
          poster
        };
      });
      lastFetch = now;
    }
  } catch (err) {
    console.error('Error fetching streamtp events:', err.message);
  }

  return eventsCache;
}

// Pre-warm cache periodically
setInterval(getLiveEvents, 60000);

// 24/7 Fixed Sports Channels list with authentic logos
const FIXED_CHANNELS = [
  {
    id: 'raava_ch_espn',
    name: 'ESPN Latino',
    stream: 'espn',
    logo: 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/espn-us.png'
  },
  {
    id: 'raava_ch_espnmx',
    name: 'ESPN México',
    stream: 'espnmx',
    logo: 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/espn-us.png'
  },
  {
    id: 'raava_ch_espn2',
    name: 'ESPN 2',
    stream: 'espn2',
    logo: 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/espn-2-us.png'
  },
  {
    id: 'raava_ch_espn3',
    name: 'ESPN 3',
    stream: 'espn3',
    logo: 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/espn-3-us.png'
  },
  {
    id: 'raava_ch_tudn',
    name: 'TUDN México',
    stream: 'tudnmx',
    logo: 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/mexico/tudn-mx.png'
  },
  {
    id: 'raava_ch_tudnus',
    name: 'TUDN USA',
    stream: 'tudnus',
    logo: 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/mexico/tudn-mx.png'
  },
  {
    id: 'raava_ch_azteca7',
    name: 'Azteca 7 (Deportes)',
    stream: 'azteca7',
    logo: 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/mexico/azteca-7-mx.png'
  },
  {
    id: 'raava_ch_foxsports',
    name: 'Fox Sports',
    stream: 'fox1ar',
    logo: 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/argentina/fox-sports-ar.png'
  },
  {
    id: 'raava_ch_disney1',
    name: 'Disney+ / Star+ 1',
    stream: 'disney1',
    logo: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'raava_ch_disney2',
    name: 'Disney+ / Star+ 2',
    stream: 'disney2',
    logo: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'raava_ch_disney3',
    name: 'Disney+ / Star+ 3',
    stream: 'disney3',
    logo: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'raava_ch_max1',
    name: 'TNT Sports / Max 1',
    stream: 'max1',
    logo: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'raava_ch_max2',
    name: 'TNT Sports / Max 2',
    stream: 'max2',
    logo: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'raava_ch_winplus',
    name: 'Win Sports+',
    stream: 'winplus',
    logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80'
  }
];

async function resolveM3u8FromUrl(targetUrl) {
  // Check memory cache first (3 minutes TTL)
  const cached = streamCache.get(targetUrl);
  if (cached && Date.now() - cached.time < 180000) {
    return cached.data;
  }

  try {
    const resp = await axios.get(targetUrl, {
      headers: {
        ...HEADERS,
        'Referer': 'https://streamtp-golden1.click/'
      },
      timeout: 6000
    });

    const html = resp.data;
    const match = html.match(/var\s+playbackURL\s*=\s*"([^"]+)"/);
    if (match && match[1]) {
      const cleanUrl = match[1].replace(/\\\//g, '/');
      const data = {
        streamUrl: cleanUrl,
        referer: 'https://streamtp99a.sbs/',
        origin: 'https://streamtp99a.sbs'
      };
      streamCache.set(targetUrl, { time: Date.now(), data });
      return data;
    }
  } catch (err) {
    console.error('Error resolving playbackURL from:', targetUrl, err.message);
  }
  return null;
}

async function resolveChannelStream(streamParam) {
  const targetUrl = `https://streamtp99a.sbs/global1.php?stream=${encodeURIComponent(streamParam)}`;
  return await resolveM3u8FromUrl(targetUrl);
}

module.exports = {
  getLiveEvents,
  FIXED_CHANNELS,
  resolveM3u8FromUrl,
  resolveChannelStream
};
