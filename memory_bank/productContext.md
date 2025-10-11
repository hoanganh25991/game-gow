# Product Context

## Purpose
This document explains **why** GoW RPG exists, **what problems** it solves, and **how** it should work from a product perspective. It provides context for product decisions and helps anyone (AI agents, developers, stakeholders) understand the problem space and user needs.

---

## Why This Project Exists

### Market Opportunity
1. **Browser Gaming Gap**: Most action RPGs require downloads/installs; few offer quality browser-based experiences
2. **Mobile-First**: Growing mobile gaming market in Southeast Asia (especially Vietnam)
3. **PWA Potential**: Progressive Web Apps enable app-like experiences without app store friction
4. **Quick Sessions**: Players want engaging games they can play in 5-15 minute sessions

### Player Needs
1. **Accessibility**: Play anywhere, anytime, no download required
2. **Instant Gratification**: Jump into action immediately, no long tutorials
3. **Progression**: Feel meaningful advancement (levels, skills, maps)
4. **Customization**: Choose playstyle through skill selection
5. **Localization**: Play in native language (Vietnamese primary audience)

### Technical Vision
1. **Simplicity**: Prove that quality games don't need complex build toolchains
2. **Performance**: Demonstrate PWA can achieve 60fps on mobile
3. **Modularity**: Show how to build maintainable game architecture with vanilla JS
4. **Open Web**: Leverage web standards (ES modules, WebGL, WebAudio, Service Workers)

---

## Problems Being Solved

### For Players
1. **Barrier to Entry**: No download, no install, no account required — just play
2. **Storage Constraints**: No device storage consumed (PWA caching is minimal)
3. **Language Barriers**: Fully localized Vietnamese experience (rare for indie games)
4. **Performance Issues**: Optimized for mid-range mobile devices (not just high-end)
5. **Engagement**: Dynamic enemy spawning keeps combat intense and engaging

### For Developers
1. **Build Complexity**: No webpack/vite/rollup — pure ES modules
2. **Dependency Hell**: Minimal dependencies (just Three.js, bundled locally)
3. **Maintainability**: Modular architecture makes systems easy to understand and modify
4. **Extensibility**: Data-driven skills/maps allow content addition without code refactors
5. **Localization**: i18n system makes adding languages straightforward

### For Business
1. **Distribution**: PWA + TWA enables Google Play distribution without native app
2. **Updates**: Instant updates via service worker (no app store approval delays)
3. **Cross-Platform**: Single codebase for desktop and mobile
4. **Analytics**: Web-based analytics easier than native app tracking
5. **Monetization**: Web Payment API integration for in-app purchases

---

## How The Product Should Work

### Core Gameplay Loop
```
Spawn in Village → Explore Map → Fight Enemies → Gain XP/Loot
     ↑                                                    ↓
     ←─────────── Level Up / Unlock Maps ←───────────────┘
```

### Player Journey

#### First Session (0-5 minutes)
1. **Splash Screen**: Quick loading, "Start" button
2. **Tutorial Guide**: Non-blocking overlay highlights controls
3. **First Combat**: Immediate enemy encounters, basic attack tutorial
4. **First Skill**: Use Q skill (Flame Chain), see visual effects
5. **First Level**: Gain XP, level up, see stat increases

#### Early Game (5-30 minutes)
1. **Skill Discovery**: Open Hero screen, browse Skillbook
2. **Loadout Customization**: Assign different skills to Q/W/E/R
3. **Map Progression**: Unlock MAP 2, see difficulty increase
4. **First Uplift**: Reach level 5, choose permanent upgrade
5. **Village System**: Discover new villages, use portals

#### Mid Game (30+ minutes)
1. **Build Optimization**: Experiment with skill combinations
2. **Map Mastery**: Progress through MAP 3, 4, 5...
3. **Uplift Strategy**: Plan upgrade path for long-term power
4. **Endless Maps**: Reach endless generation, test limits
5. **Settings Tuning**: Adjust quality/environment for performance

### Key User Flows

#### Combat Flow
```
See Enemy → Move to Range → Auto-Attack or Cast Skill → Enemy Dies → Gain XP
```

#### Skill Casting Flow
```
Press Q/W/E/R → Check Cooldown/Mana → Target (if needed) → Cast → Visual Effects → Damage Applied
```
- **Desktop**: Press key, click ground for AOE
- **Mobile**: Tap skill button, drag for AOE placement

#### Map Progression Flow
```
Level Up → Open Hero Screen → Maps Tab → See Unlocked Maps → Select Map → Confirm Travel → Load New Map
```

