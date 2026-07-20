import type { EvidenceBar, Regulation, Source } from "./types";

const source = (label: string, url: string): Source => ({ label, url });
const bar = (label: string, value: number, max: number, display: string): EvidenceBar => ({ label, value, max, display });

// The 10 original draft rules are grouped into 4 themes ("clusters"). Each group
// makes ONE set of judgments per theme, so the activity fits a ~35-minute slot.
// Each theme keeps a one-line summary (`text`), 2–3 short `provisions`, and one
// combined evidence block. `id`/`number` drive storage and ordering.
export const defaultRegulations: Regulation[] = [
  {
    id: "theme-human-control",
    number: 1,
    title: "Human Control of Force",
    text: "Keep a human in charge of any decision to kill, and prove that military AI is safe before it is ever used.",
    provisions: [
      "A named human officer must confirm the target is military, weigh the risk to civilians, and approve any attack that could kill. A weapon may fire on its own only to stop incoming missiles or rockets, inside a set area and time where no civilians are present.",
      "Before a high-risk military AI system is bought or used, it must pass an independent legal review and be tested against at least 1,000 realistic situations — such as jammed sensors, enemies surrendering, and hospitals — with the results published and re-checked every 24 months.",
    ],
    evidenceFor: "These turn the vague phrase ‘human control’ into things you can actually check: a named officer, a bounded target, and published, repeatable tests.",
    evidenceChallenge: "Missiles can arrive faster than a person can react, and governments may keep test results secret because the systems are classified.",
    evidenceDataPoint: "A 2021 UN report found that a Kargu-2 attack drone may have struck fighters in Libya in 2020 with no human command — widely described as possibly the first killing chosen by a machine. In 2023, 152 countries backed the first UN resolution on autonomous weapons; only 4 opposed.",
    evidenceBars: [bar("For UN action", 152, 167, "152 states"), bar("Abstained", 11, 167, "11"), bar("Against", 4, 167, "4")],
    sources: [
      source("UN — Background on autonomous weapons (UNODA)", "https://disarmament.unoda.org/the-convention-on-certain-conventional-weapons/background-on-laws-in-the-ccw/"),
      source("UN Digital Library — 2023 autonomous-weapons vote (A/RES/78/241)", "https://digitallibrary.un.org/record/4033027"),
    ],
  },
  {
    id: "theme-accountability",
    number: 2,
    title: "Identity, Accountability & Transparency",
    text: "Don't let AI decide who a person is, or harm them, without human checks, lasting records, and public oversight.",
    provisions: [
      "No one may be arrested, attacked, or blocked from moving based only on an automatic biometric match of their face, walk, or voice. A trained person must confirm identity from at least two other sources, and error rates for different groups must be published before use.",
      "High-risk systems must keep secure, unchangeable records for 10 years. Suspected civilian harm must be made public within 30 days and independently investigated within 90 days, with a human appeal and compensation for unlawful harm.",
      "Each country must publish a yearly public register of its high-risk security AI — purpose, legal basis, error rates, and incidents — and an independent body must audit each system at least every 24 months.",
    ],
    evidenceFor: "A second human check stops a probable match from becoming a life-or-death decision, and public records and audits let others compare official claims with what actually happens.",
    evidenceChallenge: "Extra checks slow urgent work, honest error data may not exist for the real setting, and detailed disclosure can reveal a system's weaknesses to opponents.",
    evidenceDataPoint: "A US government lab (NIST) tested 189 face-recognition systems and found false matches were 10 to more than 100 times more common for some groups — for example Asian, Black, and Native American faces — than for others. Such errors have already led to people being wrongfully arrested.",
    evidenceBars: [bar("Smaller error gap", 10, 100, "10×"), bar("Larger error gap", 100, 100, ">100×")],
    sources: [
      source("NIST — Demographic differences in face recognition (2019)", "https://www.nist.gov/news-events/news/2019/12/nist-study-evaluates-effects-race-age-sex-face-recognition-software"),
    ],
  },
  {
    id: "theme-crisis-protection",
    number: 3,
    title: "Protecting People in Crisis",
    text: "Stop crisis and aid technology from being turned against the vulnerable people it is meant to help.",
    provisions: [
      "Data collected to give humanitarian, medical, migration, or disaster aid must never be reused to target, arrest, deport, or spy on people. It must be encrypted, any data breach reported within 72 hours, and identifying records deleted once the aid has ended.",
      "People seeking asylum, food, shelter, health care, or cash aid must always have an option that needs no fingerprints, iris scans, or smartphone, and any automated refusal must get a human review within 7 days.",
      "No automated system may cut off a household's water, food support, or essential energy on its own. Service must continue during a free, offline appeal whenever life or health is at risk.",
    ],
    evidenceFor: "Using data only for its original purpose, keeping a human in the loop, and reporting breaches fast protect people who cannot realistically refuse to hand over data when they need help to survive.",
    evidenceChallenge: "Emergencies may need fast data-sharing, offline back-up processes cost more, and keeping services on during appeals can strain already scarce supplies.",
    evidenceDataPoint: "A 2022 cyberattack on a Red Cross server exposed the personal data of more than 515,000 highly vulnerable people. By the end of 2023, 117.3 million people had been forced from their homes worldwide.",
    evidenceBars: [bar("People exposed in one 2022 breach", 515000, 600000, ">515,000"), bar("Forcibly displaced worldwide", 117300000, 130000000, "117.3 million")],
    sources: [
      source("ICRC — Cyberattack: what we know (2022)", "https://www.icrc.org/en/document/cyber-attack-icrc-what-we-know"),
      source("UNHCR — Global Trends: forced displacement", "https://www.unhcr.org/global-trends"),
    ],
  },
  {
    id: "theme-oversight",
    number: 4,
    title: "The Most Dangerous Weapons & Global Oversight",
    text: "Put the worst-case weapons under a hard ban and a shared international early-warning system.",
    provisions: [
      "Countries must ban using AI to design, improve, obtain, or aim chemical weapons. Dual-use facilities must report such work and allow inspections under the existing Chemical Weapons Convention.",
      "Countries must tell a shared international monitoring body at least 60 days before fielding a new type of high-risk autonomous weapon, and within 72 hours of any serious civilian-harm incident. The body can investigate and recommend a temporary pause.",
    ],
    evidenceFor: "Attaching AI rules to a treaty that already works gives ready-made inspections and national authorities, and advance notice plus an emergency pause creates real chances to prevent harm before it spreads.",
    evidenceChallenge: "Ordinary chemistry and medicine use similar AI tools, so inspectors must separate banned work from peaceful work, and countries may reject outside review on security or sovereignty grounds.",
    evidenceDataPoint: "Chemical weapons remain a real danger: international investigators confirmed sarin and chlorine attacks in Syria in the 2010s, with the 2013 Ghouta sarin attack alone killing several hundred to about 1,400 people. The watchdog treaty (OPCW) now has 193 members and in 2023 confirmed that all declared stockpiles had been destroyed.",
    evidenceBars: [bar("Member states", 193, 195, "193 states"), bar("Declared stockpiles destroyed", 100, 100, "100% (2023)")],
    sources: [
      source("OPCW — All declared chemical weapons destroyed (2023)", "https://www.opcw.org/media-centre/news/2023/07/opcw-marks-destruction-all-declared-chemical-weapons-stockpiles"),
      source("OPCW — The OPCW and Syria", "https://www.opcw.org/media-centre/featured-topics/opcw-and-syria"),
    ],
  },
];
