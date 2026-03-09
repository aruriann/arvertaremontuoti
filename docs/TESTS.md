# Tests

## Calculator — basic cases

### Verdict: Verta remontuoti (R_adj ≤ 30 %)
- Input: value=10000, repair=1000, age=5, mileage=120000, fault=A, safety=no, usage=long
- Click "🔍 Skaičiuoti"
- Expected verdict banner: ✅ **Verta remontuoti** (green)
- Expected "Galutinis įvertinimas": 5.0 %

### Verdict: Ribinis variantas (30 % < R_adj ≤ 45 %)
- Input: value=8000, repair=2000, age=5, mileage=100000, fault=B, safety=no, usage=mid
- Expected verdict banner: ⚠️ **Ribinis variantas** (yellow)
- Expected "Galutinis įvertinimas": 35.0 %

### Verdict: Dažnai neapsimoka (45 % < R_adj ≤ 60 %)
- Input: value=5000, repair=1500, age=12, mileage=100000, fault=C, safety=no, usage=mid
- Expected verdict banner: 🔶 **Dažnai neapsimoka** (orange)
- Expected "Galutinis įvertinimas": 55.0 %

### Verdict: Ekonomiškai neverta (R_adj > 60 %)
- Input: value=5000, repair=4000, age=12, mileage=220000, fault=C, safety=no, usage=short
- Expected verdict banner: 🚫 **Ekonomiškai neverta** (red)
- Expected "Galutinis įvertinimas": 120.0 %
- Expected: progress bar fully red (capped at 100 % width)

---

## Calculator — validation

### Required fields
- Leave all fields blank and click "🔍 Skaičiuoti"
  - Expected: results card does not appear
  - Expected: error message shown under each of the seven fields
  - Expected: invalid fields have a red border

### Individual field errors (exact messages)
| Field | Bad value | Expected error message |
|---|---|---|
| Automobilio vertė | empty or 0 | Įveskite teigiamą automobilio vertę (€) |
| Remonto kaina | empty or 0 | Įveskite teigiamą remonto kainą (€) |
| Automobilio amžius | 41 or empty | Amžius turi būti 0–40 metų |
| Rida | 1 000 000 or empty | Rida turi būti 0–999 999 km |
| Gedimo tipas | not selected | Pasirinkite gedimo tipą |
| Saugumo gedimas | not selected | Pasirinkite ar gedimas susijęs su saugumu |
| Naudojimo planas | not selected | Pasirinkite naudojimo laikotarpį |

### Error clears on correction
- Trigger a validation error on any numeric field, then correct the value
  - Expected: red border and error message disappear immediately on input

### Edge values that must pass
- Automobilio amžius = 0 → no error
- Automobilio amžius = 40 → no error
- Rida = 0 → no error
- Rida = 999 999 → no error

---

## Calculator — UI controls

### Clear button (Išvalyti)
- Enter values, calculate, then click "🗑 Išvalyti" (either the form button or the results button)
  - Expected: form resets to blank, errors cleared, results card hidden, safety box hidden, page scrolls to top

### Recalculate button (Perskaičiuoti)
- After a calculation click "🔄 Perskaičiuoti"
  - Expected: results card hides, **form values are kept**, page scrolls to top, focus moves to "Automobilio vertė" field

---

## Safety issue

### Safety warning box appears
- Select "Taip – saugumo komponentas" for "Ar šis gedimas susijęs su saugumu?", then calculate
  - Expected: yellow "Saugumo gedimas" warning box appears between the verdict banner and the action block
  - Expected: warning text says safety components must be fixed regardless of economics

### Safety warning box is hidden when not a safety issue
- Select "Ne – komforto ar techninis gedimas", then calculate
  - Expected: no yellow safety warning box

### Safety info tooltip
- Click the "i" button next to "Ar šis gedimas susijęs su saugumu?"
  - Expected: tooltip lists safety examples (stabdžiai, vairo sistema, ratų guoliai, šarnyrai, padangos...)
  - Expected: click anywhere outside or press Escape → tooltip closes

---

## Action block (Ką daryti dabar?)

### Block appears after calculation
- Fill all fields and click "🔍 Skaičiuoti"
  - Expected: "Ką daryti dabar?" block appears above the summary stats
  - Expected: block contains one bold recommendation sentence, a "Kodėl?" bullet list (3 items), and a "3 žingsniai" numbered list (3 items)

### Recommendation matches verdict
| Verdict | Recommendation direction |
|---|---|
| ✅ Verta remontuoti | Remontuokite |
| ⚠️ Ribinis variantas | Palyginkite remonto kainas |
| 🔶 Dažnai neapsimoka | Apsvarstykite pardavimą |
| 🚫 Ekonomiškai neverta | Neinvestuokite į remontą |

### Safety issue overrides step 1
- Select "Taip" for safety question, then calculate
  - Expected: recommendation sentence is prefixed with *Pirma sutaisykite saugumo gedimą, paskui:*
  - Expected: step 1 in "3 žingsniai" is *Pirmiausia atlikite minimalų saugumo remontą...*
- Select "Ne", then calculate
  - Expected: no safety prefix; standard steps for that verdict level

---

## Summary stat boxes

### Labels and values
- After any calculation, check the three stat boxes
  - Expected labels: **Remonto dalis nuo vertės**, **Papildoma rizika**, **Galutinis įvertinimas**
  - Expected: "Galutinis įvertinimas" box has helper text *Kuo mažesnis procentas, tuo labiau verta remontuoti.*

### Progress bar colour matches verdict
| Verdict | Bar colour |
|---|---|
| Verta remontuoti | Green |
| Ribinis variantas | Yellow |
| Dažnai neapsimoka | Orange |
| Ekonomiškai neverta | Red |

