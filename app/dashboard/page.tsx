import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardApp } from "./DashboardApp";

export const metadata: Metadata = { title: "Class dashboard" };

export default function Dashboard() {
  return <Suspense fallback={<main><div className="app-shell"><div className="loading-state">Preparing the class results…</div></div></main>}><DashboardApp /></Suspense>;
}
