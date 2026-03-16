export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

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
