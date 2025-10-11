# Config Module Structure

The `config/constants.js` file has been refactored into a modular structure for better organization and maintainability.

## Module Breakdown

### storage.js
**Purpose**: Local storage configuration and keys
- `LOCAL_STORAGE_PREFIX` - Prefix for all local storage keys
- `storageKey()` - Function to generate storage keys
- `STORAGE_KEYS` - Object containing all storage key definitions

### theme.js
**Purpose**: Theme colors and CSS variable management (JavaScript as source of truth)
- `initializeTheme()` - Function to inject colors into CSS variables (called on game load)
- `updateThemeColor()` - Function to dynamically update a specific color
- `THEME_COLORS` - Direct color access from JavaScript values
- `CSS_VAR` - CSS variable references for DOM styling

### world.js
**Purpose**: World, player, and enemy configuration
- `WORLD` - Game world settings (spawn, combat, AI, chunking)
- `VILLAGE_POS` - Village position vector
- `REST_RADIUS` - Rest area radius
- `HERO_MODEL_URL` - Hero model URL (currently null)

### scaling.js
**Purpose**: Progression and balancing
- `SCALING` - XP growth, hero/enemy stat scaling per level

### stats.js
**Purpose**: Base hero statistics
- `STATS_BASE` - Initial hero HP, MP, regen, and XP requirements

### fx.js
**Purpose**: Visual effects timing and configuration
- `FX` - Global VFX timing controls (timeScale, fade, spin, etc.)

### index.js
**Purpose**: Central re-export point
- Re-exports all constants from all modules
- Provides a single import point for convenience

## Usage

### Theme Initialization
The theme system uses JavaScript as the source of truth. On game load, call `initializeTheme()` to populate CSS variables:

```javascript
import { initializeTheme, THEME_READY } from "../config/theme.js";

// Initialize theme (injects JS colors into CSS variables)
initializeTheme();
await THEME_READY;

// Optionally override specific colors
initializeTheme({
  themeOrange: "#ff0000",  // Custom fire color
  themeDark: "#000000"
});
```

### Dynamic Theme Updates
You can update colors at runtime:

```javascript
import { updateThemeColor } from "../config/theme.js";

// Change theme color dynamically (updates both JS and CSS)
updateThemeColor('themeOrange', '#ff0000');
```

### Option 1: Import from specific modules (recommended for new code)
```javascript
import { STORAGE_KEYS } from "../config/storage.js";
import { THEME_COLORS, CSS_VAR, initializeTheme } from "../config/theme.js";
import { WORLD } from "../config/world.js";
```

### Option 2: Import from index.js (convenient for multiple imports)
```javascript
import { STORAGE_KEYS, THEME_COLORS, WORLD, SCALING } from "../config/index.js";
```

### Option 3: Import from constants.js (backward compatibility)
```javascript
import { STORAGE_KEYS, THEME_COLORS, WORLD } from "../config/index.js";
```

## Backward Compatibility

The original `config/constants.js` file now re-exports all constants from the new modules, ensuring existing code continues to work without modifications. However, for new code, it's recommended to import from the specific modules or from `index.js`.

## Benefits

1. **Better Organization**: Related constants are grouped together
2. **Easier Maintenance**: Smaller, focused files are easier to understand and modify
3. **Improved Tree-shaking**: Bundlers can better optimize unused code
4. **Clear Dependencies**: Each module explicitly imports what it needs
5. **Backward Compatible**: Existing imports continue to work
6. **JavaScript-Driven Theming**: Colors defined in JS can be easily modified programmatically
7. **Single Source of Truth**: All theme colors defined in one place (THEME_COLORS)
8. **Dynamic Theming**: Update colors at runtime with `updateThemeColor()`
9. **Centralized VFX Colors**: Effects color palette for consistent visual styling

## Known Limitations

### Hardcoded Colors in Effects
There are **300+ hardcoded color values** in the effects system (primarily in `src/effects/*.js` files). These are currently direct hex values (e.g., `0xff6347`, `#ffd700`) embedded in effect implementations.

**Future Improvement**: Refactor individual effect files to use `EFFECTS_COLORS` palette instead of hardcoded values. The `config/effects-colors.js` module provides a centralized palette ready for this migration.

## Theme System Details

### How It Works

1. **Definition**: All colors are defined in `THEME_COLORS` object in `config/theme.js`
2. **Initialization**: On game load, `initializeTheme()` injects these colors into CSS variables
3. **Access**: 
   - Use `THEME_COLORS` object for direct JavaScript access
   - Use `CSS_VAR` for CSS variable references in DOM styling
   - Use `THEME_COLORS` for Canvas2D contexts
4. **Updates**: Call `updateThemeColor(key, value)` to change colors at runtime

### Migration from CSS to JS

Previously, colors were defined in `css/base.css` and read by JavaScript. Now:
- Colors are defined in JavaScript (`THEME_COLORS`)
- `initializeTheme()` populates CSS variables from JavaScript
- This allows dynamic theme changes controlled entirely by JavaScript
- CSS can still reference these colors via `var(--color-name)`
