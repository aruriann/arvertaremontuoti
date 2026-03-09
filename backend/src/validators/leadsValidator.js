const LEAD_TYPES   = ['service', 'compare', 'sell'];
const FAULT_TYPES  = ['A', 'B', 'C'];
const USAGE_PLANS  = ['short', 'mid', 'long'];
const VERDICT_IDXS = [0, 1, 2, 3];

function err(field, msg) {
  return { ok: false, field, msg };
}

function isInt(v) {
  return Number.isInteger(v);
}

/**
 * Validates and normalises a raw leads payload.
 * Returns { ok: true, data } or { ok: false, field, msg }.
 *
 * leadType drives the business flow:
 *   "service" — client wants repair service offers
 *   "compare" — client wants to compare repair prices before deciding
 *   "sell"    — client wants a buy-out / selling offer
 */
export function validateLead(raw) {
  // ── leadType ─────────────────────────────────────────────────────────────
  if (!raw.leadType || !LEAD_TYPES.includes(raw.leadType)) {
    return err('leadType', `Must be one of: ${LEAD_TYPES.join(', ')}`);
  }

  // ── text fields ──────────────────────────────────────────────────────────
  const city               = typeof raw.city === 'string' ? raw.city.trim().replace(/\s{2,}/g, ' ') : null;
  const carInfo            = typeof raw.carInfo === 'string' ? raw.carInfo.trim().replace(/\s{2,}/g, ' ') : null;
  const problemDescription = typeof raw.problemDescription === 'string' ? raw.problemDescription.trim().replace(/\s{2,}/g, ' ') : null;
  const contact            = typeof raw.contact === 'string' ? raw.contact.trim() : null;
  const verdictTitle       = typeof raw.verdictTitle === 'string' ? raw.verdictTitle.trim() : null;
  const verdictSub         = typeof raw.verdictSub === 'string' ? raw.verdictSub.trim() : null;

  if (!city || city.length < 2)               return err('city', 'Required, min 2 chars');
  if (city.length > 80)                       return err('city', 'Max 80 chars');

  if (!carInfo || carInfo.length < 3)         return err('carInfo', 'Required, min 3 chars');
  if (carInfo.length > 120)                   return err('carInfo', 'Max 120 chars');

  if (!problemDescription || problemDescription.length < 5) return err('problemDescription', 'Required, min 5 chars');
  if (problemDescription.length > 1000)       return err('problemDescription', 'Max 1000 chars');

  if (!contact || contact.length < 5)         return err('contact', 'Required, min 5 chars');
  if (contact.length > 120)                   return err('contact', 'Max 120 chars');

  // ── verdict ──────────────────────────────────────────────────────────────
  if (!isInt(raw.verdictIdx) || !VERDICT_IDXS.includes(raw.verdictIdx)) {
    return err('verdictIdx', `Must be integer, one of: ${VERDICT_IDXS.join(', ')}`);
  }

  if (!verdictTitle || verdictTitle.length < 2) return err('verdictTitle', 'Required, min 2 chars');
  if (verdictTitle.length > 120)                return err('verdictTitle', 'Max 120 chars');

  if (!verdictSub || verdictSub.length < 2)   return err('verdictSub', 'Required, min 2 chars');
  if (verdictSub.length > 300)                return err('verdictSub', 'Max 300 chars');

  // ── scores ───────────────────────────────────────────────────────────────
  const scoreBase     = Number(raw.scoreBase);
  const scoreBonus    = Number(raw.scoreBonus);
  const scoreAdjusted = Number(raw.scoreAdjusted);

  if (isNaN(scoreBase)     || scoreBase < 0     || scoreBase > 10)     return err('scoreBase',     'Must be number 0–10');
  if (isNaN(scoreBonus)    || scoreBonus < -10  || scoreBonus > 10)    return err('scoreBonus',    'Must be number -10–10');
  if (isNaN(scoreAdjusted) || scoreAdjusted < 0 || scoreAdjusted > 10) return err('scoreAdjusted', 'Must be number 0–10');

  // ── car fields ───────────────────────────────────────────────────────────
  const carValue   = Number(raw.carValue);
  const repairCost = Number(raw.repairCost);
  const carAge     = raw.carAge;
  const mileage    = raw.mileage;

  if (isNaN(carValue)   || carValue <= 0   || carValue > 1000000)   return err('carValue',   'Must be number > 0 and <= 1 000 000');
  if (isNaN(repairCost) || repairCost <= 0 || repairCost > 1000000) return err('repairCost', 'Must be number > 0 and <= 1 000 000');
  if (!isInt(carAge)    || carAge < 0      || carAge > 40)          return err('carAge',     'Must be integer 0–40');
  if (!isInt(mileage)   || mileage < 0     || mileage > 999999)     return err('mileage',    'Must be integer 0–999 999');

  // ── fault / safety / usage ───────────────────────────────────────────────
  if (!FAULT_TYPES.includes(raw.faultType)) {
    return err('faultType', `Must be one of: ${FAULT_TYPES.join(', ')}`);
  }
  if (typeof raw.safetyIssue !== 'boolean') {
    return err('safetyIssue', 'Must be boolean');
  }
  if (!USAGE_PLANS.includes(raw.usagePlan)) {
    return err('usagePlan', `Must be one of: ${USAGE_PLANS.join(', ')}`);
  }

  return {
    ok: true,
    data: {
      leadType:           raw.leadType,
      city,
      carInfo,
      problemDescription,
      contact,
      verdictIdx:         raw.verdictIdx,
      verdictTitle,
      verdictSub,
      scoreBase,
      scoreBonus,
      scoreAdjusted,
      carValue,
      repairCost,
      carAge,
      mileage,
      faultType:          raw.faultType,
      safetyIssue:        raw.safetyIssue,
      usagePlan:          raw.usagePlan,
    },
  };
}
