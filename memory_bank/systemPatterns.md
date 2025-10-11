# System Patterns

## Purpose
Document the **high-level architecture**, **key technical decisions**, and **recurring design patterns** in the repository. This file helps AI agents and engineers quickly understand:
- How components relate and communicate
- Where to make changes for specific features
- What patterns to follow when extending the codebase
- Why certain architectural decisions were made

**Read this before making architectural changes or adding new systems.**

> 📖 **For detailed module-level documentation**, see:
> - [docs/technical/](docs/technical/) — Deep-dive technical docs for each module (17 files)
> - [docs/requirements/](docs/requirements/) — Detailed requirements for each module (16 files)
> - Start with [docs/technical/index.md](docs/technical/index.md) for navigation

---

## Architecture Overview

### Technology Stack
- **Language**: Vanilla JavaScript (ES2020+), ES Modules
- **Markup**: HTML5
- **Styling**: CSS3 (modular files in `css/`)
- **3D Engine**: Three.js v0.160.0 (bundled locally in `vendor/`)
- **Runtime**: Browser (desktop + mobile)
- **Build**: None — static files, runs by opening `index.html`

### Core Principles
1. **No Build Step**: Pure ES modules, no webpack/vite/rollup
2. **Modular Architecture**: Each system in its own file with clear responsibilities
3. **Data-Driven**: Skills, maps, enemies defined as data, not hardcoded
4. **Minimal Dependencies**: Only Three.js, everything else is vanilla JS
5. **Mobile-First**: Optimize for mobile, enhance for desktop

---

## System Architecture

### High-Level Component Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                         index.html                          │
│                    (Entry Point + UI Shell)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                        src/main.js                          │
│                  (Orchestrator / Game Loop)                 │
└─┬───────┬───────┬───────┬───────┬───────┬───────┬───────┬──┘
  │       │       │       │       │       │       │       │
  ↓       ↓       ↓       ↓       ↓       ↓       ↓       ↓
┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐
│World│ │Ent│   │Skill│ │UI │   │Input│ │Map│   │Audio│ │VFX│
└───┘   └───┘   └───┘   └───┘   └───┘   └───┘   └───┘   └───┘
  │       │       │       │       │       │       │       │
  ↓       ↓       ↓       ↓       ↓       ↓       ↓       ↓
3D Scene Player  Pool   HUD    Touch   Villages Sound  Effects
Camera  Enemy   Loadout Hero   Keyboard Portals Music  Indicators
Render  AI      Casting Settings Raycast Maps    SFX   Transients
```

### Module Responsibilities

#### Core Systems (`src/`)
- **main.js**: Orchestrator, game loop, system initialization
- **world.js**: 3D scene, camera, rendering, lights, ground
- **entities.js**: Player and Enemy classes, entity management
- **skills.js**: Skill system, casting, cooldowns, effects
- **effects.js**: Visual effects manager, transient effects, indicators

#### Data & Configuration (`src/`)
- **skills_pool.js**: Skill definitions (SKILL_POOL array)
- **constants.js**: Game constants (THEME_COLORS, WORLD, STATS_BASE, SKILLS)
- **config.js**: Runtime flags (DEBUG, HERO_MODEL_URL)
- **maps.js**: Map manager, base maps, endless generation

#### UI Systems (`src/ui/`)
- **hud.js**: HUD, minimap, player bars, center messages
- **hero/index.js**: Hero screen orchestrator
- **hero/tabs/skills.js**: Skills tab (loadout management)
- **hero/tabs/book.js**: Skillbook tab (skill browsing)
- **hero/tabs/maps.js**: Maps tab (map selection)
- **hero/tabs/info.js**: Info tab (player stats)
- **hero/tabs/marks.js**: Marks tab (user flags)
- **settings/index.js**: Settings screen orchestrator
- **settings/tabs/general.js**: General settings (language, quality)
- **settings/tabs/environment.js**: Environment settings (density, rain)
- **settings/tabs/info.js**: Info tab (version, credits)
- **guide.js**: Tutorial guide overlay
- **skillbar.js**: Skill bar rendering and icon helpers

#### Input & Controls (`src/`)
- **input_service.js**: Keyboard/mouse input service
- **touch.js**: Touch controls (joystick, radial skills)
- **raycast.js**: Raycasting for ground targeting and enemy selection

#### World Features (`src/`)
- **villages.js**: Village generation, portals, fences, roads
- **portals.js**: Portal system (recall, travel, countdown)
- **environment.js**: Environment generation (trees, rocks, etc.)
- **meshes.js**: Geometry factories (player, enemy, portal, house, etc.)

#### Progression & Persistence (`src/`)
- **uplift.js**: Uplift system (permanent upgrades)
- **loadout.js**: Loadout persistence (Q/W/E/R assignments)
- **skill_upgrades.js**: Skill upgrade system

#### Utilities (`src/`)
- **i18n.js**: Translation system (`t()` helper)
- **audio.js**: Audio system (SFX, music)
- **utils.js**: Pure helper functions (math, distance, lerp, etc.)

---

## Design Patterns

### 1. Data-Driven Content

**Pattern**: Define content as data structures, render with generic systems

**Example**: Skills
```javascript
// src/skills_pool.js
export const SKILL_POOL = [
  {
    id: "flame_chain",
    name: "Flame Chain",
    type: "chain",
    cd: 5,
    mana: 22,
    // ... more properties
  },
  // ... more skills
];

