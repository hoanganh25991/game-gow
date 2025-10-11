# GameApp Coordinators

This directory contains focused coordinator modules that organize the game initialization and runtime logic. This refactoring breaks down the monolithic `GameApp.js` into maintainable, single-responsibility modules.

## Architecture Overview

The refactored architecture follows these principles:

1. **Separation of Concerns**: Each coordinator handles a specific domain
2. **Clear Boundaries**: Well-defined interfaces between modules
3. **Dependency Injection**: Dependencies are passed in constructors
4. **Single Responsibility**: Each module has one clear purpose

## Coordinator Modules

### AudioCoordinator
**Responsibility**: Audio system initialization and management

**Key Features**:
- Initializes audio with user gesture handling
- Manages music and SFX volume settings
- Provides audio controller for UI
- Handles background music lifecycle

**Public API**:
- `init()` - Initialize audio system
- `createAudioController()` - Create controller for settings UI
- `ensureBackgroundMusic()` - Start background music

---

### EnvironmentCoordinator
**Responsibility**: Environment and world terrain management

**Key Features**:
- Initializes environment (trees, rocks, flowers, rain)
- Manages chunk loading system for large worlds
- Handles environment density and quality settings
- Mobile optimization support

**Public API**:
- `init()` - Initialize environment
- `updateFollow(player)` - Update environment to follow player
- `updateChunks(playerPos)` - Update chunk manager
- `update(t, dt)` - Per-frame environment updates
- `getState()` / `setState()` - Environment state management
- `createEnvironmentContext(player)` - Create context for settings UI

---

### EntityCoordinator
**Responsibility**: Game entities (player, enemies, villages, portals)

**Key Features**:
- Creates and initializes player
- Sets up villages and portals
- Initializes dynamic enemy spawner
- Manages map unlock progression
- Handles player level-up events

**Public API**:
- `init()` - Initialize all entities
- `getPlayer()` - Get player reference
- `getEnemies()` - Get enemies array
- `getPortals()` - Get portals system
- `getVillages()` - Get villages system
- `adjustEnemyCountForCurrentMap()` - Adjust spawning for map difficulty

---

### LoadoutCoordinator
**Responsibility**: Skill loadout system management

**Key Features**:
- Loads and saves skill loadouts
- Applies skill upgrades
- Listens for loadout change events
- Manages skill bar UI updates

**Public API**:
- `init()` - Initialize loadout system
- `getCurrentLoadout()` - Get current skill loadout
- `setLoadoutAndSave(ids, skillsSystem)` - Update and save loadout
- `getSkillAPI()` - Get skill API for external use

---

### InputCoordinator
**Responsibility**: Input systems (keyboard, mouse, touch, raycasting)

**Key Features**:
- Creates raycast system for click detection
- Initializes input service for keyboard/mouse
- Sets up touch controls for mobile
- Manages enemy mesh tracking for raycasting

**Public API**:
- `init()` - Initialize input systems
- `getInputService()` - Get input service reference
- `getTouchControls()` - Get touch controls reference
- `dispose()` - Cleanup resources

---

### UISetupCoordinator
**Responsibility**: UI initialization and wiring

**Key Features**:
- Sets up settings screen
- Wires restore purchases button
- Connects UI elements to game systems
- Manages hero screen display

**Public API**:
- `setup()` - Setup all UI components
- `showHeroScreen(initialTab)` - Display hero screen
- `dispose()` - Cleanup UI bindings

---

### UpdateLoopCoordinator
**Responsibility**: Main game update loop orchestration

**Key Features**:
- Coordinates all per-frame updates
- Handles joystick and keyboard movement
- Manages camera updates
- Updates all game systems in correct order
- Handles adaptive performance optimization

**Public API**:
- `setStrides(aiStride, bbStride)` - Set AI and billboard update rates
- `update(dt, t, budgetInfo)` - Main update function called by GameLoop

## Data Flow

```
GameApp (Orchestrator)
    ↓
┌───────────────────────────────────────────┐
│ Core Infrastructure                        │
│ - Settings, World, Effects, UI, Maps      │
└───────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────┐
│ Coordinators (Initialization)             │
│ - Audio, Environment, Entity,             │
│   Loadout, Input, UI Setup                │
└───────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────┐
│ Game Systems                               │
│ - Camera, Player, Enemies, Skills,        │
│   Buffs, Proximity, Respawn               │
└───────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────┐
│ Update Loop Coordinator                    │
│ - Orchestrates runtime updates            │
└───────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────┐
│ Game Loop                                  │
│ - Frame timing and rendering              │
└───────────────────────────────────────────┘
```

## Initialization Phases

The `GameApp` initialization follows a clear sequence:

1. **Core Infrastructure**: Settings, world, effects, UI, maps
2. **Coordinators**: Audio, environment, entities, loadout, input, UI setup
3. **Game Systems**: Camera, player, enemies, skills, buffs, respawn
4. **Setup and Wire**: Connect all systems together
5. **Game Loop**: Start the update/render loop

## Benefits of This Architecture

### 1. Maintainability
- Each module is ~200-400 lines vs 1000+ line monolith
- Clear responsibility boundaries
- Easy to locate and fix bugs

### 2. Testability
- Coordinators can be tested in isolation
- Dependencies are explicit and mockable
- Clear interfaces for testing

### 3. Scalability
- New features can be added to specific coordinators
- New coordinators can be added without modifying existing ones
- Dependencies are clear and manageable

### 4. Readability
- Code organization matches conceptual model
- Less cognitive load when reading code
- Self-documenting structure

### 5. Reusability
- Coordinators can be reused in different contexts
- Clear interfaces enable composition
- Minimal coupling between modules

## Migration Notes

The refactoring maintains **100% backward compatibility**:
- Same public API on `GameApp`
- Same initialization sequence
- Same runtime behavior
- All existing features preserved

Changes are purely internal organizational improvements.

## Best Practices

When modifying coordinators:

1. **Keep dependencies explicit**: Pass all dependencies via constructor
2. **Single responsibility**: If a coordinator grows too large, split it
3. **Clear interfaces**: Document public methods with JSDoc
4. **Error handling**: Use try-catch for external calls
5. **Avoid globals**: Pass references instead of using window/global vars
6. **State management**: Keep state minimal and well-documented

## Future Improvements

Potential enhancements:
- Event bus for cross-coordinator communication
- Configuration objects instead of long parameter lists
- TypeScript for type safety
- Unit tests for each coordinator
- Dependency injection container
