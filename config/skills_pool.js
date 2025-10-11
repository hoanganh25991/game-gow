/**
 * God of Water Skill Pool — simplified core definitions
 *
 * Notes:
 * - Visual FX have moved to src/skills_fx.js (per-id mapping).
 * - Descriptions/behaviors have moved to src/skills_docs.js (per-id mapping).
 * - This file now contains only the runtime parameters used by logic and UI stats.
 */
export const SKILLS_POOL = [
  {
    id: "flame_chain",
    name: "Frost Chain",
    short: "Chain",
    icon: "❄️",
    type: "chain",
    cd: 5,
    mana: 22,
    range: 45,
    jumps: 5,
    jumpRange: 24,
    dmg: 24,
    slowFactor: 0.25,
    slowDuration: 0.9
  },
  {
    id: "inferno_blast",
    name: "Tsunami Blast",
    short: "Blast",
    icon: "🌊",
    type: "aoe",
    cd: 8,
    mana: 34,
    radius: 16,
    dmg: 35,
    slowFactor: 0.45,
    slowDuration: 1.5
  },
  {
    id: "burning_aura",
    name: "Freezing Aura",
    short: "Freeze",
    icon: "❄️",
    type: "aura",
    cd: 15,
    mana: 0,
    radius: 14,
    tick: 0.7,
    dmg: 8,
    duration: 10,
    manaPerTick: 2
  },
  {
    id: "meteor_storm",
    name: "Ice Storm",
    short: "Storm",
    icon: "🌨️",
    type: "storm",
    cd: 22,
    mana: 55,
    radius: 30,
    strikes: 22,
    dmg: 20,
    duration: 7
  },
  {
    id: "fire_bolt",
    name: "Ice Bolt",
    short: "Bolt+",
    icon: "💧",
    type: "beam",
    cd: 2.5,
    mana: 14,
    range: 36,
    dmg: 22
  },
  {
    id: "flame_nova",
    name: "Frost Nova",
    short: "Nova",
    icon: "❄️",
    type: "nova",
    cd: 12,
    mana: 26,
    radius: 14,
    dmg: 30
  },
  {
    id: "blazing_aura",
    name: "Glacial Aura",
    short: "Glacial",
    icon: "❄️",
    type: "aura",
    cd: 18,
    mana: 0,
    radius: 12,
    tick: 0.5,
    dmg: 6,
    duration: 9,
    manaPerTick: 2.5
  },
  {
    id: "scorching_field",
    name: "Frozen Field",
    short: "Frozen",
    icon: "❄️",
    type: "aura",
    cd: 14,
    mana: 0,
    radius: 13,
    tick: 0.6,
    dmg: 7,
    duration: 8,
    manaPerTick: 2
  },
  {
    id: "inferno_overload",
    name: "Deluge Overload",
    short: "Deluge",
    icon: "🌊",
    type: "aura",
    cd: 16,
    mana: 0,
    radius: 15,
    tick: 0.55,
    dmg: 9,
    duration: 9,
    manaPerTick: 3
  },
  {
    id: "fireball",
    name: "Waterball",
    short: "Ball",
    icon: "💧",
    type: "beam",
    cd: 2.2,
    mana: 16,
    range: 48,
    dmg: 20
  },
  {
    id: "flame_spear",
    name: "Ice Spear",
    short: "Spear",
    icon: "🔱",
    type: "beam",
    cd: 3.2,
    mana: 18,
    range: 52,
    dmg: 28
  },
  {
    id: "heatwave",
    name: "Tidal Wave",
    short: "Tidal",
    icon: "🌊",
    type: "beam",
    cd: 2.8,
    mana: 15,
    range: 40,
    dmg: 24
  },
  {
    id: "volcanic_wrath",
    name: "Oceanic Wrath",
    short: "Wrath",
    icon: "🌊",
    type: "storm",
    cd: 18,
    mana: 42,
    radius: 24,
    strikes: 14,
    dmg: 18,
    duration: 5.5
  },
  {
    id: "fire_dome",
    name: "Water Dome",
    short: "Dome",
    icon: "💧",
    type: "storm",
    cd: 24,
    mana: 60,
    radius: 32,
    strikes: 28,
    dmg: 18,
    duration: 8
  },
  {
    id: "lava_storm",
    name: "Hail Storm",
    short: "Hail",
    icon: "🌨️",
    type: "storm",
    cd: 20,
    mana: 50,
    radius: 28,
    strikes: 20,
    dmg: 19,
    duration: 6.5
  },
  {
    id: "flame_ring",
    name: "Frost Ring",
    short: "Ring",
    icon: "❄️",
    type: "aoe",
    cd: 10,
    mana: 32,
    radius: 18,
    dmg: 32,
    slowFactor: 0.4,
    slowDuration: 1.2
  },
  {
    id: "ember_burst",
    name: "Droplet Burst",
    short: "Droplet",
    icon: "💧",
    type: "aoe",
    cd: 7,
    mana: 28,
    radius: 15,
    dmg: 28
  },
  {
    id: "pyroclasm",
    name: "Cataclysm",
    short: "Cata",
    icon: "🌊",
    type: "aoe",
    cd: 11,
    mana: 36,
    radius: 20,
    dmg: 38,
    slowFactor: 0.5,
    slowDuration: 1.8
  }
];

/**
 * Basic Attack definition (not a skill, but shares icon/name structure)
 */
export const BASIC_ATTACK = Object.freeze({
  id: "basic_attack",
  name: "Basic Attack",
  short: "Basic",
  icon: "💧",
  type: "basic"
});

/**
 * Default starting loadout (4 skill IDs)
 */
export const DEFAULT_LOADOUT = Object.freeze(
  SKILLS_POOL.slice(0, 4).map((skill) => skill.id)
);