// src/ui/hero/tabs/book.js
SKILL_POOL.forEach(skill => {
  // Render skill card from data
  const card = createSkillCard(skill);
  container.appendChild(card);
});
```

**Benefits**:
- Easy to add new content without code changes
- Content can be loaded from JSON files
- Easier to balance and tune
- Supports localization

**Where Used**:
- Skills: `SKILL_POOL` in `skills_pool.js`
- Maps: `BASE_MAPS` in `maps.js`
- Constants: `THEME_COLORS`, `WORLD`, `STATS_BASE` in `constants.js`

### 2. Localization via Translation Keys

**Pattern**: All UI text uses `t('key')` instead of hardcoded strings

**Example**:
```javascript
// ❌ Bad: Hardcoded string
button.textContent = "Start Game";

// ✅ Good: Translation key
import { t } from './i18n.js';
button.textContent = t('ui.start_game');
```

**Benefits**:
- Easy to add new languages
- Runtime language switching
- Centralized translation management
- No code changes for translations

**Where Used**:
- All UI modules (`src/ui/**/*.js`)
- Skill names/descriptions (via `t('skills.names.flame_chain')`)
- Map names/descriptions (via `t('maps.map1.name')`)

### 3. Module Exports & Imports

**Pattern**: Each module exports specific functions/classes, imports what it needs

**Example**:
```javascript
// src/entities.js
export class Player extends Entity { /* ... */ }
export class Enemy extends Entity { /* ... */ }
export function getNearestEnemy(pos, enemies) { /* ... */ }

// src/main.js
import { Player, Enemy, getNearestEnemy } from './entities.js';
```

**Benefits**:
- Clear dependencies
- Tree-shakeable (if using bundler)
- Easy to understand module boundaries
- No global namespace pollution

**Convention**:
- Export only public API
- Keep internal helpers private
- Use named exports (not default)

### 4. Event-Driven Communication

**Pattern**: Modules communicate via DOM events or callbacks

**Example**:
```javascript
// Dispatch event when loadout changes
window.dispatchEvent(new Event('loadout-changed'));

