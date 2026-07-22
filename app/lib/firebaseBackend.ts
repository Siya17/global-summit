"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithEmailAndPassword, signOut, type Auth } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { defaultRegulations } from "./regulations";
import { defaultThresholds, type Regulation, type Responses, type Submission, type SummitSession, type Thresholds } from "./types";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let services: { auth: Auth; db: Firestore } | null = null;

export const firebaseAvailable = () => Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

function getServices() {
  if (!firebaseAvailable()) throw new Error("Firebase has not been connected yet.");
  if (!services) {
    const app = getApps().length ? getApp() : initializeApp(config);
    services = { auth: getAuth(app), db: getFirestore(app) };
  }
  return services;
}

async function anonymousUser() {
  const { auth } = getServices();
  if (auth.currentUser) return auth.currentUser;
  return (await signInAnonymously(auth)).user;
}

function submissionKey(sessionId: string, groupName: string) {
  const input = `${sessionId}:${groupName.trim().toLocaleLowerCase()}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${sessionId}-${(hash >>> 0).toString(36)}`;
}

export async function firebaseLoadSession(code: string) {
  await anonymousUser();
  const { db } = getServices();
  const normalized = code.trim().toUpperCase();
  const sessionSnap = await getDoc(doc(db, "sessions", normalized));
  if (!sessionSnap.exists()) throw new Error("Session code not found.");
  const regulationSnaps = await getDocs(query(collection(db, "regulations"), orderBy("number")));
  return {
    session: sessionSnap.data() as SummitSession,
    regulations: regulationSnaps.docs.map((item) => item.data() as Regulation),
  };
}

export async function firebaseLoadSubmissions(code: string) {
  const { session } = await firebaseLoadSession(code);
  const { db } = getServices();
  const snaps = await getDocs(query(collection(db, "submissions"), where("sessionId", "==", session.id)));
  return {
    session,
    submissions: snaps.docs.map((item) => item.data() as Submission).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  };
}

export async function firebaseSaveSubmission(input: {
  code: string;
  id?: string;
  groupName: string;
  participantNames?: string;
  responses: Responses;
  submitted: boolean;
}) {
  const user = await anonymousUser();
  const { db } = getServices();
  const { session, regulations } = await firebaseLoadSession(input.code);
  if (session.status !== "open") throw new Error("This summit is closed to submissions.");
  const id = input.id || submissionKey(session.id, input.groupName);
  const ref = doc(db, "submissions", id);
  const existing = await getDoc(ref);
  const existingOwner = existing.exists() ? (existing.data().ownerUid as string | undefined) : undefined;
  // An empty ownerUid means the instructor released this group's device lock,
  // so a new device may adopt it (see the "release" admin action below).
  if (existing.exists() && existingOwner && existingOwner !== user.uid) {
    throw new Error("This group name is already being used on another device.");
  }
  const completed = regulations.filter((regulation) => {
    const response = input.responses[regulation.id];
    return response?.decision && response.feasibility && response.priority && response.obstacles?.length && (!response.obstacles.includes("other") || response.otherObstacle?.trim()) && (!session.isMakeup || response.reasoning?.trim());
  }).length;
  if (input.submitted && completed !== regulations.length) throw new Error(session.isMakeup ? "Complete every required response, including your written reasoning for each theme, before submitting." : "Complete every required response before submitting.");
  const now = new Date().toISOString();
  const submission: Submission & { ownerUid: string } = {
    id,
    sessionId: session.id,
    groupName: input.groupName.trim(),
    responses: input.responses,
    submitted: input.submitted,
    createdAt: existing.exists() ? String(existing.data().createdAt) : now,
    updatedAt: now,
    ownerUid: user.uid,
  };
  const batch = writeBatch(db);
  batch.set(ref, submission);
  batch.set(doc(db, "privateSubmissions", id), {
    id,
    sessionId: session.id,
    participantNames: input.participantNames?.trim() || "",
    ownerUid: user.uid,
    updatedAt: now,
  });
  await batch.commit();
  return { id };
}

// Looks for an existing submission under this group name so a device with no
// local draft (a new laptop, a released lock, a cleared browser) resumes from
// the group's last saved answers instead of silently starting blank and
// overwriting them on the next save. Returns null if there is nothing to
// resume, or if the group name is still locked to a different device.
export async function firebaseLoadDraft(code: string, groupName: string) {
  const trimmed = groupName.trim();
  if (!trimmed) return null;
  const user = await anonymousUser();
  const { db } = getServices();
  const { session } = await firebaseLoadSession(code);
  const id = submissionKey(session.id, trimmed);
  const snap = await getDoc(doc(db, "submissions", id));
  if (!snap.exists()) return null;
  const data = snap.data() as Submission & { ownerUid?: string };
  if (data.ownerUid && data.ownerUid !== user.uid) return null;
  return { id, responses: data.responses };
}

export async function firebaseSignInInstructor(email: string, password: string) {
  const { auth } = getServices();
  if (auth.currentUser?.isAnonymous) await signOut(auth);
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const allowed = process.env.NEXT_PUBLIC_INSTRUCTOR_EMAIL?.trim().toLocaleLowerCase();
  if (allowed && allowed !== "replace-with-your-email@example.com" && credential.user.email?.toLocaleLowerCase() !== allowed) {
    await signOut(auth);
    throw new Error("This account is not authorized as the instructor.");
  }
  return credential.user;
}

