# Technical Context

## Purpose
Document the **technologies**, **frameworks**, **development setup**, and **technical constraints** used by the project. This file helps AI agents and engineers:
- Reproduce the development environment
- Understand technical stack and dependencies
- Know how to run, test, and deploy the project
- Understand technical constraints and limitations

**Read this before setting up development environment or making technical decisions.**

> 📖 **For detailed module-level technical documentation**, see:
> - [docs/technical/](docs/technical/) — Implementation details for each module (17 files)
> - [docs/requirements/](docs/requirements/) — Functional specifications for each module (16 files)
> - Start with [docs/technical/index.md](docs/technical/index.md) for navigation

---

## Technology Stack

### Core Technologies
| Technology     | Version | Purpose                 | Location           |
| -------------- | ------- | ----------------------- | ------------------ |
| JavaScript     | ES2020+ | Application logic       | `src/**/*.js`      |
| HTML5          | -       | Markup and UI shell     | `index.html`       |
| CSS3           | -       | Styling and layout      | `css/**/*.css`     |
| Three.js       | 0.160.0 | 3D rendering engine     | `vendor/three/`    |
| Service Worker | -       | PWA offline support     | `serviceworker.js` |
| Web Audio API  | -       | Sound effects and music | `src/audio.js`     |

### Browser APIs Used
- **ES Modules**: Native module system (import/export)
- **localStorage**: Persistent storage for player data
- **Canvas/WebGL**: 3D rendering via Three.js
- **Web Audio API**: Procedural sound generation
- **Service Worker API**: PWA caching and offline support
- **Touch Events**: Mobile touch controls
- **Pointer Events**: Unified mouse/touch handling
- **Fullscreen API**: Fullscreen mode support
- **Web Payment API**: (Future) In-app purchases

### No Build Tools
- **No Bundler**: No webpack, vite, rollup, parcel
- **No Transpiler**: No Babel, TypeScript
- **No Preprocessor**: No Sass, Less, PostCSS
- **No Task Runner**: No Gulp, Grunt
- **No Package Manager**: No npm, yarn, pnpm (for runtime)

**Why**: Simplicity, fast iteration, easy debugging, no toolchain complexity

---

## Repository Structure