// Listen for event in another module
window.addEventListener('loadout-changed', () => {
  updateSkillBar();
});
```

**Benefits**:
- Loose coupling between modules
- Easy to add new listeners
- No circular dependencies
- Testable in isolation

**Where Used**:
- Loadout changes: `'loadout-changed'` event
- Language changes: `'language-changed'` event
- Settings changes: `'settings-changed'` event

### 5. Manager Pattern

**Pattern**: Centralized manager for related functionality

**Example**:
```javascript
// src/effects.js
export class EffectsManager {
  constructor(scene) {
    this.scene = scene;
    this.transients = [];
  }
  
  addBeam(from, to, color) { /* ... */ }
  addExplosion(pos, radius, color) { /* ... */ }
  update(dt) { /* ... */ }
}

// src/main.js
const effects = new EffectsManager(scene);
```

**Benefits**:
- Centralized state management
- Easy to update all related entities
- Clear ownership of resources
- Lifecycle management (create/update/destroy)

**Where Used**:
- `EffectsManager`: Visual effects
- `UIManager`: HUD and UI elements
- `SkillsSystem`: Skill casting and cooldowns
- `createMapManager()`: Map management
- `createVillagesSystem()`: Village generation

### 6. Factory Functions

**Pattern**: Functions that create and return configured objects

**Example**:
```javascript
// src/meshes.js
export function createEnemyMesh(size, color) {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}
```

**Benefits**:
- Encapsulate creation logic
- Consistent object creation
- Easy to test
- No need for classes when not needed

**Where Used**:
- `createGoTMesh()`: Player mesh
- `createEnemyMesh()`: Enemy mesh
- `createPortalMesh()`: Portal mesh
- `createHouse()`: House mesh
- `createRaycast()`: Raycaster setup

### 7. Pure Helper Functions

**Pattern**: Stateless functions that take inputs and return outputs

**Example**:
```javascript
// src/utils.js
export function distance2D(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
```

**Benefits**:
- Easy to test
- No side effects
- Reusable across modules
- Predictable behavior

**Where Used**:
- `src/utils.js`: Math helpers, distance, direction, clamping
- `src/i18n.js`: Translation helpers

### 8. Defensive DOM Manipulation

**Pattern**: Wrap DOM operations in try/catch to handle missing elements

**Example**:
```javascript
try {
  const element = document.getElementById('skill-bar');
  if (element) {
    element.textContent = t('ui.skills');
  }
} catch (e) {
  console.warn('Failed to update skill bar:', e);
}
```

**Benefits**:
- Graceful degradation
- Doesn't crash on missing elements
- Easier to debug
- Works in partial rendering scenarios

**Where Used**:
- All UI modules (`src/ui/**/*.js`)
- HUD updates
- Settings screen

### 9. localStorage Persistence

**Pattern**: Centralized load/save functions with versioned keys

**Example**:
```javascript
// src/loadout.js
const STORAGE_KEY = 'gof_loadout_v1';

export function saveLoadout(loadout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadout));
  } catch (e) {
    console.warn('Failed to save loadout:', e);
  }
}

export function loadLoadout() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('Failed to load loadout:', e);
    return null;
  }
}
```

**Benefits**:
- Centralized persistence logic
- Versioned keys (easy to migrate)
- Error handling
- Fallback to defaults

**Where Used**:
- Loadout: `gof_loadout_v1`
- Uplift choices: `upliftChoices_v1`
- Language: `gof_language`
- Settings: `gof_settings_v1`

### 10. Mobile Optimization Pattern

**Pattern**: Detect mobile, apply aggressive optimizations

**Example**:
```javascript
// src/main.js
const isMobile = (() => {
  const hasTouchScreen = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSmallScreen = window.innerWidth <= 1024;
  return hasTouchScreen && (mobileUA || isSmallScreen);
})();

const MOBILE_OPTIMIZATIONS = {
  maxPixelRatio: 1.5,
  enemyCountMultiplier: 0.3,
  disableShadows: true,
  // ... more optimizations
};

