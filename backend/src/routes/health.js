import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, service: 'arvertaremontuoti-api', db: 'up' });
  } catch {
    res.status(500).json({ ok: false, db: 'down' });
  }
});

export default router;