```
game-gof/
├── index.html              # Entry point, UI shell
├── manifest.json           # PWA manifest
├── serviceworker.js        # Service worker for offline support
├── lock-zoom.js            # Mobile zoom prevention
├── favicon.ico             # Favicon
├── icon.png                # PWA icon
├── LICENSE                 # License file
├── README.md               # Project readme
├── todo.md                 # Task list
│
├── src/                    # Application source code
│   ├── main.js             # Entry point, orchestrator, game loop
│   ├── config.js           # Runtime flags (DEBUG, HERO_MODEL_URL)
│   ├── constants.js        # Game constants (THEME_COLORS, WORLD, STATS_BASE)
│   ├── utils.js            # Pure helper functions
│   │
│   ├── world.js            # 3D scene, camera, rendering
│   ├── entities.js         # Player and Enemy classes
│   ├── skills.js           # Skill system, casting, cooldowns
│   ├── skills_pool.js      # Skill definitions (SKILL_POOL)
│   ├── effects.js          # Visual effects manager
│   ├── meshes.js           # Geometry factories
│   │
│   ├── input_service.js    # Keyboard/mouse input
│   ├── touch.js            # Touch controls (joystick, radial)
│   ├── raycast.js          # Raycasting for targeting
│   │
│   ├── maps.js             # Map manager, endless generation
│   ├── villages.js         # Village generation
│   ├── portals.js          # Portal system (recall, travel)
│   ├── environment.js      # Environment generation
│   │
│   ├── uplift.js           # Uplift system (permanent upgrades)
│   ├── loadout.js          # Loadout persistence
│   ├── skill_upgrades.js   # Skill upgrade system
│   │
│   ├── i18n.js             # Translation system
│   ├── audio.js            # Audio system
│   ├── splash.js           # Splash screen
│   ├── payments.js         # (Future) Payment integration
│   │
│   ├── locales/            # Translation files
│   │   ├── en.json         # English translations (canonical)
│   │   └── vi.json         # Vietnamese translations
│   │
│   └── ui/                 # UI modules
│       ├── hud.js          # HUD, minimap, player bars
│       ├── skillbar.js     # Skill bar rendering
│       ├── guide.js        # Tutorial guide overlay
│       ├── deskop-controls.js  # Desktop control hints
│       │
│       ├── hero/           # Hero screen
│       │   ├── index.js    # Hero screen orchestrator
│       │   ├── preview.js  # Hero preview (3D model)
│       │   └── tabs/       # Hero screen tabs
│       │       ├── skills.js   # Skills tab (loadout)
│       │       ├── book.js     # Skillbook tab
│       │       ├── maps.js     # Maps tab
│       │       ├── info.js     # Info tab
│       │       └── marks.js    # Marks tab
│       │
│       ├── settings/       # Settings screen
│       │   ├── index.js    # Settings orchestrator
│       │   └── tabs/       # Settings tabs
│       │       ├── general.js      # General settings
│       │       ├── environment.js  # Environment settings
│       │       └── info.js         # Info tab
│       │
│       └── hudparts/       # HUD components
│           ├── minimap.js      # Minimap rendering
│           └── player_bars.js  # HP/MP/XP bars
│
├── css/                    # Stylesheets
│   ├── style.css           # Main stylesheet
│   ├── base.css            # Base styles, reset
│   ├── hud.css             # HUD styles
│   ├── hero.css            # Hero screen styles
│   ├── skills.css          # Skill UI styles
│   ├── panels.css          # Panel/modal styles
│   ├── guide.css           # Guide overlay styles
│   ├── splash.css          # Splash screen styles
│   ├── uplift.css          # Uplift popup styles
│   ├── mobile.css          # Mobile-specific styles
│   ├── landscape.css       # Landscape orientation styles
│   ├── preview.css         # Preview/3D viewer styles
│   └── bottom-middle.css   # Bottom-center UI styles
│
├── audio/                  # Audio assets
│   └── earth-space-music-313081.mp3    # Background music
│
├── vendor/                 # Third-party dependencies
│   └── three/              # Three.js (bundled locally)
│       ├── build/
│       │   └── three.module.js
│       └── examples/
│           └── jsm/
│               ├── loaders/
│               │   └── GLTFLoader.js
│               └── utils/
│                   └── BufferGeometryUtils.js
│
├── memory_bank/            # Project documentation
│   ├── projectbrief.md     # Project overview
│   ├── productContext.md   # Product vision
│   ├── systemPatterns.md   # Architecture patterns
│   ├── techContext.md      # This file
│   ├── progress.md         # Implementation status
│   ├── activeContext.md    # Current work focus
│   ├── requirements.md     # Requirements overview
│   ├── snippet.md          # Code snippets
│   │
│   └── docs/               # Detailed documentation
│       ├── technical/      # Technical docs
│       │   ├── index.md
│       │   ├── modules-and-structure.md
│       │   ├── world.md
│       │   ├── entities.md
│       │   ├── combat-and-skills.md
│       │   ├── ai.md
│       │   ├── ui-and-minimap.md
│       │   ├── ui-screens.md
│       │   ├── input-and-raycast.md
│       │   ├── camera-and-movement.md
│       │   ├── portals-and-respawn.md
│       │   ├── vfx-and-indicators.md
│       │   ├── update-loop.md
│       │   ├── audio.md
│       │   ├── leveling.md
│       │   ├── utils-and-config.md
│       │   └── debug.md
│       │
│       └── requirements/   # Requirements docs
│           ├── index.md
│           ├── world.md
│           ├── entities.md
│           ├── combat-and-skills.md
│           ├── ai.md
│           ├── ui-and-minimap.md
│           ├── settings.md
│           ├── guide.md
│           ├── input-and-raycast.md
│           ├── camera-and-movement.md
│           ├── portals-and-respawn.md
│           ├── vfx-and-indicators.md
│           ├── update-loop.md
│           ├── controls.md
│           ├── non-functional.md
│           ├── acceptance.md
│           └── smoke-tests.md
│
├── scripts/                # Build/deployment scripts
│
└── .zencoder/              # Zencoder configuration
    └── rules/
        ├── repo.md         # Repository info
        ├── engine.md       # Engine rules
        └── memory-bank.md  # Memory bank rules
```

---

## Development Setup

