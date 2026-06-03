// ============================================================================
// STORAGE LAYER — ISOLATED DATA ACCESS
// ============================================================================
// Only file that touches localStorage. All UI code imports from here.
// To change backend (e.g. Supabase): rewrite this file only. App.jsx untouched.
// ============================================================================

const STORAGE_KEY = "emotracker_v1";

// --- SCHEMA VERSION ---
// Bump when data shape changes. Add matching migration below.
export const SCHEMA_VERSION = 2;

// --- MIGRATIONS ---
// Each key = target version. Receives previous version data, returns new shape.
const migrations = {
  2: (data) => ({
    ...data,
    workouts:       [],
    yogaMilestones: []
  })
};

function initialState() {
  return {
    schemaVersion:  SCHEMA_VERSION,
    entries:        [],
    workouts:       [],
    yogaMilestones: [],
    metadata: {
      createdAt:    new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
  };
}

function migrate(data) {
  const current = data.schemaVersion || 1;
  if (current === SCHEMA_VERSION) return data;
  if (current > SCHEMA_VERSION) { console.warn("Data newer than app build."); return data; }
  let migrated = data;
  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    if (migrations[v]) migrated = migrations[v](migrated);
    migrated.schemaVersion = v;
  }
  return migrated;
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    return migrate(JSON.parse(raw));
  } catch (e) {
    console.error("Load failed, starting fresh:", e);
    return initialState();
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      schemaVersion: SCHEMA_VERSION,
      metadata: { ...data.metadata, lastModified: new Date().toISOString() }
    }));
    return true;
  } catch (e) { console.error("Save failed:", e); return false; }
}

export function exportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `emotracker-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.entries || !Array.isArray(parsed.entries)) throw new Error("Invalid backup file");
        resolve(migrate(parsed));
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}

export function clearAllData() { localStorage.removeItem(STORAGE_KEY); }
