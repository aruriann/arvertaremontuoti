# Test Checklist

Manual tests to verify the calculator works correctly after any code changes.
Run these after modifying the project.

---

## Formula reference

```
R       = remonto kaina / automobilio vertė
R_adj   = max(0, R + bonusFault + bonusAge + bonusMile + bonusUsage)

bonusFault : A=0, B=+0.10, C=+0.20
bonusAge   : <10m=0, 10–15m=+0.05, >15m=+0.10
bonusMile  : <200 000=0, 200–300 000=+0.05, >300 000=+0.10
bonusUsage : long=−0.05, mid=0, short=+0.10

Verdicts:
  R_adj ≤ 0.30  →  ✅ Verta remontuoti
  R_adj ≤ 0.45  →  ⚠️ Ribinis variantas
  R_adj ≤ 0.60  →  🔶 Dažnai neapsimoka
  R_adj  > 0.60  →  🚫 Ekonomiškai neverta
```

---

## 1. Verta remontuoti

**Inputs:**

| Laukas | Reikšmė |
|---|---|
| Automobilio vertė | 10 000 € |
| Remonto kaina | 1 000 € |
| Automobilio amžius | 5 metai |
| Rida | 120 000 km |
| Gedimo tipas | A – eksploatacinis / planinis |
| Saugumo gedimas | Ne |
| Naudojimo planas | 18+ mėn (ilgai) |

**Calculation:** R=10.0 %, bonus=−5 %, R_adj=5.0 %

**Expected results:**

- Verdict banner: ✅ **Verta remontuoti** (green)
- "Ką daryti dabar?" recommendation: remontuokite
- "Remonto dalis nuo vertės": 10.0 %
- "Papildoma rizika": −5 %
- "Galutinis įvertinimas": 5.0 %
- Progress bar: short green fill
- No safety warning box

---

## 2. Ribinis variantas

**Inputs:**

| Laukas | Reikšmė |
|---|---|
| Automobilio vertė | 8 000 € |
| Remonto kaina | 2 000 € |
| Automobilio amžius | 5 metai |
| Rida | 100 000 km |
| Gedimo tipas | B – vidutinis |
| Saugumo gedimas | Ne |
| Naudojimo planas | 6–18 mėn (vidutiniškai) |

**Calculation:** R=25.0 %, bonus=+10 %, R_adj=35.0 %

**Expected results:**

- Verdict banner: ⚠️ **Ribinis variantas** (yellow)
- "Ką daryti dabar?" recommendation: palyginkite remonto kainas
- "Galutinis įvertinimas": 35.0 %
- Progress bar: yellow, roughly one-third filled

---

## 3. Dažnai neapsimoka

**Inputs:**

| Laukas | Reikšmė |
|---|---|
| Automobilio vertė | 5 000 € |
| Remonto kaina | 1 500 € |
| Automobilio amžius | 12 metai |
| Rida | 100 000 km |
| Gedimo tipas | C – didelis / rizikingas |
| Saugumo gedimas | Ne |
| Naudojimo planas | 6–18 mėn (vidutiniškai) |

**Calculation:** R=30.0 %, bonus=+25 %, R_adj=55.0 %

**Expected results:**

- Verdict banner: 🔶 **Dažnai neapsimoka** (orange)
- "Ką daryti dabar?" recommendation: apsvarstykite pardavimą
- "Galutinis įvertinimas": 55.0 %
- Progress bar: orange, over half filled

---

## 4. Ekonomiškai neverta

**Inputs:**

| Laukas | Reikšmė |
|---|---|
| Automobilio vertė | 5 000 € |
| Remonto kaina | 4 000 € |
| Automobilio amžius | 12 metai |
| Rida | 220 000 km |
| Gedimo tipas | C – didelis / rizikingas |
| Saugumo gedimas | Ne |
| Naudojimo planas | Iki 6 mėn (trumpai) |

**Calculation:** R=80.0 %, bonus=+40 %, R_adj=120.0 %

**Expected results:**

- Verdict banner: 🚫 **Ekonomiškai neverta** (red)
- "Ką daryti dabar?" recommendation: neinvestuokite į remontą
- "Galutinis įvertinimas": 120.0 %
- Progress bar: fully red (capped at 100 % width)
- All risk bonuses visible in breakdown table (gedimo tipas, amžius, rida, naudojimas)

