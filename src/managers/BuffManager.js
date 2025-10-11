/**
 * BuffManager
 * Manages all player buffs including:
 * - Village regeneration buff
 * - Villa regeneration buff
 * - Temple buffs (damage/attack speed/defense)
 * - Buff visual indicators (emoji sprites)
 *
 * Public API:
 *   const buffManager = new BuffManager({ THREE, player, setCenterMsg, clearCenterMsg });
 *   buffManager.applyVillageBuff();
 *   buffManager.removeVillageBuff();
 *   buffManager.applyVillaBuff();
 *   buffManager.removeVillaBuff();
 *   buffManager.applyTempleBuff();
 *   buffManager.removeTempleBuff();
 */
export class BuffManager {
  // Private fields
  #THREE;
  #player;
  #setCenterMsg;
  #clearCenterMsg;

  // Buff multipliers
  #VILLAGE_REGEN_MULT = 1.8;
  #VILLA_REGEN_MULT = 1.6;
  #TEMPLE_DAMAGE_MULT = 1.3;
  #TEMPLE_ATTACK_SPEED_MULT = 1.25;
  #TEMPLE_DEFENSE_MULT = 1.4;

  // Buff state
  #villageBuffActive = false;
  #villaBuffActive = false;
  #templeBuffActive = false;
  #currentTempleBuff = null;

  // Temple buff options
  #TEMPLE_BUFF_OPTIONS = ['damage', 'attackSpeed', 'defense'];

