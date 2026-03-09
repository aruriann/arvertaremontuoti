import { Router } from 'express';
import { createLead } from '../controllers/leadsController.js';

const router = Router();

// POST /api/leads
// Accepts leads from all 3 frontend CTA flows:
//   leadType "service" — client wants repair service offers
//   leadType "compare" — client wants to compare repair prices before deciding
//   leadType "sell"    — client wants a buy-out / selling offer
router.post('/', createLead);

export default router;
