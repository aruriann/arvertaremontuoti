# Project Guidelines

This project is a simple web tool that helps users decide if repairing a car is economically worth it.

Keep the project simple and readable.

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- No frameworks
- No external libraries unless requested

## File Structure

index.html → page structure  
styles.css → styling  
app.js → calculator logic

Do not embed CSS or JS inside HTML unless requested.

## Coding Rules

1. Do NOT rewrite the entire project.
2. Only modify the necessary parts.
3. Keep functions simple.
4. Avoid complex frameworks.
5. Explain changes before making them.

## UI Rules

The UI should stay:

- simple
- mobile friendly
- clean
- easy to understand

Do not redesign the UI unless asked.

## Calculator Logic

Base formula:

R = repairCost / carValue

Adjusted ratio:

R_adj = R + risk bonuses

R_adj must never be negative.

### Verdict thresholds

<= 0.30 → Worth repairing  
<= 0.45 → Borderline  
<= 0.60 → Often not worth it  
> 0.60 → Economically not worth it

Do not change these thresholds unless requested.

## Safety Rule

If the user selects that the issue is safety related
(brakes, steering, suspension etc.)

a warning block must always appear recommending to fix the safety issue.
