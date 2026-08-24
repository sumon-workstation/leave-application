# Leave Application — Live Corps

Digital replacement for the paper leave application form. Employees pick their name, the form
fills itself from the employee master, and each submission is recorded to a Google Sheet with a
reference number. Hosted as static files on GitHub Pages — no server to run or pay for.

**Live:** https://sumon-workstation.github.io/leave-application/

## Files

| File | What it is |
|---|---|
| `index.html` | The form. Everything the employee sees. |
| `employees.js` | Employee master — 50 records from the Live Ventures roster. |
| `config.js` | Endpoint URL, weekend days, HR contact. The only file you normally edit. |
| `Code.gs` | Google Apps Script backend. Paste into the Sheet, not into the repo host. |

## Setup — about 10 minutes

### 1. Create the sheet

Make a new Google Sheet named **Live Corps — Leave Records**.

### 2. Add the script

In that sheet: **Extensions → Apps Script**. Delete the placeholder code, paste all of `Code.gs`,
and save.

Optional: set `NOTIFY = 'hr@livecorps.com'` at the top to get an email on every submission.

Run the `setup` function once from the editor. Google will ask for permission — approve it.
This creates the **Leave Records** tab with its headers.

### 3. Deploy the script

**Deploy → New deployment → Web app.**

- Description: `Leave recorder v1`
- Execute as: **Me**
- Who has access: **Anyone**

"Anyone" is required — the form is not signed in as a Google user. The script only appends rows;
it never reads or returns existing data.

Copy the Web App URL. It looks like `https://script.google.com/macros/s/AKfyc.../exec`.

### 4. Point the form at it

In `config.js`, paste the URL:

```js
endpoint: "https://script.google.com/macros/s/AKfyc.../exec",
```

### 5. Publish

```bash
git clone https://github.com/sumon-workstation/leave-application.git
cd leave-application
# copy index.html, employees.js, config.js, Code.gs, README.md in
git add .
git commit -m "Employee lookup and Google Sheets recording"
git push
```

Pages redeploys in about a minute. Hard-refresh the live URL to clear the old cache.

### 6. Test before announcing

Submit one application as yourself. Confirm the row lands in the sheet and the reference number
shows on the form. Then delete the test row.

## How it behaves

- **Endpoint set** → submissions record to the sheet, form locks, reference number is displayed.
- **Endpoint empty** → the form still works as a PDF generator. It says so in the toolbar rather
  than pretending to submit.
- **Network fails** → the entered data stays on screen with a message to retry or fall back to PDF.
  Nothing is lost.

The **General Manager Approval** block and the **ADMIN USE ONLY** table stay blank on purpose.
Approval is recorded in the sheet's `Approval` / `Approver` / `Decision Date` columns, and the
printed PDF keeps the signature block for anyone who still wants a wet signature on file.

## Maintenance

**Someone joins or leaves:** edit `employees.js`, commit, push. Nothing else changes.

**Weekend days:** `config.js` → `weekend: [5,6]` is Friday/Saturday. Use `[0,6]` for Sunday/Saturday.

**Reference numbers:** `LV-2026-0001`, sequential, restarting each January.

## Known limits

This records applications. It does not calculate entitlement balances, enforce them, or route
approvals through a workflow. HR still fills the balance columns by hand. Moving to Odoo Time Off
is the next step if that manual work becomes the bottleneck.

## One thing to check before you share the link

GitHub Pages is public. `employees.js` contains every employee's name, ID, designation, department,
and join date, and anyone with the URL can read it — no login required.

Three ways to handle it, in order of effort:

1. Make the repository private and use a paid GitHub plan (Pages on private repos requires one), or
   host on Netlify/Cloudflare Pages with access control.
2. Replace the dropdown with an ID entry field and validate against the roster server-side in
   `Code.gs`, so the roster never ships to the browser.
3. Accept it, if a staff directory is not considered sensitive at Live.

Worth a decision with the CIO before the link circulates.
