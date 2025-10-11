/**
 * Theme configuration - JavaScript as source of truth
 * Colors are defined here and injected into CSS variables on load
 */

// Define all color values in JavaScript (source of truth)
export const THEME_COLORS = {
  // Primary theme palette (WATER THEME - aqua/blue)
  themeDark: "#0a1a24",         // deep dark blue
  themeOrange: "#00bfff",       // repurposed as primary water (legacy var name)
  themeLightOrange: "#4dd0e1",  // mid aqua (legacy var name)
  themeWhite: "#e0ffff",        // ice white
  themeAccent: "#87ceeb",       // sky blue accent
  themeYellow: "#b0e0e6",       // frost accent

  // Backwards-compatible aliases
  white: "#e6f7ff",
  orange: "#00bfff",
  darkOrange: "#1681a7",
  lightOrange: "#4dd0e1",

  // Gameplay / UI tokens
  hp: "#6bb6ff",   // cool blue for HP (water theme style)
  mp: "#00ced1",   // dark turquoise for mana
  xp: "#87ceeb",   // sky blue for XP
  bg: "#07131a",
  enemy: "#0e3a4a",      // deep ocean blue
  enemyDark: "#051f2b",  // darker ocean depths

  // Glass / overlay tokens
  glass: "#07131AB3",         // rgba(7, 19, 26, 0.7)
  glassStrong: "#07131AD9",   // rgba(7, 19, 26, 0.85)
  accent: "#87ceeb",

  // System (settings / hero / flash) theme tokens
  systemBg: "linear-gradient(180deg, #081820F2, #061A1AF2)",  // rgba(8,24,32,0.95), rgba(6,18,26,0.95)
  systemBorder: "#4DD0E14D",  // rgba(77, 208, 225, 0.3)
  systemText: "#e6f7ff",
  systemAccent: "#87ceeb",

  // Common color values - for consistency
  borderOrange: "#4DD0E159",      // rgba(77, 208, 225, 0.35)
  borderOrangeLight: "#4DD0E14D", // rgba(77, 208, 225, 0.3)
  borderOrangeSubtle: "#4DD0E126", // rgba(77, 208, 225, 0.15)
  borderWhiteSubtle: "#FFFFFF1F",
  borderWhiteFaint: "#FFFFFF0F",

  // Background gradients
  bgRadialFire: "radial-gradient(1200px 1200px at 70% 30%, #0d2330 0%, #0a1a24 50%, #07131a 100%)",
  bgDarkFire: "#0A283799",       // rgba(10, 40, 55, 0.6)
  bgDarkerFire: "#0719237CC",    // rgba(7, 25, 35, 0.8)

  // Text colors
  textWarm: "#e6f7ff",
  textWarmLight: "#cfeeff",

  // Shadow values
  shadowMedium: "0 8px 30px #00000059",
  shadowStrong: "0 8px 30px #00000073",

  // Glow effects
  glowOrange: "#4DD0E199",       // rgba(77, 208, 225, 0.6)
  glowOrangeStrong: "#4DD0E1CC", // rgba(77, 208, 225, 0.8)

  // Canvas/HUD utility colors
  roadUnderlay: "#C8D8E226",     // light blue-grey underlay
  roadDark: "#1a2830E6",         // dark ocean road
  villageRing: "#5AFFDB99",      // aqua village ring
  villageRingFaint: "#5AFFDB59",
  portal: "#4D7CFFE6",           // bright water blue portal
  portalAlt: "#78B4FFE6",        // lighter water portal
  enemyDot: "#5080FFF2",         // blue enemy dot
  yellowGlowStrong: "#75D7FFF2", // cyan glow (repurposed yellow)
  playerDot: "#7ECCFFFF",

  // Structure minimap colors
  templeDot: "#00CED1F2",        // dark turquoise
  villaDot: "#1E90FFF2",         // dodger blue
  columnDot: "#E0F8F8F2",        // pale cyan
  statueDot: "#20B2AAF2",        // light sea green
  obeliskDot: "#5F9EA0F2",       // cadet blue

  // Skill/environment shared tokens (water themed)
  ember: "#00d4ff",      // water spark (was ember)
  lava: "#0080ff",       // deep water flow (was lava)
  village: "#47b3ff",    // water village glow
  ash: "#5a6b7a",        // misty grey (was ash)
  volcano: "#13576b",    // deep sea stone (was volcano)
  
  // Environment-specific colors (water themed)
  ambientDark: "#003d52",    // deep ocean ambient
  rock: "#2a4550",           // wet stone
  trunk: "#1a3a42",          // driftwood trunk
  stem: "#2a4a5a",           // kelp/seaweed stem
  darkFire: "#003d5a",       // dark water depths (was darkFire)
  tomato: "#ff6b7a",         // coral accent

  // Hero character colors (water god theme)
  heroSkin: "#dbeeff",           // pale ice skin
  heroSkinEmissive: "#105a7a",   // water glow skin
  heroBeard: "#e6f4ff",          // frost beard
  heroBeardEmissive: "#126b8a",  // water beard glow
  heroCrown: "#cfe8ff",          // ice crown
  heroBodyEmissive: "#0a5a7a",   // water body glow
  heroCloak: "#0a3f5a",          // deep blue cloak
  heroCloakEmissive: "#061525",  // dark water cloak glow
  heroShoulderEmissive: "#0a3e5a", // water shoulder glow
  heroBelt: "#9fd8ff",           // light aqua belt
  heroHair: "#13334a",           // dark ocean hair
  heroHairEmissive: "#091529",   // dark water hair glow
  heroHandLight: "#66b3ff",      // water hand light

  // Enemy colors (water creatures)
  enemyBodyEmissive: "#0a2a3a",  // dark water creature glow
  enemyEyeEmissive: "#005570",   // deep sea eye glow
  enemyEye: "#a0e0ff",           // bright aqua eye

  // UI bar colors
  hpBarBg: "#1a2a32",
  hpBarFill: "#6bb6ff",    // water blue HP
  overheadBarBg: "#0d1a22",

  // Structure colors (water architecture)
  portalBase: "#0e2e48",         // water portal base
  houseBase: "#155272",          // coral house base
  sandstone: "#dce8f4",          // pale limestone/coral
  villaBase: "#157292",          // ocean villa base
  villaPorchColumn: "#e8f4f8",   // pale water column

  // Tree foliage colors (water theme - kelp/seaweed)
  cypressFoliage: "#3c6a7f",     // kelp/seaweed dark
  oliveCanopy: "#4a7a8f",        // kelp/seaweed light

  // Map-specific enemy tints (adjusted for water theme)
  mapAct1: "#80b3ff",      // Act I - Coastal Awakening (light water blue)
  mapAct2: "#60c0ff",      // Act II - Ocean Plains (bright aqua)
  mapAct3: "#70d4ff",      // Act III - Deep Sea Peaks (cyan)
  mapAct4: "#a0ffd1",      // Act IV - Sky Citadel (cyan/teal) - kept similar
  mapAct5: "#9fd8ff",      // Act V - The Godforge (light azure blue) - kept similar
};

