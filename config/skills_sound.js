/**
 * Skills Sound Configuration
 * 
 * Pure configuration mapping skill IDs to their sound definitions.
 * Similar to skills_pool.js - contains only data, no implementation.
 * 
 * Sound definitions can be:
 * - A string: URL to an MP3 file (e.g., "./audio/explosion.mp3")
 * - An object: Procedural sound parameters (type, frequencies, duration, etc.)
 * - An array: Multiple sounds to play simultaneously
 * 
 * Implementation is handled by audio.js
 */

/**
 * Sound configuration for each skill ID
 */
export const SKILL_SOUNDS = {
  // Chain lightning skills
  flame_chain: {
    type: "zap",
    freqStart: 1400,
    freqEnd: 600,
    dur: 0.12,
    gain: 0.5
  },
  
  // AOE/Blast skills
  inferno_blast: {
    type: "noiseBurst",
    dur: 0.28,
    filterType: "lowpass",
    cutoff: 600,
    q: 1.2,
    gain: 0.65
  },
  
  flame_ring: {
    type: "noiseBurst",
    dur: 0.25,
    filterType: "lowpass",
    cutoff: 700,
    q: 1.5,
    gain: 0.7
  },
  
  ember_burst: {
    type: "noiseBurst",
    dur: 0.22,
    filterType: "bandpass",
    cutoff: 800,
    q: 2.0,
    gain: 0.6
  },
  
  pyroclasm: {
    type: "noiseBurst",
    dur: 0.3,
    filterType: "lowpass",
    cutoff: 500,
    q: 1.8,
    gain: 0.75
  },
  
  // Aura skills
  burning_aura: {
    type: "blip",
    freq: 520,
    dur: 0.08,
    gain: 0.28
  },
  
  blazing_aura: {
    type: "blip",
    freq: 580,
    dur: 0.09,
    gain: 0.3
  },
  
  scorching_field: {
    type: "blip",
    freq: 480,
    dur: 0.08,
    gain: 0.26
  },
  
  inferno_overload: {
    type: "blip",
    freq: 620,
    dur: 0.1,
    gain: 0.32
  },
  
  // Storm skills
  meteor_storm: {
    type: "noiseBurst",
    dur: 0.55,
    filterType: "lowpass",
    cutoff: 300,
    q: 0.6,
    gain: 0.3
  },
  
  volcanic_wrath: {
    type: "noiseBurst",
    dur: 0.45,
    filterType: "lowpass",
    cutoff: 350,
    q: 0.7,
    gain: 0.35
  },
  
  fire_dome: {
    type: "noiseBurst",
    dur: 0.6,
    filterType: "lowpass",
    cutoff: 280,
    q: 0.5,
    gain: 0.28
  },
  
  lava_storm: {
    type: "noiseBurst",
    dur: 0.5,
    filterType: "lowpass",
    cutoff: 320,
    q: 0.65,
    gain: 0.32
  },
  
  // Beam/Bolt skills
  fire_bolt: {
    type: "zap",
    freqStart: 1000,
    freqEnd: 500,
    dur: 0.09,
    gain: 0.45
  },
  
  fireball: {
    type: "zap",
    freqStart: 1100,
    freqEnd: 450,
    dur: 0.1,
    gain: 0.5
  },
  
  flame_spear: {
    type: "zap",
    freqStart: 1300,
    freqEnd: 550,
    dur: 0.11,
    gain: 0.55
  },
  
  heatwave: {
    type: "zap",
    freqStart: 950,
    freqEnd: 480,
    dur: 0.09,
    gain: 0.48
  },
  
  // Nova skills
  flame_nova: {
    type: "noiseBurst",
    dur: 0.22,
    filterType: "bandpass",
    cutoff: 800,
    q: 2.5,
    gain: 0.55
  },
  
  // Basic attack
  basic_attack: {
    type: "zap",
    freqStart: 1200,
    freqEnd: 380,
    dur: 0.10,
    gain: 0.6
  },
  
  // Hit/impact sounds (not skills, but used by game events)
  chain_hit: {
    type: "zap",
    freqStart: 1400,
    freqEnd: 600,
    dur: 0.07,
    gain: 0.33
  },
  
  player_hit: {
    type: "blip",
    freq: 180,
    dur: 0.12,
    gain: 0.45
  },
  
  enemy_die: [
    {
      type: "zap",
      freqStart: 700,
      freqEnd: 180,
      dur: 0.16,
      gain: 0.35
    },
    {
      type: "noiseBurst",
      dur: 0.22,
      filterType: "lowpass",
      cutoff: 600,
      q: 0.9,
      gain: 0.25
    }
  ],
  
  // Aura state changes
  aura_on: {
    type: "blip",
    freq: 520,
    dur: 0.08,
    gain: 0.28
  },
  
  aura_off: {
    type: "blip",
    freq: 320,
    dur: 0.08,
    gain: 0.25
  },
  
  aura_tick: {
    type: "blip",
    freq: 800,
    dur: 0.03,
    gain: 0.12
  },
  
  // Examples using MP3 files (uncomment and provide actual paths):
  // flame_chain: "./audio/chain_lightning.mp3",
  // inferno_blast: "./audio/explosion.mp3",
  // meteor_storm: "./audio/storm.mp3",
  
  // Example of hybrid (MP3 + procedural):
  // pyroclasm: [
  //   "./audio/big_explosion.mp3",
  //   {
  //     type: "boom"
  //   }
  // ],
};

/**
 * Default fallback sounds by skill type
 * Used when a specific skill ID is not found in SKILL_SOUNDS
 */
export const DEFAULT_SOUNDS = {
  basic_attack: {
    type: "zap",
    freqStart: 1200,
    freqEnd: 380,
    dur: 0.10,
    gain: 0.6
  },
};