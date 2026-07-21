# Instructor Guide — Global Summit on Emerging Technology and Peace

A plain-language guide for running this classroom activity, written for instructors who
are **not** software developers. You do **not** need to understand the code to run the class.

If you only read one thing: **the activity is a website with three pages** — one for students,
one for the live results, and one for you. Everything else below is detail.

> **One action needed before Release will work.** This guide now covers a new **Release** button
> (Section 6) that lets a group switch devices without losing their answers. It needs a small,
> already-made update to `firestore.rules` to be **re-published** in the Firebase console — the
> exact same one-click "paste and Publish" step from your original setup (Firebase setup, Step 5
> in `README.md`), just with the already-updated file. Nothing else changed requires this step;
> everything else in this update works immediately.

---

## 1. What the activity is

Your students act as one **working group** at an imaginary international summit. An expert
panel has already drafted rules about how powerful new technologies — especially AI — should be
limited so they do not harm people in war and crisis. To fit the activity into one class period,
those rules are bundled into **four themes**, each holding **2–3 related rules** ("provisions").

Each group's job is not to invent rules from scratch. It is to **judge the four themes** and
decide which ones the world could realistically agree on. At the end, the class produces a
**"Minimum Framework"**: the set of themes that most groups support.

**The four themes:**
1. **Human Control of Force** — a human must approve lethal force; weapons are tested and legally reviewed before use.
2. **Identity, Accountability & Transparency** — no targeting by face-scan alone; records, investigation, and remedy for harm; a public register and independent audits.
3. **Protecting People in Crisis** — a firewall around humanitarian data; a non-digital option for displaced people; human review before essential services (water, food, power) are cut off.
4. **The Most Dangerous Weapons & Global Oversight** — no AI for chemical weapons; international notice and an emergency pause for new autonomous weapons.

### What students learn
- How to weigh a rule's **moral importance** against its **political feasibility** (the two rarely match).
- How **evidence** changes an opinion — each rule comes with a real data point and a counter-argument.
- How international agreement actually forms: through trade-offs, not perfect consensus.

### Who it is for
Graduate students from **any field** — no background in law or political science is assumed.
Difficult terms are explained in the text itself (see "Floating explanations" below).

---

## 2. What a student does (the heart of the activity)

For **each of the four themes**, the group reads its **2–3 short rules** ("provisions"), plus:
- an **evidence chart** with a real-world number,
- **"Why it may be needed"** and **"Practical challenge"** (the two sides), and
- a link to the **source**.

Then the group agrees on **one set of judgments for the whole theme** — three single choices
(A–C) and one multi-choice (D):

| # | Question | Choices |
|---|----------|---------|
| A | **Decision** — what should happen to this theme? | Keep as written · Keep but revise · Remove · Unsure |
| B | **Feasibility** — could countries realistically agree to it? | Realistic · Difficult but possible · Not realistic |
| C | **Priority** — how important is it? | Essential · Important · Minor |
| D | **Main obstacles** — what stands in the way? (**pick up to 3**) | Countries won't give up control · Hard to check if it's followed · Militaries say they need it · Too costly or hard to run · The technology changes too fast · Unfair to some countries · No way to enforce it · Something else |

Two more fields are **optional**: a **proposed rewrite** and a **short reason**. These are the
most interesting things to read aloud in the debrief, so encourage groups to fill them in.

When all four themes are done, the group hits **Submit**. They can reopen and edit on the **same
device/browser** while the session is open — resubmitting **updates** their entry, it does not
create a duplicate.

> **Their work is saved as they go, not just at the end.** The page quietly saves progress in the
> background a couple of seconds after each answer, and again every time a group moves to the next
> theme — you'll see a small "Saved" note near the top of the page. If a laptop dies or a tab
> closes mid-activity, nothing beyond the last few seconds is lost, even if the group never
> pressed Submit. See Section 6 ("Groups") for what to do if a group needs to continue on a
> **different** device.

