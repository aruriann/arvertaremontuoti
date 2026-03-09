CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  lead_type TEXT NOT NULL,
  city TEXT NOT NULL,
  car_info TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  contact TEXT NOT NULL,

  verdict_idx INTEGER NOT NULL,
  verdict_title TEXT NOT NULL,
  verdict_sub TEXT NOT NULL,

  score_base NUMERIC(8,4) NOT NULL,
  score_bonus NUMERIC(8,4) NOT NULL,
  score_adjusted NUMERIC(8,4) NOT NULL,

  car_value NUMERIC(12,2) NOT NULL,
  repair_cost NUMERIC(12,2) NOT NULL,
  car_age INTEGER NOT NULL,
  mileage INTEGER NOT NULL,

  fault_type TEXT NOT NULL,
  safety_issue BOOLEAN NOT NULL,
  usage_plan TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'new'
);