if (isMobile) {
  // Apply optimizations
  renderer.setPixelRatio(Math.min(currentRatio, MOBILE_OPTIMIZATIONS.maxPixelRatio));
  renderer.shadowMap.enabled = false;
}
```

**Benefits**:
- 60fps on mid-range mobile devices
- Graceful degradation
- Configurable optimizations
- Easy to tune per device

**Where Used**:
- `src/main.js`: Mobile detection and optimization config
- Enemy spawning: Reduced count on mobile
- VFX: Culling distance on mobile
- UI updates: Throttled on mobile

---

## Key Technical Decisions

### Decision 1: No Build Step
**Why**: Simplicity, fast iteration, no toolchain complexity  
**Trade-off**: No tree-shaking, no minification (but PWA caching helps)  
**Impact**: Easy to run locally, easy to debug, easy to deploy

### Decision 2: ES Modules (Not Bundled)
**Why**: Native browser support, no build step needed  
**Trade-off**: More HTTP requests (but HTTP/2 helps)  
**Impact**: Clean imports, clear dependencies, easy to understand

### Decision 3: Three.js Bundled Locally
**Why**: Offline support, version control, no CDN dependency  
**Trade-off**: Larger repo size (~2MB)  
**Impact**: Better PWA offline support, controlled versioning

### Decision 4: Vietnamese as Default Language
**Why**: Primary target audience is Vietnamese players  
**Trade-off**: English speakers need to switch language  
**Impact**: Better first impression for target audience

### Decision 5: Dynamic Enemy Spawning (Not Fixed)
**Why**: Keep combat intense, enemies always around player  
**Trade-off**: More complex spawn logic, harder to balance  
**Impact**: Better engagement, "hunter" gameplay feel

### Decision 6: Data-Driven Skills
**Why**: Easy to add/modify skills without code changes  
**Trade-off**: More complex skill system, harder to debug  
**Impact**: Faster content iteration, easier to balance

### Decision 7: PWA + TWA for Google Play
**Why**: Single codebase, instant updates, no native app complexity  
**Trade-off**: Limited native features, web performance constraints  
**Impact**: Faster development, easier deployment, cross-platform

### Decision 8: localStorage (Not Server)
**Why**: No backend needed, instant persistence, offline support  
**Trade-off**: No cross-device sync, limited storage  
**Impact**: Simpler architecture, faster development, no server costs

### Decision 9: Modular UI (Not Framework)
**Why**: No framework overhead, full control, easy to understand  
**Trade-off**: More manual DOM manipulation, no reactivity  
**Impact**: Smaller bundle, faster load, easier to debug

### Decision 10: Mobile-First Optimization
**Why**: Primary platform is mobile, 60fps is critical  
**Trade-off**: More complex optimization logic, harder to test  
**Impact**: Better mobile performance, wider device support

---

## Extension Patterns

### Adding a New Skill
1. Add skill definition to `SKILL_POOL` in `src/skills_pool.js`
2. Add translation keys to `src/locales/en.json` and `vi.json`
3. Implement casting logic in `src/skills.js` (if new skill type)
4. Add visual effects in `src/effects.js` (if new effect type)
5. Test in Hero → Skillbook tab

### Adding a New Map
1. Add map definition to `BASE_MAPS` in `src/maps.js`
2. Add translation keys to `src/locales/en.json` and `vi.json`
3. Configure enemy palette and strength scaling
4. Test in Hero → Maps tab

### Adding a New UI Screen
1. Create new file in `src/ui/` (e.g., `inventory.js`)
2. Export `renderInventoryScreen()` function
3. Add HTML elements to `index.html`
4. Add CSS to `css/inventory.css`
5. Add translation keys to locale files
6. Wire up in `src/main.js` or relevant module

### Adding a New Enemy Type
1. Extend `Enemy` class in `src/entities.js`
2. Add factory function in `src/meshes.js`
3. Configure AI behavior (aggro, attack, wander)
4. Add to spawn logic in `src/main.js`
5. Test in-game

### Adding a New Persistent Setting
1. Add getter/setter in relevant module (e.g., `src/config.js`)
2. Use versioned localStorage key (e.g., `gof_setting_v1`)
3. Add UI in Settings screen
4. Add translation keys
5. Test save/load and default fallback

---

## Testing & Validation Patterns

### Smoke Testing
1. Open `index.html` in browser
2. Check console for errors
3. Test basic gameplay (move, attack, cast skills)
4. Switch language (Settings → General → Language)
5. Test on mobile device (touch controls)

### Locale Validation
```bash
# Find all t() usages
grep -r "t(\"" src/ --include="*.js"
grep -r "t(''" src/ --include="*.js"

