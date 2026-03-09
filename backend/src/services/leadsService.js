import { query } from '../db.js';

/**
 * Inserts a validated, normalised lead into the database.
 * Returns the new row's id.
 *
 * Lead types and their business meaning:
 *   "service" — client wants repair service offers
 *   "compare" — client wants to compare repair prices before deciding
 *   "sell"    — client wants a buy-out / selling offer
 */
export async function insertLead(data) {
  const sql = `
    INSERT INTO leads (
      lead_type,
      city,
      car_info,
      problem_description,
      contact,
      verdict_idx,
      verdict_title,
      verdict_sub,
      score_base,
      score_bonus,
      score_adjusted,
      car_value,
      repair_cost,
      car_age,
      mileage,
      fault_type,
      safety_issue,
      usage_plan
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8,
      $9, $10, $11,
      $12, $13, $14, $15,
      $16, $17, $18
    )
    RETURNING id
  `;

  const values = [
    data.leadType,
    data.city,
    data.carInfo,
    data.problemDescription,
    data.contact,
    data.verdictIdx,
    data.verdictTitle,
    data.verdictSub,
    data.scoreBase,
    data.scoreBonus,
    data.scoreAdjusted,
    data.carValue,
    data.repairCost,
    data.carAge,
    data.mileage,
    data.faultType,
    data.safetyIssue,
    data.usagePlan,
  ];

  const result = await query(sql, values);
  return result.rows[0].id;
}
