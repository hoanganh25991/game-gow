# Skills Sound System

A dynamic, configuration-based sound system for game skills that separates sound definitions from implementation.

## Architecture

- **`skills_sound.js`** - Pure configuration file (like `skills_pool.js`)
  - Contains `SKILL_SOUNDS` object mapping skill IDs to sound definitions
  - Contains `DEFAULT_SOUNDS_BY_TYPE` for fallback sounds
  - No implementation code, only data

- **`audio.js`** - Implementation
  - Contains `playSkillSound()` function that reads configurations
  - Handles both procedural sounds and MP3 files
  - Manages audio buffer caching and playback

## Usage

### Basic Usage

```javascript
import { audio } from "./audio.js";
import { SKILL_SOUNDS } from "./skills_sound.js";

// Play a skill sound
audio.playSkillSound("flame_chain", SKILL_SOUNDS.flame_chain);

// Play with overrides
audio.playSkillSound("flame_chain", SKILL_SOUNDS.flame_chain, { gain: 0.8 });
```

### Integration with Skills System

```javascript
import { audio } from "./audio.js";
import { SKILL_SOUNDS, DEFAULT_SOUNDS_BY_TYPE } from "./skills_sound.js";

// In your skill casting function:
function castSkill(skillDef) {
  // Get sound config for this skill
  const soundConfig = SKILL_SOUNDS[skillDef.id] || DEFAULT_SOUNDS_BY_TYPE[skillDef.type];
  
  // Play the sound
  audio.playSkillSound(skillDef.id, soundConfig);
  
  // ... rest of skill logic
}
```

## Sound Configuration Types

### 1. Procedural Sounds

#### Zap (Electric/Energy)
```javascript
flame_chain: {
  type: "zap",
  freqStart: 1400,  // Starting frequency (Hz)
  freqEnd: 600,     // Ending frequency (Hz)
  dur: 0.12,        // Duration (seconds)
  color: "bandpass", // Filter type
  q: 8,             // Filter resonance
  gain: 0.5         // Volume (0-1)
}
```

#### Noise Burst (Explosions/Impacts)
```javascript
inferno_blast: {
  type: "noiseBurst",
  dur: 0.28,              // Duration (seconds)
  filterType: "lowpass",  // Filter type
  cutoff: 600,            // Cutoff frequency (Hz)
  q: 1.2,                 // Filter resonance
  gain: 0.65              // Volume (0-1)
}
```

#### Blip (Short Tones)
```javascript
burning_aura: {
  type: "blip",
  freq: 520,    // Frequency (Hz)
  dur: 0.08,    // Duration (seconds)
  gain: 0.28    // Volume (0-1)
}
```

#### Strike & Boom (Predefined)
```javascript
impact_skill: {
  type: "strike"  // Bright crack sound
}

explosion_skill: {
  type: "boom"    // Soft explosion
}
```

### 2. MP3 Files

```javascript
epic_ultimate: "./audio/epic_explosion.mp3"
```

### 3. Multiple Sounds (Array)

```javascript
combo_skill: [
  {
    type: "zap",
    freqStart: 1400,
    freqEnd: 600,
    dur: 0.12,
    gain: 0.5
  },
  {
    type: "noiseBurst",
    dur: 0.2,
    filterType: "bandpass",
    cutoff: 800,
    q: 2.0,
    gain: 0.4
  }
]
```

### 4. Hybrid (MP3 + Procedural)

```javascript
hybrid_skill: [
  "./audio/whoosh.mp3",
  {
    type: "blip",
    freq: 800,
    dur: 0.05,
    gain: 0.3
  }
]
```

## Adding New Sounds

### Option 1: Edit skills_sound.js

Add your configuration to the `SKILL_SOUNDS` object:

```javascript
export const SKILL_SOUNDS = {
  // ... existing sounds ...
  
  my_new_skill: {
    type: "zap",
    freqStart: 1800,
    freqEnd: 400,
    dur: 0.15,
    gain: 0.7
  }
};
```

### Option 2: Runtime Addition

```javascript
import { SKILL_SOUNDS } from "./skills_sound.js";

SKILL_SOUNDS.my_new_skill = {
  type: "zap",
  freqStart: 1800,
  freqEnd: 400,
  dur: 0.15,
  gain: 0.7
};
```

## Preloading MP3 Files

For better performance, preload MP3 files during game initialization:

```javascript
import { audio } from "./audio.js";
import { SKILL_SOUNDS } from "./skills_sound.js";

async function initAudio(loadoutSkillIds) {
  // Get sound configs for current loadout
  const soundConfigs = loadoutSkillIds
    .map(id => SKILL_SOUNDS[id])
    .filter(config => config);
  
  // Preload MP3 files
  await audio.preloadSkillSounds(soundConfigs);
}

// Usage
await initAudio(["flame_chain", "inferno_blast", "burning_aura", "fire_beam"]);
```

## API Reference

### audio.playSkillSound(skillId, soundConfig, opts)

Play a sound based on configuration.

**Parameters:**
- `skillId` (string) - The skill ID (for logging/debugging)
- `soundConfig` (string|object|array) - Sound configuration from SKILL_SOUNDS
- `opts` (object) - Optional overrides for procedural sounds

**Returns:** Promise<void>

### audio.preloadSkillSounds(soundConfigs)

Preload MP3 files to avoid delays during gameplay.

**Parameters:**
- `soundConfigs` (array) - Array of sound configurations

**Returns:** Promise<void>

### audio.clearAudioCache()

Clear the audio buffer cache (useful for memory management).

**Returns:** void

## Migration from Old System

### Before (switch case in audio.js):
```javascript
audio.sfx("cast_chain");
```

### After (configuration-based):
```javascript
import { SKILL_SOUNDS } from "./skills_sound.js";
audio.playSkillSound("flame_chain", SKILL_SOUNDS.flame_chain);
```

## Benefits

1. **Separation of Concerns** - Configuration separate from implementation
2. **Easy to Modify** - Change sounds without touching implementation code
3. **Type Safety** - Clear structure for sound definitions
4. **Flexible** - Supports procedural sounds, MP3 files, or both
5. **Maintainable** - Similar pattern to skills_pool.js
6. **Extensible** - Easy to add new sound types or configurations