#### Skill Customization Flow
```
Open Hero Screen → Skills Tab → Browse Skill Pool → Select Skill → Choose Slot (Q/W/E/R) → Confirm → Loadout Updated
```

---

## Product Principles

### Design Principles
1. **Immediate Feedback**: Every action has clear visual/audio response
2. **Progressive Disclosure**: Introduce features gradually, not all at once
3. **Fail-Safe**: No punishing mechanics, death just respawns in village
4. **Clarity Over Complexity**: Simple, readable UI over fancy effects
5. **Mobile-First**: Design for touch, enhance for desktop (not vice versa)

### Content Principles
1. **Data-Driven**: Skills, maps, enemies defined in data, not hardcoded
2. **Localization-Ready**: All text uses translation keys, never hardcoded strings
3. **Extensible**: Adding content shouldn't require architecture changes
4. **Balanced**: Skills should feel powerful but not trivialize content
5. **Varied**: Maps should feel different (visuals, enemy types, difficulty)

### Technical Principles
1. **Performance First**: 60fps is non-negotiable on target devices
2. **Graceful Degradation**: Reduce quality on low-end devices, don't crash
3. **Offline-Capable**: Core game works without network (after first load)
4. **Stateless Where Possible**: Minimize global state, prefer pure functions
5. **Fail Loudly in Dev**: Use DEBUG mode to catch issues early

---

## Key Stakeholders & Consumers

### Internal
1. **Gameplay Engineers**: Implement skills, enemies, combat systems
2. **UI Engineers**: Build screens, HUD, settings, guide
3. **Content Designers**: Define skills, maps, progression curves
4. **Localization Team**: Translate and maintain locale files
5. **QA/Testers**: Verify functionality, performance, localization

### External
1. **Players**: Primary consumers, provide feedback and engagement metrics
2. **Community**: Share feedback, report bugs, suggest features
3. **Developers**: Learn from codebase, contribute improvements
4. **Stakeholders**: Monitor metrics, make business decisions

---

## Success Metrics

### Engagement
- **Session Length**: Average 10+ minutes (indicates engaging gameplay)
- **Sessions per User**: 3+ per week (indicates retention)
- **Skill Usage**: All skills used regularly (indicates balance)
- **Map Progression**: 50%+ reach MAP 3+ (indicates progression works)

### Performance
- **FPS**: 60fps on 80%+ of devices (indicates optimization works)
- **Load Time**: < 3 seconds to playable (indicates fast startup)
- **Crash Rate**: < 1% (indicates stability)
- **Frame Drops**: < 5% of frames below 50fps (indicates smooth gameplay)

### Localization
- **Translation Coverage**: 100% of UI text (indicates completeness)
- **Language Distribution**: 60%+ Vietnamese, 40% English (validates target audience)
- **Locale Switching**: < 1% errors (indicates robust i18n)

### Business
- **Installs**: 1,000+ on Google Play (indicates distribution success)
- **Retention**: 30% day-1, 10% day-7 (indicates product-market fit)
- **Ratings**: 4.0+ stars (indicates player satisfaction)
- **Monetization**: (Future) IAP conversion rate, ARPU

---

## Product Roadmap (High-Level)

### Phase 1: Core Experience ✅ (Complete)
- Basic gameplay loop (move, fight, level)
- Fire-themed skills (Q/W/E/R)
- Mobile optimization
- Localization (EN/VI)
- PWA + Google Play

### Phase 2: Content Expansion 🚧 (In Progress)
- More skills in pool (20+ total)
- More maps (10+ base maps)
- Uplift system refinement
- Skill balance tuning

### Phase 3: Depth & Retention 📋 (Planned)
- Equipment/inventory system
- Achievements and challenges
- Daily quests
- Leaderboards
- Social features (share progress)

### Phase 4: Monetization 💰 (Future)
- Cosmetic skins (hero, skills)
- Premium skill packs
- Map packs
- Battle pass / season system
- Remove ads option

---

## How to Use This File

### Before Making Product Decisions
1. **Read this file** to understand product vision and principles
2. **Check alignment** with product principles and success metrics
3. **Consider stakeholders** who will be affected
4. **Validate against user needs** and market opportunity

### When to Update This File
1. **Product Vision Changes**: New target audience, market shift
2. **Major Feature Additions**: New systems that change core loop
3. **Metrics Changes**: New success criteria or KPIs
4. **Stakeholder Changes**: New teams or external partners
5. **Roadmap Updates**: Phase completion or priority shifts

### Related Documents
- **Project Brief**: `projectbrief.md` — Quick overview and goals
- **System Patterns**: `systemPatterns.md` — How product is implemented
- **Progress**: `progress.md` — Current state and what's working
- **Active Context**: `activeContext.md` — Current work focus
