# Global Summit on Emerging Technology and Peace

A responsive graduate-level Peace Studies classroom activity. Student groups evaluate 15 draft regulations, submit one shared framework, and compare normative importance with political feasibility on a live class dashboard.

## Stack

- TypeScript, React, and the Next.js-compatible vinext app router
- Cloudflare D1 for sessions, editable regulations, drafts, and submissions
- Cloudflare Sites hosting; no student accounts required

D1 is used because class records must survive refreshes and be shared across devices. Browser storage is used only for a recoverable draft on the group’s current device.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set a strong `INSTRUCTOR_PASSWORD`.
3. Run `npm run db:generate` after schema changes.
4. Run `npm run dev` and open the local URL shown.

The starter session code is `PEACE26`. The database and editable seed content are initialized on first request. The default instructor password is intentionally not included.

## Classroom flow

- Students open `/summit`, enter the session code and group details, and complete four required judgments for every regulation.
- `/dashboard` refreshes every 15 seconds and also has a manual refresh control.
- `/instructor` creates sessions, opens or closes submissions, edits evidence and sources, removes accidental entries, resets a session, adjusts thresholds, and exports CSV or JSON.
- Resubmission uses the session plus normalized group name as a unique key, preventing duplicate entries.

## Dashboard classifications

Thresholds are percentages and are editable per session. Categories are evaluated in this order: Necessary but difficult, Revision needed, Contested, Low priority, then Strong consensus. The default minimum framework requires at least 55% support, at least 40% Essential, and no more than 25% Remove. The dashboard always displays the active framework thresholds.

## Deployment and database

`.openai/hosting.json` declares the logical D1 binding as `DB`. Generated Drizzle migrations live in `drizzle/`; the app also runs idempotent `CREATE TABLE IF NOT EXISTS` statements so a new classroom deployment can initialize safely. Set `INSTRUCTOR_PASSWORD` as a hosted secret before sharing the instructor URL.

## Manual check

- Join with `PEACE26`, complete all required controls, move backward and forward, and confirm the draft survives refresh.
- Submit, edit, and resubmit the same group; verify only one dashboard entry exists.
- Confirm dashboard percentages and Important but Difficult ranking with two contrasting groups.
- Close submissions and verify student writes are rejected with a clear message.
- Edit one evidence card, export CSV and JSON, delete a test entry, and test mobile keyboard navigation.

## Current MVP limits

- Instructor access uses one environment password rather than named instructor accounts.
- Dashboard refresh is polling rather than a push subscription.
- Source links and provisional evidence notes should be reviewed by the instructor before assessed use.