# Check if keys exist in locale files
grep "\"key_name\"" src/locales/en.json
grep "\"key_name\"" src/locales/vi.json
```

### Performance Testing
1. Open DevTools → Performance tab
2. Record 10 seconds of gameplay
3. Check FPS (target: 60fps)
4. Check frame time (target: < 16ms)
5. Check draw calls (target: < 100)
6. Check memory usage (target: < 200MB)

### Mobile Testing
1. Test on real device (not just emulator)
2. Check touch controls (joystick, radial skills)
3. Check performance (FPS, frame drops)
4. Check UI scaling (readable text, tappable buttons)
5. Check offline support (disable network, reload)

---

## Common Pitfalls & Solutions

### Pitfall 1: Missing Translation Keys
**Problem**: UI shows `undefined` or key string instead of translated text  
**Solution**: Always add keys to both `en.json` and `vi.json`  
**Prevention**: Search for `t()` usages before committing

### Pitfall 2: Circular Dependencies
**Problem**: Module A imports B, B imports A → error  
**Solution**: Extract shared code to third module, use events for communication  
**Prevention**: Keep module dependencies unidirectional

### Pitfall 3: Memory Leaks (Three.js)
**Problem**: Geometries/materials not disposed → memory grows  
**Solution**: Call `.dispose()` on geometries/materials when removing objects  
**Prevention**: Use `EffectsManager` for transient objects

### Pitfall 4: Mobile Performance
**Problem**: Game runs at 30fps on mobile  
**Solution**: Apply `MOBILE_OPTIMIZATIONS`, reduce enemy count, disable shadows  
**Prevention**: Test on real mobile devices early

### Pitfall 5: localStorage Quota Exceeded
**Problem**: localStorage full, can't save  
**Solution**: Use versioned keys, clean up old data, compress JSON  
**Prevention**: Keep saved data minimal, use efficient serialization

---

## Notes for AI Agents

### When Making Changes
1. **Preserve Patterns**: Follow existing patterns (data-driven, localization, etc.)
2. **Minimal Edits**: Make smallest change that achieves goal
3. **Test Locally**: Verify changes work before committing
4. **Update Docs**: Update memory bank if architecture changes
5. **Check Locale**: Ensure translation keys exist for new UI text

### When Adding Features
1. **Check Existing**: Look for similar features to follow patterns
2. **Data-Driven**: Prefer data definitions over hardcoded logic
3. **Localize**: Use `t()` for all user-facing text
4. **Mobile-First**: Consider mobile performance and touch controls
5. **Document**: Update memory bank with new patterns/decisions

### When Debugging
1. **Console First**: Check browser console for errors
2. **Locale Keys**: Verify translation keys exist
3. **Mobile Test**: Test on real device if mobile-related
4. **Performance**: Check FPS and frame time if performance issue
5. **Memory**: Check for Three.js memory leaks if memory grows

---

## Related Documents

- **Project Brief**: `projectbrief.md` — Project overview and goals
- **Product Context**: `productContext.md` — Product vision and user flows
- **Tech Context**: `techContext.md` — Technologies and setup
- **Progress**: `progress.md` — Implementation status
- **Active Context**: `activeContext.md` — Current work focus
- **Technical Docs**: `docs/technical/` — Detailed module documentation
- **Requirements**: `docs/requirements/` — Feature requirements