**Floating explanations:** difficult words (for example *biometric*, *dual-use*, *autonomous
weapon*) appear with a **dotted underline**. Hovering, tapping, or keyboard-focusing the word
shows a one-sentence plain definition. You can edit or add these — see Section 7.

---

## 3. The three pages

The site has three web addresses ("routes"). Whatever your final web address is (see Section 4),
add these to the end of it:

| Page | Address ends with | Who uses it | What it does |
|------|-------------------|-------------|--------------|
| **Student Summit** | `/summit` | Students | Read the rules and submit the group's judgments. |
| **Class Dashboard** | `/dashboard` | Everyone (project it) | Live results: where the class agrees, what is "important but difficult", and the emerging Minimum Framework. Refreshes automatically every 15 seconds. |
| **Instructor Desk** | `/instructor` | You only | Open/close the session, edit rules, watch groups arrive, export the data, and adjust settings. Password-protected. |

The **session code** ties them together. The default code is **`PEACE26`**. Students type it on
the `/summit` page. You can create more codes for different classes (Section 6).

You don't need to remember the Dashboard address separately: once you're signed in to the
Instructor Desk, an **"Open live dashboard ↗"** link sits at the top of every tab and opens the
Dashboard for your current session code in a new tab — handy for projecting it while you keep the
Instructor Desk open on your own laptop.

---

## 4. Getting it online for a class

There are two ways to use the site. **You almost certainly want Option A for a real class.**

### Option A — Firebase (recommended: works on every student's own device)
This gives every student a shared, live experience from their own laptop or phone. It requires
a **one-time setup** by you or your IT support, following the steps in **`README.md`**
("Firebase setup"). In short:
1. Create one free Firebase project.
2. Turn on **Email/Password** and **Anonymous** sign-in.
3. Create **only your own** instructor account (choose your password there — never put it in the code).
4. Put your email into `firestore.rules` and the Firebase settings into the site's configuration.
5. Deploy (Cloudflare or Vercel — both are in `README.md`).

After that, you just share the web link and the code `PEACE26`. Students do **not** create
accounts or type any password — they join invisibly.

> Not comfortable with the setup? This is the one part worth asking a technically-minded
> colleague or your department's IT help for ~30 minutes. Everything after it is click-only.

### Option B — Preview it yourself on your own computer
Use this to **see the activity yourself** before class. It runs on your laptop only.

1. Install **Node.js version 22.13 or newer** from <https://nodejs.org> (the "LTS" download).
2. Open **PowerShell**, then go to this project folder. For example:
   ```powershell
   cd "C:\Users\pa17\Desktop\Tokyo Tech\7_materials\global-summit"
   ```
3. Install the parts the site needs (first time only):
   ```powershell
   npm install
   ```
4. Start the site:
   ```powershell
   npm run dev
   ```
5. The terminal prints a web address such as `http://localhost:3000`. Open it in your browser
   and add `/summit`, `/dashboard`, or `/instructor` to the end.
6. To stop it, click the PowerShell window and press **Ctrl + C**.

To open the **Instructor Desk** in this preview mode, the site needs to know your instructor
email and password. Copy the file `.env.example` to a new file named `.env.local` and fill in
`INSTRUCTOR_EMAIL` and `INSTRUCTOR_PASSWORD`, then restart with `npm run dev`.

> Option B is perfect for previewing and for a single-screen demo. For a whole class submitting
> from many devices at once, use Option A.

---

## 5. Running the class (about 35 minutes, then your discussion)

**Before class**
- Decide your groups (3–5 students each works well).
- Open the **Instructor Desk** → **Session** tab and confirm the session shows **"Submissions open"**.
- Have the **Dashboard** ready to project.

**In class**
1. **Frame it (5 min).** "You are one delegation. Your goal is not the perfect agreement — it is
   the strongest set of rules many countries could actually accept."
2. **Groups deliberate (~25 min).** Each group opens `/summit`, enters code `PEACE26` and a
   group name, and works through the four themes (about 6 minutes each). One person types the
   group's agreed answers.