### Prerequisites
- **Web Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Static File Server**: Python, Node.js, or any HTTP server
- **Text Editor**: VSCode, Sublime, Vim, or any editor
- **Git**: For version control

### Quick Start

#### Option 1: Python (Recommended)
```bash
# Navigate to project directory
cd /path/to/game-gof

# Start Python HTTP server
python3 -m http.server 8000

# Open browser
open http://localhost:8000
```

#### Option 2: Node.js
```bash
# Navigate to project directory
cd /path/to/game-gof

# Install http-server globally (one-time)
npm install -g http-server

# Start server
http-server -p 8000

# Open browser
open http://localhost:8000
```

#### Option 3: npx (No Install)
```bash
# Navigate to project directory
cd /path/to/game-gof

# Start server with npx
npx http-server -p 8000

# Open browser
open http://localhost:8000
```

#### Option 4: VSCode Live Server
1. Install "Live Server" extension in VSCode
2. Right-click `index.html`
3. Select "Open with Live Server"

### Debug Mode
Add `?debug` to URL to enable debug features:
```
http://localhost:8000?debug
```

**Debug Features**:
- FPS counter
- Performance metrics (frame time, draw calls, triangles)
- Console logging for game events
- Visual debug helpers

### Custom Hero Model
Add `?model=URL` to load custom hero model:
```
http://localhost:8000?model=https://example.com/model.glb
```

---

## Browser Compatibility

### Supported Browsers
| Browser          | Version | Desktop | Mobile | Notes              |
| ---------------- | ------- | ------- | ------ | ------------------ |
| Chrome           | 90+     | ✅       | ✅      | Best performance   |
| Firefox          | 88+     | ✅       | ✅      | Good performance   |
| Safari           | 14+     | ✅       | ✅      | iOS primary target |
| Edge             | 90+     | ✅       | ✅      | Chromium-based     |
| Samsung Internet | 14+     | ❌       | ✅      | Mobile only        |

### Required Features
- **ES Modules**: Native import/export support
- **WebGL 2.0**: For Three.js rendering
- **Web Audio API**: For sound effects
- **localStorage**: For persistence
- **Service Workers**: For PWA support
- **Touch Events**: For mobile controls

### Known Issues
- **Safari iOS < 14**: ES module issues
- **Firefox Android**: Slightly lower performance
- **Chrome iOS**: Uses Safari engine, same limitations

---

## Localization (i18n)

### System Overview
- **Implementation**: `src/i18n.js` with `t()` helper function
- **Locale Files**: `src/locales/en.json` and `vi.json`
- **Default Language**: Vietnamese (`vi`)
- **Runtime Switching**: Yes, via Settings → General → Language

### Translation Key Structure
```
{
  "ui": {
    "start_game": "Start Game",
    "settings": "Settings"
  },
  "skills": {
    "names": {
      "flame_chain": "Flame Chain"
    },
    "shorts": {
      "flame_chain": "Chain"
    },
    "descriptions": {
      "flame_chain": "Ignite an enemy and spread flames..."
    }
  },
  "maps": {
    "map1": {
      "name": "Scorched Plains",
      "description": "A barren wasteland..."
    }
  }
}
```

### Adding New Translations
1. Add key to `src/locales/en.json` (canonical)
2. Add translation to `src/locales/vi.json`
3. Use `t('key.path')` in code
4. Test language switching

### Finding Missing Keys
```bash
# Search for all t() usages
grep -r "t(\"" src/ --include="*.js"
grep -r "t(''" src/ --include="*.js"

# Check if key exists
grep "\"key_name\"" src/locales/en.json
```

---

## Persistence (localStorage)

### Storage Keys
| Key                 | Purpose                 | Format | Version |
| ------------------- | ----------------------- | ------ | ------- |
| `gof_loadout_v1`    | Skill loadout (Q/W/E/R) | JSON   | v1      |
| `upliftChoices_v1`  | Uplift choices          | JSON   | v1      |
| `gof_language`      | Language preference     | String | -       |
| `gof_settings_v1`   | Game settings           | JSON   | v1      |
| `gof_level`         | Player level            | Number | -       |
| `gof_xp`            | Player XP               | Number | -       |
| `gof_unlocked_maps` | Unlocked maps           | JSON   | -       |
| `gof_marks`         | User-placed flags       | JSON   | -       |

