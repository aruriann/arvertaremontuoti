import { validateLead } from '../validators/leadsValidator.js';
import { insertLead } from '../services/leadsService.js';

export async function createLead(req, res, next) {
  const validation = validateLead(req.body);

  if (!validation.ok) {
    return res.status(400).json({
      ok: false,
      error: 'Validation failed',
      details: { field: validation.field, message: validation.msg },
    });
  }

  try {
    const id = await insertLead(validation.data);
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    next(err);
  }
}
