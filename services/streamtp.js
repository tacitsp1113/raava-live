const axios = require('axios');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

let eventsCache = [];
let lastFetch = 0;
const CACHE_TTL = 120000; // 2 minutes

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
  if (s.startsWith('disney')) return `Disney+ Deportes ${s.replace('disney', '')}`;
  if (s.startsWith('max')) return `Max / TNT Sports ${s.replace('max', '')}`;
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

async function getLiveEvents() {
  const now = Date.now();
  if (eventsCache.length > 0 && now - lastFetch < CACHE_TTL) {
    return eventsCache;
  }

  try {
    const url = 'https://streamtp-golden1.click/events.json';
    const resp = await axios.get(url, {
      headers: { ...HEADERS, 'Referer': 'https://streamtp-golden1.click/' },
      timeout: 8000
    });

    if (Array.isArray(resp.data)) {
      eventsCache = resp.data.map((item, idx) => {
        const streamParam = item.url && item.url.includes('stream=')
          ? item.url.split('stream=')[1]
          : item.url;
        const channelName = formatChannelName(streamParam);

        return {
          id: `raava_tp_${idx}`,
          title: item.title || 'Evento en Vivo',
          category: item.category || 'Deportes',
          time: item.time || '',
          quality: item.quality || 'HD',
          channelName,
          rawUrl: item.url,
          streamParam
        };
      });
      lastFetch = now;
    }
  } catch (err) {
    console.error('Error fetching streamtp events:', err.message);
  }

  return eventsCache;
}

// 24/7 Fixed Sports Channels list
const FIXED_CHANNELS = [
  { id: 'raava_ch_espn', name: 'ESPN Latino', stream: 'espn' },
  { id: 'raava_ch_espnmx', name: 'ESPN México', stream: 'espnmx' },
  { id: 'raava_ch_espn2', name: 'ESPN 2', stream: 'espn2' },
  { id: 'raava_ch_espn3', name: 'ESPN 3', stream: 'espn3' },
  { id: 'raava_ch_espn4', name: 'ESPN 4', stream: 'espn4' },
  { id: 'raava_ch_tudn', name: 'TUDN México', stream: 'tudnmx' },
  { id: 'raava_ch_tudnus', name: 'TUDN USA', stream: 'tudnus' },
  { id: 'raava_ch_azteca7', name: 'Azteca 7 (Deportes)', stream: 'azteca7' },
  { id: 'raava_ch_disney1', name: 'Disney+ / Star+ 1', stream: 'disney1' },
  { id: 'raava_ch_disney2', name: 'Disney+ / Star+ 2', stream: 'disney2' },
  { id: 'raava_ch_disney3', name: 'Disney+ / Star+ 3', stream: 'disney3' },
  { id: 'raava_ch_max1', name: 'TNT Sports / Max 1', stream: 'max1' },
  { id: 'raava_ch_max2', name: 'TNT Sports / Max 2', stream: 'max2' },
  { id: 'raava_ch_winplus', name: 'Win Sports+', stream: 'winplus' }
];

async function resolveM3u8FromUrl(targetUrl) {
  try {
    const resp = await axios.get(targetUrl, {
      headers: {
        ...HEADERS,
        'Referer': 'https://streamtp-golden1.click/'
      },
      timeout: 9000
    });

    const html = resp.data;
    const match = html.match(/var\s+playbackURL\s*=\s*"([^"]+)"/);
    if (match && match[1]) {
      const cleanUrl = match[1].replace(/\\\//g, '/');
      return {
        streamUrl: cleanUrl,
        referer: 'https://streamtp99a.sbs/',
        origin: 'https://streamtp99a.sbs'
      };
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