3. **Watch the Dashboard fill in (live).** As groups submit, the projected Dashboard updates.
4. **Close submissions.** In the Instructor Desk → Session tab, click **"Close submissions"** so
   the picture stops moving while you discuss.
5. **Debrief (15–20 min).** Use the Dashboard's **"Important but Difficult"** panel and the
   **Minimum Framework** as your discussion spine (prompts in Section 8).

**Timing note:** four themes at ~6 minutes each keeps the group work near **25 minutes**, so the
whole activity fits a **35-minute** block before your class discussion. The join screen tells
students to plan for about 30 minutes.

---

## 6. Using the Instructor Desk

Go to `/instructor`, sign in with your instructor email and password. You will see four tabs:

- **Session** — the main controls.
  - **Open / Close submissions** (close it before the debrief).
  - **Create another session** — make a new code (e.g. `JULY26`) for a different class. Each code
    keeps its own separate results.
  - **Export responses** — download everything as **CSV** (opens in Excel) or **JSON**. The CSV
    has one row per group per theme, including their chosen obstacles, written reasons, and
    rewrites — useful for
    grading or research.
  - **Reset this session** — deletes all responses for that code. Use only to clear a test run.
- **Groups** — see who has joined, whether they are a draft or submitted.
  - **Release** *(only when Firebase is connected — see `README.md`)*: frees a group's name so
    they can continue on a **different device**, without losing anything they already saved. Use
    this if a laptop dies, a student switches devices, or a browser gets wiped mid-class — normally
    a group's name is locked to the one device it started on, precisely so no one else can
    accidentally hijack it; Release lifts that lock on purpose. The group then re-enters the same
    code and the same group name on the new device and picks up where they left off.
  - **Delete** — permanently removes a group's response. Use only for accidental duplicates or
    test entries; unlike Release, this cannot be undone.
- **Content** — **edit any theme, its numbered rules, its evidence, and its sources — without
  touching code** (see Section 7).
- **Thresholds** — the percentages that decide the Dashboard categories and which rules enter the
  Minimum Framework. The defaults are sensible; only change them if you want to make agreement
  easier or harder to reach. Every number is shown to students on the Dashboard, so the logic
  stays transparent.

---

## 7. Editing the rules, evidence, and word definitions

You have two ways to change wording. **The first needs no code.**

### A. Live, through the Instructor Desk (recommended)
Instructor Desk → **Content** tab → click any theme. You can edit:
- its title and one-line summary,
- every **numbered rule** students see (add, edit, or remove a rule with the **+ / ×** buttons —
  at least one rule must remain),
- the "Why it may be needed" / "Practical challenge" notes and the data point, and
- its **sources** (add, edit, or remove as many as you like, same **+ / ×** buttons).

Click **Save theme**. If something goes wrong (for example, a lost connection), the editor stays
open with everything you typed still in the boxes and shows what went wrong — it will not
silently discard your edits. Saved changes update for everyone immediately.

> Note: content edits apply to the shared database for sessions that already exist. Brand-new
> sessions start from the built-in defaults in the file below.

### B. In the files (only needed for the built-in starting text)
- **The four themes, their rules, and evidence:** `app/lib/regulations.ts`. Each theme has a
  `title`, a one-line `text` summary, a `provisions` list (the numbered rules), the two evidence
  notes, an `evidenceDataPoint`, the little `evidenceBars` (the chart), and `sources`. Edit the
  text between the quotation marks. Keep the concrete numbers (like "30 days" or "at least 1,000")
  — they are what make each rule debatable. This file only matters for **brand-new** sessions or a
  database that has never been opened in the Instructor Desk — once a session exists, edit it
  live through Option A instead.
- **The floating word definitions:** `app/lib/glossary.ts`. Each entry has a `term` and a plain
  `definition`. To explain a new word, copy an existing block and change the two lines. `aliases`
  lets one definition also cover plural forms (e.g. "audit" and "audits"). Any listed word is
  automatically underlined and explained the first time it appears in a rule — you do not have to
  mark it up by hand.

After editing files, if the site is running in preview mode (Option B), stop it (Ctrl + C) and run
`npm run dev` again to see the change.

