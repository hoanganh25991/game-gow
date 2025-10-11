/**
 * WorldManager
 * Manages Three.js world setup including scene, camera, renderer, and ground grid.
 * Handles camera updates, grid following, and resize events.
 *
 * Public API:
 *   const worldManager = new WorldManager({ 
 *     initWorld, 
 *     updateCamera, 
 *     updateGridFollow,
 *     addResizeHandler 
 *   });
 *   const { renderer, scene, camera, ground, cameraOffset, cameraShake } = worldManager.getWorld();
 *   worldManager.updateCameraForPlayer(player, lastMoveDir, dt);
 *   worldManager.updateGridForPlayer(player);
 *   worldManager.render();
 */
export class WorldManager {
  // Private fields for world initialization
  #initWorld;
  #updateCamera;
  #updateGridFollow;
  #addResizeHandler;

  // World components
  #renderer;
  #scene;
  #camera;
  #ground;
  #cameraOffset;
  #cameraShake;
  #baseCameraOffset;

  // Camera mode state
  #firstPersonMode = false;
  #defaultCameraNear;
  #defaultCameraFov;

  constructor({ initWorld, updateCamera, updateGridFollow, addResizeHandler }) {
    this.#initWorld = initWorld;
    this.#updateCamera = updateCamera;
    this.#updateGridFollow = updateGridFollow;
    this.#addResizeHandler = addResizeHandler;

    // Initialize the world
    this.#initialize();
  }

  /**
   * Initialize Three.js world
   * @private
   */
  #initialize() {
    const world = this.#initWorld();

    this.#renderer = world.renderer;
    this.#scene = world.scene;
    this.#camera = world.camera;
    this.#ground = world.ground;
    this.#cameraOffset = world.cameraOffset;
    this.#cameraShake = world.cameraShake;

    // Store base camera offset for reset
    this.#baseCameraOffset = this.#cameraOffset.clone();

    // Store default camera settings
    this.#defaultCameraNear = this.#camera.near || 0.1;
    this.#defaultCameraFov = this.#camera.fov || 60;

    // Setup resize handler
    this.#addResizeHandler(this.#renderer, this.#camera);

    console.info('[WorldManager] Initialized');
  }

  /**
   * Get all world components
   */
  getWorld() {
    return {
      renderer: this.#renderer,
      scene: this.#scene,
      camera: this.#camera,
      ground: this.#ground,
      cameraOffset: this.#cameraOffset,
      cameraShake: this.#cameraShake,
      baseCameraOffset: this.#baseCameraOffset
    };
  }

  /**
   * Get renderer
   */
  getRenderer() {
    return this.#renderer;
  }

  /**
   * Get scene
   */
  getScene() {
    return this.#scene;
  }

  /**
   * Get camera
   */
  getCamera() {
    return this.#camera;
  }

  /**
   * Get ground
   */
  getGround() {
    return this.#ground;
  }

  /**
   * Get camera offset
   */
  getCameraOffset() {
    return this.#cameraOffset;
  }

  /**
   * Get base camera offset
   */
  getBaseCameraOffset() {
    return this.#baseCameraOffset;
  }

  /**
   * Get camera shake
   */
  getCameraShake() {
    return this.#cameraShake;
  }

  /**
   * Update camera for player (third-person mode)
   */
  updateCameraForPlayer(player, lastMoveDir, dt) {
    if (this.#firstPersonMode) return; // Skip if in FP mode

    try {
      this.#updateCamera(
        this.#camera,
        player,
        lastMoveDir,
        dt,
        this.#cameraOffset,
        this.#cameraShake
      );
    } catch (err) {
      console.error('[WorldManager] Camera update failed:', err);
    }
  }

  /**
   * Update grid to follow player
   */
  updateGridForPlayer(player) {
    try {
      this.#updateGridFollow(this.#ground, player);
    } catch (err) {
      console.error('[WorldManager] Grid update failed:', err);
    }
  }

  /**
   * Render the scene
   */
  render() {
    try {
      this.#renderer.render(this.#scene, this.#camera);
    } catch (err) {
      console.error('[WorldManager] Render failed:', err);
    }
  }

  /**
   * Set first-person mode
   */
  setFirstPersonMode(enabled, player = null, heroBars = null) {
    this.#firstPersonMode = !!enabled;

    if (this.#firstPersonMode) {
      // First-person mode: tighter near plane and wider FOV
      this.#camera.near = 0.01;
      this.#camera.fov = 75;
      this.#camera.updateProjectionMatrix();

      // Hide torso/head/cloak parts so arms remain visible
      try {
        if (player?.mesh?.userData?.fpHide) {
          player.mesh.userData.fpHide.forEach((o) => { if (o) o.visible = false; });
        }
        if (heroBars?.container) {
          heroBars.container.visible = false;
        }
      } catch (_) { }
    } else {
      // Third-person mode: restore defaults
      this.#camera.near = this.#defaultCameraNear;
      this.#camera.fov = this.#defaultCameraFov;
      this.#camera.updateProjectionMatrix();

      // Restore visibility
      try {
        if (player?.mesh?.userData?.fpHide) {
          player.mesh.userData.fpHide.forEach((o) => { if (o) o.visible = true; });
        }
        if (heroBars?.container) {
          heroBars.container.visible = true;
        }
      } catch (_) { }
    }
  }

  /**
   * Check if in first-person mode
   */
  isFirstPersonMode() {
    return this.#firstPersonMode;
  }

  /**
   * Reset camera offset to base
   */
  resetCameraOffset() {
    this.#cameraOffset.copy(this.#baseCameraOffset);
  }

  /**
   * Add object to scene
   */
  addToScene(object) {
    this.#scene.add(object);
  }

  /**
   * Remove object from scene
   */
  removeFromScene(object) {
    this.#scene.remove(object);
  }

  /**
   * Get renderer DOM element
   */
  getRendererDomElement() {
    return this.#renderer.domElement;
  }

  /**
   * Dispose world resources (cleanup)
   */
  dispose() {
    try {
      // Traverse scene and dispose geometries/materials
      this.#scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      // Dispose renderer
      this.#renderer.dispose();

      console.info('[WorldManager] Disposed');
    } catch (err) {
      console.error('[WorldManager] Disposal failed:', err);
    }
  }
}
