# Project Brief

## Project Identity
**Name**: GoW RPG — God of Fire  
**Former Name**: GoT — Thunder God (renamed during fire theme refactor)  
**Type**: Browser-based top-down action RPG  
**Platform**: Progressive Web App (PWA) — Desktop & Mobile  
**Published**: Google Play Store (as TWA - Trusted Web Activity)

---

## High-Level Overview

GoW RPG is a lightweight, browser-based action RPG featuring:
- **Top-down 3D gameplay** powered by Three.js
- **Fire-themed hero** (God of Fire) with mass-clear abilities
- **Dynamic enemy spawning** that keeps 40-80 enemies around the player
- **DOTA/RTS-style controls** (click-to-move, skill hotkeys)
- **Mobile-optimized** with touch controls (virtual joystick, radial skills)
- **Skill customization** via loadout system (Q/W/E/R slots)
- **Map progression** with level-based gating and endless generation
- **Localization** (English/Vietnamese) with runtime switching
- **PWA features** (offline support, installable)

The game emphasizes fast-paced combat, skill customization, and progression through increasingly difficult maps.

---

## Core Requirements & Goals

### Gameplay
1. **Responsive Combat**: Smooth controls on desktop (keyboard/mouse) and mobile (touch)
2. **Fire-Themed Skills**: Chain attacks, AOE explosions, burning auras, meteor storms
3. **Dynamic Enemies**: Enemies spawn around player, not fixed on map (hunter-style gameplay)
4. **Progression**: Level up, unlock maps, choose permanent upgrades (uplift system)
5. **Skill Customization**: Choose skills from pool, assign to Q/W/E/R slots

### Technical
1. **No Build Step**: Static files, runs by opening `index.html` or serving statically
2. **Modular Architecture**: ES modules, clean separation of concerns
3. **Minimal Dependencies**: Vanilla JS + Three.js (bundled locally in `vendor/`)
4. **Mobile Performance**: 60fps on mid-range devices (aggressive optimizations)
5. **Persistence**: localStorage for player state (level, loadout, unlocked maps, uplift choices)

### UX/UI
1. **Localization**: English and Vietnamese with runtime switching (default: Vietnamese)
2. **Comprehensive UI**: HUD, Hero screen (skills/maps/info), Settings, Guide overlay
3. **Touch-Friendly**: Virtual joystick, radial skill layout, hold-to-cast
4. **Accessibility**: Clear visual feedback, readable text, intuitive controls

### Deployment
1. **PWA**: Installable on mobile and desktop, offline support
2. **Google Play**: Published as TWA (Trusted Web Activity)
3. **Static Hosting**: Works with any static file server (no server-side logic)

---

## What Makes This Project Unique

1. **No Build Step**: Pure ES modules, no webpack/vite/rollup complexity
2. **Fire Theme**: Distinctive visual style with orange/red/gold palette
3. **Dynamic Spawning**: Enemies follow player, not fixed on map
4. **Mobile-First**: Aggressive optimizations for 60fps on mobile
5. **Localization**: Vietnamese as default (uncommon for indie games)
6. **Skill Pool System**: Data-driven skills with detailed behavior specs
7. **PWA on Google Play**: Published as TWA, not native app

---

## Target Audience

- **Primary**: Vietnamese mobile gamers who enjoy action RPGs
- **Secondary**: Desktop players looking for quick, accessible browser games
- **Tertiary**: Developers interested in PWA game development patterns

---

## Success Criteria

1. **Performance**: 60fps on mid-range mobile devices (iPhone 11, Samsung A52)
2. **Engagement**: Average session length > 10 minutes
3. **Retention**: 30% day-1 retention, 10% day-7 retention
4. **Localization**: 100% of UI text translated (EN/VI)
5. **Stability**: < 1% crash rate on supported devices

---

## Why This Brief Exists

This file provides a **quick orientation** for:
- **AI agents** (like Zencoder) to understand project goals before reading code
- **New developers** joining the project
- **Stakeholders** reviewing project scope and direction
- **Future maintainers** understanding original intent

**Read this first** before diving into code or making architectural decisions.

---

## Related Documents

- **Product Context**: `productContext.md` — Why this project exists, problems solved
- **System Patterns**: `systemPatterns.md` — Architecture and design patterns
- **Tech Context**: `techContext.md` — Technologies, setup, development workflow
- **Progress**: `progress.md` — What works, what's left, known issues
- **Active Context**: `activeContext.md` — Current work focus, recent changes
