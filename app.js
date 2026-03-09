/* ───────────── helpers ───────────── */
const $ = id => document.getElementById(id);

function setError(fieldId, msg) {
  const inp = $(fieldId);
  const err = $('err-' + fieldId);
  inp.classList.add('invalid');
  if (msg) err.textContent = msg;
  err.classList.add('visible');
}
function clearError(fieldId) {
  const inp = $(fieldId);
  const err = $('err-' + fieldId);
  inp.classList.remove('invalid');
  err.classList.remove('visible');
}
function clearAllErrors() {
  ['carValue','repairCost','carAge','mileage','faultType','safetyIssue','usagePlan']
    .forEach(clearError);
}

/* ───────────── validation ───────────── */
function validate() {
  clearAllErrors();
  let ok = true;

  const carValue   = parseFloat($('carValue').value);
  const repairCost = parseFloat($('repairCost').value);
  const carAge     = parseFloat($('carAge').value);
  const mileage    = parseFloat($('mileage').value);
  const faultType  = $('faultType').value;
  const safetyIssue = $('safetyIssue').value;
  const usagePlan  = $('usagePlan').value;

  if (!$('carValue').value || isNaN(carValue) || carValue <= 0) {
    setError('carValue', 'Įveskite teigiamą automobilio vertę (€)'); ok = false;
  }
  if (!$('repairCost').value || isNaN(repairCost) || repairCost <= 0) {
    setError('repairCost', 'Įveskite teigiamą remonto kainą (€)'); ok = false;
  }
  if ($('carAge').value === '' || isNaN(carAge) || carAge < 0 || carAge > 40) {
    setError('carAge', 'Amžius turi būti 0–40 metų'); ok = false;
  }
  if ($('mileage').value === '' || isNaN(mileage) || mileage < 0 || mileage > 999999) {
    setError('mileage', 'Rida turi būti 0–999 999 km'); ok = false;
  }
  if (!faultType) {
    setError('faultType', 'Pasirinkite gedimo tipą'); ok = false;
  }
  if (!safetyIssue) {
    setError('safetyIssue', 'Pasirinkite ar gedimas susijęs su saugumu'); ok = false;
  }
  if (!usagePlan) {
    setError('usagePlan', 'Pasirinkite naudojimo laikotarpį'); ok = false;
  }
  return ok;
}

/* ───────────── pure compute function (no DOM) ───────────── */
function compute({ carValue, repairCost, carAge, mileage, faultType, safetyIssue, usagePlan }) {
  const R          = repairCost / carValue;
  const bonusFault = faultType === 'A' ? 0 : faultType === 'B' ? 0.10 : 0.20;
  const bonusAge   = carAge    <  10   ? 0 : carAge    <= 15   ? 0.05 : 0.10;
  const bonusMile  = mileage   < 200000 ? 0 : mileage  <= 300000 ? 0.05 : 0.10;
  const bonusUsage = usagePlan === 'long' ? -0.05 : usagePlan === 'mid' ? 0 : 0.10;
  const totalBonus = bonusFault + bonusAge + bonusMile + bonusUsage;
  const R_adj      = Math.max(0, R + totalBonus);
  const verdictIdx = verdictIdxFor(R_adj);
  return {
    carValue, repairCost, carAge, mileage, faultType, safetyIssue, usagePlan,
    R, bonusFault, bonusAge, bonusMile, bonusUsage, totalBonus, R_adj,
    verdictIdx,
    verdictTitle: VERDICT_TITLES[verdictIdx],
    verdictSub: [
      'Remonto išlaidos yra proporcingai mažos automobilio vertės atžvilgiu.',
      'Sprendimas priklauso nuo papildomų veiksnių – verta gerai apsvarstyti.',
      'Remonto kaina reikšmingai viršija rekomenduojamą ribą. Svarstykite alternatyvas.',
      'Remonto investicija labai neproporcioninga automobilio vertei.'
    ][verdictIdx],
    vIcon: VERDICT_ICONS[verdictIdx]
  };
}

/* ───────────── calculation ───────────── */
function calculate() {
  if (!validate()) return;
  renderResults(compute({
    carValue:    parseFloat($('carValue').value),
    repairCost:  parseFloat($('repairCost').value),
    carAge:      parseFloat($('carAge').value),
    mileage:     parseFloat($('mileage').value),
    faultType:   $('faultType').value,
    safetyIssue: $('safetyIssue').value === 'yes',
    usagePlan:   $('usagePlan').value
  }));
}

function pct(val) { return (val * 100).toFixed(1) + ' %'; }
function sign(val) {
  if (val === 0) return '0 %';
  return (val > 0 ? '+' : '') + (val * 100).toFixed(0) + ' %';
}

function badgeFor(val) {
  if (val <= 0) return '<span class="badge badge-ok">+0 %</span>';
  if (val <= 0.05) return `<span class="badge badge-warn">${sign(val)}</span>`;
  return `<span class="badge badge-danger">${sign(val)}</span>`;
}

/* ───────────── insight helpers ───────────── */
const VERDICT_TITLES = ['Verta remontuoti', 'Ribinis variantas', 'Dažnai neapsimoka', 'Ekonomiškai neverta'];
const VERDICT_ICONS  = ['✅', '⚠️', '🔶', '🚫'];

function verdictIdxFor(R_adj) {
  return R_adj <= 0.30 ? 0 : R_adj <= 0.45 ? 1 : R_adj <= 0.60 ? 2 : 3;
}

function scenarioRAdj(repair, value, totalBonus) {
  return Math.max(0, repair / value + totalBonus);
}

/* ───────────── value helper — pure functions ───────────── */
function extractNumber(str) {
  const s = String(str).trim();
  // Near-€ extraction — handles "4 850 €", "€4 850", "BMW 320d - 4850 €"
  const em = s.match(/€\s*([\d][\d ,]{0,11})/) || s.match(/([\d][\d ,]{0,11})\s*€/);
  if (em) {
    const n = parseInt(em[1].replace(/[\s,]/g, ''), 10);
    if (n > 0 && n <= 9999999) return n;
  }
  // Fallback: split on non-numeric chars, return last plausible price (>= 100)
  const parts = s.split(/[^\d\s,]+/).map(c => c.trim())
    .filter(c => /\d/.test(c))
    .map(c => parseInt(c.replace(/[\s,]/g, ''), 10))
    .filter(n => n >= 100 && n <= 9999999);
  return parts.length ? parts[parts.length - 1] : null;
}

