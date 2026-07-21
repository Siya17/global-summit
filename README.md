# Global Summit on Emerging Technology and Peace

A graduate Peace Studies classroom simulation in React and TypeScript. Student groups evaluate 10 measurable draft rules grouped into four themes, examine sourced evidence charts, and negotiate a minimum framework — sized to fit a ~35-minute class slot.

## Hosting design

- **Primary:** Cloudflare Sites.
- **Backup:** Vercel, built from the same repository with `npm run build:vercel`.
- **Shared backend when connected:** Firebase Authentication and Cloud Firestore.
- **Transition fallback:** Cloudflare D1 remains active when Firebase environment values are absent.

Both deployments use the same Firebase records after the same `NEXT_PUBLIC_FIREBASE_*` values are configured on Cloudflare and Vercel.

## Firebase setup

Do this once, before your first class. It takes about 15 minutes and is entirely done by
clicking in a web browser — no command line needed for this part. You will need a Google
account.

### Step 1 — Create the Firebase project
1. Go to <https://console.firebase.google.com> and sign in with your Google account.
2. Click **Add project** (or **Create a project**).
3. Type a project name — anything you like, e.g. `global-summit-peace`. Click **Continue**.
4. If asked about Google Analytics, you can turn the toggle **off**. This app does not need it.
5. Click **Create project**, then **Continue** once it finishes.

### Step 2 — Turn on sign-in methods
1. In the left sidebar, under **Build**, click **Authentication**.
2. Click **Get started** (first time only).
3. Open the **Sign-in method** tab.
4. Click **Email/Password**, switch it **Enable** on, then **Save**.
5. Click **Anonymous**, switch it **Enable** on, then **Save**. (This is what lets students join
   without creating an account.)

### Step 3 — Create your instructor account
1. Still inside **Authentication**, open the **Users** tab.
2. Click **Add user**.
3. Enter the email address you (the instructor) will sign in with, and choose a password.
4. Click **Add user**.

   > This is the **only** account you ever create by hand. Students never appear here — they
   > join anonymously. **Never** put this password into a code file, a chat message, or this
   > README. You will only ever type it into the `/instructor` sign-in screen.

### Step 4 — Create the database
1. In the left sidebar, under **Build**, click **Firestore Database**.
2. Click **Create database**.
3. Pick a location close to your students (you cannot change this later) and click **Next**.
4. Choose **Start in production mode**, then click **Create**. (Don't worry about what
   "production mode" means — Step 5 replaces the rules with the ones this project ships with.)

### Step 5 — Install the access rules
This app comes with a ready-made rules file that makes sure only your instructor account can
edit content, and that students can only see their own submissions plus the public results.

