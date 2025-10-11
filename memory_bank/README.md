# Memory Bank — GoW RPG Knowledge Base

## Purpose
This directory contains the **complete knowledge base** for the GoW RPG project. It serves as the **single source of truth** for understanding the project without reading code.

**Target Audience**:
- AI agents (like Zencoder) starting fresh after memory reset
- New developers joining the project
- Stakeholders reviewing project status
- Future maintainers understanding original intent

---

## 📚 Core Documents (Read These First)

### 1. [Project Brief](projectbrief.md) — Start Here
**What**: Quick overview of the project  
**When to Read**: First thing, before anything else  
**Contains**:
- Project identity and goals
- High-level overview
- Core requirements
- What makes this project unique
- Success criteria

**Read Time**: 5 minutes

---

### 2. [Product Context](productContext.md) — Why & How
**What**: Product vision, user needs, and flows  
**When to Read**: Before making product decisions  
**Contains**:
- Why this project exists
- Problems being solved
- How the product should work
- Product principles
- Success metrics
- Product roadmap

**Read Time**: 10 minutes

---

### 3. [System Patterns](systemPatterns.md) — Architecture
**What**: Architecture, design patterns, technical decisions  
**When to Read**: Before making architectural changes  
**Contains**:
- System architecture overview
- Module responsibilities
- Design patterns (data-driven, localization, etc.)
- Key technical decisions
- Extension patterns
- Common pitfalls

**Read Time**: 15 minutes

---

### 4. [Tech Context](techContext.md) — Setup & Stack
**What**: Technologies, setup, development workflow  
**When to Read**: Before setting up development environment  
**Contains**:
- Technology stack
- Repository structure
- Development setup
- Browser compatibility
- Localization system
- Performance optimization
- PWA configuration
- Testing and debugging

**Read Time**: 15 minutes

---

### 5. [Progress](progress.md) — Status & History
**What**: What works, what's left, known issues  
**When to Read**: To understand current implementation status  
**Contains**:
- What works (implemented features)
- Known issues and TODOs
- Evolution of key decisions
- Current state summary
- Metrics and milestones

**Read Time**: 10 minutes

---

### 6. [Active Context](activeContext.md) — Current Focus
**What**: Current work, recent changes, next steps  
**When to Read**: Every time you start working  
**Contains**:
- Current focus (most recent work)
- Recent changes (chronological)
- Open issues and TODOs
- Important files and where to look
- How to find things
- Next steps

**Read Time**: 5 minutes  
**Update Frequency**: Daily/weekly

---

## 📖 Detailed Reference Documentation

For **deep-dive, module-level documentation**, see the `docs/` subdirectory:

### 🔧 Technical Reference (`docs/technical/`)
**17 module-focused technical documents** covering implementation details:
- **What**: Code-level architecture, exports, data flow, integration notes
- **When to Read**: When implementing or debugging specific modules
- **Modules**: AI, Audio, Camera & Movement, Combat & Skills, Entities, Input & Raycast, Leveling, Portals, UI & Minimap, VFX & Indicators, World, Update Loop, Utils & Config, Debug, and more
- **Start Here**: [docs/technical/index.md](docs/technical/index.md)

**Example Topics**:
- How skills system works (`combat-and-skills.md`)
- How AI aggro/wander works (`ai.md`)
- How world generation works (`world.md`)
- How input/raycasting works (`input-and-raycast.md`)

### 📋 Requirements Reference (`docs/requirements/`)
**16 module-focused requirement documents** covering functional specifications:
- **What**: User-facing behavior, acceptance criteria, test cases
- **When to Read**: When implementing features or writing tests
- **Modules**: World, Entities, Input, Combat, AI, VFX, UI, Settings, Guide, Portals, Camera, Update Loop, Controls, Non-Functional, Acceptance, Smoke Tests
- **Start Here**: [docs/requirements/index.md](docs/requirements/index.md)