export async function firebaseEnsureSeed() {
  const { db } = getServices();
  const sessionRef = doc(db, "sessions", "PEACE26");
  const session = await getDoc(sessionRef);
  if (!session.exists()) {
    const seed: SummitSession = {
      id: "session-peace26",
      sessionCode: "PEACE26",
      title: "Global Summit on Emerging Technology and Peace",
      status: "open",
      isMakeup: false,
      thresholds: defaultThresholds,
      framework: [],
      createdAt: new Date().toISOString(),
    };
    await setDoc(sessionRef, seed);
  }
  // Seed on a fresh project, and migrate an older rule set to the current one:
  // if the current default content is missing, replace whatever is there.
  const regulations = await getDocs(collection(db, "regulations"));
  const hasCurrent = regulations.docs.some((item) => item.id === defaultRegulations[0].id);
  if (!hasCurrent) {
    const batch = writeBatch(db);
    regulations.docs.forEach((item) => batch.delete(item.ref));
    defaultRegulations.forEach((regulation) => batch.set(doc(db, "regulations", regulation.id), regulation));
    await batch.commit();
  }
}

export async function firebaseLoadAdmin(code: string) {
  await firebaseEnsureSeed();
  const { session, regulations } = await firebaseLoadSession(code);
  const { db } = getServices();
  const publicSnaps = await getDocs(query(collection(db, "submissions"), where("sessionId", "==", session.id)));
  const privateSnaps = await getDocs(query(collection(db, "privateSubmissions"), where("sessionId", "==", session.id)));
  const names = new Map(privateSnaps.docs.map((item) => [item.id, String(item.data().participantNames || "")]));
  const submissions = publicSnaps.docs
    .map((item) => ({ ...(item.data() as Submission), participantNames: names.get(item.id) || "" }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { session, regulations, submissions };
}

type AdminAction =
  | { action: "create"; code: string; title?: string; isMakeup?: boolean }
  | { action: "session"; status?: "open" | "closed"; thresholds?: Thresholds; framework?: number[] }
  | { action: "regulation"; regulation: Regulation }
  | { action: "delete"; submissionId: string }
  | { action: "release"; submissionId: string }
  | { action: "reset" };

export async function firebaseAdminAction(code: string, body: AdminAction) {
  const { db } = getServices();
  const normalized = code.trim().toUpperCase();
  if (body.action === "create") {
    const nextCode = body.code.trim().toUpperCase();
    if (!/^[A-Z0-9-]{4,10}$/.test(nextCode)) throw new Error("Use 4–10 letters, numbers, or hyphens.");
    const existing = await getDoc(doc(db, "sessions", nextCode));
    if (existing.exists()) throw new Error("That session code already exists.");
    const session: SummitSession = {
      id: `session-${nextCode.toLocaleLowerCase()}`,
      sessionCode: nextCode,
      title: body.title?.trim() || "Global Summit on Emerging Technology and Peace",
      status: "open",
      isMakeup: Boolean(body.isMakeup),
      thresholds: defaultThresholds,
      framework: [],
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "sessions", nextCode), session);
    return;
  }
  const sessionRef = doc(db, "sessions", normalized);
  const sessionSnap = await getDoc(sessionRef);
  if (!sessionSnap.exists()) throw new Error("Session code not found.");
  const session = sessionSnap.data() as SummitSession;
  if (body.action === "session") {
    await updateDoc(sessionRef, {
      status: body.status || session.status,
      thresholds: body.thresholds || session.thresholds,
      framework: body.framework || session.framework,
    });
  } else if (body.action === "regulation") {
    await setDoc(doc(db, "regulations", body.regulation.id), body.regulation);
  } else if (body.action === "delete") {
    const batch = writeBatch(db);
    batch.delete(doc(db, "submissions", body.submissionId));
    batch.delete(doc(db, "privateSubmissions", body.submissionId));
    await batch.commit();
  } else if (body.action === "release") {
    // Clears the device lock without touching their saved answers, so the
    // group can resume from any device and firebaseSaveSubmission's
    // ownership check treats the submission as unclaimed.
    const batch = writeBatch(db);
    batch.update(doc(db, "submissions", body.submissionId), { ownerUid: "" });
    batch.update(doc(db, "privateSubmissions", body.submissionId), { ownerUid: "" });
    await batch.commit();
  } else if (body.action === "reset") {
    const publicSnaps = await getDocs(query(collection(db, "submissions"), where("sessionId", "==", session.id)));
    const privateSnaps = await getDocs(query(collection(db, "privateSubmissions"), where("sessionId", "==", session.id)));
    const refs = [...publicSnaps.docs, ...privateSnaps.docs];
    for (let start = 0; start < refs.length; start += 450) {
      const batch = writeBatch(db);
      refs.slice(start, start + 450).forEach((item) => batch.delete(item.ref));
      await batch.commit();
    }
  }
}

export async function firebaseDeleteRegulation(id: string) {
  const { db } = getServices();
  await deleteDoc(doc(db, "regulations", id));
}
