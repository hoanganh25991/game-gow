export const LOCAL_STORAGE_PREFIX = "gof";

export const storageKey = (suffix, separator = ".") => {
  const suffixStr = String(suffix ?? "");
  const sep = typeof separator === "string" ? separator : ".";
  return `${LOCAL_STORAGE_PREFIX}${sep || ""}${suffixStr}`;
};

export const STORAGE_KEYS = {
  lang: storageKey("lang"),
  renderPrefs: storageKey("renderPrefs"),
  envPrefs: storageKey("envPrefs"),
  audioPrefs: storageKey("audioPrefs"),
  uiPrefs: storageKey("uiPrefs"),
  pendingReloadReason: storageKey("pendingReloadReason"),
  appPurchased: storageKey("app.purchased"),
  playerLevel: storageKey("playerLevel"),
  mapCurrentIndex: storageKey("mapCurrentIndex"),
  mapUnlockedMax: storageKey("mapUnlockedMax"),
  upliftChoices: storageKey("upliftChoices_v1"),
  persistentMarks: storageKey("persistentMarks"),
  markNextReadyAt: storageKey("markNextReadyAt"),
  villages: storageKey("dynamic.villages.v1"),
  roads: storageKey("dynamic.roads.v1"),
  roadsGeom: storageKey("dynamic.roads_geom.v1"),
  worldSeed: storageKey("worldSeed"),
  chunkPrefix: storageKey("chunk"),
  lang: storageKey("lang"),
  fireLoadout: storageKey("fire_loadout"),
  skillLevels: storageKey("skill_levels"),
  skillPoints: storageKey("skill_points"),
  unlockedSkills: storageKey("unlocked_skills"),
};
