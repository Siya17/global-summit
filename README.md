# Global Summit on Emerging Technology and Peace

A graduate Peace Studies classroom simulation in React and TypeScript. Student groups evaluate 10 measurable draft rules grouped into four themes, examine sourced evidence charts, and negotiate a minimum framework — sized to fit a ~35-minute class slot.

## Hosting design

- **Primary:** Cloudflare Sites.
- **Backup:** Vercel, built from the same repository with `npm run build:vercel`.
- **Shared backend when connected:** Firebase Authentication and Cloud Firestore.
- **Transition fallback:** Cloudflare D1 remains active when Firebase environment values are absent.

Both deployments use the same Firebase records after the same `NEXT_PUBLIC_FIREBASE_*` values are configured on Cloudflare and Vercel.

## Firebase setup

1. Create one Firebase project.
2. Enable **Email/Password** and **Anonymous** authentication.
3. Create only your instructor user in Firebase Authentication and choose the password there. Never place that password in source code or send it in chat.
4. Replace `replace-with-your-email@example.com` in `firestore.rules` with your exact email, then deploy the rules.
5. Copy `.env.example` to `.env.local` and add the Firebase web-app configuration.
6. Add the same public variables to Cloudflare and Vercel.
7. Add both deployment domains to Firebase Authentication’s authorized domains.

The first successful instructor login initializes session `PEACE26` and the four themes. Firestore rules enforce the instructor email independently of the interface.

## Cloudflare fallback

Until Firebase is connected, Cloudflare uses D1 and checks both `INSTRUCTOR_EMAIL` and `INSTRUCTOR_PASSWORD` on the server. Configure both as hosted secrets before using the instructor page.

## Classroom routes

- `/summit`: student group deliberation and submission.
- `/dashboard`: live aggregate results and the provisional minimum framework.
- `/instructor`: your restricted session, content, export, and threshold controls.

Students use invisible anonymous Firebase sessions; they do not create named accounts. Participant names are stored separately from public dashboard submissions and are readable only by the instructor under the supplied Firestore rules.

## Local use

Install dependencies, configure `.env.local`, and run `npm run dev`. Use `npm run build` for Cloudflare and `npm run build:vercel` for Vercel.