### Storage Patterns
```javascript
// Save
function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to save ${key}:`, e);
  }
}

// Load
function loadData(key, defaultValue) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.warn(`Failed to load ${key}:`, e);
    return defaultValue;
  }
}
```

### Storage Limits
- **Quota**: ~5-10MB per origin (browser-dependent)
- **Strategy**: Keep data minimal, use efficient JSON
- **Cleanup**: Remove old versioned keys when migrating

---

## Performance Optimization

### Mobile Detection
```javascript
const isMobile = (() => {
  const hasTouchScreen = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSmallScreen = window.innerWidth <= 1024;
  return hasTouchScreen && (mobileUA || isSmallScreen);
})();
```

### Mobile Optimizations
```javascript
const MOBILE_OPTIMIZATIONS = {
  maxPixelRatio: 1.5,           // Cap pixel ratio
  enemyCountMultiplier: 0.3,    // 30% of desktop enemies
  vfxDistanceCull: 60,          // Cull VFX beyond 60 units
  hudUpdateMs: 300,             // Update HUD every 300ms
  minimapUpdateMs: 400,         // Update minimap every 400ms
  aiStrideMultiplier: 3,        // AI updates every 3rd frame
  frameBudgetMs: 6.0,           // 6ms frame budget (60fps)
  envDensityReduction: 0.4,     // 40% of desktop environment
  disableShadows: true,         // Disable shadows
  reduceDrawCalls: true,        // Merge geometries
  cullDistance: 100,            // Freeze enemies beyond 100 units
  skipSlowUpdates: true,        // Skip slow debuff indicators
  simplifyMaterials: true,      // Use simpler materials
  disableRain: true,            // Disable rain particles
};
```

### Quality Presets
- **Low**: Minimal effects, low resolution, high performance
- **Medium**: Balanced effects and performance
- **High**: Full effects, high resolution, best visuals

### Performance Targets
- **Desktop**: 60fps @ 1080p
- **Mobile**: 60fps @ 720p (with optimizations)
- **Frame Time**: < 16ms (60fps) or < 33ms (30fps)
- **Draw Calls**: < 100 per frame
- **Memory**: < 200MB

---

## PWA Configuration

### Manifest (`manifest.json`)
```json
{
  "name": "GoW RPG - God of Fire",
  "short_name": "GoW RPG",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a1a",
  "theme_color": "#ff4500",
  "icons": [
    {
      "src": "icon.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker (`serviceworker.js`)
- **Caching Strategy**: Cache-first for static assets
- **Offline Support**: Core game works offline after first load
- **Update Strategy**: Check for updates on page load

### Installation
- **Desktop**: Chrome/Edge show install prompt
- **Mobile**: iOS Safari "Add to Home Screen", Android Chrome install prompt
- **Google Play**: Published as TWA (Trusted Web Activity)

---

## Testing

### Manual Testing
1. **Desktop**: Test on Chrome, Firefox, Safari
2. **Mobile**: Test on iOS Safari, Android Chrome
3. **Touch**: Test virtual joystick and radial skills
4. **Localization**: Switch language, verify translations
5. **Offline**: Disable network, reload, verify game works
6. **Performance**: Check FPS, frame time, draw calls

### Smoke Test Checklist
- [ ] Game loads without errors
- [ ] Player can move (keyboard/mouse/touch)
- [ ] Player can attack (A key or touch center)
- [ ] Skills cast correctly (Q/W/E/R)
- [ ] Enemies spawn and attack
- [ ] HUD shows HP/MP/XP/Level
- [ ] Minimap shows player and enemies
- [ ] Language switching works
- [ ] Settings save and load
- [ ] Offline mode works (after first load)

### Performance Testing
```javascript
// Enable debug mode
// Open: http://localhost:8000?debug

// Check console for:
// - FPS (target: 60)
// - Frame time (target: < 16ms)
// - Draw calls (target: < 100)
// - Triangles (target: < 100k)
```

### Locale Testing
```bash
# Find all t() usages
grep -r "t(\"" src/ --include="*.js" | wc -l

# Check for missing keys
# Compare t() usages with keys in en.json and vi.json
```

---

## Deployment

### Static Hosting
**Supported Platforms**:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- AWS S3 + CloudFront
- Any static file server

**Steps**:
1. Push code to repository
2. Configure hosting platform
3. Deploy (usually automatic on push)
4. Verify PWA works (manifest, service worker)

### Google Play (TWA)
**Requirements**:
- PWA with valid manifest
- HTTPS hosting
- Service worker
- TWA wrapper app

**Steps**:
1. Create TWA wrapper app (Android Studio)
2. Configure `assetlinks.json` for domain verification
3. Build APK/AAB
4. Upload to Google Play Console
5. Publish

### CDN Optimization
- **Gzip**: Enable gzip compression on server
- **Caching**: Set cache headers for static assets
- **HTTP/2**: Use HTTP/2 for multiplexing
- **Preload**: Preload critical resources (Three.js)

---

## Debugging

### Console Logging
```javascript
// Enable debug mode
// URL: http://localhost:8000?debug

// Check DEBUG flag
import { DEBUG } from './config.js';
if (DEBUG) {
  console.log('Debug info:', data);
}
```

### Common Issues

#### Issue: Game doesn't load
**Cause**: ES module import error  
**Solution**: Check browser console, verify file paths, use HTTP server (not file://)

#### Issue: Skills don't cast
**Cause**: Missing translation keys  
**Solution**: Check locale files, add missing keys

#### Issue: Low FPS on mobile
**Cause**: Too many enemies, shadows enabled  
**Solution**: Apply MOBILE_OPTIMIZATIONS, reduce enemy count

#### Issue: localStorage quota exceeded
**Cause**: Too much data saved  
**Solution**: Clean up old data, use efficient JSON

#### Issue: Service worker not updating
**Cause**: Cached old version  
**Solution**: Unregister service worker, hard refresh (Ctrl+Shift+R)

---

## Development Workflow

### Typical Workflow
1. **Edit Code**: Make changes in `src/` or `css/`
2. **Refresh Browser**: Hard refresh (Ctrl+Shift+R) to see changes
3. **Check Console**: Verify no errors
4. **Test Feature**: Manually test changed functionality
5. **Test Localization**: Switch language, verify translations
6. **Test Mobile**: Test on real device (if mobile-related)
7. **Commit**: Commit changes with descriptive message

### Code Style
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Use semicolons
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: JSDoc for public functions, inline for complex logic

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-skill

# Make changes
# ... edit files ...

# Commit changes
git add .
git commit -m "Add new skill: Fireball"

# Push to remote
git push origin feature/new-skill

# Create pull request (if using GitHub)
```

---

## Technical Constraints

### Browser Limitations
- **localStorage**: ~5-10MB quota
- **WebGL**: Limited on low-end devices
- **Audio**: iOS requires user interaction to play
- **Fullscreen**: iOS doesn't support fullscreen API
- **Service Worker**: Requires HTTPS (except localhost)

### Performance Constraints
- **Mobile**: 60fps target requires aggressive optimizations
- **Draw Calls**: Keep < 100 per frame
- **Triangles**: Keep < 100k per frame
- **Memory**: Keep < 200MB total

### Platform Constraints
- **iOS**: No fullscreen, audio requires user interaction
- **Android**: Varied performance across devices
- **Desktop**: Generally no constraints

---

## Future Technical Improvements

### Short-Term
- [ ] Add JSDoc comments to all public functions
- [ ] Implement automated locale validation
- [ ] Add performance profiling tools
- [ ] Improve error handling and logging

### Medium-Term
- [ ] Add unit tests (Jest or Vitest)
- [ ] Add E2E tests (Playwright or Cypress)
- [ ] Implement CI/CD pipeline
- [ ] Add code linting (ESLint)

### Long-Term
- [ ] Consider optional build step for production (minification)
- [ ] Implement server-side persistence (optional)
- [ ] Add analytics and telemetry
- [ ] Implement A/B testing framework

---

## Related Documents

- **Project Brief**: `projectbrief.md` — Project overview and goals
- **Product Context**: `productContext.md` — Product vision and user flows
- **System Patterns**: `systemPatterns.md` — Architecture and patterns
- **Progress**: `progress.md` — Implementation status
- **Active Context**: `activeContext.md` — Current work focus
- **Technical Docs**: `docs/technical/` — Detailed module documentation
- **Requirements**: `docs/requirements/` — Feature requirements