function calcMedian(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/* ───────────── insight block ───────────── */
function renderInsightBlock(d) {
  // Feature 1 — verdict-specific price limit sentences
  const maxRepair = threshold => Math.round((threshold - d.totalBonus) * d.carValue);
  const fmt       = v => v.toLocaleString('lt-LT');

  const limitLines = [];

  if (d.verdictIdx === 0) {
    const max = maxRepair(0.30);
    if (max > 0) limitLines.push(`Kad liktų „Verta remontuoti", remonto kaina gali būti iki ~${fmt(max)} €.`);

  } else if (d.verdictIdx === 1) {
    const max30 = maxRepair(0.30);
    const max60 = maxRepair(0.60);
    if (max30 > 0) limitLines.push(`Kad būtų „Verta remontuoti", remonto kaina turėtų būti iki ~${fmt(max30)} €.`);
    if (max60 > 0) limitLines.push(`Kad nenukristų į „Dažnai neapsimoka", remonto kaina turėtų būti iki ~${fmt(max60)} €.`);

  } else if (d.verdictIdx === 2) {
    const max30 = maxRepair(0.30);
    const max45 = maxRepair(0.45);
    if (max45 > 0) limitLines.push(`Kad pakiltų į „Ribinis variantas", remonto kaina turėtų būti iki ~${fmt(max45)} €.`);
    if (max30 > 0) limitLines.push(`Kad būtų „Verta remontuoti", remonto kaina turėtų būti iki ~${fmt(max30)} €.`);

  } else {
    const max60 = maxRepair(0.60);
    if (max60 > 0) limitLines.push(`Kad bent būtų „Dažnai neapsimoka", remonto kaina turėtų būti iki ~${fmt(max60)} €.`);
  }

  $('insightLimits').innerHTML = limitLines.length
    ? '<div class="insight-sub-title">Kokio remonto dydžio dar verta?</div>' +
      limitLines.map(l => `<div class="insight-limit-row">${l}</div>`).join('')
    : '';

  // Feature 2 — stability sentence (repair +15 %)
  const adjPlus15 = scenarioRAdj(d.repairCost * 1.15, d.carValue, d.totalBonus);
  const idxPlus15 = verdictIdxFor(adjPlus15);

  $('insightStability').textContent = idxPlus15 === d.verdictIdx
    ? 'Net jei remonto kaina padidėtų ~15 %, verdiktas greičiausiai nesikeistų.'
    : `Jei remonto kaina padidėtų ~15 %, verdiktas pasikeistų į „${VERDICT_TITLES[idxPlus15]}".`;

  // Feature 3 — scenarios table
  const scenarios = [
    { label: 'Dabartinis',             repair: d.repairCost,        value: d.carValue },
    { label: 'Remontas +15 %',         repair: d.repairCost * 1.15, value: d.carValue },
    { label: 'Vertė −10 %',            repair: d.repairCost,        value: d.carValue * 0.90 },
    { label: 'Blogiausias scenarijus', repair: d.repairCost * 1.15, value: d.carValue * 0.90 }
  ];

  const rows = scenarios.map(s => {
    const radj = scenarioRAdj(s.repair, s.value, d.totalBonus);
    const idx  = verdictIdxFor(radj);
    return `<tr>
      <td>${s.label}</td>
      <td>${Math.round(s.repair).toLocaleString('lt-LT')} €</td>
      <td>${pct(radj)}</td>
      <td>${VERDICT_ICONS[idx]} ${VERDICT_TITLES[idx]}</td>
    </tr>`;
  }).join('');

  $('scenariosTable').innerHTML =
    '<thead><tr><th>Scenarijus</th><th>Remontas</th><th>Įvertis</th><th>Verdiktas</th></tr></thead>' +
    '<tbody>' + rows + '</tbody>';

  // Collapse scenarios panel on each new render
  $('scenariosPanel').hidden = true;
  $('scenariosToggle').setAttribute('aria-expanded', 'false');
  $('scenariosToggle').innerHTML = '<span id="scenariosToggleArrow">▶</span> Parodyti scenarijus';
}

/* ───────────── action block ───────────── */
function renderActionBlock(d) {
  const safety = d.safetyIssue;

  const data = [
    // verdictIdx 0
    {
      rec: 'Remontuokite – remonto išlaidos yra proporcingos automobilio vertei.',
      why: [
        'Remonto kaina sudaro nedidelę dalį automobilio vertės.',
        'Automobilis dar turi potencialą tarnauti ilgiau.',
        'Remontas šiuo atveju yra ekonomiškai geriausias pasirinkimas.'
      ],
      steps: [
        'Palyginkite kainas bent 2–3 autoservisuose.',
        'Paprašykite raštiško garantijos patvirtinimo atliktam darbui.',
        'Atlikę remontą pasiteiraukite dėl profilaktinio patikrinimo.'
      ]
    },
    // verdictIdx 1
    {
      rec: 'Prieš spręsdami, palyginkite remonto kainas – galbūt pavyks sutaupyti.',
      why: [
        'Remonto kaina yra ribinė – šiek tiek per didelė, bet dar priimtina.',
        'Kaina servisuose gali skirtis 20–40 %, verta paklausti kelių.',
        'Sprendimas priklauso nuo to, kiek dar planuojate važinėti.'
      ],
      steps: [
        'Kreipkitės į bent 3 skirtingus servisus ir palyginkite kainas.',
        'Įvertinkite, ar investicija atsipirks per likusį naudojimo laiką.',
        'Jei kainos nesumažės – svarstykite pardavimą ar minimalų remontą.'
      ]
    },
    // verdictIdx 2
    {
      rec: 'Rimtai apsvarstykite automobilio pardavimą – remontas dažnai neatsipirks.',
      why: [
        'Remonto išlaidos yra per didelės lyginant su automobilio verte.',
        'Pardavus su gedimu dažnai galima gauti geresnį galutinį rezultatą.',
        'Rizika, kad po remonto atsiras naujų gedimų, yra padidėjusi.'
      ],
      steps: [
        'Išsiaiškinkite automobilio rinkos kainą su gedimu (autoplius.lt).',
        'Palyginkite: pardavimo kaina su gedimu vs. po remonto – ar skirtumas apsimoka?',
        'Jei vis tiek remontuosite – derinkitės dėl kainos ir gaukite garantiją raštu.'
      ]
    },
    // verdictIdx 3
    {
      rec: 'Neinvestuokite į remontą – pardavimas ar utilizavimas yra protingesnis sprendimas.',
      why: [
        'Remonto kaina yra labai neproporcioninga automobilio rinkos vertei.',
        'Tokia investicija retai kada atsipirks.',
        'Rinka tokius automobilius perka kaip „donorą" ar dalimis.'
      ],
      steps: [
        'Išsiaiškinkite supirkimo pasiūlymus (skelbiu.lt, autonet.lt, FB grupės).',
        'Apsvarstykite pardavimą dalimis – gali atnešti daugiau nei pardavimas su gedimu.',
        'Jei automobilis kol kas saugus, naudokite tol, kol nebeapsimoka.'
      ]
    }
  ];

  const { rec, why, steps } = data[d.verdictIdx];

  const safetyStep = 'Pirmiausia atlikite minimalų saugumo remontą (stabdžiai, vairas ir pan.) – vairuoti nesaugų automobilį draudžiama.';
  const safetyPrefix = 'Pirma sutaisykite saugumo gedimą, paskui: ';

  const finalRec   = safety ? safetyPrefix + rec.charAt(0).toLowerCase() + rec.slice(1) : rec;
  const finalSteps = safety ? [safetyStep, ...steps.slice(0, 2)] : steps;

  $('actionBlock').innerHTML =
    '<div class="ab-title">Ką daryti dabar?</div>' +
    '<div class="ab-rec">' + finalRec + '</div>' +
    '<div class="ab-sub-title">Kodėl?</div>' +
    '<ul>' + why.map(w => '<li>' + w + '</li>').join('') + '</ul>' +
    '<div class="ab-sub-title">3 žingsniai</div>' +
    '<ol>' + finalSteps.map(s => '<li>' + s + '</li>').join('') + '</ol>';
}

function renderResults(d) {
  _lastResult = d;

  // Verdict
  $('verdictBox').className = 'verdict-box verdict-' + d.verdictIdx;
  $('vIcon').textContent = d.vIcon;
  $('vTitle').textContent = d.verdictTitle;
  $('vSub').textContent  = d.verdictSub;

  // Insight block (price limits + stability + scenarios)
  renderInsightBlock(d);

  // Action block
  renderActionBlock(d);

  // Lead CTA
  renderLeadCTA(d);

  // Safety box
  $('safetyBox').style.display = d.safetyIssue ? 'flex' : 'none';

  // Stats
  $('statR').textContent     = pct(d.R);
  $('statBonus').textContent = sign(d.totalBonus);
  $('statRadj').textContent  = pct(d.R_adj);

  // Progress bar
  const pFill = $('progressFill');
  const barPct = Math.min(d.R_adj * 100, 100);
  const color = d.verdictIdx === 0 ? '#22c55e'
              : d.verdictIdx === 1 ? '#f59e0b'
              : d.verdictIdx === 2 ? '#f97316'
              : '#ef4444';
  pFill.style.width = barPct + '%';
  pFill.style.background = color;

  // Breakdown table
  const faultLabel = d.faultType === 'A' ? 'A – planinis'
                   : d.faultType === 'B' ? 'B – vidutinis' : 'C – didelis/rizikingas';
  const ageLabel   = d.carAge < 10 ? 'iki 10 m.'
                   : d.carAge <= 15 ? '10–15 m.' : '16+ m.';
  const mileLabel  = d.mileage < 200000 ? 'iki 200 000 km'
                   : d.mileage <= 300000 ? '200–300 000 km' : '300 000+ km';
  const usageLabel = d.usagePlan === 'long' ? '18+ mėn'
                   : d.usagePlan === 'mid' ? '6–18 mėn' : 'iki 6 mėn';

  $('breakdownBody').innerHTML = `
    <tr>
      <td>Remonto santykis <em>(remonto kaina / vertė)</em></td>
      <td>${d.repairCost.toLocaleString('lt-LT')} € / ${d.carValue.toLocaleString('lt-LT')} €</td>
      <td><strong>${pct(d.R)}</strong></td>
      <td><span class="badge badge-neutral">Bazė</span></td>
    </tr>
    <tr>
      <td>Gedimo tipas</td>
      <td>${faultLabel}</td>
      <td>${sign(d.bonusFault)}</td>
      <td>${badgeFor(d.bonusFault)}</td>
    </tr>
    <tr>
      <td>Automobilio amžius</td>
      <td>${d.carAge} m. (${ageLabel})</td>
      <td>${sign(d.bonusAge)}</td>
      <td>${badgeFor(d.bonusAge)}</td>
    </tr>
    <tr>
      <td>Rida</td>
      <td>${d.mileage.toLocaleString('lt-LT')} km (${mileLabel})</td>
      <td>${sign(d.bonusMile)}</td>
      <td>${badgeFor(d.bonusMile)}</td>
    </tr>
    <tr>
      <td>Planuojamas naudojimas</td>
      <td>${usageLabel}</td>
      <td>${sign(d.bonusUsage)}</td>
      <td>${d.bonusUsage < 0
            ? '<span class="badge badge-ok">'+sign(d.bonusUsage)+'</span>'
            : badgeFor(d.bonusUsage)}</td>
    </tr>
    <tr class="total-row">
      <td colspan="2"><strong>Galutinis įvertinimas</strong></td>
      <td colspan="2"><strong>${pct(d.R_adj)}</strong> <span class="total-formula">(bazė ${pct(d.R)} + rizika ${sign(d.totalBonus)})</span></td>
    </tr>
  `;

  // Options
  const isHighFault = d.faultType === 'C';
  const isOld = d.carAge >= 10;
  const isHighMile = d.mileage >= 200000;

  const repairTips = [
    isHighFault
      ? 'Paprašykite išsamios diagnozės – patikrinkite, ar nėra papildomų gedimų.'
      : 'Atlikite remontą ir paprašykite visų darbų garantijos raštu.',
    'Palyginkite kelių servisų kainas – skirtumas gali siekti 30–50 %.',
    isOld
      ? 'Remontuojant seną automobilį, iš anksto susiderinkite dėl nenumatytų darbų kainos viršutinės ribos.'
      : 'Paprašykite naudotų, bet kokybiškų dalių (pvz., OEM) – sumažinsite išlaidas.',
    isHighMile
      ? 'Tikrinkite guolius, amortizatorius ir kitas susidėvėjusias dalis – verta tvarkyti iš karto.'
      : 'Pasiteiraukite dėl profilaktinio aptarnavimo kartu su remontu.'
  ].slice(0, 3);

  const reduceTips = [
    'Palyginkite kainas bent 3 skirtinguose autoservisuose ar pas privačius meistrus.',
    'Pirkite atsargines dalis savarankiškai (autoplius.lt, e-katalog.lt) ir pateikite servisui.',
    isHighFault
      ? 'Aptarkite su meistru, ar galima atlikti tik esminį remontą, atidedant neesminius darbus.'
      : 'Paklauskite, ar galima pakeisti tik kritinius komponentus, o kosmetinius gedimus atidėti.'
  ];

  const sellTips = [
    d.verdictIdx >= 2
      ? 'Parduokite automobilį su gedimais (autoplius.lt, fb grupės) – nurašykite kainą ir sutaupysite remonto laiko.'
      : 'Sutaisykite mažus trūkumus patys ir parduokite už rinkos kainą.',
    'Patikrinkite supirkėjų pasiūlymus (pvz., autonet.lt, skelbiu.lt) – greitas pardavimas be derybų.',
    isOld || isHighMile
      ? 'Apsvarstykite pardavimą dalimis – senesni automobiliai dažnai duoda daugiau išardyti.'
      : 'Paruoškite automobilį pardavimui: išvalykite, padarykite nuotraukas ir pateikite pilną istoriją.'
  ];

  const renderList = (ulId, items) => {
    $(ulId).innerHTML = items.map(t => `<li>${t}</li>`).join('');
  };
  renderList('optRepair', repairTips);
  renderList('optReduce', reduceTips);
  renderList('optSell',   sellTips);

  // Collapse breakdown on each new result
  $('breakdownPanel').hidden = true;
  $('breakdownToggle').setAttribute('aria-expanded', 'false');
  $('breakdownToggleArrow').textContent = '▶';
  $('breakdownToggle').innerHTML = '<span id="breakdownToggleArrow">▶</span> Parodyti skaičiavimo detales';

  // Reflect current inputs in the URL bar so the address can be shared directly
  history.replaceState(null, '', buildShareURL(d));

  $('results').style.display = 'block';
  setTimeout(() => {
    $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
}

/* ───────────── share ───────────── */
// Holds the last calculated data so share functions can read it
let _lastResult = null;

function showToast(msg) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function copyResult() {
  if (!_lastResult) return;
  const d = _lastResult;
  const safetyLabel = d.safetyIssue ? 'Taip' : 'Ne';
  const text =
    'Ar verta remontuoti automobilį? — REZULTATAS\n' +
    'Verdiktas: ' + d.verdictTitle + '\n' +
    'R: ' + pct(d.R) + ' | Rizikos priedas: ' + sign(d.totalBonus) + ' | R_adj: ' + pct(d.R_adj) + '\n' +
    'Saugumo gedimas: ' + safetyLabel + '\n' +
    'Pastaba: ' + d.verdictSub;

  navigator.clipboard.writeText(text).then(
    () => showToast('✅ Rezultatas nukopijuotas!'),
    () => showToast('⚠️ Nepavyko nukopijuoti – bandykite rankiniu būdu.')
  );
}

/* ───────────── share helpers ───────────── */

// Build the URL parameter set from a result object.
// Extend this function when adding new shareable fields.
function buildShareParams(d) {
  return new URLSearchParams({
    value:   d.carValue,
    repair:  d.repairCost,
    age:     d.carAge,
    mileage: d.mileage,
    fault:   d.faultType,
    safety:  d.safetyIssue ? 'yes' : 'no',
    usage:   d.usagePlan
  });
}

// Build a full absolute share URL from a result object.
function buildShareURL(d) {
  return location.origin + location.pathname + '?' + buildShareParams(d).toString();
}

function copyLink() {
  if (!_lastResult) {
    showToast('⚠️ Pirmiausia atlikite skaičiavimą, tada kopijuokite nuorodą.');
    return;
  }
  const url = buildShareURL(_lastResult);
  navigator.clipboard.writeText(url).then(
    () => showToast('🔗 Nuoroda nukopijuota!'),
    () => showToast('⚠️ Nepavyko nukopijuoti nuorodos.')
  );
}

/* ───────────── load from URL params ───────────── */
function loadFromParams() {
  const p = new URLSearchParams(location.search);
  if (!p.has('value')) return;

  const value   = parseFloat(p.get('value'));
  const repair  = parseFloat(p.get('repair'));
  const age     = parseFloat(p.get('age'));
  const mileage = parseFloat(p.get('mileage'));
  const fault   = p.get('fault');
  const safety  = p.get('safety');
  const usage   = p.get('usage');

  const validFaults = ['A', 'B', 'C'];
  const validSafety = ['yes', 'no'];
  const validUsage  = ['short', 'mid', 'long'];

  // Abort if any param is missing or out of valid range
  if (
    isNaN(value)   || value  <= 0 ||
    isNaN(repair)  || repair <= 0 ||
    isNaN(age)     || age    <  0 || age    > 40 ||
    isNaN(mileage) || mileage < 0 || mileage > 999999 ||
    !validFaults.includes(fault) ||
    !validSafety.includes(safety) ||
    !validUsage.includes(usage)
  ) return;

  // Restore all form fields, then run normal calculation flow
  $('carValue').value    = value;
  $('repairCost').value  = repair;
  $('carAge').value      = age;
  $('mileage').value     = mileage;
  $('faultType').value   = fault;
  $('safetyIssue').value = safety;
  $('usagePlan').value   = usage;

  calculate();
}

/* ───────────── lead CTA ───────────── */
const CTA_CONFIG = {
  0: {
    type:   'service',
    title:  '🔧 Gauti 3 serviso pasiūlymus',
    text:   'Palyginkite remonto kainas savo mieste ir pasirinkite pigiausią.',
    button: 'Gauti pasiūlymus',
    formHeading: 'Užklausa serviso pasiūlymams',
    formSub:     'Užpildykite žemiau – susisieksime su pasiūlymais iš servisų jūsų mieste.'
  },
  1: {
    type:   'compare',
    title:  '💰 Palyginti remonto kainas prieš sprendimą',
    text:   'Kainų skirtumas tarp servisų gali pakeisti galutinį sprendimą.',
    button: 'Palyginti kainas',
    formHeading: 'Užklausa kainų palyginimui',
    formSub:     'Įveskite savo duomenis – padėsime gauti kelias neįpareigojančias sąmatas.'
  },
  2: {
    type:   'sell',
    title:  '🚗 Sužinoti kiek gautum parduodamas automobilį dabar',
    text:   'Gaukite pasiūlymą iš supirkėjų arba įvertinkite pardavimo galimybes.',
    button: 'Gauti pasiūlymą',
    formHeading: 'Užklausa pardavimo pasiūlymui',
    formSub:     'Užpildykite žemiau – susisieksime su pirkėjų pasiūlymais.'
  },
  3: {
    type:   'sell',
    title:  '🚗 Sužinoti kiek gautum parduodamas automobilį dabar',
    text:   'Gaukite pasiūlymą iš supirkėjų arba įvertinkite pardavimo galimybes.',
    button: 'Gauti pasiūlymą',
    formHeading: 'Užklausa pardavimo pasiūlymui',
    formSub:     'Užpildykite žemiau – susisieksime su pirkėjų pasiūlymais.'
  }
};

function renderLeadCTA(d) {
  const cfg = CTA_CONFIG[d.verdictIdx];
  if (!cfg) { $('leadCtaBlock').style.display = 'none'; return; }
  $('leadCtaTitle').textContent  = cfg.title;
  $('leadCtaText').textContent   = cfg.text;
  $('leadCtaBtn').textContent    = cfg.button;
  $('leadCtaBtn').dataset.leadType = cfg.type;
  $('leadCtaBlock').style.display = 'block';
  closeLeadForm();
}

function openLeadForm(leadType) {
  const cfg = Object.values(CTA_CONFIG).find(c => c.type === leadType) || CTA_CONFIG[0];
  $('leadFormHeading').textContent = cfg.formHeading;
  $('leadFormSub').textContent     = cfg.formSub;
  const status = $('leadFormStatus');
  status.style.display = 'none';
  status.className = 'lead-form-status';
  status.textContent = '';
  $('leadFormWrap').style.display = 'block';
  setTimeout(() => $('leadCity').focus(), 50);
}

function closeLeadForm() {
  $('leadFormWrap').style.display = 'none';
  $('leadForm').reset();
  const status = $('leadFormStatus');
  status.style.display = 'none';
  status.className = 'lead-form-status';
  status.textContent = '';
}

function buildLeadPayload(extra) {
  const d = _lastResult;
  return {
    leadType:           extra.leadType,
    city:               extra.city,
    carInfo:            extra.carInfo,
    problemDescription: extra.problemDescription,
    contact:            extra.contact,
    createdAt:          new Date().toISOString(),
    verdictIdx:         d.verdictIdx,
    verdictTitle:       d.verdictTitle,
    verdictSub:         d.verdictSub,
    scoreBase:          d.R,
    scoreBonus:         d.totalBonus,
    scoreAdjusted:      d.R_adj,
    carValue:           d.carValue,
    repairCost:         d.repairCost,
    carAge:             d.carAge,
    mileage:            d.mileage,
    faultType:          d.faultType,
    safetyIssue:        d.safetyIssue,
    usagePlan:          d.usagePlan
  };
}

// Locally, the frontend and backend run on different ports, so we need an
// absolute URL. In production, nginx proxies /api/* to Node.js on the same
// domain, so a relative URL works without any change to this code.
const API_BASE_URL = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
) ? 'http://localhost:3000' : '';

async function submitLead(payload) {
  try {
    const res  = await fetch(`${API_BASE_URL}/api/leads`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[submitLead error]', err);
    return { ok: false };
  }
}

function handleLeadSubmit(e) {
  e.preventDefault();

  const status = $('leadFormStatus');

  // Guard: calculation must have run first
  if (!_lastResult) {
    status.textContent = 'Prašome pirmiausia atlikti skaičiavimą.';
    status.className = 'lead-form-status error';
    status.style.display = 'block';
    return;
  }

  const city    = $('leadCity').value.trim();
  const carInfo = $('leadCarInfo').value.trim();
  const problem = $('leadProblem').value.trim();
  const contact = $('leadContact').value.trim();

  // Focus first invalid field
  const firstInvalid =
    !city               ? $('leadCity')    :
    !carInfo            ? $('leadCarInfo') :
    !problem            ? $('leadProblem') :
    contact.length < 5  ? $('leadContact') : null;

  if (firstInvalid) {
    status.textContent = 'Prašome užpildyti visus privalomus laukus (kontaktas turi būti bent 5 simboliai).';
    status.className = 'lead-form-status error';
    status.style.display = 'block';
    firstInvalid.focus();
    return;
  }

  const leadType = $('leadCtaBtn').dataset.leadType || 'service';
  const payload  = buildLeadPayload({ leadType, city, carInfo, problemDescription: problem, contact });

  submitLead(payload).then(result => {
    if (result.ok) {
      status.textContent = 'Ačiū! Jūsų užklausa išsiųsta.';
      status.className = 'lead-form-status success';
      $('leadForm').reset();
    } else {
      status.textContent = 'Nepavyko išsiųsti užklausos.';
      status.className = 'lead-form-status error';
    }
    status.style.display = 'block';
  });
}

/* ───────────── clear ───────────── */
function clearAll() {
  $('calcForm').reset();
  clearAllErrors();
  $('results').style.display = 'none';
  $('safetyBox').style.display = 'none';
  $('leadCtaBlock').style.display = 'none';
  closeLeadForm();
  closeSafetyTip && closeSafetyTip();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ───────────── events ───────────── */
$('calcForm').addEventListener('submit', e => { e.preventDefault(); calculate(); });
$('clearBtn').addEventListener('click', clearAll);
$('clearBtn2').addEventListener('click', clearAll);
$('recalcBtn').addEventListener('click', () => {
  $('results').style.display = 'none';
  $('leadCtaBlock').style.display = 'none';
  closeLeadForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => $('carValue').focus(), 300);
});

['carValue','repairCost','carAge','mileage'].forEach(id => {
  $(id).addEventListener('input', () => clearError(id));
});
['faultType','safetyIssue','usagePlan'].forEach(id => {
  $(id).addEventListener('change', () => clearError(id));
});

$('copyResultBtn').addEventListener('click', copyResult);
$('copyLinkBtn').addEventListener('click', copyLink);

$('leadCtaBtn').addEventListener('click', () => {
  openLeadForm($('leadCtaBtn').dataset.leadType || 'service');
});
$('leadCancelBtn').addEventListener('click', closeLeadForm);
$('leadForm').addEventListener('submit', handleLeadSubmit);

/* ───────────── export as PNG ───────────── */
let _html2canvasLoaded = false;

function loadHtml2Canvas() {
  if (_html2canvasLoaded || window.html2canvas) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    s.onload  = () => { _html2canvasLoaded = true; resolve(); };
    s.onerror = () => reject(new Error('CDN nepasiekiamas'));
    document.head.appendChild(s);
  });
}

function exportImage() {
  if (!_lastResult) return;
  const d   = _lastResult;
  const fmt = v => v.toLocaleString('lt-LT');

  const EXPORT_RECS = [
    'Remontas dažniausiai ekonomiškai pagrįstas.',
    'Verta patikslinti sąmatą ir palyginti 2–3 servisus.',
    'Dažnai verta svarstyti pardavimą arba mažesnės apimties remontą.',
    'Ekonomiškai dažnai geriau automobilį parduoti.'
  ];

  // Populate export card
  $('exportVerdict').textContent        = d.vIcon + ' ' + d.verdictTitle;
  $('exportPercent').textContent        = pct(d.R_adj);
  $('exportRepair').textContent         = fmt(d.repairCost) + ' €';
  $('exportValue').textContent          = fmt(d.carValue) + ' €';
  $('exportBonus').textContent          = sign(d.totalBonus);
  $('exportExplanation').textContent    =
    'Remontas sudaro ' + pct(d.R) + ' automobilio vertės. ' +
    'Galutinis įvertinimas su rizikos priedais: ' + pct(d.R_adj) + '.';
  $('exportRecommendation').textContent = EXPORT_RECS[d.verdictIdx];

  // Reveal card off-screen so html2canvas can render it
  const card = $('exportCard');
  card.style.left = '-9999px';
  card.style.display = 'block';

  loadHtml2Canvas()
    .then(() => html2canvas(card, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }))
    .then(canvas => {
      const link = document.createElement('a');
      link.download = 'remonto-ivertinimas.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    })
    .catch(err => showToast(err.message === 'CDN nepasiekiamas'
      ? '⚠️ Nepavyko įkelti bibliotekos. Patikrinkite interneto ryšį.'
      : '⚠️ Nepavyko sugeneruoti paveikslėlio.'))
    .finally(() => { card.style.display = 'none'; });
}

$('exportImgBtn').addEventListener('click', exportImage);

$('scenariosToggle').addEventListener('click', () => {
  const panel  = $('scenariosPanel');
  const toggle = $('scenariosToggle');
  const open   = !panel.hidden;
  panel.hidden = open;
  toggle.setAttribute('aria-expanded', String(!open));
  toggle.innerHTML = open
    ? '<span id="scenariosToggleArrow">▶</span> Parodyti scenarijus'
    : '<span id="scenariosToggleArrow">▼</span> Slėpti scenarijus';
});

$('breakdownToggle').addEventListener('click', () => {
  const panel  = $('breakdownPanel');
  const toggle = $('breakdownToggle');
  const open   = !panel.hidden;
  panel.hidden = open;
  toggle.setAttribute('aria-expanded', String(!open));
  toggle.innerHTML = open
    ? '<span id="breakdownToggleArrow">▶</span> Parodyti skaičiavimo detales'
    : '<span id="breakdownToggleArrow">▼</span> Slėpti skaičiavimo detales';
});

loadFromParams();

/* ───────────── safety tooltip ───────────── */
const safetyInfoBtn = $('safetyInfoBtn');
const safetyTooltip = $('safetyTooltip');

function closeSafetyTip() {
  if (!safetyTooltip) return;
  safetyTooltip.classList.remove('visible');
  safetyTooltip.setAttribute('aria-hidden', 'true');
  if (safetyInfoBtn) safetyInfoBtn.setAttribute('aria-expanded', 'false');
}
function toggleSafetyTip(e) {
  e.preventDefault();
  e.stopPropagation();
  const isOpen = safetyTooltip.classList.contains('visible');
  if (isOpen) closeSafetyTip();
  else {
    safetyTooltip.classList.add('visible');
    safetyTooltip.setAttribute('aria-hidden', 'false');
    safetyInfoBtn.setAttribute('aria-expanded', 'true');
  }
}

if (safetyInfoBtn && safetyTooltip) {
  safetyInfoBtn.addEventListener('click', toggleSafetyTip);
  safetyTooltip.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', () => closeSafetyTip());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSafetyTip(); });
}

/* ───────────── example loader ───────────── */
document.querySelectorAll('.btn-example[data-example]').forEach(btn => {
  btn.addEventListener('click', () => loadExample(btn.dataset.example));
});

function loadExample(key) {
  const examples = {
    A: { carValue: 8000, repairCost: 600,  carAge: 4,  mileage: 80000,  faultType: 'A', safetyIssue: 'no', usagePlan: 'long'  },
    B: { carValue: 7000, repairCost: 2000, carAge: 11, mileage: 150000, faultType: 'B', safetyIssue: 'no', usagePlan: 'mid'   },
    C: { carValue: 4000, repairCost: 2500, carAge: 18, mileage: 250000, faultType: 'C', safetyIssue: 'no', usagePlan: 'short' }
  };
  const d = examples[key];
  if (!d) return;
  $('carValue').value    = d.carValue;
  $('repairCost').value  = d.repairCost;
  $('carAge').value      = d.carAge;
  $('mileage').value     = d.mileage;
  $('faultType').value   = d.faultType;
  $('safetyIssue').value = d.safetyIssue;
  $('usagePlan').value   = d.usagePlan;
  clearAllErrors();
  document.getElementById('calculator').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(calculate, 450);
}

/* ───────────── value helper — rule-based estimate ───────────── */
const BRAND_MULT = {
  'alfa-romeo': 1.05, 'audi': 1.22, 'bmw': 1.30, 'chevrolet': 0.88,
  'chrysler': 0.88, 'citroen': 0.88, 'dacia': 0.85, 'fiat': 0.88,
  'ford': 0.95, 'honda': 1.02, 'hyundai': 0.95, 'infiniti': 1.10,
  'jaguar': 1.35, 'jeep': 1.05, 'kia': 0.95, 'land-rover': 1.40,
  'lexus': 1.15, 'mazda': 1.02, 'mercedes-benz': 1.30, 'mini': 1.10,
  'mitsubishi': 0.92, 'nissan': 0.95, 'opel': 0.92, 'peugeot': 0.90,
  'porsche': 1.55, 'renault': 0.90, 'saab': 1.05, 'seat': 1.00,
  'subaru': 0.98, 'suzuki': 0.90, 'skoda': 1.00, 'tesla': 1.30,
  'toyota': 1.05, 'volkswagen': 1.00, 'volvo': 1.15, 'kita': 1.00,
};

function estimateCarValue({ make, year, mileage, fuel, transmission }) {
  const CURRENT_YEAR = new Date().getFullYear();
  const age = Math.min(40, Math.max(0, CURRENT_YEAR - (year | 0)));

  // Base value by age (depreciation table, ages 0–40)
  const BASE = [
    22000, 18500, 15500, 13000, 11000,  // 0–4
     9500,  8200,  7200,  6400,  5700,  // 5–9
     5100,  4500,  4000,  3500,  3100,  // 10–14
     2700,  2400,  2100,  1800,  1600,  // 15–19
     1400,  1300,  1200,  1100,  1100,  // 20–24
     1050,  1050,  1000,  1000,   950,  // 25–29
      950,   900,   900,   850,   850,  // 30–34
      800,   800,   750,   750,   700,  // 35–39
      700                               // 40
  ];
  const base = BASE[Math.min(age, BASE.length - 1)];

  // Mileage multiplier
  const safeMile = Math.max(0, mileage | 0);
  const mileMult =
    safeMile <  50000 ? 1.15 :
    safeMile < 100000 ? 1.05 :
    safeMile < 120000 ? 1.00 :
    safeMile < 200000 ? 0.92 :
    safeMile < 300000 ? 0.85 :
    0.75;

  // Fuel multiplier
  const fuelMult =
    fuel === 'diesel'   ? 1.05 :
    fuel === 'hybrid'   ? 1.15 :
    fuel === 'electric' ? 1.25 :
    fuel === 'lpg'      ? 0.88 : 1.00;

  // Transmission multiplier
  const transMult = transmission === 'auto' ? 1.10 : 1.00;

  // Brand multiplier (from lookup table, not from UI option value)
  const brandMult = BRAND_MULT[String(make).toLowerCase()] || 1.00;

  const raw = base * mileMult * fuelMult * transMult * brandMult;

  // Confidence & interval spread based on car age
  const confidence = age <= 5 ? 'high' : age <= 12 ? 'medium' : 'low';
  const spread     = confidence === 'high' ? 0.12 : confidence === 'medium' ? 0.18 : 0.25;

  const estimate = Math.max(200, Math.round(raw / 100) * 100);
  const low      = Math.max(100, Math.round(raw * (1 - spread) / 100) * 100);
  const high     = Math.max(low + 100, Math.round(raw * (1 + spread) / 100) * 100);

  return { estimate, low, high, confidence };
}

/* ───────────── value helper UI ───────────── */
(function initValueHelper() {
  const toggle = $('valueHelperToggle');
  const panel  = $('valueHelperPanel');
  if (!toggle || !panel) return;

  // Set vhYear max to current year dynamically
  $('vhYear').max = new Date().getFullYear();

  /* ── main panel toggle ── */
  toggle.addEventListener('click', () => {
    const open = !panel.hidden;
    panel.hidden = open;
    toggle.setAttribute('aria-expanded', String(!open));
  });

  /* ── MODE 1: field map & validation ── */
  const VH = {
    make:  { el: $('vhMake'),         errEl: $('vh-err-make'),  ev: 'change' },
    model: { el: $('vhModel'),        errEl: $('vh-err-model'), ev: 'input'  },
    year:  { el: $('vhYear'),         errEl: $('vh-err-year'),  ev: 'input'  },
    mile:  { el: $('vhMileage'),      errEl: $('vh-err-mile'),  ev: 'input'  },
    fuel:  { el: $('vhFuel'),         errEl: $('vh-err-fuel'),  ev: 'change' },
    trans: { el: $('vhTransmission'), errEl: $('vh-err-trans'), ev: 'change' },
  };

  function vhSetError(key, msg) {
    VH[key].el.classList.add('invalid');
    VH[key].errEl.textContent = msg;
  }
  function vhClearError(key) {
    VH[key].el.classList.remove('invalid');
    VH[key].errEl.textContent = '';
  }
  function vhClearAllErrors() {
    Object.keys(VH).forEach(vhClearError);
  }

  function vhValidate() {
    vhClearAllErrors();
    let ok = true;
    const CY = new Date().getFullYear();

    if (!VH.make.el.value) {
      vhSetError('make', 'Pasirinkite markę'); ok = false;
    }

    const model = VH.model.el.value.trim().replace(/\s{2,}/g, ' ');
    if (!model || model.length < 2) {
      vhSetError('model', 'Įveskite modelį (bent 2 simboliai)'); ok = false;
    } else if (/^\d+$/.test(model)) {
      vhSetError('model', 'Modelis negali būti vien tik skaičiai'); ok = false;
    } else if (model.length > 40) {
      vhSetError('model', 'Modelis per ilgas (maks. 40 simbolių)'); ok = false;
    }

    const yearRaw = VH.year.el.value;
    const year    = parseInt(yearRaw, 10);
    if (!yearRaw || isNaN(year) || year < 1990 || year > CY) {
      vhSetError('year', 'Metai turi būti 1990–' + CY); ok = false;
    }

    const mileRaw = VH.mile.el.value;
    const mile    = parseInt(mileRaw, 10);
    if (mileRaw === '' || isNaN(mile) || mile < 0 || mile > 999999) {
      vhSetError('mile', 'Rida turi būti 0–999 999 km'); ok = false;
    }

    if (!VH.fuel.el.value) {
      vhSetError('fuel', 'Pasirinkite kuro tipą'); ok = false;
    }
    if (!VH.trans.el.value) {
      vhSetError('trans', 'Pasirinkite pavarų dėžę'); ok = false;
    }

    return ok;
  }

  /* ── MODE 1: state ── */
  const estimateResult = $('vhEstimateResult');
  const estimateVal    = $('vhEstimateVal');
  const estimateLow    = $('vhEstimateLow');
  const estimateHigh   = $('vhEstimateHigh');
  const estimateBtn    = $('vhEstimateBtn');
  const useEstimateBtn = $('useEstimateBtn');

  let _estimate      = null;
  let _estimatedYear = null;
  let _estimatedMile = null;

  function hideEstimateResult() {
    _estimate = _estimatedYear = _estimatedMile = null;
    if (estimateResult) estimateResult.hidden = true;
  }

  // On any field change: clear its error, hide stale result
  Object.entries(VH).forEach(([key, f]) => {
    f.el.addEventListener(f.ev, () => {
      vhClearError(key);
      if (_estimate !== null) hideEstimateResult();
    });
  });

  if (estimateBtn) {
    estimateBtn.addEventListener('click', () => {
      if (!vhValidate()) return;

      const year = parseInt(VH.year.el.value, 10);
      const mile = parseInt(VH.mile.el.value, 10);

      const res = estimateCarValue({
        make:         VH.make.el.value,
        model:        VH.model.el.value.trim(),
        year,
        mileage:      mile,
        fuel:         VH.fuel.el.value,
        transmission: VH.trans.el.value,
      });

      _estimate      = res.estimate;
      _estimatedYear = year;
      _estimatedMile = mile;

      const fmt = v => v.toLocaleString('lt-LT');
      estimateVal.textContent  = fmt(_estimate) + ' €';
      estimateLow.textContent  = fmt(res.low)   + ' €';
      estimateHigh.textContent = fmt(res.high)  + ' €';
      estimateResult.hidden = false;
    });
  }

  if (useEstimateBtn) {
    useEstimateBtn.addEventListener('click', () => {
      if (_estimate === null) return;
      const CY = new Date().getFullYear();

      const cv = $('carValue');
      cv.value = _estimate;
      cv.dispatchEvent(new Event('input'));
      clearError('carValue');

      if (_estimatedYear !== null) {
        const ageField = $('carAge');
        ageField.value = Math.min(40, Math.max(0, CY - _estimatedYear));
        ageField.dispatchEvent(new Event('input'));
        clearError('carAge');
      }

      if (_estimatedMile !== null) {
        const mileField = $('mileage');
        mileField.value = _estimatedMile;
        mileField.dispatchEvent(new Event('input'));
        clearError('mileage');
      }

      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  /* ── MODE 2: listings (secondary) ── */
  const mode2Toggle = $('vhMode2Toggle');
  const mode2Panel  = $('vhMode2Panel');

  if (mode2Toggle && mode2Panel) {
    mode2Toggle.addEventListener('click', () => {
      const open = !mode2Panel.hidden;
      mode2Panel.hidden = open;
      mode2Toggle.setAttribute('aria-expanded', String(!open));
    });
  }

  const listInputs  = ['listing1', 'listing2', 'listing3'].map(id => $(id));
  const listResult  = $('helperResult');
  const listWarning = $('helperWarning');
  const useListBtn  = $('useHelperValue');

  let currentMedian = null;

  listInputs.forEach(inp => {
    if (!inp) return;
    inp.addEventListener('input', () => {
      if (inp.value && /[^\d]/.test(inp.value)) {
        const n = extractNumber(inp.value);
        inp.value = n !== null ? String(n) : '';
      }
      updateMode2();
    });
  });

  function updateMode2() {
    const vals = listInputs.map(inp => {
      const n = parseInt(inp.value, 10);
      return (isNaN(n) || n <= 0) ? null : n;
    });
    const valid = vals.filter(v => v !== null);

    // Warning only when ≥2 valid values AND spread is large
    if (valid.length >= 2) {
      const sorted = [...valid].sort((a, b) => a - b);
      listWarning.hidden = sorted[sorted.length - 1] <= sorted[0] * 1.35;
    } else {
      listWarning.hidden = true;
    }

    if (valid.length < 3) {
      const need = 3 - valid.length;
      listResult.textContent = valid.length === 0
        ? 'Įveskite visas 3 kainas'
        : 'Dar reikia ' + need + (need === 1 ? ' kainos' : ' kainų');
      listResult.classList.remove('has-value');
      useListBtn.hidden = true;
      currentMedian = null;
      return;
    }

    currentMedian = calcMedian(valid);
    listResult.textContent = 'Rekomenduojama vertė: ' + currentMedian.toLocaleString('lt-LT') + ' €';
    listResult.classList.add('has-value');
    useListBtn.hidden = false;
  }

  if (useListBtn) {
    useListBtn.addEventListener('click', () => {
      if (currentMedian === null) return;
      const cv = $('carValue');
      cv.value = currentMedian;
      cv.dispatchEvent(new Event('input'));
      clearError('carValue');
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  /* ── reset on form clear ── */
  $('calcForm').addEventListener('reset', () => {
    hideEstimateResult();
    vhClearAllErrors();
    currentMedian = null;
    if (listResult)  { listResult.textContent = 'Įveskite visas 3 kainas'; listResult.classList.remove('has-value'); }
    if (listWarning) listWarning.hidden = true;
    if (useListBtn)  useListBtn.hidden  = true;
  });
})();

/* ───────────── header CTA: hide while hero is visible ───────────── */
(function () {
  const cta  = document.getElementById('headerCta');
  const hero = document.getElementById('top');
  if (!cta || !hero) return;

  function showCta() {
    cta.classList.remove('cta-hidden');
    cta.removeAttribute('tabindex');
    cta.removeAttribute('aria-hidden');
  }
  function hideCta() {
    cta.classList.add('cta-hidden');
    cta.setAttribute('tabindex', '-1');
    cta.setAttribute('aria-hidden', 'true');
  }

  // Start hidden (hero is visible on load)
  hideCta();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      entry.isIntersecting ? hideCta() : showCta();
    }, { threshold: 0 }).observe(hero);
  } else {
    // Fallback for browsers without IntersectionObserver
    window.addEventListener('scroll', () => {
      hero.getBoundingClientRect().bottom > 0 ? hideCta() : showCta();
    }, { passive: true });
  }
})();

/* ───────────── sticky header shadow on scroll ───────────── */
(function () {
  const hdr = document.getElementById('site-header');
  if (!hdr) return;
  window.addEventListener('scroll', () => {
    hdr.style.boxShadow = window.scrollY > 4
      ? '0 2px 12px rgba(0,0,0,.10)'
      : '0 1px 8px rgba(0,0,0,.06)';
  }, { passive: true });
})();

/* ═══════════════════════════════════════════════════════════════
   DEBUG / TEST MODE  —  active only when URL contains ?debug=1
   ═══════════════════════════════════════════════════════════════ */
if (new URLSearchParams(location.search).get('debug') === '1') {
  /* ── inject panel CSS ── */
  const dbgStyle = document.createElement('style');
  dbgStyle.textContent = `
    #debugPanel{position:fixed;bottom:0;left:0;right:0;max-height:55vh;overflow-y:auto;
      background:#1e1e2e;color:#cdd6f4;font-family:monospace;font-size:13px;
      border-top:3px solid #89b4fa;z-index:9999;padding:12px 16px;}
    #debugPanel h2{margin:0 0 8px;font-size:14px;color:#89b4fa;}
    #dbgRunBtn{background:#89b4fa;color:#1e1e2e;border:none;padding:5px 14px;
      border-radius:4px;cursor:pointer;font-weight:700;font-size:13px;}
    #dbgRunBtn:hover{background:#b4befe;}
    .dbg-summary{margin:8px 0;font-size:14px;font-weight:700;}
    .dbg-pass{color:#a6e3a1;}.dbg-fail{color:#f38ba8;}
    .dbg-failures{margin-top:8px;}
    .dbg-failure{background:#313244;border-left:3px solid #f38ba8;
      margin:4px 0;padding:6px 10px;border-radius:0 4px 4px 0;line-height:1.6;}
    .dbg-failure b{color:#f38ba8;}
    .dbg-fuzz{color:#a6e3a1;font-size:12px;margin-top:6px;}
    .dbg-checks{margin-bottom:10px;display:flex;flex-direction:column;gap:3px;}
    .dbg-ck-pass{color:#a6e3a1;font-size:13px;}
    .dbg-ck-fail{color:#f38ba8;font-size:13px;font-weight:700;}
  `;
  document.head.appendChild(dbgStyle);

  /* ── inject panel HTML ── */
  const dbgPanel = document.createElement('div');
  dbgPanel.id = 'debugPanel';
  dbgPanel.innerHTML =
    '<h2>🧪 Debug / Test Mode</h2>' +
    '<button id="dbgRunBtn">Paleisti testus</button>' +
    '<div id="dbgChecks" class="dbg-checks"></div>' +
    '<div id="dbgSummary" class="dbg-summary"></div>' +
    '<div id="dbgFailures" class="dbg-failures"></div>' +
    '<div id="dbgFuzz" class="dbg-fuzz"></div>';
  document.body.appendChild(dbgPanel);

  /* ── seeded RNG (LCG) ── */
  function makeRng(seed) {
    let s = (seed ^ 0) >>> 0;
    return function () {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0;
      return s / 4294967295;
    };
  }

  /* ── near-equal helper ── */
  const near = (a, b) => Math.abs(a - b) < 1e-9;

  /* ── unit tests ── */
  const UNIT_TESTS = [
    // ── From TEST.md scenarios ──────────────────────────────────────
    {
      label: 'TEST.md #1 – Verta remontuoti',
      inp: { carValue:10000, repairCost:1000, carAge:5, mileage:120000, faultType:'A', safetyIssue:false, usagePlan:'long' },
      exp: { R:0.10, bonusFault:0, bonusAge:0, bonusMile:0, bonusUsage:-0.05, totalBonus:-0.05, R_adj:0.05, verdictIdx:0 }
    },
    {
      label: 'TEST.md #2 – Ribinis variantas',
      inp: { carValue:8000, repairCost:2000, carAge:5, mileage:100000, faultType:'B', safetyIssue:false, usagePlan:'mid' },
      exp: { R:0.25, bonusFault:0.10, bonusAge:0, bonusMile:0, bonusUsage:0, totalBonus:0.10, R_adj:0.35, verdictIdx:1 }
    },
    {
      label: 'TEST.md #3 – Dažnai neapsimoka',
      inp: { carValue:5000, repairCost:1500, carAge:12, mileage:100000, faultType:'C', safetyIssue:false, usagePlan:'mid' },
      exp: { R:0.30, bonusFault:0.20, bonusAge:0.05, bonusMile:0, bonusUsage:0, totalBonus:0.25, R_adj:0.55, verdictIdx:2 }
    },
    {
      label: 'TEST.md #4 – Ekonomiškai neverta',
      inp: { carValue:5000, repairCost:4000, carAge:12, mileage:220000, faultType:'C', safetyIssue:false, usagePlan:'short' },
      exp: { R:0.80, bonusFault:0.20, bonusAge:0.05, bonusMile:0.05, bonusUsage:0.10, totalBonus:0.40, R_adj:1.20, verdictIdx:3 }
    },
    // ── Threshold boundaries ─────────────────────────────────────────
    {
      label: 'Boundary R_adj=0.30 → verdictIdx=0',
      inp: { carValue:10000, repairCost:3000, carAge:5, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { totalBonus:0, R_adj:0.30, verdictIdx:0 }
    },
    {
      label: 'Boundary R_adj=0.31 → verdictIdx=1',
      inp: { carValue:10000, repairCost:3100, carAge:5, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { totalBonus:0, R_adj:0.31, verdictIdx:1 }
    },
    {
      label: 'Boundary R_adj=0.45 → verdictIdx=1',
      inp: { carValue:10000, repairCost:4500, carAge:5, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { totalBonus:0, R_adj:0.45, verdictIdx:1 }
    },
    {
      label: 'Boundary R_adj=0.46 → verdictIdx=2',
      inp: { carValue:10000, repairCost:4600, carAge:5, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { totalBonus:0, R_adj:0.46, verdictIdx:2 }
    },
    {
      label: 'Boundary R_adj=0.60 → verdictIdx=2',
      inp: { carValue:10000, repairCost:6000, carAge:5, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { totalBonus:0, R_adj:0.60, verdictIdx:2 }
    },
    {
      label: 'Boundary R_adj=0.61 → verdictIdx=3',
      inp: { carValue:10000, repairCost:6100, carAge:5, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { totalBonus:0, R_adj:0.61, verdictIdx:3 }
    },
    // ── R_adj clamped to 0 ───────────────────────────────────────────
    {
      label: 'R_adj clamped to 0 (R+bonus < 0)',
      inp: { carValue:10000, repairCost:100, carAge:5, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'long' },
      exp: { R_adj:0, verdictIdx:0 }
    },
    // ── Age boundaries ───────────────────────────────────────────────
    {
      label: 'Age boundary: age=9 → bonusAge=0',
      inp: { carValue:10000, repairCost:3000, carAge:9, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { bonusAge:0, R_adj:0.30, verdictIdx:0 }
    },
    {
      label: 'Age boundary: age=10 → bonusAge=0.05',
      inp: { carValue:10000, repairCost:3000, carAge:10, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { bonusAge:0.05, R_adj:0.35, verdictIdx:1 }
    },
    {
      label: 'Age boundary: age=15 → bonusAge=0.05',
      inp: { carValue:10000, repairCost:3000, carAge:15, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { bonusAge:0.05, R_adj:0.35, verdictIdx:1 }
    },
    {
      label: 'Age boundary: age=16 → bonusAge=0.10',
      inp: { carValue:10000, repairCost:3000, carAge:16, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { bonusAge:0.10, R_adj:0.40, verdictIdx:1 }
    },
    // ── Mileage boundaries ───────────────────────────────────────────
    {
      label: 'Mileage boundary: 199999 → bonusMile=0',
      inp: { carValue:10000, repairCost:3000, carAge:5, mileage:199999, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { bonusMile:0, R_adj:0.30, verdictIdx:0 }
    },
    {
      label: 'Mileage boundary: 200000 → bonusMile=0.05',
      inp: { carValue:10000, repairCost:3000, carAge:5, mileage:200000, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { bonusMile:0.05, R_adj:0.35, verdictIdx:1 }
    },
    {
      label: 'Mileage boundary: 300000 → bonusMile=0.05',
      inp: { carValue:10000, repairCost:4000, carAge:5, mileage:300000, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { bonusMile:0.05, R_adj:0.45, verdictIdx:1 }
    },
    {
      label: 'Mileage boundary: 300001 → bonusMile=0.10',
      inp: { carValue:10000, repairCost:4000, carAge:5, mileage:300001, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { bonusMile:0.10, R_adj:0.50, verdictIdx:2 }
    },
    // ── Usage all three values ────────────────────────────────────────
    {
      label: 'Usage: long → bonusUsage=-0.05',
      inp: { carValue:10000, repairCost:3500, carAge:5, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'long' },
      exp: { bonusUsage:-0.05, R_adj:0.30, verdictIdx:0 }
    },
    {
      label: 'Usage: mid → bonusUsage=0',
      inp: { carValue:10000, repairCost:3500, carAge:5, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { bonusUsage:0, R_adj:0.35, verdictIdx:1 }
    },
    {
      label: 'Usage: short → bonusUsage=0.10',
      inp: { carValue:10000, repairCost:3500, carAge:5, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'short' },
      exp: { bonusUsage:0.10, R_adj:0.45, verdictIdx:1 }
    },
    // ── Fault type all three values ───────────────────────────────────
    {
      label: 'Fault A → bonusFault=0',
      inp: { carValue:10000, repairCost:2000, carAge:5, mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'mid' },
      exp: { bonusFault:0, R_adj:0.20, verdictIdx:0 }
    },
    {
      label: 'Fault B → bonusFault=0.10',
      inp: { carValue:10000, repairCost:2000, carAge:5, mileage:100000, faultType:'B', safetyIssue:false, usagePlan:'mid' },
      exp: { bonusFault:0.10, R_adj:0.30, verdictIdx:1 }
    },
    {
      label: 'Fault C → bonusFault=0.20',
      inp: { carValue:10000, repairCost:2000, carAge:5, mileage:100000, faultType:'C', safetyIssue:false, usagePlan:'mid' },
      exp: { bonusFault:0.20, R_adj:0.40, verdictIdx:1 }
    },
    // ── Max all bonuses ───────────────────────────────────────────────
    {
      label: 'All max bonuses: totalBonus=0.50',
      inp: { carValue:5000, repairCost:2000, carAge:20, mileage:350000, faultType:'C', safetyIssue:false, usagePlan:'short' },
      exp: { bonusFault:0.20, bonusAge:0.10, bonusMile:0.10, bonusUsage:0.10, totalBonus:0.50, R_adj:0.90, verdictIdx:3 }
    }
  ];

  function runUnitTests() {
    const failures = [];
    let passed = 0;
    UNIT_TESTS.forEach(t => {
      const r = compute(t.inp);
      const checks = [];
      const e = t.exp;
      if ('R'          in e && !near(r.R,          e.R))          checks.push(`R: got ${r.R}, want ${e.R}`);
      if ('bonusFault' in e && !near(r.bonusFault, e.bonusFault)) checks.push(`bonusFault: got ${r.bonusFault}, want ${e.bonusFault}`);
      if ('bonusAge'   in e && !near(r.bonusAge,   e.bonusAge))   checks.push(`bonusAge: got ${r.bonusAge}, want ${e.bonusAge}`);
      if ('bonusMile'  in e && !near(r.bonusMile,  e.bonusMile))  checks.push(`bonusMile: got ${r.bonusMile}, want ${e.bonusMile}`);
      if ('bonusUsage' in e && !near(r.bonusUsage, e.bonusUsage)) checks.push(`bonusUsage: got ${r.bonusUsage}, want ${e.bonusUsage}`);
      if ('totalBonus' in e && !near(r.totalBonus, e.totalBonus)) checks.push(`totalBonus: got ${r.totalBonus}, want ${e.totalBonus}`);
      if ('R_adj'      in e && !near(r.R_adj,      e.R_adj))      checks.push(`R_adj: got ${r.R_adj}, want ${e.R_adj}`);
      if ('verdictIdx' in e && r.verdictIdx !== e.verdictIdx)      checks.push(`verdictIdx: got ${r.verdictIdx}, want ${e.verdictIdx}`);
      if (checks.length === 0) {
        passed++;
      } else {
        failures.push({ label: t.label, checks });
      }
    });
    return { passed, total: UNIT_TESTS.length, failures };
  }

  /* ── fuzz tests ── */
  function runFuzzTests(n) {
    const rng = makeRng(0xDEADBEEF);
    const faults  = ['A', 'B', 'C'];
    const usages  = ['short', 'mid', 'long'];
    const safetyV = [true, false];
    let passed = 0;
    const failures = [];

    for (let i = 0; i < n; i++) {
      const carValue   = Math.round(500  + rng() * 49500);
      const repairCost = Math.round(100  + rng() * 29900);
      const carAge     = Math.floor(rng() * 41);
      const mileage    = Math.floor(rng() * 1000000);
      const faultType  = faults[Math.floor(rng() * 3)];
      const safetyIssue = safetyV[Math.floor(rng() * 2)];
      const usagePlan  = usages[Math.floor(rng() * 3)];

      const inp = { carValue, repairCost, carAge, mileage, faultType, safetyIssue, usagePlan };
      const r   = compute(inp);
      const errs = [];

      // Invariant 1: R_adj >= 0
      if (r.R_adj < 0) errs.push('R_adj < 0');

      // Invariant 2: verdictIdx in 0..3
      if (r.verdictIdx < 0 || r.verdictIdx > 3) errs.push('verdictIdx out of range');

      // Invariant 3: verdictIdx consistent with R_adj
      if (r.verdictIdx !== verdictIdxFor(r.R_adj)) errs.push('verdictIdx inconsistent with R_adj');

      // Invariant 4: totalBonus = sum of parts
      if (!near(r.totalBonus, r.bonusFault + r.bonusAge + r.bonusMile + r.bonusUsage))
        errs.push('totalBonus != sum of parts');

      // Invariant 5: R_adj = max(0, R + totalBonus)
      if (!near(r.R_adj, Math.max(0, r.R + r.totalBonus)))
        errs.push('R_adj != max(0, R + totalBonus)');

      // Invariant 6: monotone – higher repair never produces lower R_adj
      const r2 = compute({ ...inp, repairCost: repairCost + 1 });
      if (r2.R_adj < r.R_adj - 1e-9) errs.push('monotone fail: repair+1 lowers R_adj');

      // Invariant 7: monotone – lower value never produces lower R_adj
      const r3 = compute({ ...inp, carValue: Math.max(1, carValue - 1) });
      if (r3.R_adj < r.R_adj - 1e-9) errs.push('monotone fail: value-1 lowers R_adj');

      if (errs.length === 0) {
        passed++;
      } else if (failures.length < 5) {
        failures.push({ inp, errs });
      }
    }
    return { passed, total: n, failures };
  }

  /* ── check 1: DOM sanity ── */
  function runDomCheck() {
    const REQUIRED_IDS = [
      'calcForm','carValue','repairCost','carAge','mileage',
      'faultType','safetyIssue','usagePlan','results','verdictBox',
      'statR','statBonus','statRadj','progressFill',
      'copyLinkBtn','copyResultBtn','scenariosToggle','breakdownToggle','toast'
    ];
    const missing = REQUIRED_IDS.filter(id => !document.getElementById(id));
    return {
      passed: missing.length === 0,
      message: missing.length === 0
        ? 'DOM CHECK PASSED'
        : 'DOM CHECK FAILED – missing: ' + missing.join(', ')
    };
  }

  /* ── check 2: share link round-trip ── */
  function runShareRoundTrip() {
    const inp = { carValue:10000, repairCost:2000, carAge:8, mileage:120000, faultType:'B', safetyIssue:false, usagePlan:'long' };
    const rA = compute(inp);

    // Build params (same as copyLink)
    const params = new URLSearchParams({
      value:   inp.carValue,  repair: inp.repairCost,
      age:     inp.carAge,    mileage: inp.mileage,
      fault:   inp.faultType, safety: inp.safetyIssue ? 'yes' : 'no',
      usage:   inp.usagePlan
    });

    // Parse back (same as loadFromParams)
    const rB = compute({
      carValue:    parseFloat(params.get('value')),
      repairCost:  parseFloat(params.get('repair')),
      carAge:      parseFloat(params.get('age')),
      mileage:     parseFloat(params.get('mileage')),
      faultType:   params.get('fault'),
      safetyIssue: params.get('safety') === 'yes',
      usagePlan:   params.get('usage')
    });

    const rAdjOk    = near(rA.R_adj, rB.R_adj);
    const verdictOk = rA.verdictIdx === rB.verdictIdx;
    const passed    = rAdjOk && verdictOk;
    let message = passed ? 'SHARE ROUND-TRIP PASSED' : 'SHARE ROUND-TRIP FAILED';
    if (!rAdjOk)    message += ' – R_adj: A=' + rA.R_adj + ' B=' + rB.R_adj;
    if (!verdictOk) message += ' – verdictIdx: A=' + rA.verdictIdx + ' B=' + rB.verdictIdx;
    return { passed, message };
  }

  /* ── check 3: UI regression ── */
  function runUiRegression() {
    // Fill form with known valid values
    const uiInp = { carValue:10000, repairCost:2000, carAge:8, mileage:120000, faultType:'B', safetyIssue:'no', usagePlan:'long' };
    $('carValue').value    = uiInp.carValue;
    $('repairCost').value  = uiInp.repairCost;
    $('carAge').value      = uiInp.carAge;
    $('mileage').value     = uiInp.mileage;
    $('faultType').value   = uiInp.faultType;
    $('safetyIssue').value = uiInp.safetyIssue;
    $('usagePlan').value   = uiInp.usagePlan;

    const expected     = compute({ ...uiInp, safetyIssue: false });
    const expectedPct  = Math.min(expected.R_adj * 100, 100);

    calculate(); // fills DOM

    const errs = [];

    if ($('results').style.display !== 'block')
      errs.push('#results not visible after calculate()');

    const fillPct = parseFloat($('progressFill').style.width);
    if (isNaN(fillPct) || Math.abs(fillPct - expectedPct) > 0.1)
      errs.push('#progressFill width: got ' + fillPct + '%, expected ~' + expectedPct.toFixed(2) + '%');

    const tblRows = document.getElementById('scenariosTable').querySelectorAll('tbody tr');
    if (tblRows.length !== 4)
      errs.push('#scenariosTable: got ' + tblRows.length + ' rows, expected 4');

    const panel       = $('scenariosPanel');
    const hiddenBefore = panel.hidden;
    $('scenariosToggle').click();
    const hiddenAfter  = panel.hidden;
    $('scenariosToggle').click(); // restore
    if (hiddenBefore === hiddenAfter)
      errs.push('#scenariosToggle click did not change panel.hidden');

    return {
      passed:  errs.length === 0,
      message: errs.length === 0 ? 'UI TEST PASSED' : 'UI TEST FAILED – ' + errs.join('; ')
    };
  }

  /* ── check 4: value helper (median + paste normalization + use-value) ── */
  function runValueHelperCheck() {
    const errs = [];

    // Median
    const m1 = calcMedian([4200, 4800, 9000]);
    if (m1 !== 4800) errs.push('calcMedian([4200,4800,9000])=' + m1 + ', want 4800');

    const m2 = calcMedian([3000, 3200, 3100]);
    if (m2 !== 3100) errs.push('calcMedian([3000,3200,3100])=' + m2 + ', want 3100');

    // Paste normalization
    const e1 = extractNumber('4 850 €');
    if (e1 !== 4850) errs.push('extractNumber("4 850 €")=' + e1 + ', want 4850');

    const e2 = extractNumber('BMW 320d - 4850 €');
    if (e2 !== 4850) errs.push('extractNumber("BMW 320d - 4850 €")=' + e2 + ', want 4850');

    // "Naudoti šią vertę" writes correct median into #carValue
    const l1 = document.getElementById('listing1');
    const l2 = document.getElementById('listing2');
    const l3 = document.getElementById('listing3');
    const cv = document.getElementById('carValue');
    const useBtn = document.getElementById('useHelperValue');

    if (l1 && l2 && l3 && cv && useBtn) {
      // Ensure panel is open so inputs are reachable
      const panel = document.getElementById('valueHelperPanel');
      const wasHidden = panel.hidden;
      panel.hidden = false;

      l1.value = '4200'; l1.dispatchEvent(new Event('input'));
      l2.value = '4800'; l2.dispatchEvent(new Event('input'));
      l3.value = '9000'; l3.dispatchEvent(new Event('input'));
      useBtn.click(); // sets cv.value = 4800 and closes panel

      const got = parseInt(cv.value, 10);
      if (got !== 4800) errs.push('"Naudoti šią vertę" set #carValue=' + got + ', want 4800');

      // Clean up listing inputs
      l1.value = ''; l2.value = ''; l3.value = '';
      l1.dispatchEvent(new Event('input'));
      if (wasHidden) panel.hidden = true;
    } else {
      errs.push('value helper DOM elements missing');
    }

    return {
      passed:  errs.length === 0,
      message: errs.length === 0 ? 'VALUE HELPER PASSED' : 'VALUE HELPER FAILED – ' + errs.join('; ')
    };
  }

  /* ── check 5: estimate helper invariants + DOM ── */
  function runEstimateHelperCheck() {
    const errs = [];

    // 1. Valid input produces a result and result is shown
    const panel = document.getElementById('valueHelperPanel');
    const wasHidden = panel.hidden;
    panel.hidden = false;

    const vhMake  = document.getElementById('vhMake');
    const vhModel = document.getElementById('vhModel');
    const vhYear  = document.getElementById('vhYear');
    const vhMile  = document.getElementById('vhMileage');
    const vhFuel  = document.getElementById('vhFuel');
    const vhTrans = document.getElementById('vhTransmission');
    const estBtn  = document.getElementById('vhEstimateBtn');
    const estRes  = document.getElementById('vhEstimateResult');

    if (!vhMake || !vhModel || !vhYear || !vhMile || !vhFuel || !vhTrans || !estBtn || !estRes) {
      errs.push('estimate helper DOM elements missing');
    } else {
      const CY = new Date().getFullYear();
      vhMake.value  = 'toyota';
      vhModel.value = 'Corolla';
      vhYear.value  = String(CY - 8);
      vhMile.value  = '130000';
      vhFuel.value  = 'petrol';
      vhTrans.value = 'manual';
      estBtn.click();

      // 2. Result box is visible after valid submit
      if (estRes.hidden) errs.push('result box still hidden after valid estimate');

      // 3. estimateCarValue invariants via direct call
      const knownCases = [
        { make: 'toyota',     year: CY - 5,  mileage: 80000,  fuel: 'petrol',   transmission: 'manual' },
        { make: 'bmw',        year: CY - 12, mileage: 200000, fuel: 'diesel',   transmission: 'auto'   },
        { make: 'kita',       year: CY - 20, mileage: 350000, fuel: 'lpg',      transmission: 'manual' },
        { make: 'porsche',    year: CY - 3,  mileage: 20000,  fuel: 'petrol',   transmission: 'auto'   },
        { make: 'dacia',      year: CY - 15, mileage: 250000, fuel: 'diesel',   transmission: 'manual' },
        { make: 'volkswagen', year: CY - 1,  mileage: 10000,  fuel: 'hybrid',   transmission: 'auto'   },
        { make: 'unknown-xx', year: CY - 10, mileage: 100000, fuel: 'petrol',   transmission: 'manual' }, // fallback brand
        { make: 'tesla',      year: CY - 2,  mileage: 40000,  fuel: 'electric', transmission: 'auto'   },
      ];

      knownCases.forEach((inp, i) => {
        let r;
        try { r = estimateCarValue(inp); } catch(e) {
          errs.push('case ' + (i+1) + ': threw ' + e.message); return;
        }
        if (r.estimate <= 0)       errs.push('case ' + (i+1) + ': estimate=' + r.estimate + ' not > 0');
        if (r.low <= 0)            errs.push('case ' + (i+1) + ': low=' + r.low + ' not > 0');
        if (r.high <= r.low)       errs.push('case ' + (i+1) + ': high=' + r.high + ' not > low=' + r.low);
        if (r.estimate < r.low)    errs.push('case ' + (i+1) + ': estimate=' + r.estimate + ' < low=' + r.low);
        if (r.estimate > r.high)   errs.push('case ' + (i+1) + ': estimate=' + r.estimate + ' > high=' + r.high);
        if (!['high','medium','low'].includes(r.confidence))
                                   errs.push('case ' + (i+1) + ': invalid confidence=' + r.confidence);
      });

      // 4. Age boundary: year=CY gives age 0, no crash
      const boundary = estimateCarValue({ make: 'ford', year: CY, mileage: 0, fuel: 'petrol', transmission: 'manual' });
      if (!boundary || boundary.estimate <= 0) errs.push('age=0 boundary: estimate invalid');

      // 5. Age clamping: very old car (year 1900) should not crash and estimate > 0
      const oldCar = estimateCarValue({ make: 'kita', year: 1900, mileage: 0, fuel: 'petrol', transmission: 'manual' });
      if (!oldCar || oldCar.estimate <= 0) errs.push('year=1900 old car: estimate invalid');

      // Clean up helper fields
      vhMake.value = ''; vhModel.value = ''; vhYear.value = '';
      vhMile.value = ''; vhFuel.value = ''; vhTrans.value = '';
    }

    if (wasHidden) panel.hidden = true;

    return {
      passed:  errs.length === 0,
      message: errs.length === 0 ? 'ESTIMATE HELPER PASSED' : 'ESTIMATE HELPER FAILED – ' + errs.join('; ')
    };
  }

  /* ── check 6: repair limits ordering ── */
  function runLimitsCheck() {
    const round10 = v => Math.max(0, Math.round(v / 10) * 10);
    const cases = [
      { carValue:10000, repairCost:2000, carAge:5,  mileage:100000, faultType:'A', safetyIssue:false, usagePlan:'long'  },
      { carValue:8000,  repairCost:1000, carAge:15, mileage:300000, faultType:'C', safetyIssue:false, usagePlan:'short' },
      { carValue:5000,  repairCost:4000, carAge:20, mileage:400000, faultType:'C', safetyIssue:false, usagePlan:'short' },
      { carValue:10000, repairCost:100,  carAge:5,  mileage:50000,  faultType:'A', safetyIssue:false, usagePlan:'long'  }
    ];
    const errs = [];
    cases.forEach((inp, i) => {
      const r    = compute(inp);
      const lg   = round10(r.carValue * (0.30 - r.totalBonus));
      const lb   = round10(r.carValue * (0.45 - r.totalBonus));
      const lbad = round10(r.carValue * (0.60 - r.totalBonus));
      if (!(lg <= lb && lb <= lbad))
        errs.push('case ' + (i + 1) + ': ' + lg + ' / ' + lb + ' / ' + lbad + ' out of order');
    });
    return {
      passed:  errs.length === 0,
      message: errs.length === 0 ? 'LIMITS ORDER PASSED' : 'LIMITS ORDER FAILED – ' + errs.join('; ')
    };
  }

  /* ── run all tests ── */
  document.getElementById('dbgRunBtn').addEventListener('click', function () {
    this.disabled = true;
    this.textContent = 'Vykdoma…';

    setTimeout(() => {
      const dom      = runDomCheck();
      const share    = runShareRoundTrip();
      const ui       = runUiRegression();
      const vh       = runValueHelperCheck();
      const estimate = runEstimateHelperCheck();
      const limits   = runLimitsCheck();
      const unit     = runUnitTests();
      const fuzz     = runFuzzTests(3000);

      // Checks panel
      document.getElementById('dbgChecks').innerHTML = [dom, share, ui, vh, estimate, limits].map(c =>
        '<div class="' + (c.passed ? 'dbg-ck-pass' : 'dbg-ck-fail') + '">' +
        (c.passed ? '✅ ' : '❌ ') + c.message + '</div>'
      ).join('');

      // Summary
      const checksPassed = [dom, share, ui, vh, estimate, limits].filter(c => c.passed).length;
      const totalPassed  = unit.passed + fuzz.passed;
      const totalTests   = unit.total  + fuzz.total;
      const allPassed    = checksPassed === 6 && totalPassed === totalTests;

      document.getElementById('dbgSummary').innerHTML =
        '<span class="' + (allPassed ? 'dbg-pass' : 'dbg-fail') + '">' +
        (allPassed ? '✅' : '❌') +
        ' Unit: ' + unit.passed + '/' + unit.total +
        ' · Fuzz: ' + fuzz.passed + '/' + fuzz.total +
        ' · Checks: ' + checksPassed + '/6' +
        '</span>';

      // Unit + fuzz failure details
      const allFailures = [
        ...unit.failures.map(f =>
          '<div class="dbg-failure"><b>UNIT: ' + f.label + '</b><br>' + f.checks.join('<br>') + '</div>'
        ),
        ...fuzz.failures.map(f =>
          '<div class="dbg-failure"><b>FUZZ:</b> ' +
          JSON.stringify(f.inp) + '<br>' + f.errs.join('<br>') + '</div>'
        )
      ].slice(0, 10);

      document.getElementById('dbgFailures').innerHTML =
        allFailures.length ? '<b>Nesėkmingi testai (pirmieji 10):</b>' + allFailures.join('') : '';

      document.getElementById('dbgFuzz').textContent =
        fuzz.passed === fuzz.total
          ? '✅ Fuzz: visi ' + fuzz.total + ' testų praėjo (seed=0xDEADBEEF)'
          : '❌ Fuzz: ' + (fuzz.total - fuzz.passed) + ' nesėkmingi iš ' + fuzz.total;

      this.disabled = false;
      this.textContent = 'Paleisti testus';
    }, 0);
  });
}
