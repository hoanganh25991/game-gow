/**
 * Visual FX Configuration per Skill
 * 
 * This file defines the complete visual configuration for each skill.
 * Each skill has its own unique configuration that can include:
 * - colors: Primary, secondary, accent colors for the effect
 * - size: Scale factors for various visual elements
 * - particles: Particle system configuration
 * - intensity: Visual intensity multipliers
 * - custom: Any skill-specific parameters
 * 
 * The actual effect implementations are in src/effects/{skill_id}.js
 */
export const SKILL_FX = Object.freeze({
  // ===== CHAIN SKILLS =====
  flame_chain: {
    colors: {
      primary: "#00bfff",      // Deep sky blue
      secondary: "#4dd0e1",    // Mid aqua
      accent: "#87ceeb",       // Sky blue sparks
      glow: "#00ced1"          // Dark turquoise glow
    },
    size: {
      chain: 0.3,              // Chain link thickness
      impact: 1.5,             // Impact explosion size
      sparks: 0.15             // Spark particle size
    },
    particles: {
      count: 20,               // Particles per chain link
      speed: 2.5,
      lifetime: 0.8
    },
    intensity: 1.2,
    shake: 0.2,
    custom: {
      chainAmplitude: 0.6,     // Wave amplitude for chain arcs
      lightningBranches: 3     // Number of lightning branches
    }
  },

  // ===== AOE BLAST SKILLS =====
  inferno_blast: {
    colors: {
      primary: "#00bfff",      // Deep sky blue core
      secondary: "#4dd0e1",    // Aqua waves
      accent: "#87ceeb",       // Sky blue flash
      smoke: "#2a4550"         // Dark blue mist
    },
    size: {
      core: 2.0,               // Explosion core size
      shockwave: 3.5,          // Shockwave radius multiplier
      flames: 1.8              // Water spray height
    },
    particles: {
      count: 50,               // Explosion particles
      speed: 8.0,
      lifetime: 1.2
    },
    intensity: 1.8,
    shake: 0.35,
    custom: {
      shockwaveRings: 3,       // Number of expanding rings
      fireColumns: 8           // Vertical water columns
    }
  },

  // ===== AURA SKILLS =====
  burning_aura: {
    colors: {
      primary: "#00ced1",      // Dark turquoise
      secondary: "#00bfff",    // Deep sky blue
      accent: "#4dd0e1",       // Mid aqua
      ember: "#87ceeb"         // Sky blue droplets
    },
    size: {
      aura: 1.0,               // Aura radius multiplier
      flames: 0.8,             // Ice shard size
      embers: 0.12             // Droplet particle size
    },
    particles: {
      count: 30,               // Floating droplets
      speed: 1.5,
      lifetime: 2.0
    },
    intensity: 0.8,
    shake: 0.1,
    custom: {
      pulseRate: 2.0,          // Aura pulse frequency
      flameRings: 2,           // Concentric frost rings
      emberDensity: 1.5        // Droplet spawn rate
    }
  },

  blazing_aura: {
    colors: {
      primary: "#87ceeb",      // Sky blue (colder)
      secondary: "#00bfff",    // Deep sky blue
      accent: "#b0e0e6",       // Powder blue
      core: "#e0ffff"          // Ice white core
    },
    size: {
      aura: 1.2,
      flames: 1.0,
      core: 0.5
    },
    particles: {
      count: 40,
      speed: 2.0,
      lifetime: 1.8
    },
    intensity: 1.2,
    shake: 0.18,
    custom: {
      pulseRate: 3.0,
      flameRings: 3,
      heatDistortion: 1.5      // Cold wave effect intensity
    }
  },

  scorching_field: {
    colors: {
      primary: "#4dd0e1",      // Mid aqua
      secondary: "#00ced1",    // Dark turquoise
      accent: "#00bfff",       // Deep sky blue
      ground: "#003d5a"        // Deep ocean ground freeze
    },
    size: {
      field: 1.0,
      flames: 0.9,
      cracks: 0.3              // Ground ice crack size
    },
    particles: {
      count: 35,
      speed: 1.2,
      lifetime: 2.5
    },
    intensity: 1.0,
    shake: 0.15,
    custom: {
      groundCracks: 12,        // Number of frozen cracks
      flameSpouts: 8,          // Ice spout locations
      heatWaves: true          // Enable cold distortion
    }
  },

  inferno_overload: {
    colors: {
      primary: "#00bfff",      // Deep sky blue (intense)
      secondary: "#4dd0e1",    // Mid aqua
      accent: "#87ceeb",       // Sky blue
      explosion: "#b0e0e6"     // Powder blue explosion
    },
    size: {
      aura: 1.5,
      explosion: 2.5,
      flames: 1.3
    },
    particles: {
      count: 60,
      speed: 4.0,
      lifetime: 1.5
    },
    intensity: 2.0,
    shake: 0.2,
    custom: {
      pulseRate: 4.0,
      explosionWaves: 4,       // Expanding explosion rings
      fireSpirals: 6           // Spiraling water streams
    }
  },

  // ===== STORM SKILLS =====
  meteor_storm: {
    colors: {
      primary: "#00bfff",      // Deep sky blue ice
      secondary: "#4dd0e1",    // Aqua trail
      accent: "#003d5a",       // Deep ocean
      impact: "#b0e0e6"        // Powder blue impact flash
    },
    size: {
      meteor: 1.2,             // Ice meteor size
      trail: 0.4,              // Trail width
      crater: 2.0              // Impact crater size
    },
    particles: {
      count: 40,               // Debris per meteor
      speed: 6.0,
      lifetime: 1.0
    },
    intensity: 2.0,
    shake: 0.45,
    custom: {
      meteorSpeed: 25,         // Fall speed
      trailLength: 8,          // Trail segments
      craterGlow: 1.5,         // Crater glow duration
      shockwaveRings: 3
    }
  },

  volcanic_wrath: {
    colors: {
      primary: "#00bfff",      // Deep sky blue water
      secondary: "#003d5a",    // Deep ocean
      accent: "#87ceeb",       // Sky blue sparks
      smoke: "#1a3a42"         // Dark blue mist
    },
    size: {
      volcano: 2.0,            // Geyser cone size
      lava: 1.5,               // Water blob size
      smoke: 3.0               // Mist cloud size
    },
    particles: {
      count: 70,
      speed: 5.0,
      lifetime: 2.0
    },
    intensity: 2.5,
    shake: 0.35,
    custom: {
      lavaFountains: 5,        // Number of water fountains
      smokeColumns: 8,         // Mist pillar count
      lavaBombs: 12            // Water projectiles
    }
  },

  fire_dome: {
    colors: {
      primary: "#4dd0e1",      // Mid aqua
      secondary: "#00bfff",    // Deep sky blue
      accent: "#87ceeb",       // Sky blue
      shield: "#00ced1"        // Dark turquoise shield
    },
    size: {
      dome: 1.0,               // Dome radius multiplier
      pillars: 2.5,            // Pillar height
      shield: 0.8              // Shield thickness
    },
    particles: {
      count: 80,
      speed: 3.0,
      lifetime: 3.0
    },
    intensity: 2.0,
    shake: 0.6,
    custom: {
      domePillars: 16,         // Pillars forming dome
      rotationSpeed: 1.5,      // Dome rotation
      pulseRate: 2.5,
      shieldLayers: 3          // Layered shield effect
    }
  },

  lava_storm: {
    colors: {
      primary: "#00bfff",      // Deep sky blue hail
      secondary: "#003d5a",    // Deep ocean
      accent: "#00ced1",       // Dark turquoise
      crust: "#0a3a42"         // Dark ice crust
    },
    size: {
      lavaPool: 1.5,
      geysers: 2.0,
      splashes: 1.0
    },
    particles: {
      count: 60,
      speed: 4.5,
      lifetime: 1.8
    },
    intensity: 2.2,
    shake: 0.38,
    custom: {
      geyserCount: 10,         // Water geysers
      poolBubbles: 20,         // Bubbling water
      splashArcs: 8            // Water splash directions
    }
  },

  // ===== PROJECTILE/BEAM SKILLS =====
  fire_bolt: {
    colors: {
      primary: "#4dd0e1",      // Mid aqua beam
      secondary: "#00bfff",    // Deep sky blue
      accent: "#87ceeb",       // Sky blue sparks
      trail: "#00ced1"         // Dark turquoise trail
    },
    size: {
      bolt: 0.3,               // Bolt thickness
      impact: 1.2,
      trail: 0.2
    },
    particles: {
      count: 15,
      speed: 2.0,
      lifetime: 0.6
    },
    intensity: 1.0,
    shake: 0.2,
    custom: {
      boltSegments: 8,         // Segmented bolt effect
      sparkCount: 12,          // Trailing sparks
      pierceEffect: true       // Piercing visual
    }
  },

  fireball: {
    colors: {
      primary: "#4dd0e1",      // Mid aqua core
      secondary: "#00bfff",    // Deep sky blue waves
      accent: "#00ced1",       // Dark turquoise outer
      explosion: "#b0e0e6"     // Powder blue explosion
    },
    size: {
      ball: 0.6,               // Waterball size
      trail: 0.4,
      explosion: 2.0
    },
    particles: {
      count: 25,
      speed: 3.0,
      lifetime: 1.0
    },
    intensity: 1.3,
    shake: 0.22,
    custom: {
      rotation: 5.0,           // Waterball spin rate
      trailDensity: 2.0,       // Trail particle density
      explosionRings: 3
    }
  },

  flame_spear: {
    colors: {
      primary: "#00bfff",      // Deep sky blue spear
      secondary: "#4dd0e1",    // Mid aqua
      accent: "#87ceeb",       // Sky blue tip
      trail: "#00ced1"         // Dark turquoise trail
    },
    size: {
      spear: 0.8,              // Spear length multiplier
      tip: 0.4,                // Spear tip size
      trail: 0.3
    },
    particles: {
      count: 20,
      speed: 4.0,
      lifetime: 0.8
    },
    intensity: 1.5,
    shake: 0.28,
    custom: {
      spearLength: 3.0,        // Spear model length
      tipGlow: 2.0,            // Tip glow intensity
      spiralTrail: true,       // Spiral trail effect
      pierceDepth: 1.5         // Pierce-through effect
    }
  },

  heatwave: {
    colors: {
      primary: "#00ced1",      // Dark turquoise
      secondary: "#00bfff",    // Deep sky blue
      accent: "#4dd0e1",       // Mid aqua
      distortion: "#0ac2d9"    // Tidal distortion color
    },
    size: {
      wave: 1.5,               // Wave height
      width: 2.0,              // Wave width
      distortion: 3.0          // Distortion area
    },
    particles: {
      count: 40,
      speed: 2.5,
      lifetime: 1.5
    },
    intensity: 1.4,
    shake: 0.3,
    custom: {
      waveSpeed: 15,           // Wave travel speed
      ripples: 5,              // Wave ripple count
      heatDistortion: 2.0,     // Distortion intensity
      groundScorch: true       // Leave frozen marks
    }
  },

  // ===== NOVA/RING SKILLS =====
  flame_nova: {
    colors: {
      primary: "#4dd0e1",      // Mid aqua
      secondary: "#00bfff",    // Deep sky blue
      accent: "#87ceeb",       // Sky blue
      core: "#b0e0e6"          // Powder blue core
    },
    size: {
      core: 1.0,               // Nova core size
      ring: 1.5,               // Expanding ring size
      flames: 1.2              // Ice burst size
    },
    particles: {
      count: 60,
      speed: 8.0,
      lifetime: 1.2
    },
    intensity: 2.0,
    shake: 0.35,
    custom: {
      expansionSpeed: 12,      // Ring expansion speed
      flameRays: 16,           // Radial ice rays
      pulseWaves: 3,           // Pulse wave count
      coreExplosion: true      // Central explosion
    }
  },

  flame_ring: {
    colors: {
      primary: "#4dd0e1",      // Mid aqua
      secondary: "#00bfff",    // Deep sky blue
      accent: "#00ced1",       // Dark turquoise
      inner: "#87ceeb"         // Sky blue inner ring
    },
    size: {
      ring: 1.0,
      thickness: 0.5,
      flames: 1.0
    },
    particles: {
      count: 45,
      speed: 3.5,
      lifetime: 1.5
    },
    intensity: 1.5,
    shake: 0.32,
    custom: {
      ringLayers: 3,           // Concentric rings
      flameSpouts: 12,         // Ice spikes around ring
      rotation: 2.0,           // Ring rotation speed
      pulseRate: 3.0
    }
  },

  ember_burst: {
    colors: {
      primary: "#00bfff",      // Deep sky blue
      secondary: "#00ced1",    // Dark turquoise
      accent: "#4dd0e1",       // Mid aqua
      ember: "#87ceeb"         // Sky blue droplets
    },
    size: {
      burst: 1.2,
      embers: 0.15,
      glow: 0.8
    },
    particles: {
      count: 80,               // Many small droplets
      speed: 6.0,
      lifetime: 2.0
    },
    intensity: 1.6,
    shake: 0.28,
    custom: {
      emberCount: 100,         // Total droplet particles
      burstDirections: 24,     // Radial burst directions
      floatEffect: true,       // Droplets float/fall
      glowPulse: 2.5
    }
  },

  pyroclasm: {
    colors: {
      primary: "#00bfff",      // Deep sky blue (massive)
      secondary: "#003d5a",    // Deep ocean
      accent: "#87ceeb",       // Sky blue
      explosion: "#b0e0e6"     // Powder blue explosion
    },
    size: {
      explosion: 3.0,          // Massive explosion
      shockwave: 4.0,
      debris: 1.5
    },
    particles: {
      count: 100,              // Maximum particles
      speed: 10.0,
      lifetime: 2.5
    },
    intensity: 3.0,
    shake: 0.4,
    custom: {
      explosionStages: 3,      // Multi-stage explosion
      shockwaveRings: 5,       // Multiple shockwaves
      debrisCount: 50,         // Flying debris
      craterSize: 3.0,         // Impact crater
      fireColumns: 12,         // Vertical water columns
      groundCracks: 20         // Radiating ice cracks
    }
  }
});

/**
 * Get FX configuration for a skill, with fallback to default water effect
 */
export function getSkillFX(skillId) {
  return SKILL_FX[skillId] || {
    colors: {
      primary: "#4dd0e1",
      secondary: "#00bfff",
      accent: "#87ceeb",
      glow: "#00ced1"
    },
    size: {
      default: 1.0
    },
    particles: {
      count: 20,
      speed: 3.0,
      lifetime: 1.0
    },
    intensity: 1.0,
    shake: 0.2,
    custom: {}
  };
}
