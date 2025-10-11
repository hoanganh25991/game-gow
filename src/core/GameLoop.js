/**
 * GameLoop
 * Manages the main animation loop, delta time calculation, and system update coordination.
 * Handles performance budgeting and frame skip logic for mobile optimization.
 *
 * Public API:
 *   const gameLoop = new GameLoop({ 
 *     now, 
 *     isMobile, 
 *     MOBILE_OPTIMIZATIONS,
 *     onUpdate: (dt, t) => { ... }
 *   });
 *   gameLoop.start();
 *   gameLoop.stop();
 */
export class GameLoop {
  // Private fields
  #now;
  #isMobile;
  #MOBILE_OPTIMIZATIONS;
  #onUpdate;

  // Loop state
  #isRunning = false;
  #lastT = 0;
  #animationFrameId = null;

  // Performance budgeting
  #frameBudgetMs;
  #frameStartMs = 0;

  constructor({ now, isMobile, MOBILE_OPTIMIZATIONS, onUpdate }) {
    this.#now = now;
    this.#isMobile = isMobile;
    this.#MOBILE_OPTIMIZATIONS = MOBILE_OPTIMIZATIONS;
    this.#onUpdate = onUpdate;

    // Set frame budget based on platform
    this.#frameBudgetMs = isMobile
      ? (MOBILE_OPTIMIZATIONS?.frameBudgetMs || 10.0)
      : 10.0;

    // Allow runtime tuning
    try {
      if (typeof window !== 'undefined') {
        window.__FRAME_BUDGET_MS = this.#frameBudgetMs;
      }
    } catch (_) { }
  }

  /**
   * Check if current frame is over budget
   * @private
   */
  #isOverBudget() {
    return (performance.now() - this.#frameStartMs) > this.#frameBudgetMs;
  }

  /**
   * Calculate delta time with safety clamp
   * @private
   */
  #calculateDeltaTime(t) {
    // Clamp dt to max 50ms (0.05s) to avoid physics explosions on lag spikes
    return Math.min(0.05, t - this.#lastT);
  }

  /**
   * Main animation loop tick
   * @private
   */
  #tick = () => {
    if (!this.#isRunning) return;

    this.#animationFrameId = requestAnimationFrame(this.#tick);

    // Track frame timing
    this.#frameStartMs = performance.now();

    const t = this.#now();
    const dt = this.#calculateDeltaTime(t);
    this.#lastT = t;

    // Call the update callback with delta time, current time, and budget checker
    try {
      this.#onUpdate(dt, t, {
        isOverBudget: () => this.#isOverBudget(),
        frameStartMs: this.#frameStartMs,
        frameBudgetMs: this.#frameBudgetMs
      });
    } catch (err) {
      console.error('[GameLoop] Update error:', err);
    }
  };

  /**
   * Start the game loop
   */
  start() {
    if (this.#isRunning) return;

    this.#isRunning = true;
    this.#lastT = this.#now();
    this.#tick();

    console.info('[GameLoop] Started');
  }

  /**
   * Stop the game loop
   */
  stop() {
    if (!this.#isRunning) return;

    this.#isRunning = false;

    if (this.#animationFrameId !== null) {
      cancelAnimationFrame(this.#animationFrameId);
      this.#animationFrameId = null;
    }

    console.info('[GameLoop] Stopped');
  }

  /**
   * Check if loop is currently running
   */
  isRunning() {
    return this.#isRunning;
  }

  /**
   * Update frame budget (for runtime tuning)
   */
  setFrameBudget(ms) {
    this.#frameBudgetMs = Math.max(1, ms);
    try {
      if (typeof window !== 'undefined') {
        window.__FRAME_BUDGET_MS = this.#frameBudgetMs;
      }
    } catch (_) { }
  }

  /**
   * Get current frame budget
   */
  getFrameBudget() {
    return this.#frameBudgetMs;
  }
}
