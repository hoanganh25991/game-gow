/**
 * Map Configuration
 * - Defines all map-related constants and data
 * - Endless mode settings, map emojis, and map definitions
 */
import { THEME_COLORS } from "./theme.js";

// Endless tuning beyond the defined Acts
export const ENDLESS = {
  hpGrowthPerDepth: 1.18,
  dmgGrowthPerDepth: 1.16,
  speedGrowthPerDepth: 1.03,
  countGrowthPerDepth: 1.04,
};

// Deterministic icon set for maps (emoji). Order matters for stable mapping.
export const MAP_EMOJIS = [
  "🌩️","🌾","⛰️","🏰","⚒️","🌪️","🗺️","🔥","🌊","❄️",
  "🌿","🌀","⚡","☄️","🌋","🏜️","🏞️","🛡️","🧭","🔮",
  "🌫️","⛏️","🌧️","🌥️","🌠"
];

// Definitions: tune per-map enemy tint and multipliers
export const MAPS = [
  {
    index: 1,
    name: "Act I — Fields of Awakening",
    requiredLevel: 1,
    enemyTint: THEME_COLORS.mapAct1,
    enemyHpMul: 1.0,
    enemyDmgMul: 1.0,
    enemySpeedMul: 1.0,
    enemyCountMul: 1.0,
    desc: "A scorched grove outside the origin village. Fallen scouts and burning beasts swarm the ashen woods.",
    strongEnemies: ["Ravagers (fast melee)", "Embercasters (ranged fire)"],
    imgHint: "Square art: dark forest clearing under a smoke-filled sky; faint ruins; red-tinted foes.",
  },
  {
    index: 2,
    name: "Act II — Volcanic Plains",
    requiredLevel: 5,
    enemyTint: THEME_COLORS.mapAct2,
    enemyHpMul: 1.35,
    enemyDmgMul: 1.2,
    enemySpeedMul: 1.02,
    enemyCountMul: 1.1,
    desc: "Open grasslands where flames never die. Raiding packs and fire-touched archers roam freely.",
    strongEnemies: ["Flame Hounds (pack hunters)", "Ballistarii (armored archers)"],
    imgHint: "Square art: windswept plains with distant volcanic peaks; orange-tinted foes.",
  },
  {
    index: 3,
    name: "Act III — Inferno Peaks",
    requiredLevel: 10,
    enemyTint: THEME_COLORS.mapAct3,
    enemyHpMul: 1.8,
    enemyDmgMul: 1.45,
    enemySpeedMul: 1.05,
    enemyCountMul: 1.25,
    desc: "Knife-edged ridgelines where the heat rises like a beast. Altitude and fire converge to test your mettle.",
    strongEnemies: ["Harpy Matrons (dive assaults)", "Fire Shamans (support casters)"],
    imgHint: "Square art: volcanic mountain ridge with lava flows; golden-tinted foes, smoke-filled sky.",
  },
  {
    index: 4,
    name: "Act IV — Sky Citadel",
    requiredLevel: 20,
    enemyTint: THEME_COLORS.mapAct4,
    enemyHpMul: 2.4,
    enemyDmgMul: 1.8,
    enemySpeedMul: 1.08,
    enemyCountMul: 1.45,
    desc: "A floating bastion crackling with bound sigils. Only the resolute can breach its shining walls.",
    strongEnemies: ["Sentinel Constructs (shielded)", "Zealous Templars (coordinated strikes)"],
    imgHint: "Square art: floating fortress with crackling runes; teal-tinted foes.",
  },
  {
    index: 5,
    name: "Act V — The Godforge",
    requiredLevel: 35,
    enemyTint: THEME_COLORS.mapAct5,
    enemyHpMul: 3.2,
    enemyDmgMul: 2.3,
    enemySpeedMul: 1.12,
    enemyCountMul: 1.7,
    desc: "An eldritch foundry where power is hammered into being. Sparks of divinity burn those who trespass.",
    strongEnemies: ["Forge Colossus (heavy slam)", "Aether Smiths (channeling blasts)"],
    imgHint: "Square art: colossal heavenly forge, molten channels, pale-blue aura; azure-tinted foes.",
  },
];