**Example Topics**:
- Combat & skills requirements (`combat-and-skills.md`)
- Controls specification (`controls.md`)
- Smoke test checklist (`smoke-tests.md`)
- Non-functional requirements (`non-functional.md`)

### 📱 Special Documentation
- **[docs/twa-license-integration.md](docs/twa-license-integration.md)** — Complete guide for TWA/Play Store licensing integration (app-priced model, Play Integrity API, server verification examples)

---

### 📊 Documentation Hierarchy

```
memory_bank/
├── README.md              ← You are here (navigation guide)
├── projectbrief.md        ← High-level overview
├── productContext.md      ← Product vision & strategy
├── systemPatterns.md      ← Architecture & patterns (high-level)
├── techContext.md         ← Tech stack & setup (high-level)
├── progress.md            ← Implementation status
├── activeContext.md       ← Current focus
└── docs/                  ← DETAILED REFERENCE ↓
    ├── technical/         ← Module-by-module technical docs (17 files)
    │   ├── index.md       ← Start here for technical deep-dive
    │   ├── combat-and-skills.md
    │   ├── ai.md
    │   ├── world.md
    │   └── ... (14 more)
    ├── requirements/      ← Module-by-module requirements (16 files)
    │   ├── index.md       ← Start here for requirements
    │   ├── combat-and-skills.md
    │   ├── controls.md
    │   └── ... (14 more)
    └── twa-license-integration.md
```

**Relationship**:
- **Top-level files** = Strategic, high-level, quick reference (30 min read)
- **`docs/` subdirectory** = Tactical, detailed, module-specific (2-3 hours for full read)

---

## 🎯 Reading Order by Role

### For AI Agents (Starting Fresh)
1. **Project Brief** — Understand what this is
2. **Active Context** — Know what's happening now
3. **System Patterns** — Understand architecture
4. **Progress** — Know what works and what doesn't
5. **Tech Context** — Understand technical setup
6. **Product Context** — (Optional) Understand product vision

**Total Time**: ~30 minutes for core understanding

---

### For New Developers
1. **Project Brief** — Understand project goals
2. **Tech Context** — Set up development environment
3. **System Patterns** — Understand architecture
4. **Progress** — Know current status
5. **Active Context** — Know current work focus
6. **Product Context** — (Optional) Understand product vision

**Total Time**: ~45 minutes for full onboarding

---

### For Product Managers
1. **Project Brief** — Understand project overview
2. **Product Context** — Understand product vision and metrics
3. **Progress** — Know current status and roadmap
4. **Active Context** — Know current work focus

**Total Time**: ~20 minutes for product understanding

---

### For Stakeholders
1. **Project Brief** — Understand project overview
2. **Progress** — Know current status
3. **Product Context** — Understand success metrics

**Total Time**: ~15 minutes for high-level overview

---

## 🔄 Document Relationships

```
┌─────────────────┐
│ Project Brief   │ ← Start here (5 min)
└────────┬────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    ↓         ↓            ↓            ↓
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Product │ │  System  │ │   Tech   │ │ Progress │
│ Context │ │ Patterns │ │ Context  │ │          │
└─────────┘ └──────────┘ └──────────┘ └──────────┘
    │            │            │            │
    └────────────┴────────────┴────────────┘
                      ↓
              ┌──────────────┐
              │    Active    │ ← Update frequently
              │   Context    │
              └──────────────┘
```

---

## 📝 Maintenance Guidelines

### When to Update

#### Project Brief
- Project goals change
- Target audience shifts
- Success criteria evolve
- Major pivots or direction changes

**Frequency**: Rarely (quarterly or on major changes)

#### Product Context
- Product vision changes
- New user flows added
- Success metrics change
- Roadmap updates

**Frequency**: Monthly or on major feature additions

#### System Patterns
- New architectural patterns introduced
- Major refactors
- New design patterns adopted
- Technical decisions made

**Frequency**: On architectural changes

#### Tech Context
- Technology stack changes
- New dependencies added
- Development setup changes
- New deployment targets

