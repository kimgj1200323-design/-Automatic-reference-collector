export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // 클라이언트에 토큰을 전달 (이 토큰은 우리 앱임을 증명하는 용도)
  res.status(200).json({
    token: process.env.APP_SECRET_TOKEN || ''
  });
}
