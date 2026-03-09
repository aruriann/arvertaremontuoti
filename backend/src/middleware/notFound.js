export default function notFound(_req, res) {
  res.status(404).json({ ok: false, error: 'Not Found' });
}
