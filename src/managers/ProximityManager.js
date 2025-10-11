/**
 * ProximityManager
 * Manages proximity detection for structures (temples, villas, columns, statues, obelisks)
 * and triggers appropriate messages and buff application.
 *
 * Public API:
 *   const proximityManager = new ProximityManager({
 *     player, chunkMgr, villaStructures, buffManager, 
 *     setCenterMsg, clearCenterMsg, getStructureProtectionRadius
 *   });
 *   proximityManager.update();
 */
export class ProximityManager {
  // Private fields
  #player;
  #chunkMgr;
  #villaStructures;
  #buffManager;
  #setCenterMsg;
  #clearCenterMsg;
  #getStructureProtectionRadius;

  // Proximity state
  #nearVilla = false;
  #nearTemple = false;
  #nearStructure = null;
  #lastStructureMessage = 0;

  // Constants
  #STRUCTURE_MESSAGE_COOLDOWN = 3000; // 3 seconds between messages
  #PROXIMITY_DISTANCE = 15; // Distance for structure message triggers

  // Structure-specific messages
  #STRUCTURE_MESSAGES = {
    temple: [
      'Ancient power emanates from {name}',
      'You feel a divine presence at {name}',
      'Sacred energy surrounds {name}'
    ],
    villa: [
      '{name} stands as a testament to ancient architecture',
      'You admire the craftsmanship of {name}',
      '{name} exudes an aura of sophistication'
    ],
    column: [
      '{name} reaches toward the heavens',
      'Ancient strength flows through {name}',
      '{name} stands as a pillar of history'
    ],
    statue: [
      '{name} captures a moment of eternal glory',
      'You gaze upon the majestic {name}',
      '{name} tells stories of ancient heroes'
    ],
    obelisk: [
      '{name} pierces the sky with mystical energy',
      'Ancient knowledge is encoded in {name}',
      '{name} channels power from the cosmos'
    ]
  };

  constructor({ 
    player, 
    chunkMgr, 
    villaStructures, 
    buffManager, 
    setCenterMsg, 
    clearCenterMsg,
    getStructureProtectionRadius 
  }) {
    this.#player = player;
    this.#chunkMgr = chunkMgr;
    this.#villaStructures = villaStructures;
    this.#buffManager = buffManager;
    this.#setCenterMsg = setCenterMsg;
    this.#clearCenterMsg = clearCenterMsg;
    this.#getStructureProtectionRadius = getStructureProtectionRadius;
  }

  /**
   * Get a random proximity message for a structure
   * @private
   */
  #getStructureProximityMessage(structureType, structureName) {
    const messages = this.#STRUCTURE_MESSAGES[structureType] || [`You discover {name}`];
    const template = messages[Math.floor(Math.random() * messages.length)];
    return template.replace('{name}', structureName);
  }

  /**
   * Check proximity to structures and display messages
   * @private
   */
  #checkStructureProximity() {
    if (!this.#player || !this.#chunkMgr) return;
    
    const playerPos = this.#player.pos();
    const structuresAPI = this.#chunkMgr.getStructuresAPI();
    if (!structuresAPI) return;
    
    const structures = structuresAPI.listStructures();
    let closestStructure = null;
    let closestDistance = Infinity;
    
    // Find closest structure within proximity distance
    for (const structure of structures) {
      const distance = Math.hypot(playerPos.x - structure.position.x, playerPos.z - structure.position.z);
      if (distance < this.#PROXIMITY_DISTANCE && distance < closestDistance) {
        closestDistance = distance;
        closestStructure = structure;
      }
    }
    
    // Check if we entered or left a structure's proximity
    const now = Date.now();
    if (closestStructure && closestStructure !== this.#nearStructure) {
      this.#nearStructure = closestStructure;
      if (now - this.#lastStructureMessage > this.#STRUCTURE_MESSAGE_COOLDOWN) {
        const message = this.#getStructureProximityMessage(
          closestStructure.type, 
          closestStructure.name
        );
        try { this.#setCenterMsg?.(message); } catch (_) {}
        setTimeout(() => { try { this.#clearCenterMsg?.(); } catch (_) {} }, 3000);
        this.#lastStructureMessage = now;
      }
    } else if (!closestStructure && this.#nearStructure) {
      this.#nearStructure = null;
    }
  }

  /**
   * Check villa proximity and apply/remove buff
   * @private
   */
  #checkVillaProximity() {
    try {
      const pp = this.#player.pos();
      let near = false;
      
      // Check static villas
      for (const v of this.#villaStructures) {
        const d = Math.hypot(pp.x - v.center.x, pp.z - v.center.z);
        if (d <= (v.radius + 2)) { 
          near = true; 
          break; 
        }
      }
      
      // Check chunked villas if not already near a static villa
      if (!near && this.#chunkMgr) {
        try {
          const structuresAPI = this.#chunkMgr.getStructuresAPI();
          if (structuresAPI) {
            const structures = structuresAPI.listStructures();
            for (const s of structures) {
              if (s.type === 'villa') {
                const d = Math.hypot(pp.x - s.position.x, pp.z - s.position.z);
                const checkRadius = s.protectionRadius || this.#getStructureProtectionRadius('villa');
                if (d <= checkRadius) { 
                  near = true; 
                  break; 
                }
              }
            }
          }
        } catch (_) {}
      }
      
      // Apply or remove buff based on proximity
      if (near && !this.#nearVilla) {
        this.#nearVilla = true;
        try { this.#buffManager?.applyVillaBuff(); } catch (_) {}
      } else if (!near && this.#nearVilla) {
        this.#nearVilla = false;
        try { this.#buffManager?.removeVillaBuff(); } catch (_) {}
      }
    } catch (_) {}
  }

  /**
   * Check temple proximity and apply/remove buff
   * @private
   */
  #checkTempleProximity() {
    try {
      const pp = this.#player.pos();
      let nearTemple = false;
      
      if (this.#chunkMgr) {
        const structuresAPI = this.#chunkMgr.getStructuresAPI();
        if (structuresAPI) {
          const structures = structuresAPI.listStructures();
          for (const s of structures) {
            if (s.type === 'temple') {
              const d = Math.hypot(pp.x - s.position.x, pp.z - s.position.z);
              const checkRadius = s.protectionRadius || this.#getStructureProtectionRadius('temple');
              if (d <= checkRadius) { 
                nearTemple = true; 
                break; 
              }
            }
          }
        }
      }
      
      // Apply or remove buff based on proximity
      if (nearTemple && !this.#nearTemple) {
        this.#nearTemple = true;
        try { this.#buffManager?.applyTempleBuff(); } catch (_) {}
      } else if (!nearTemple && this.#nearTemple) {
        this.#nearTemple = false;
        try { this.#buffManager?.removeTempleBuff(); } catch (_) {}
      }
    } catch (_) {}
  }

  /**
   * Update all proximity checks
   * Should be called once per frame or throttled
   */
  update() {
    this.#checkStructureProximity();
    this.#checkVillaProximity();
    this.#checkTempleProximity();
  }

  /**
   * Get current proximity state (for debugging)
   */
  getProximityState() {
    return {
      nearVilla: this.#nearVilla,
      nearTemple: this.#nearTemple,
      nearStructure: this.#nearStructure
    };
  }
}