---

## 8. Debrief discussion prompts

- **Where is the gap widest?** Look at "Important but Difficult" — rules many call *Essential* but
  few call *Realistic*. Why is the right thing so hard to agree on?
- **What made the Minimum Framework, and what just missed?** Read one "just missed" rule's
  proposed rewrites — could a small change have won more support?
- **Which obstacle dominated?** If most groups blamed *Sovereignty* or *Verification*, ask what a
  rule would need to overcome it.
- **Did the evidence move anyone?** Ask a group that chose "Remove" or "Not realistic" what number
  or fact, if any, would have changed their mind.
- **Minimum vs. ideal.** Is a weaker rule that everyone accepts better than a strong rule that
  half reject? This is the core tension of the whole simulation.

---

## 9. Troubleshooting & FAQ

- **A student sees "Session code not found."** Check they typed the code exactly (it is not
  case-sensitive, but spelling matters) and that the session exists in your Instructor Desk.
- **A student sees "This summit is currently closed."** You (or a colleague) clicked
  *Close submissions*. Reopen it in the Session tab.
- **"This group name is already being used on another device."** Normal and by design — a group's
  name locks to whichever device it started on, so a second device can't accidentally overwrite
  it. If it's genuinely the *same* group needing to switch devices (a dead laptop, a new browser),
  go to Instructor Desk → **Groups** → **Release** next to their name, then have them re-enter the
  same code and group name on the new device — their saved answers will still be there. If it's
  actually two different groups that picked the same name, have the second group use a different
  name instead. *(Release needs Firebase connected — see `README.md`. In the Cloudflare/D1
  fallback mode there is no device lock at all, so this message never appears there.)*
- **A group's laptop died or they lost their tab mid-activity.** Their work is safe: progress
  autosaves in the background every few seconds and at every "Save & continue," not just at the
  final Submit (see Section 2). If they're back on the **same** device and browser, re-entering the
  same code and group name reloads it instantly. If they need a **different** device, use
  **Release** above first, then re-enter — either way nothing beyond the last few seconds is lost.
- **The Dashboard looks empty.** Nothing counts until a group presses **Submit** with all four
  themes complete. Saved drafts do not appear in the results.
- **The Dashboard is not updating.** It refreshes every 15 seconds; there is also a
  **"Refresh results"** button. Make sure the code in the address bar matches your session.
- **I forgot my instructor password.** It lives in Firebase (Option A) — reset it in the Firebase
  console. In preview mode (Option B) it is in your `.env.local` file.
- **A student's screen says "Not saved — check connection."** Their answers so far are still safe
  on their screen and will keep trying in the background; this just means the last autosave
  attempt failed (usually a dropped Wi-Fi connection). Have them check their connection — the next
  successful save (or pressing Submit) clears it.
- **Clicking Release shows a permission error.** The updated `firestore.rules` hasn't been
  re-published yet for this Firebase project — see the note near the top of this guide.

---

## 10. Known issue to be aware of (not something you need to fix)

The command `npm test` currently fails. That test is **leftover scaffolding from the starter
template** and checks for a placeholder "loading" page that this project replaced — it has nothing
to do with the summit activity, and the activity itself builds and runs correctly (`npm run build`
succeeds). You can safely ignore `npm test`. If you would like a real test added later, ask your
developer to replace `tests/rendered-html.test.mjs`.

---

## Quick file map (for when you hand this to a developer)

| You want to change… | File |
|----------------------|------|
| The 4 themes / provisions / evidence / charts (defaults) | `app/lib/regulations.ts` |
| Word definitions in the floating tooltips | `app/lib/glossary.ts` |
| The student page | `app/summit/SummitApp.tsx` |
| The results dashboard | `app/dashboard/DashboardApp.tsx` |
| The instructor controls | `app/instructor/InstructorApp.tsx` |
| Colours and styling | `app/globals.css` |
| Hosting / Firebase setup | `README.md` |
| Who can read/write what in Firebase (incl. the Release permission) | `firestore.rules` |
