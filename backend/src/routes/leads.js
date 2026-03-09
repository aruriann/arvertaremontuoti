import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createLead } from '../controllers/leadsController.js';

const router = Router();

const leadsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// POST /api/leads
// Accepts leads from all 3 frontend CTA flows:
//   leadType "service" — client wants repair service offers
//   leadType "compare" — client wants to compare repair prices before deciding
//   leadType "sell"    — client wants a buy-out / selling offer
router.post('/', leadsLimiter, createLead);

export default router;
