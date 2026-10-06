/**
 * 3D icons (Microsoft Fluent Emoji 3D, MIT licence) bundled in /public/icons/3d.
 * Category / service data comes from the API with an emoji or nothing, so we resolve
 * the right picture from the emoji first and then from keywords in the name or slug.
 */
export type Icon3DName =
  | "ant" | "broom" | "bug" | "droplet" | "gift" | "house" | "house-garden" | "light-bulb" | "massage"
  | "paintbrush" | "palette" | "party" | "plug" | "scissors" | "shower" | "snowflake" | "soap"
  | "sparkles" | "toolbox" | "tools" | "wrench";

const EMOJI_TO_ICON: Record<string, Icon3DName> = {
  "🧹": "broom", "🧽": "soap", "🧼": "soap", "🔧": "wrench", "🛠": "tools", "💆": "massage", "💇": "scissors",
  "✂": "scissors", "💡": "light-bulb", "🔌": "plug", "⚡": "light-bulb", "🎨": "palette", "🖌": "paintbrush",
  "🐜": "ant", "🐛": "bug", "🪲": "bug", "🦟": "bug", "❄": "snowflake", "💧": "droplet", "🚿": "shower",
  "🚰": "droplet", "🧰": "toolbox", "🏠": "house", "🏡": "house-garden", "🎁": "gift", "✨": "sparkles", "🎉": "party",
};

// Order matters: the first match wins.
const KEYWORDS: [RegExp, Icon3DName][] = [
  [/\b(ac|air.?condition|refrigerat|fridge|cooling)\b/, "snowflake"],
  [/(pest|termite|cockroach|rodent|bug)/, "bug"],
  [/(spa|massage|facial|salon|beauty)/, "massage"],
  [/(hair|haircut|barber|scissor)/, "scissors"],
  [/(plumb|tap|leak|water|pipe|ro\b|purifier|drain)/, "droplet"],
  [/(electric|wiring|switch|socket|fan)/, "plug"],
  [/(light|bulb|lamp)/, "light-bulb"],
  [/(sofa|carpet|shampoo|laundry|wash)/, "soap"],
  [/(bath|shower|toilet)/, "shower"],
  [/(paint|waterproof|wall)/, "paintbrush"],
  [/(clean|maid|sweep|mop)/, "broom"],
  [/(repair|appliance|service|fix|maintenance)/, "wrench"],
];

const normalise = (s: string) => s.replace(/[\uFE0F\u200D]/g, "").trim();

/** Pass any hints (emoji, name, slug, category) — the first one that resolves wins. */
export function resolveIcon3D(...hints: (string | null | undefined)[]): Icon3DName {
  for (const hint of hints) {
    if (!hint) continue;
    const key = normalise(hint);
    if (EMOJI_TO_ICON[key]) return EMOJI_TO_ICON[key];
  }
  for (const hint of hints) {
    if (!hint) continue;
    const text = hint.toLowerCase();
    for (const [pattern, name] of KEYWORDS) if (pattern.test(text)) return name;
  }
  return "sparkles";
}

/** Soft background tints that rotate across cards (brand indigo / brand orange first). */
export const ICON_TINTS = [
  "bg-brand-soft",
  "bg-accent-soft",
  "bg-[#E4F4EC]",
  "bg-[#FFF3C9]",
  "bg-[#FDE7F0]",
  "bg-[#E3F0FC]",
] as const;

export const tintAt = (index: number) => ICON_TINTS[index % ICON_TINTS.length];
