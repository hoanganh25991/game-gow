// GoW RPG — Fully Refactored with Class-Based Architecture
// Main entry point - uses GameApp class for orchestration

import { GameApp } from "./core/GameApp.js";

// Create and initialize the game application
const app = new GameApp();

// Initialize and start the game
app.init().then(() => {
  app.start();
}).catch((err) => {
  console.error("[GameApp] Initialization failed:", err);
});
