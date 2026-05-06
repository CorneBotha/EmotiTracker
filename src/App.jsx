import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus, X, Check, ChevronRight, BookOpen, BarChart3, Settings,
  Trash2, Clock, Brain, Flame, Download, Upload, AlertTriangle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  loadData, saveData, exportJSON, importJSON, clearAllData, SCHEMA_VERSION
} from "./storage.js";

// ---------- CONSTANTS ----------
const EMOTIONS = {
  positive: [
    "Joy", "Gratitude", "Pride", "Excitement", "Calm",
    "Confident", "Inspired", "Focused", "Satisfied", "Relief"
  ],
  negative: [
    "Anger", "Frustration", "Anxiety", "Fear", "Sadness",
    "Shame", "Envy", "Disappointment", "Overwhelm", "Guilt"
  ],
  neutral: [
    "Curious", "Surprised", "Nostalgic", "Conflicted",
    "Restless", "Bored", "Skeptical", "Alert"
  ]
};

const CATEGORY_COLORS = {
  positive: "#7a9b76",
  negative: "#b85c5c",
  neutral: "#b8a86b"
};

// ---------- HELPERS ----------
const todayStr = () => new Date().toISOString().split("T")[0];
const isToday = (iso) => iso.split("T")[0] === todayStr();
const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

const categoryOf = (emotion) => {
  for (const cat of Object.keys(EMOTIONS)) {
    if (EMOTIONS[cat].includes(emotion)) return cat;
  }
  return "neutral";
};

