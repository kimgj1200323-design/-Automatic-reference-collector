const rateLimit = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1분
  const maxRequests = 30;     // 1분에 최대 30회

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, start: now });
    return true;
  }
  const data = rateLimit.get(ip);
  if (now - data.start > windowMs) {
    rateLimit.set(ip, { count: 1, start: now });
    return true;
  }
  if (data.count >= maxRequests) return false;
  data.count++;
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-app-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 비밀 토큰 검증
  const APP_TOKEN = process.env.APP_SECRET_TOKEN;
  if (APP_TOKEN && req.headers['x-app-token'] !== APP_TOKEN) {
    return res.status(401).json({ error: '인증 실패: 유효하지 않은 접근이에요.' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' });
  }

  const { action, ...params } = req.query;
  const API_KEY = process.env.YOUTUBE_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'YouTube API 키가 설정되지 않았어요. Vercel 환경변수를 확인해주세요.' });
  }

  try {
    let url = '';

    if (action === 'search') {
      const { q, maxResults, order, publishedAfter } = params;
      url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&videoDuration=short&order=${order}&maxResults=${maxResults}&publishedAfter=${publishedAfter}&key=${API_KEY}`;
    } else if (action === 'stats') {
      const { ids } = params;
      url = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids}&key=${API_KEY}`;
    } else {
      return res.status(400).json({ error: '알 수 없는 action이에요.' });
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