/**
 * Converts camelCase to kebab-case for CSS variable names
 */
function toKebabCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Injects theme colors into CSS custom properties
 * Call this on game load to populate CSS variables from JavaScript
 */
export function initializeTheme(customColors = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // Merge custom colors with defaults
  const colors = { ...THEME_COLORS, ...customColors };

  // Set each color as a CSS variable
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    const cssVarName = `--${toKebabCase(key)}`;
    root.style.setProperty(cssVarName, value);
  });

  // Dispatch event to signal theme is ready
  try {
    window.dispatchEvent(new Event("theme-initialized"));
  } catch (_) {}
}

/**
 * Update a specific theme color dynamically
 * @param {string} colorKey - The color key from THEME_COLORS (e.g., 'themeOrange')
 * @param {string} value - The new color value (e.g., '#ff0000')
 */
export function updateThemeColor(colorKey, value) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  
  const cssVarName = `--${toKebabCase(colorKey)}`;
  document.documentElement.style.setProperty(cssVarName, value);
  
  // Also update the THEME_COLORS object
  THEME_COLORS[colorKey] = value;
}

/**
 * CSS variable references for DOM styling (preferred for live theming)
 * Dynamically generated from THEME_COLORS keys
 * Example: themeDark -> "var(--theme-dark)"
 */
export const CSS_VAR = Object.keys(THEME_COLORS).reduce((acc, key) => {
  acc[key] = `var(--${toKebabCase(key)})`;
  return acc;
}, {});
