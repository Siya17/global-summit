// Plain-language definitions for terms that appear in the draft regulations.
// These power the floating tooltips students see while they read each rule.
// To add a term: add an entry below. `aliases` catches plural or related forms.
// The definition should be one short sentence a non-specialist can understand.

export type GlossaryEntry = { term: string; aliases?: string[]; definition: string };

export const glossary: GlossaryEntry[] = [
  {
    term: "high-risk",
    definition:
      "Used where a mistake could seriously harm people — for example weapons, policing, or border control.",
  },
  {
    term: "biometric",
    definition:
      "Automatic recognition of a person from body features such as the face, fingerprints, voice, or the way they walk.",
  },
  {
    term: "error rates",
    aliases: ["error rate"],
    definition:
      "How often a system gets it wrong — flagging the wrong person, or missing the right one.",
  },
  {
    term: "autonomous weapon",
    aliases: ["autonomous weapons"],
    definition:
      "A weapon that can select and attack targets on its own, without a human approving each strike.",
  },
  {
    term: "appeal",
    definition:
      "A formal request to have a decision reviewed, normally by a person rather than a machine.",
  },
  {
    term: "compensation",
    definition: "Payment or repair offered to make up for harm or loss that was caused.",
  },
  {
    term: "humanitarian",
    definition:
      "Aid meant to save lives and ease suffering in a crisis, such as food, shelter, and medical care.",
  },
  {
    term: "encrypted",
    aliases: ["encryption"],
    definition: "Scrambled so that only authorised people can read it, even if the data is stolen.",
  },
  {
    term: "data breach",
    aliases: ["breach", "breaches"],
    definition:
      "When protected data is stolen, leaked, or seen by people who should not have access to it.",
  },
  {
    term: "asylum",
    definition: "Protection a country gives to someone who has fled danger in their home country.",
  },
  {
    term: "iris scans",
    aliases: ["iris scan"],
    definition: "Identifying a person from the unique pattern of their eye.",
  },
  {
    term: "dual-use",
    definition:
      "Technology that can be used for peaceful purposes or for weapons — the same tools serve both.",
  },
  {
    term: "Chemical Weapons Convention",
    definition:
      "A treaty in force since 1997, joined by 193 countries, that bans chemical weapons and allows inspections.",
  },
  {
    term: "audited",
    aliases: ["audit", "audits"],
    definition: "An independent, in-depth check that a system works properly and follows the rules.",
  },
  {
    term: "public register",
    definition: "An official list that a government publishes for anyone to read.",
  },
  {
    term: "legal basis",
    definition: "The specific law that gives an authority the power to act.",
  },
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");

// All searchable forms (term + aliases), longest first so the most specific match wins.
const searchable = glossary
  .flatMap((entry) => [entry.term, ...(entry.aliases ?? [])].map((form) => ({ form, entry })))
  .sort((a, b) => b.form.length - a.form.length);

export const glossaryPattern = new RegExp(
  `(${searchable.map((item) => `\\b${escapeRegExp(item.form)}\\b`).join("|")})`,
  "gi",
);

export function lookupGlossary(matched: string): GlossaryEntry | undefined {
  const needle = matched.toLowerCase();
  return glossary.find(
    (entry) =>
      entry.term.toLowerCase() === needle ||
      entry.aliases?.some((alias) => alias.toLowerCase() === needle),
  );
}