---

## 5. Saugumo gedimas

**Inputs:**

| Laukas | Reikšmė |
|---|---|
| Automobilio vertė | 5 000 € |
| Remonto kaina | 3 000 € |
| Automobilio amžius | 15 metai |
| Rida | 250 000 km |
| Gedimo tipas | C – didelis / rizikingas |
| Saugumo gedimas | **Taip** |
| Naudojimo planas | Iki 6 mėn (trumpai) |

**Calculation:** R=60.0 %, bonus=+40 %, R_adj=100.0 %

**Expected results:**

- Verdict: 🚫 **Ekonomiškai neverta**
- Safety warning box **"Saugumo gedimas"** appears (yellow, above action block)
- "Ką daryti dabar?" recommendation sentence starts with: *Pirma sutaisykite saugumo gedimą, paskui:*
- First step in "3 žingsniai" is: *Pirmiausia atlikite minimalų saugumo remontą...*
- No safety box when "Ne" is selected

---

## 6. Validation — all fields empty

Leave all fields blank and click **🔍 Skaičiuoti**.

**Expected:**

- Results card does NOT appear
- Seven error messages shown (one per field):
  - *Įveskite teigiamą automobilio vertę (€)*
  - *Įveskite teigiamą remonto kainą (€)*
  - *Amžius turi būti 0–40 metų*
  - *Rida turi būti 0–999 999 km*
  - *Pasirinkite gedimo tipą*
  - *Pasirinkite ar gedimas susijęs su saugumu*
  - *Pasirinkite naudojimo laikotarpį*
- Invalid fields highlighted with red border

---

## 7. Validation — edge values

| Input | Value | Expected error |
|---|---|---|
| Automobilio amžius | 41 | *Amžius turi būti 0–40 metų* |
| Automobilio amžius | 0 | No error (valid) |
| Automobilio amžius | 40 | No error (valid) |
| Rida | 1 000 000 | *Rida turi būti 0–999 999 km* |
| Rida | 0 | No error (valid) |
| Automobilio vertė | 0 | *Įveskite teigiamą automobilio vertę (€)* |
| Remonto kaina | −100 | *Įveskite teigiamą remonto kainą (€)* |

Errors clear as soon as the field is corrected.

---

## 8. Clear button

Enter any valid values, click **🔍 Skaičiuoti**, then click **🗑 Išvalyti** (either button).

**Expected:**

- Form resets to empty state
- All error messages cleared
- Results card hidden
- Safety warning box hidden
- Page scrolls to top

---

## 9. Recalculate button

After a calculation, click **🔄 Perskaičiuoti**.

**Expected:**

- Results card hides
- **Form values are kept** (not cleared)
- Page scrolls to top
- Focus moves to "Automobilio vertė" field (after ~300 ms)

---

## 10. Share — copy result text

After a calculation, click **📋 Kopijuoti rezultatą**.

**Expected clipboard content format:**
```
Ar verta remontuoti automobilį? — REZULTATAS
Verdiktas: <verdict title>
R: <x.x %> | Rizikos priedas: <±x %> | R_adj: <x.x %>
Saugumo gedimas: Taip/Ne
Pastaba: <verdict subtitle>
```

**Expected:** toast "✅ Rezultatas nukopijuotas!" appears briefly.

---

## 11. Share — copy link

After a calculation, click **🔗 Kopijuoti nuorodą**.

**Expected URL format (full absolute URL):**
```
https://arvertaremontuoti.lt/?value=10000&repair=1000&age=5&mileage=120000&fault=A&safety=no&usage=long
```

**Expected:** toast "🔗 Nuoroda nukopijuota!" appears briefly.

---

## 11a. Share — URL bar auto-updates after calculation

After clicking **🔍 Skaičiuoti**, check the browser address bar.

**Expected:** address bar URL already contains the current inputs as query parameters — without clicking "Kopijuoti nuorodą".

---

## 11b. Share — copy link before calculation

Click **🔗 Kopijuoti nuorodą** before running any calculation.

**Expected:** toast "⚠️ Pirmiausia atlikite skaičiavimą, tada kopijuokite nuorodą." — no URL is copied.

---

## 12. Share — open copied link

Open the URL from test 11 in a new browser tab.

**Expected:**

