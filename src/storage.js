// ============================================================================
// STORAGE LAYER — ISOLATED DATA ACCESS
// ============================================================================
// This file is the ONLY place that touches persistence. Never import
// localStorage, IndexedDB, or Supabase directly in UI components. If you
// change backends later (e.g. to Supabase cloud sync), you change only
// this file — the UI keeps working.
// ============================================================================

const STORAGE_KEY = "emotracker_v1";

// --- SCHEMA VERSION ---
// Bump this number whenever the shape of the saved data changes.
// Then add a migration function below. Existing users' data will be
// migrated automatically on next app load.
export const SCHEMA_VERSION = 1;

// --- MIGRATIONS ---
// Each key is a target version. The function receives the PREVIOUS
// version's data and must return the new version's data.
//
// EXAMPLE (future): if v2 adds a `tags` field to each entry:
//   2: (data) => ({
//     ...data,
//     entries: data.entries.map(e => ({ ...e, tags: [] }))
//   })
//
// NEVER delete old migrations — they're needed for users who skip versions.
const migrations = {
  // 1 is the initial version; no migration needed.
};

// --- DEFAULT SHAPE ---
function initialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    entries: [],
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
  };
}

// --- MIGRATE ---
function migrate(data) {
  const current = data.schemaVersion || 1;
  if (current === SCHEMA_VERSION) return data;
  if (current > SCHEMA_VERSION) {
    // Data is newer than this app build. Don't wipe — just load as-is
    // and warn. User probably opened the app on an older browser.
    console.warn("Data schema is newer than app version. Loading as-is.");
    return data;
  }
  let migrated = data;
  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    if (migrations[v]) {
      migrated = migrations[v](migrated);
    }
    migrated.schemaVersion = v;
  }
  return migrated;
}

// --- PUBLIC API ---

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch (e) {
    console.error("Load failed, starting fresh:", e);
    return initialState();
  }
}

export function saveData(data) {
  try {
    const toSave = {
      ...data,
      schemaVersion: SCHEMA_VERSION,
      metadata: {
        ...data.metadata,
        lastModified: new Date().toISOString()
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return true;
  } catch (e) {
    console.error("Save failed:", e);
    return false;
  }
}

// --- EXPORT / IMPORT (user-facing backup mechanism) ---

export function exportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().split("T")[0];
  a.download = `emotracker-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.entries || !Array.isArray(parsed.entries)) {
          throw new Error("Invalid backup file");
        }
        const migrated = migrate(parsed);
        resolve(migrated);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}