> **Already done this once and just pulled a newer version of the project?** The rules occasionally
> change (for example, to support the instructor's "Release a group" button). Your email is likely
> already filled in from before, so you can skip straight to step 3 below — just re-copy the
> **current** contents of `firestore.rules` and re-publish them, the same way as the first time.

1. Open the file `firestore.rules` in this project folder, in any text editor (Notepad works).
2. Find this line near the top:
   ```
   && request.auth.token.email == "replace-with-your-email@example.com";
   ```
   Replace `replace-with-your-email@example.com` with the **exact** email you used in Step 3
   (keep the quotation marks around it). Save the file.
3. Select the entire contents of `firestore.rules` and copy it (Ctrl+A, then Ctrl+C).
4. Back in the Firebase console, inside **Firestore Database**, click the **Rules** tab at the
   top.
5. Click inside the editor box, select everything already there and delete it, then paste
   (Ctrl+V) the contents you copied.
6. Click **Publish**.

### Step 6 — Get your web app configuration
1. Click the **gear icon** next to "Project Overview" in the top-left, then **Project settings**.
2. Scroll down to **Your apps**. Click the **`</>`** (web) icon to register a new web app.
3. Give it any nickname, e.g. `global-summit-web`. Leave "Also set up Firebase Hosting" **unchecked**.
4. Click **Register app**. Firebase shows a code block containing a `firebaseConfig` object with
   six values: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
   **Keep this screen open** — you need these six values in the next step.
5. Click **Continue to console**.

   > You can always find these six values again later: **Project settings → Your apps → your
   > web app → SDK setup and configuration**.

### Step 7 — Put the configuration into this project
1. In this project folder, make a copy of the file `.env.example` and rename the copy `.env.local`
   (same folder, same capitalization).
2. Open `.env.local` in a text editor and fill in the six Firebase lines using the values from
   Step 6, and your instructor email on the seventh line:
   ```
   NEXT_PUBLIC_INSTRUCTOR_EMAIL=your-instructor-email@example.com
   NEXT_PUBLIC_FIREBASE_API_KEY=            (paste the apiKey value)
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=        (paste the authDomain value)
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=         (paste the projectId value)
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=     (paste the storageBucket value)
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=(paste the messagingSenderId value)
   NEXT_PUBLIC_FIREBASE_APP_ID=             (paste the appId value)
   ```
3. Leave `INSTRUCTOR_EMAIL` and `INSTRUCTOR_PASSWORD` (the two lines **without** `NEXT_PUBLIC_`)
   blank or as-is — those two are only used by the Cloudflare fallback (see below) and are not
   needed once Firebase is connected.
4. Save the file. `.env.local` is already excluded from Git, so it will not be committed or
   uploaded anywhere.

### Step 8 — Add the same values to your live website host
`.env.local` only affects your own computer. For students to reach the real, hosted website, the
same values need to be entered wherever that website's environment variables are configured.

- **Vercel:** open your project on <https://vercel.com>, go to **Settings → Environment
  Variables**, add each of the seven `NEXT_PUBLIC_…` names and values from Step 7 (for all
  environments), then trigger a new deployment.
- **Cloudflare:** open **Workers & Pages** for this project at
  <https://dash.cloudflare.com>, go to **Settings → Variables and Secrets**, add the same seven
  `NEXT_PUBLIC_…` names and values, then redeploy.
  > If this project's Cloudflare hosting was already set up for you by whichever platform
  > generated this site, look there for an "Environment Variables" or "Secrets" screen instead —
  > the exact location differs by platform, but the seven values are exactly the same everywhere.

### Step 9 — Authorize your website's domain
Firebase blocks sign-in from domains it doesn't recognize, so add each real web address your
site is published at:
1. In the Firebase console, go to **Authentication → Settings → Authorized domains**.
2. Click **Add domain** and enter your Vercel domain (e.g. `your-site.vercel.app`).
3. Click **Add domain** again and enter your Cloudflare domain (e.g. `your-site.pages.dev`), and
   any custom domain you use.
   `localhost` is already listed by default, so local testing (Step 10) works without extra setup.

### Step 10 — Test it
1. Open your site's `/instructor` page (locally: run `npm run dev`, then visit
   `http://localhost:3000/instructor`).
2. Sign in with the instructor email and password from Step 3.
3. Signing in successfully for the first time automatically creates session **`PEACE26`** and
   loads the four themes into Firestore — you don't create these by hand.
4. Share the `/summit` page and the code `PEACE26` with your students.

Firestore rules enforce the instructor email independently of the app's interface, so even a
student who guesses the instructor page cannot make changes without that exact email and
password.

## Cloudflare fallback

Until Firebase is connected, Cloudflare uses D1 and checks both `INSTRUCTOR_EMAIL` and `INSTRUCTOR_PASSWORD` on the server. Configure both as hosted secrets before using the instructor page.

## Classroom routes

- `/summit`: student group deliberation and submission.
- `/dashboard`: live aggregate results and the provisional minimum framework.
- `/instructor`: your restricted session, content, export, and threshold controls.

Students use invisible anonymous Firebase sessions; they do not create named accounts. Participant names are stored separately from public dashboard submissions and are readable only by the instructor under the supplied Firestore rules.

## Local use

Install dependencies, configure `.env.local`, and run `npm run dev`. Use `npm run build` for Cloudflare and `npm run build:vercel` for Vercel.