---

## Share

### Copy result text (📋 Kopijuoti rezultatą)
- Calculate, then click "📋 Kopijuoti rezultatą"
  - Expected clipboard content:
    ```
    Ar verta remontuoti automobilį? — REZULTATAS
    Verdiktas: <verdict title>
    R: <x.x %> | Rizikos priedas: <±x %> | R_adj: <x.x %>
    Saugumo gedimas: Taip/Ne
    Pastaba: <verdict subtitle>
    ```
  - Expected: toast "✅ Rezultatas nukopijuotas!" appears briefly

### Copy link (🔗 Kopijuoti nuorodą)
- Calculate, then click "🔗 Kopijuoti nuorodą"
  - Expected: clipboard contains a full absolute URL with params: `value`, `repair`, `age`, `mileage`, `fault`, `safety`, `usage`
  - Expected: toast "🔗 Nuoroda nukopijuota!" appears briefly

### Copy link before calculation
- Click "🔗 Kopijuoti nuorodą" without running a calculation first
  - Expected: toast "⚠️ Pirmiausia atlikite skaičiavimą, tada kopijuokite nuorodą." — nothing copied

### URL bar reflects calculation
- After clicking "🔍 Skaičiuoti", check the browser address bar
  - Expected: URL already contains all 7 query params without clicking any share button

### Opening a copied link restores state
- Open a copied share URL in a new tab
  - Expected: all seven form fields are pre-filled from URL parameters
  - Expected: calculation runs automatically on page load
  - Expected: verdict, CTA, stats, breakdown table, and option cards match the original result

### Invalid URL parameters are ignored
- Open the page with one or more invalid/missing params (e.g. `age=999` or any param missing)
  - Expected: page loads normally, form is empty, no crash, no auto-calculation

### Clipboard blocked (fallback)
- If the browser denies clipboard access, click either share button
  - Expected: toast shows a descriptive error message; no silent failure

---

## CTA block

### CTA appears after calculation
- Calculate any valid set of inputs
  - Expected: CTA block appears below the "Ką daryti dabar?" action block

### CTA content matches verdict
| Verdict | Expected CTA title |
|---|---|
| Verta remontuoti | 🔧 Gauti 3 serviso pasiūlymus |
| Ribinis variantas | 💰 Palyginti remonto kainas prieš sprendimą |
| Dažnai neapsimoka | 🚗 Sužinoti kiek gautum parduodamas automobilį dabar |
| Ekonomiškai neverta | 🚗 Sužinoti kiek gautum parduodamas automobilį dabar |

### CTA note is visible
- Expected: text "Nemokama. Jokių įsipareigojimų." appears below the CTA button

---

## Lead form

### Lead form opens inline
- Click the CTA button
  - Expected: lead form appears below the CTA block (not a modal/popup)
  - Expected: form fields are empty; no status message visible
  - Expected: focus moves to "Miestas" field

### Lead form heading matches CTA type
| CTA type | Expected form heading |
|---|---|
| service | Užklausa serviso pasiūlymams |
| compare | Užklausa kainų palyginimui |
| sell | Užklausa pardavimo pasiūlymui |

### Cancel closes the form
- Open the lead form, then click "Atšaukti"
  - Expected: form hides, fields clear, status message cleared
  - Expected: CTA block remains visible

### Validation — all fields empty
- Open form, click "Siųsti užklausą" with all fields empty
  - Expected: error message appears
  - Expected: focus moves to "Miestas" field
  - Expected: form is not submitted (no console log)

### Validation — contact too short
- Fill all fields but enter only 2 characters in "Kontaktas"
  - Expected: error message appears
  - Expected: focus moves to "Kontaktas" field

### Successful submit
- Fill all 4 fields (Miestas, Automobilis, Gedimo aprašymas, Kontaktas ≥ 5 chars)
- Click "Siųsti užklausą"
  - Expected: success message "✅ Užklausa išsiųsta!..." appears
  - Expected: form fields reset to empty
  - Expected: DevTools console shows `[Lead payload]` object with all fields:
    `leadType`, `city`, `carInfo`, `problemDescription`, `contact`, `createdAt`,
    `verdictIdx`, `verdictTitle`, `scoreBase`, `scoreBonus`, `scoreAdjusted`,
    `carValue`, `repairCost`, `carAge`, `mileage`, `faultType`, `safetyIssue`, `usagePlan`

---

## State reset

### clearAll() resets CTA and lead form
- Calculate, open lead form, fill some fields, then click "🗑 Išvalyti"
  - Expected: results card hidden, CTA block hidden, lead form hidden, fields cleared, status message cleared

### Recalc hides CTA and lead form
- Calculate, open lead form, then click "🔄 Perskaičiuoti"
  - Expected: results card hides, CTA hides, lead form closes and resets

### New calculation resets old form state
1. Calculate (any verdict), open lead form, enter some text, see a success or error message
2. Click "🔄 Perskaičiuoti", change inputs, calculate again
   - Expected: CTA updates to match new verdict
   - Expected: lead form is closed
   - Expected: old form values and status message are gone

---

## Export (PNG)

### Export button downloads PNG
- Calculate, then click "🖼 Išsaugoti kaip paveikslėlį"
  - Expected: browser downloads `remonto-ivertinimas.png`
  - Expected: image shows verdict, percent, repair cost, car value, risk bonus, explanation, recommendation

### Export CDN failure
- Block the CDN URL in DevTools Network tab, then click the export button
  - Expected: toast message appears saying the library could not be loaded
  - Expected: no crash; button remains functional if network is restored