// ============================================================================
// MAIN
// ============================================================================
export default function App() {
  const [data, setData] = useState(null);
  const [view, setView] = useState("log");
  const [showAdd, setShowAdd] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);

  // Load on mount
  useEffect(() => {
    setData(loadData());
  }, []);

  // Save on every change
  useEffect(() => {
    if (data) saveData(data);
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-500 flex items-center justify-center font-mono text-xs">
        LOADING…
      </div>
    );
  }

  const entries = data.entries;
  const setEntries = (next) =>
    setData({ ...data, entries: typeof next === "function" ? next(entries) : next });

  const addEntry = (e) => {
    setEntries([{ ...e, id: Date.now().toString() }, ...entries]);
    setShowAdd(false);
  };
  const updateEntry = (id, patch) =>
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const deleteEntry = (id) =>
    setEntries(entries.filter((e) => e.id !== id));

  const todayEntries = entries.filter((e) => isToday(e.timestamp));
  const unreviewedToday = todayEntries.filter((e) => !e.reviewed);

  return (
    <div className="min-h-screen w-full bg-stone-950 text-stone-100 font-body">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300..700;1,300..700&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
        .font-body { font-family: 'Instrument Sans', system-ui, sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      `}</style>

      <div className="relative max-w-lg mx-auto pb-24">
        <Header view={view} entries={entries} />

        <main className="px-5 pt-4">
          {view === "log" && (
            <LogView
              today={todayEntries}
              all={entries}
              onDelete={deleteEntry}
              unreviewedCount={unreviewedToday.length}
              onStartReview={() => { setReviewIdx(0); setView("review"); }}
            />
          )}

          {view === "review" && (
            <ReviewView
              unreviewed={unreviewedToday}
              idx={reviewIdx}
              setIdx={setReviewIdx}
              onSubmit={(id, patch) => {
                updateEntry(id, patch);
                if (reviewIdx + 1 >= unreviewedToday.length) {
                  setView("log"); setReviewIdx(0);
                } else {
                  setReviewIdx(reviewIdx + 1);
                }
              }}
              onExit={() => setView("log")}
            />
          )}

          {view === "patterns" && <PatternsView entries={entries} />}

          {view === "settings" && (
            <SettingsView
              data={data}
              onImport={(imported) => setData(imported)}
              onClear={() => setData(loadData())}
            />
          )}
        </main>

        {showAdd && <AddModal onClose={() => setShowAdd(false)} onSave={addEntry} />}

        <BottomNav view={view} setView={setView} onAdd={() => setShowAdd(true)} />
      </div>
    </div>
  );
}

// ---------- HEADER ----------
function Header({ view, entries }) {
  const count = entries.filter((e) => isToday(e.timestamp)).length;
  const titles = {
    log: "Today",
    review: "End-of-Day Review",
    patterns: "Patterns",
    settings: "Settings"
  };
  return (
    <header className="px-5 pt-8 pb-2 border-b border-stone-900">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
            {fmtDate(new Date().toISOString())}
          </div>
          <h1 className="font-display text-3xl italic tracking-tight mt-1">
            {titles[view]}
          </h1>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl text-amber-500">{String(count).padStart(2, "0")}</div>
          <div className="font-mono text-[10px] tracking-[0.15em] text-stone-500 uppercase">logs</div>
        </div>
      </div>
    </header>
  );
}

// ---------- LOG VIEW ----------
function LogView({ today, all, onDelete, unreviewedCount, onStartReview }) {
  const past = all.filter((e) => !isToday(e.timestamp)).slice(0, 10);
  return (
    <div className="space-y-6">
      {today.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-800 rounded">
          <p className="font-display italic text-stone-400 text-lg">No entries yet</p>
          <p className="font-mono text-[11px] tracking-wide text-stone-600 mt-2 uppercase">
            tap + to log an emotion
          </p>
        </div>
      ) : (
        <section className="space-y-2">
          {today.map((e) => (
            <EntryCard key={e.id} entry={e} onDelete={() => onDelete(e.id)} />
          ))}
        </section>
      )}

      {unreviewedCount > 0 && (
        <button
          onClick={onStartReview}
          className="w-full py-4 border border-amber-700/40 bg-amber-900/10 rounded flex items-center justify-between px-5 hover:bg-amber-900/20 transition"
        >
          <div className="text-left">
            <div className="font-display italic text-lg text-amber-200">End-of-day review</div>
            <div className="font-mono text-[10px] tracking-wide text-amber-600/80 uppercase mt-1">
              {unreviewedCount} {unreviewedCount === 1 ? "entry" : "entries"} to process
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-500" />
        </button>
      )}

      {past.length > 0 && (
        <section>
          <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3">
            Previous
          </div>
          <div className="space-y-2">
            {past.map((e) => (
              <EntryCard key={e.id} entry={e} onDelete={() => onDelete(e.id)} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EntryCard({ entry, onDelete, compact }) {
  const [expanded, setExpanded] = useState(false);
  const cat = entry.category || categoryOf(entry.emotion);
  const color = CATEGORY_COLORS[cat];
  return (
    <div
      className="border border-stone-800 bg-stone-900/40 rounded p-4"
      style={{ borderLeftWidth: "3px", borderLeftColor: color }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-lg">{entry.emotion}</span>
            <span className="font-mono text-xs text-stone-500">·</span>
            <span className="font-mono text-xs text-stone-400">{entry.intensity}/10</span>
            {entry.reviewed && (
              <span className="font-mono text-[9px] tracking-wider text-emerald-500/80 uppercase ml-1">
                ✓ reviewed
              </span>
            )}
          </div>
          <div className="font-mono text-[10px] text-stone-500 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            {fmtTime(entry.timestamp)}
            {compact && <span>· {fmtDate(entry.timestamp)}</span>}
          </div>
          {entry.trigger && (
            <p className="text-sm text-stone-300 mt-2 leading-snug">{entry.trigger}</p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-stone-600 hover:text-rose-400 p-1 shrink-0"
          aria-label="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {expanded && entry.reviewed && (
        <div className="mt-3 pt-3 border-t border-stone-800 space-y-2 font-mono text-xs">
          <div>
            <span className="text-stone-500 uppercase tracking-wider text-[9px]">Classification</span>
            <div className={entry.classification === "reflection" ? "text-emerald-400" : "text-rose-400"}>
              {entry.classification === "reflection" ? "Reflection (considered)" : "Reaction (impulsive)"}
            </div>
          </div>
          {entry.leverage && (
            <div>
              <span className="text-stone-500 uppercase tracking-wider text-[9px]">Leverage plan</span>
              <p className="text-stone-300 font-body text-sm mt-1">{entry.leverage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- ADD MODAL ----------
function AddModal({ onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("negative");
  const [emotion, setEmotion] = useState("");
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState("");

  const canSave = emotion && trigger.trim().length > 0;
  const handleSave = () => {
    onSave({
      timestamp: new Date().toISOString(),
      emotion, category, intensity,
      trigger: trigger.trim(),
      reviewed: false, classification: null, leverage: ""
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="w-full max-w-lg bg-stone-900 border-t sm:border border-stone-800 rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 sticky top-0 bg-stone-900 z-10">
          <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
            Log Emotion · {step}/3
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-6 space-y-6">
          {step === 1 && (
            <>
              <div>
                <label className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {["positive", "negative", "neutral"].map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCategory(c); setEmotion(""); }}
                      className={`py-3 rounded border text-sm capitalize transition ${
                        category === c
                          ? "border-stone-400 bg-stone-800 text-stone-100"
                          : "border-stone-800 text-stone-500 hover:border-stone-700"
                      }`}
                      style={category === c ? { borderLeftWidth: "3px", borderLeftColor: CATEGORY_COLORS[c] } : {}}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
                  Specific emotion
                </label>
                <div className="flex flex-wrap gap-2 mt-3">
                  {EMOTIONS[category].map((em) => (
                    <button
                      key={em}
                      onClick={() => setEmotion(em)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition ${
                        emotion === em
                          ? "bg-stone-100 text-stone-900 border-stone-100"
                          : "border-stone-700 text-stone-300 hover:border-stone-500"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!emotion}
                className="w-full py-3 bg-amber-600 text-stone-950 font-medium rounded disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <div>
                <label className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
                  Intensity
                </label>
                <div className="flex items-center gap-4 mt-4">
                  <span className="font-mono text-xs text-stone-500">1</span>
                  <input
                    type="range" min="1" max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="font-mono text-xs text-stone-500">10</span>
                </div>
                <div className="text-center mt-4">
                  <span className="font-display italic text-5xl text-amber-500">{intensity}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-stone-700 text-stone-300 rounded">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-amber-600 text-stone-950 font-medium rounded">Next</button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div>
                <label className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
                  What triggered it?
                </label>
                <textarea
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  placeholder="e.g. Conversation about finances"
                  autoFocus rows={4}
                  className="w-full mt-3 bg-stone-950 border border-stone-800 rounded p-3 text-stone-100 placeholder:text-stone-600 focus:border-stone-600 focus:outline-none resize-none"
                />
                <div className="font-mono text-[10px] text-stone-600 mt-2">
                  Brief is fine — full reflection happens end of day.
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex-1 py-3 border border-stone-700 text-stone-300 rounded">Back</button>
                <button
                  onClick={handleSave} disabled={!canSave}
                  className="flex-1 py-3 bg-amber-600 text-stone-950 font-medium rounded disabled:opacity-30"
                >
                  Save
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- REVIEW VIEW ----------
function ReviewView({ unreviewed, idx, setIdx, onSubmit, onExit }) {
  const entry = unreviewed[idx];
  const [classification, setClassification] = useState(null);
  const [leverage, setLeverage] = useState("");

  useEffect(() => {
    setClassification(null); setLeverage("");
  }, [idx, entry?.id]);

  if (!entry) {
    return (
      <div className="text-center py-16">
        <Check className="w-8 h-8 mx-auto text-emerald-500 mb-4" />
        <div className="font-display italic text-2xl">All processed</div>
        <button onClick={onExit} className="mt-6 px-6 py-2 border border-stone-700 rounded text-sm">
          Back to log
        </button>
      </div>
    );
  }

  const cat = entry.category || categoryOf(entry.emotion);
  const handleSubmit = () => {
    onSubmit(entry.id, { reviewed: true, classification, leverage: leverage.trim() });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1">
        {unreviewed.map((_, i) => (
          <div key={i} className={`h-0.5 flex-1 rounded ${i <= idx ? "bg-amber-500" : "bg-stone-800"}`} />
        ))}
      </div>
      <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">
        {idx + 1} of {unreviewed.length}
      </div>

      <div
        className="border border-stone-800 bg-stone-900/50 rounded p-5"
        style={{ borderLeftWidth: "3px", borderLeftColor: CATEGORY_COLORS[cat] }}
      >
        <div className="font-mono text-[10px] text-stone-500 mb-2">{fmtTime(entry.timestamp)}</div>
        <div className="font-display text-3xl italic">{entry.emotion}</div>
        <div className="font-mono text-sm text-stone-400 mt-1">intensity {entry.intensity}/10</div>
        <div className="mt-4 pt-4 border-t border-stone-800">
          <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-2">Trigger</div>
          <p className="text-stone-200">{entry.trigger}</p>
        </div>
      </div>

      <div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3">Your response</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setClassification("reflection")}
            className={`p-4 rounded border text-left transition ${
              classification === "reflection"
                ? "border-emerald-600 bg-emerald-950/30" : "border-stone-800"
            }`}
          >
            <Brain className="w-4 h-4 text-emerald-400 mb-2" />
            <div className="font-display italic text-base">Reflection</div>
            <div className="font-mono text-[10px] text-stone-500 mt-1">considered, processed</div>
          </button>
          <button
            onClick={() => setClassification("reaction")}
            className={`p-4 rounded border text-left transition ${
              classification === "reaction"
                ? "border-rose-600 bg-rose-950/30" : "border-stone-800"
            }`}
          >
            <Flame className="w-4 h-4 text-rose-400 mb-2" />
            <div className="font-display italic text-base">Reaction</div>
            <div className="font-mono text-[10px] text-stone-500 mt-1">impulsive, unfiltered</div>
          </button>
        </div>
      </div>

      <div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3">Leverage plan</div>
        <div className="font-display italic text-stone-400 text-sm mb-3">
          How do you use this better, or cause less damage?
        </div>
        <textarea
          value={leverage}
          onChange={(e) => setLeverage(e.target.value)}
          placeholder="e.g. Next time, pause 10 min before responding."
          rows={5}
          className="w-full bg-stone-950 border border-stone-800 rounded p-3 text-stone-100 placeholder:text-stone-600 focus:border-stone-600 focus:outline-none resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={onExit} className="px-4 py-3 border border-stone-700 text-stone-300 rounded">Exit</button>
        <button
          onClick={handleSubmit}
          disabled={!classification || leverage.trim().length === 0}
          className="flex-1 py-3 bg-amber-600 text-stone-950 font-medium rounded disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {idx + 1 < unreviewed.length
            ? <>Next <ChevronRight className="w-4 h-4" /></>
            : <>Finish <Check className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}

// ---------- PATTERNS VIEW ----------
function PatternsView({ entries }) {
  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const byEmotion = {}, byCategory = { positive: 0, negative: 0, neutral: 0 };
    let reflections = 0, reactions = 0, intensitySum = 0;
    entries.forEach((e) => {
      byEmotion[e.emotion] = (byEmotion[e.emotion] || 0) + 1;
      byCategory[e.category || categoryOf(e.emotion)] += 1;
      intensitySum += e.intensity;
      if (e.reviewed) {
        if (e.classification === "reflection") reflections++;
        else if (e.classification === "reaction") reactions++;
      }
    });
    return {
      total: entries.length,
      avgIntensity: (intensitySum / entries.length).toFixed(1),
      reflections, reactions,
      topEmotions: Object.entries(byEmotion).sort(([, a], [, b]) => b - a).slice(0, 6).map(([name, count]) => ({ name, count })),
      pieData: Object.entries(byCategory).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
    };
  }, [entries]);

  if (!stats) return (
    <div className="text-center py-16 text-stone-500">
      <BarChart3 className="w-6 h-6 mx-auto mb-3" />
      <div className="font-display italic">No data yet</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total logs" value={stats.total} />
        <StatCard label="Avg intensity" value={stats.avgIntensity} />
        <StatCard label="Reflections" value={stats.reflections} color="#7a9b76" />
        <StatCard label="Reactions" value={stats.reactions} color="#b85c5c" />
      </div>

      {(stats.reflections + stats.reactions) > 0 && (
        <div className="border border-stone-800 rounded p-4">
          <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3">Response ratio</div>
          <div className="flex h-2 rounded overflow-hidden">
            <div className="bg-emerald-600" style={{ width: `${(stats.reflections / (stats.reflections + stats.reactions)) * 100}%` }} />
            <div className="bg-rose-600" style={{ width: `${(stats.reactions / (stats.reflections + stats.reactions)) * 100}%` }} />
          </div>
          <div className="flex justify-between mt-2 font-mono text-[10px] text-stone-500">
            <span>{stats.reflections} reflection</span>
            <span>{stats.reactions} reaction</span>
          </div>
        </div>
      )}

      <div className="border border-stone-800 rounded p-4">
        <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3">Top emotions</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats.topEmotions} layout="vertical" margin={{ left: 0, right: 10 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tick={{ fill: "#a8a29e", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
            <Bar dataKey="count" fill="#c9a961" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border border-stone-800 rounded p-4">
        <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3">Category split</div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={stats.pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
              {stats.pieData.map((d, i) => <Cell key={i} fill={CATEGORY_COLORS[d.name]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#0c0a09", border: "1px solid #292524", fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="border border-stone-800 rounded p-3">
      <div className="font-mono text-[9px] tracking-[0.15em] text-stone-500 uppercase">{label}</div>
      <div className="font-display italic text-3xl mt-1" style={{ color: color || "#fafaf9" }}>{value}</div>
    </div>
  );
}

// ---------- SETTINGS VIEW ----------
function SettingsView({ data, onImport, onClear }) {
  const fileRef = useRef();
  const [message, setMessage] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleExport = () => {
    exportJSON(data);
    setMessage({ type: "ok", text: "Backup file downloaded." });
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = await importJSON(file);
      onImport(imported);
      setMessage({ type: "ok", text: `Imported ${imported.entries.length} entries.` });
    } catch (err) {
      setMessage({ type: "err", text: `Import failed: ${err.message}` });
    }
    e.target.value = "";
  };

  const handleClear = () => {
    clearAllData();
    onClear();
    setConfirmClear(false);
    setMessage({ type: "ok", text: "All data cleared." });
  };

  return (
    <div className="space-y-6">
      {/* App info */}
      <div className="border border-stone-800 rounded p-4 space-y-2 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-stone-500">App version</span>
          <span>1.0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Data schema</span>
          <span>v{SCHEMA_VERSION}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Entries</span>
          <span>{data.entries.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">First entry</span>
          <span>
            {data.entries.length > 0
              ? fmtDate(data.entries[data.entries.length - 1].timestamp)
              : "—"}
          </span>
        </div>
      </div>

      {message && (
        <div className={`rounded p-3 text-sm ${
          message.type === "ok"
            ? "bg-emerald-900/30 text-emerald-200 border border-emerald-800"
            : "bg-rose-900/30 text-rose-200 border border-rose-800"
        }`}>
          {message.text}
        </div>
      )}

      {/* Backup */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3">Backup</div>
        <button
          onClick={handleExport}
          className="w-full py-3 border border-stone-700 rounded flex items-center justify-center gap-2 hover:bg-stone-900 transition"
        >
          <Download className="w-4 h-4" />
          <span>Export to JSON file</span>
        </button>
        <p className="font-mono text-[10px] text-stone-500 mt-2 leading-relaxed">
          Save regularly. Data lives on this device only. If you clear browser data or switch phones, it's gone.
        </p>
      </div>

      {/* Restore */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3">Restore</div>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-3 border border-stone-700 rounded flex items-center justify-center gap-2 hover:bg-stone-900 transition"
        >
          <Upload className="w-4 h-4" />
          <span>Import from JSON file</span>
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        <p className="font-mono text-[10px] text-stone-500 mt-2">
          Replaces all current data. Export first if unsure.
        </p>
      </div>

      {/* Danger */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-rose-500/80 uppercase mb-3">Danger</div>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            className="w-full py-3 border border-rose-900/60 text-rose-300 rounded flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Clear all data</span>
          </button>
        ) : (
          <div className="border border-rose-900/60 bg-rose-950/20 rounded p-4 space-y-3">
            <p className="text-rose-200 text-sm">Delete all {data.entries.length} entries permanently?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmClear(false)} className="flex-1 py-2 border border-stone-700 rounded text-sm">Cancel</button>
              <button onClick={handleClear} className="flex-1 py-2 bg-rose-700 text-stone-100 rounded text-sm">Delete everything</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- BOTTOM NAV ----------
function BottomNav({ view, setView, onAdd }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-800 bg-stone-950/95 backdrop-blur">
      <div className="max-w-lg mx-auto grid grid-cols-4 relative">
        <NavBtn active={view === "log"} onClick={() => setView("log")} icon={<BookOpen className="w-4 h-4" />} label="Log" />
        <NavBtn active={view === "patterns"} onClick={() => setView("patterns")} icon={<BarChart3 className="w-4 h-4" />} label="Patterns" />
        <div className="flex items-center justify-center">
          <button
            onClick={onAdd}
            className="absolute -top-5 w-12 h-12 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg hover:bg-amber-400 transition"
            aria-label="Add entry"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        <NavBtn active={view === "settings"} onClick={() => setView("settings")} icon={<Settings className="w-4 h-4" />} label="Settings" />
      </div>
    </nav>
  );
}

function NavBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-3 gap-1 transition ${
        active ? "text-amber-500" : "text-stone-500"
      }`}
    >
      {icon}
      <span className="font-mono text-[9px] tracking-[0.15em] uppercase">{label}</span>
    </button>
  );
}
