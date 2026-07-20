import Link from "next/link";
import { SiteHeader } from "./components/SiteHeader";

export default function Home(){
  const briefing=[
    ["1","Human Control of Force","Human approval · testing before use"],
    ["2","Identity & Accountability","No face-scan-only targeting · public audits"],
    ["3","Protecting People in Crisis","Data firewall · human review of aid"],
    ["4","Dangerous Weapons & Oversight","Chemical-weapons ban · emergency pause"],
  ];
  return <main><div className="landing-shell"><SiteHeader/><section className="hero"><div className="hero-copy"><p className="eyebrow">Graduate Peace Studies · Collaborative simulation</p><h1>Build the strongest framework the world could actually accept.</h1><p className="hero-lede">An international working group has drafted 10 measurable rules on emerging technology and peace, grouped into four themes. Your group will test their protection value, evidence, and political feasibility.</p><p className="hero-note">The goal is not a perfect agreement. It is to identify the strongest framework that many countries could realistically accept.</p><div className="hero-actions"><Link className="button primary large" href="/summit">Enter the Summit <span aria-hidden="true">→</span></Link><Link className="text-link" href="/dashboard">View class dashboard</Link></div></div><div className="brief-card" aria-label="Summit briefing"><p className="card-kicker">Summit briefing · 4 themes</p><h2>Evidence before agreement</h2>{briefing.map(item=><div className="brief-rule" key={item[0]}><span>{item[0]}</span><p><strong>{item[1]}</strong><br/>{item[2]}</p></div>)}<p className="brief-footer">One group. Four judgments per theme. One minimum framework.</p></div></section><section className="landing-strip" aria-label="Activity steps"><div><span>1</span><p><strong>Read</strong> a measurable rule and its evidence chart.</p></div><div><span>2</span><p><strong>Decide</strong> what matters and what is feasible.</p></div><div><span>3</span><p><strong>Negotiate</strong> a class minimum framework.</p></div></section></div></main>
}