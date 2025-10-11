export const FX = {
  // Global VFX timing controls. Increase timeScale to make effects last longer.
  // Reduce the *_RateScale to slow animations (fade, scaling, spins, orbits).
  timeScale: 1.6 * 1.2,          // >1 = longer lifetimes (slower overall VFX)
  fadeSpeedScale: 0.6 / 1.2,     // <1 = slower fades
  scaleRateScale: 0.6 / 1.2,     // <1 = slower scale growth animations
  spinRateScale: 0.6 / 1.2,      // <1 = slower spin animations
  orbitRateScale: 0.6 / 1.2,     // <1 = slower orbit movement
  pulseRateScale: 0.6 / 1.2,     // <1 = slower pulsing (breathing) animations
  popupDurationScale: 1.5 * 2, // >1 = damage popups linger longer
  sfxOnCast: true          // play a generic "cast" sound immediately on skill cast
};