- All seven form fields are pre-filled from URL parameters
- Calculation runs automatically
- Results card appears with verdict, CTA, summary stats, insight block
- Result matches what was shown when the link was copied

---

## 13. Share — invalid URL parameters

Open the page with an out-of-range parameter, e.g.:
```
?value=8000&repair=2000&age=999&mileage=100000&fault=B&safety=no&usage=mid
```

**Expected:** page loads normally, form is empty, no crash, no auto-calculation.

---

## 13a. Share — partially missing parameters

Open the page with some params missing, e.g.:
```
?value=8000&repair=2000
```

**Expected:** page loads normally, form is empty, no crash, no auto-calculation.

---

---

## 14. CTA block — verdict 0 (Verta remontuoti)

Use the inputs from test 1 (R_adj = 5.0 %).

**Expected CTA block:**
- Title: 🔧 **Gauti 3 serviso pasiūlymus**
- Text: "Palyginkite remonto kainas savo mieste ir pasirinkite pigiausią."
- Button: **Gauti pasiūlymus**
- Note: "Nemokama. Jokių įsipareigojimų."

---

## 15. CTA block — verdict 1 (Ribinis variantas)

Use the inputs from test 2 (R_adj = 35.0 %).

**Expected CTA block:**
- Title: 💰 **Palyginti remonto kainas prieš sprendimą**
- Button: **Palyginti kainas**

---

## 16. CTA block — verdict 2 (Dažnai neapsimoka)

Use the inputs from test 3 (R_adj = 55.0 %).

**Expected CTA block:**
- Title: 🚗 **Sužinoti kiek gautum parduodamas automobilį dabar**
- Button: **Gauti pasiūlymą**

---

## 17. CTA block — verdict 3 (Ekonomiškai neverta)

Use the inputs from test 4 (R_adj = 120.0 %).

**Expected CTA block:**
- Title: 🚗 **Sužinoti kiek gautum parduodamas automobilį dabar**
- Button: **Gauti pasiūlymą**

---

## 18. Lead form — opens inline

After any calculation, click the CTA button.

**Expected:**
- Lead form appears directly below the CTA block (inline, not a modal)
- Form heading matches the CTA type (service / compare / sell)
- Form fields are empty
- No success/error message visible

---

## 19. Lead form — cancel closes form

With the form open, click **Atšaukti**.

**Expected:**
- Form closes (hidden)
- Form fields cleared
- CTA block still visible

---

## 20. Lead form — validation

Submit the form with all fields empty.

**Expected:**
- Error message appears: *"Prašome užpildyti visus privalomus laukus..."*
- Focus moves to the first invalid field (Miestas)
- Form is not submitted

Test with only contact < 5 characters filled (all others filled):
- Error still shown, focus moves to contact field

---

## 21. Lead form — successful submit

Fill all fields:
- Miestas: Vilnius
- Automobilis: VW Golf 2012
- Gedimo aprašymas: Sugedo stabdžiai
- Kontaktas: vardas@gmail.com

Click **Siųsti užklausą**.

**Expected:**
- Success message appears: "✅ Užklausa išsiųsta!..."
- Form fields reset
- Open browser DevTools console — verify payload is logged with all fields:
  - leadType, city, carInfo, problemDescription, contact, createdAt
  - verdictIdx, verdictTitle, scoreBase, scoreBonus, scoreAdjusted
  - carValue, repairCost, carAge, mileage, faultType, safetyIssue, usagePlan

---

## 22. CTA/form state — clearAll()

After a calculation with form open, click **🗑 Išvalyti**.

**Expected:**
- Results card hidden
- CTA block hidden
- Lead form hidden and fields cleared
- Page scrolls to top

---

## 23. CTA/form state — new calculation resets state

1. Calculate (verdict 0), open lead form, fill some fields
2. Click **🔄 Perskaičiuoti**
3. Change inputs to produce a different verdict (e.g. verdict 3)
4. Click **🔍 Skaičiuoti**

**Expected:**
- CTA block updates to match new verdict
- Old lead form is closed (not visible)
- Old form field values are gone
- Old success/error message is gone

---

## 24. CTA/form state — recalc hides CTA

After a calculation, click **🔄 Perskaičiuoti**.

**Expected:**
- Results card hides
- CTA block hides
- Lead form closes and resets
- Form values kept in main calculator form

---

## If all tests pass

The calculator is functioning correctly.