**Frequency**: On technical stack changes

#### Progress
- Features completed
- Known issues discovered/fixed
- Milestones reached
- Major decisions made

**Frequency**: Weekly or on feature completion

#### Active Context
- Work focus changes
- Tasks completed
- New issues discovered
- Daily/weekly progress

**Frequency**: Daily or after each work session

---

## 🎨 Document Format Guidelines

### Structure
- Use clear headings (H2, H3, H4)
- Use bullet points for lists
- Use tables for structured data
- Use code blocks for examples
- Use diagrams (ASCII art) for flows

### Style
- **Bold** for emphasis
- `code` for technical terms
- ✅ ❌ 🚧 ⏳ for status indicators
- Links for cross-references

### Tone
- Clear and concise
- Avoid jargon (or explain it)
- Write for future readers
- Assume no prior knowledge

---

## 🔍 Quick Reference

### Finding Information

**"What is this project?"**  
→ [Project Brief](projectbrief.md)

**"Why does this exist?"**  
→ [Product Context](productContext.md)

**"How is it built?"**  
→ [System Patterns](systemPatterns.md)

**"How do I set it up?"**  
→ [Tech Context](techContext.md)

**"What works and what doesn't?"**  
→ [Progress](progress.md)

**"What's happening now?"**  
→ [Active Context](activeContext.md)

**"How do I add a new skill?"**  
→ [System Patterns](systemPatterns.md) → Extension Patterns

**"How do I add a new language?"**  
→ [Tech Context](techContext.md) → Localization

**"Where is the skill system?"**  
→ [Active Context](activeContext.md) → Important Files

**"What are the known issues?"**  
→ [Progress](progress.md) → Known Issues

**"How does the combat system work in detail?"**  
→ [docs/technical/combat-and-skills.md](docs/technical/combat-and-skills.md)

**"What are the exact requirements for AI behavior?"**  
→ [docs/requirements/ai.md](docs/requirements/ai.md)

**"How do I integrate TWA licensing?"**  
→ [docs/twa-license-integration.md](docs/twa-license-integration.md)

**"What are all the controls?"**  
→ [docs/requirements/controls.md](docs/requirements/controls.md)

---

## 📊 Memory Bank Health Checklist

Use this checklist to ensure memory bank stays healthy:

- [ ] All core documents exist and are up-to-date
- [ ] Cross-references are correct (no broken links)
- [ ] Active Context updated in last 7 days
- [ ] Progress updated in last 30 days
- [ ] No contradictions between documents
- [ ] All major decisions documented
- [ ] All major features documented in Progress
- [ ] Current work focus clear in Active Context
- [ ] Technical setup instructions work
- [ ] Code examples are accurate

---

## 🚀 Getting Started (Quick Start)

### For AI Agents
```
1. Read: Project Brief (5 min)
2. Read: Active Context (5 min)
3. Read: System Patterns (15 min)
4. Start working with context
```

### For Developers
```
1. Read: Project Brief (5 min)
2. Read: Tech Context → Development Setup (5 min)
3. Run: python3 -m http.server 8000
4. Open: http://localhost:8000
5. Read: System Patterns (15 min)
6. Start coding
```

### For Product Review
```
1. Read: Project Brief (5 min)
2. Read: Product Context (10 min)
3. Read: Progress → Current State (5 min)
4. Review complete
```

---

## 📞 Contact & Support

**Project Owner**: Monk Journey Team  
**Repository**: `/Users/anhle/work-station/game-gof`  
**Published**: Google Play Store (TWA)  
**License**: Proprietary (see LICENSE file)

---

## 🔗 External Resources

- **Three.js Docs**: https://threejs.org/docs/
- **MDN Web Docs**: https://developer.mozilla.org/
- **PWA Guide**: https://web.dev/progressive-web-apps/
- **ES Modules**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules

---

**Last Updated**: 2025-01-XX  
**Memory Bank Version**: 2.0 (Comprehensive Update)