  // Buff indicators (emoji sprites attached to player mesh)
  #buffIndicators = {
    temple: null,    // Temple buff (⚔️/⚡/🛡️)
    villa: null,     // Villa HP regen (❤️)
    village: null    // Village HP regen (💚)
  };

  constructor({ THREE, player, setCenterMsg, clearCenterMsg }) {
    this.#THREE = THREE;
    this.#player = player;
    this.#setCenterMsg = setCenterMsg;
    this.#clearCenterMsg = clearCenterMsg;
  }

  /**
   * Create an emoji sprite for buff indicators
   * @private
   */
  #createEmojiSprite(emoji, size = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.font = `${size * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2);
    
    const texture = new this.#THREE.CanvasTexture(canvas);
    const material = new this.#THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new this.#THREE.Sprite(material);
    sprite.scale.set(1.5, 1.5, 1);
    return sprite;
  }

  /**
   * Show a buff indicator on the player
   * @private
   */
  #showBuffIndicator(type, emoji) {
    try {
      // Remove existing indicator of this type
      if (this.#buffIndicators[type]) {
        this.#player.mesh.remove(this.#buffIndicators[type]);
        this.#buffIndicators[type] = null;
      }
      
      // Create new indicator
      const sprite = this.#createEmojiSprite(emoji);
      
      // Calculate the center of the player mesh dynamically using bounding box
      const box = new this.#THREE.Box3().setFromObject(this.#player.mesh);
      const center = box.getCenter(new this.#THREE.Vector3());
      const centerY = center.y;
      
      // Position based on how many buffs are active
      const activeCount = Object.values(this.#buffIndicators).filter(b => b !== null).length;
      sprite.position.set(activeCount * 1.8 - 1.8, centerY, 0);
      
      this.#buffIndicators[type] = sprite;
      this.#player.mesh.add(sprite);
    } catch (_) {}
  }

  /**
   * Hide a buff indicator
   * @private
   */
  #hideBuffIndicator(type) {
    try {
      if (this.#buffIndicators[type]) {
        this.#player.mesh.remove(this.#buffIndicators[type]);
        this.#buffIndicators[type] = null;
        
        // Reposition remaining indicators
        let index = 0;
        for (const [key, indicator] of Object.entries(this.#buffIndicators)) {
          if (indicator) {
            const activeCount = Object.values(this.#buffIndicators).filter(b => b !== null).length;
            indicator.position.x = index * 1.8 - (activeCount - 1) * 0.9;
            index++;
          }
        }
      }
    } catch (_) {}
  }

  /**
   * Apply village regeneration buff
   */
  applyVillageBuff() {
    if (this.#villageBuffActive) return;
    this.#villageBuffActive = true;

    try { this.#player._villageBaseHpRegen = this.#player.hpRegen || 0; } catch (_) {}
    try { this.#player.hpRegen = (this.#player.hpRegen || 0) * this.#VILLAGE_REGEN_MULT; } catch (_) {}
    try { this.#player._villageBaseMpRegen = this.#player.mpRegen || 0; } catch (_) {}
    try { this.#player.mpRegen = (this.#player.mpRegen || 0) * this.#VILLAGE_REGEN_MULT; } catch (_) {}
    
    try { this.#setCenterMsg?.('HP regeneration increased'); } catch (_) {}
    try { this.#showBuffIndicator('village', '💚'); } catch (_) {}
    
    setTimeout(() => { try { this.#clearCenterMsg?.(); } catch (_) {} }, 1400);
  }

  /**
   * Remove village regeneration buff
   */
  removeVillageBuff() {
    if (!this.#villageBuffActive) return;
    this.#villageBuffActive = false;

    try { if (typeof this.#player._villageBaseHpRegen === 'number') this.#player.hpRegen = this.#player._villageBaseHpRegen; } catch (_) {}
    try { if (typeof this.#player._villageBaseMpRegen === 'number') this.#player.mpRegen = this.#player._villageBaseMpRegen; } catch (_) {}
    try { delete this.#player._villageBaseHpRegen; } catch (_) {}
    try { delete this.#player._villageBaseMpRegen; } catch (_) {}
    try { this.#hideBuffIndicator('village'); } catch (_) {}
  }

  /**
   * Apply villa regeneration buff
   */
  applyVillaBuff() {
    if (this.#villaBuffActive) return;
    this.#villaBuffActive = true;

    try { this.#player._villaBaseHpRegen = this.#player.hpRegen || 0; } catch (_) {}
    try { this.#player.hpRegen = (this.#player.hpRegen || 0) * this.#VILLA_REGEN_MULT; } catch (_) {}
    try { this.#player._villaBaseMpRegen = this.#player.mpRegen || 0; } catch (_) {}
    try { this.#player.mpRegen = (this.#player.mpRegen || 0) * this.#VILLA_REGEN_MULT; } catch (_) {}
    
    try { this.#setCenterMsg?.('HP regeneration increased (villa)'); } catch (_) {}
    try { this.#showBuffIndicator('villa', '❤️'); } catch (_) {}
    
    setTimeout(() => { try { this.#clearCenterMsg?.(); } catch (_) {} }, 1400);
  }

  /**
   * Remove villa regeneration buff
   */
  removeVillaBuff() {
    if (!this.#villaBuffActive) return;
    this.#villaBuffActive = false;

    try { if (typeof this.#player._villaBaseHpRegen === 'number') this.#player.hpRegen = this.#player._villaBaseHpRegen; } catch (_) {}
    try { if (typeof this.#player._villaBaseMpRegen === 'number') this.#player.mpRegen = this.#player._villaBaseMpRegen; } catch (_) {}
    try { delete this.#player._villaBaseHpRegen; } catch (_) {}
    try { delete this.#player._villaBaseMpRegen; } catch (_) {}
    try { this.#hideBuffIndicator('villa'); } catch (_) {}
  }

  /**
   * Apply random temple buff (damage/attack speed/defense)
   */
  applyTempleBuff() {
    if (this.#templeBuffActive) return;
    this.#templeBuffActive = true;
    
    // Randomly select one of three buffs
    const buffType = this.#TEMPLE_BUFF_OPTIONS[Math.floor(Math.random() * this.#TEMPLE_BUFF_OPTIONS.length)];
    this.#currentTempleBuff = buffType;
    
    if (buffType === 'damage') {
      try { this.#player._templeBaseDamage = this.#player.attackDamage || 0; } catch (_) {}
      try { this.#player.attackDamage = Math.floor((this.#player.attackDamage || 0) * this.#TEMPLE_DAMAGE_MULT); } catch (_) {}
      try { this.#setCenterMsg?.('Divine power increases your damage!'); } catch (_) {}
      try { this.#showBuffIndicator('temple', '⚔️'); } catch (_) {}
    } else if (buffType === 'attackSpeed') {
      try { this.#player._templeBaseAttackSpeed = this.#player.attackSpeed || 1; } catch (_) {}
      try { this.#player.attackSpeed = (this.#player.attackSpeed || 1) * this.#TEMPLE_ATTACK_SPEED_MULT; } catch (_) {}
      try { this.#setCenterMsg?.('Divine blessing increases your attack speed!'); } catch (_) {}
      try { this.#showBuffIndicator('temple', '⚡'); } catch (_) {}
    } else if (buffType === 'defense') {
      try { this.#player._templeBaseDefense = this.#player.defense || 0; } catch (_) {}
      try { this.#player.defense = Math.floor((this.#player.defense || 0) + 10); } catch (_) {}
      try { this.#setCenterMsg?.('Divine protection increases your defense!'); } catch (_) {}
      try { this.#showBuffIndicator('temple', '🛡️'); } catch (_) {}
    }
    
    setTimeout(() => { try { this.#clearCenterMsg?.(); } catch (_) {} }, 1400);
  }

  /**
   * Remove temple buff
   */
  removeTempleBuff() {
    if (!this.#templeBuffActive) return;
    this.#templeBuffActive = false;
    
    if (this.#currentTempleBuff === 'damage') {
      try { if (typeof this.#player._templeBaseDamage === 'number') this.#player.attackDamage = this.#player._templeBaseDamage; } catch (_) {}
      try { delete this.#player._templeBaseDamage; } catch (_) {}
    } else if (this.#currentTempleBuff === 'attackSpeed') {
      try { if (typeof this.#player._templeBaseAttackSpeed === 'number') this.#player.attackSpeed = this.#player._templeBaseAttackSpeed; } catch (_) {}
      try { delete this.#player._templeBaseAttackSpeed; } catch (_) {}
    } else if (this.#currentTempleBuff === 'defense') {
      try { if (typeof this.#player._templeBaseDefense === 'number') this.#player.defense = this.#player._templeBaseDefense; } catch (_) {}
      try { delete this.#player._templeBaseDefense; } catch (_) {}
    }
    
    this.#currentTempleBuff = null;
    try { this.#hideBuffIndicator('temple'); } catch (_) {}
  }

  /**
   * Check if a specific buff is active
   */
  isBuffActive(buffType) {
    switch (buffType) {
      case 'village': return this.#villageBuffActive;
      case 'villa': return this.#villaBuffActive;
      case 'temple': return this.#templeBuffActive;
      default: return false;
    }
  }

  /**
   * Get current temple buff type (if active)
   */
  getCurrentTempleBuff() {
    return this.#currentTempleBuff;
  }
}
