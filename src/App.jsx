import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus, X, Check, ChevronRight, BookOpen, BarChart3, Settings,
  Trash2, Clock, Brain, Flame, Download, Upload, AlertTriangle,
  Pencil, Activity, Leaf, Target, Trophy, TrendingUp, Zap,
  Timer, MapPin, Star
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import {
  loadData, saveData, exportJSON, importJSON, clearAllData, SCHEMA_VERSION
} from "./storage.js";

// ============================================================================
// CONSTANTS
// ============================================================================

const EMOTIONS = {
  positive: ["Joy","Gratitude","Pride","Excitement","Calm","Confident","Inspired","Focused","Satisfied","Relief"],
  negative: ["Anger","Frustration","Anxiety","Fear","Sadness","Shame","Envy","Disappointment","Overwhelm","Guilt"],
  neutral:  ["Curious","Surprised","Nostalgic","Conflicted","Restless","Bored","Skeptical","Alert"]
};
const CATEGORY_COLORS = { positive:"#7a9b76", negative:"#b85c5c", neutral:"#b8a86b" };

const YOGA_STYLES  = ["Yin","Vinyasa","Hatha","Power","Restorative","Meditation","Stretching"];
const BODY_FOCUS   = ["Full Body","Hips","Shoulders","Core","Spine","Hamstrings","Upper Body","Lower Body"];
const YOGA_POSES   = [
  "Crow Pose","Wheel / Upward Bow","Full Split","Headstand","Handstand",
  "Forearm Stand","King Pigeon","Half Moon","Eagle Pose","Camel Pose",
  "Bird of Paradise","Side Plank (full)","Warrior III","Dancer Pose","Scorpion"
];
const MILESTONE_STATUS = ["working","close","achieved"];
const STATUS_LABELS    = { working:"Working on it", close:"Getting close", achieved:"Achieved ✓" };
const STATUS_COLORS    = { working:"#b8a86b", close:"#c9a961", achieved:"#7a9b76" };

// ============================================================================
// HELPERS
// ============================================================================

const todayStr = () => new Date().toISOString().split("T")[0];
const isToday  = (iso) => iso.split("T")[0] === todayStr();
const fmtTime  = (iso) => new Date(iso).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", hour12:false });
const fmtDate  = (iso) => new Date(iso).toLocaleDateString([], { weekday:"short", day:"numeric", month:"short" });
const fmtMins  = (m)   => m >= 60 ? `${Math.floor(m/60)}h ${m%60 > 0 ? m%60+"m" : ""}`.trim() : `${m}m`;

const categoryOf = (emotion) => {
  for (const cat of Object.keys(EMOTIONS))
    if (EMOTIONS[cat].includes(emotion)) return cat;
  return "neutral";
};

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  const [data, setData]                   = useState(null);
  const [view, setView]                   = useState("log");
  const [showAdd, setShowAdd]             = useState(false);
  const [editEntry, setEditEntry]         = useState(null);
  const [reviewIdx, setReviewIdx]         = useState(0);
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [showTreadmill, setShowTreadmill] = useState(false);
  const [showYoga, setShowYoga]           = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);

  useEffect(() => { setData(loadData()); }, []);
  useEffect(() => { if (data) saveData(data); }, [data]);

  if (!data) return (
    <div className="min-h-screen bg-stone-950 text-stone-500 flex items-center justify-center font-mono text-xs">LOADING…</div>
  );

  // — Emotion helpers —
  const entries    = data.entries || [];
  const setEntries = (next) => setData({ ...data, entries: typeof next === "function" ? next(entries) : next });
  const addEntry    = (e)         => { setEntries([{ ...e, id: Date.now().toString() }, ...entries]); setShowAdd(false); };
  const updateEntry = (id, patch) => setEntries(entries.map(e => e.id === id ? { ...e, ...patch } : e));
  const deleteEntry = (id)        => setEntries(entries.filter(e => e.id !== id));
  const saveEdit    = (id, patch) => { updateEntry(id, patch); setEditEntry(null); };

  // — Workout helpers —
  const workouts    = data.workouts       || [];
  const milestones  = data.yogaMilestones || [];
  const setWorkouts   = (next) => setData({ ...data, workouts:       typeof next === "function" ? next(workouts)   : next });
  const setMilestones = (next) => setData({ ...data, yogaMilestones: typeof next === "function" ? next(milestones) : next });
  const addWorkout      = (w)         => { setWorkouts([{ ...w, id: Date.now().toString() }, ...workouts]); };
  const deleteWorkout   = (id)        => setWorkouts(workouts.filter(w => w.id !== id));
  const addMilestone    = (m)         => setMilestones([...milestones, { ...m, id: Date.now().toString(), createdAt: new Date().toISOString() }]);
  const updateMilestone = (id, patch) => setMilestones(milestones.map(m => m.id === id ? { ...m, ...patch } : m));
  const deleteMilestone = (id)        => setMilestones(milestones.filter(m => m.id !== id));

  const todayEntries    = entries.filter(e => isToday(e.timestamp));
  const unreviewedToday = todayEntries.filter(e => !e.reviewed);

  const handleAdd = () => {
    if (view === "wellness") setShowWorkoutPicker(true);
    else setShowAdd(true);
  };

  return (
    <div className="min-h-screen w-full bg-stone-950 text-stone-100 font-body">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300..700;1,300..700&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family:'Fraunces',Georgia,serif; font-optical-sizing:auto; }
        .font-body    { font-family:'Instrument Sans',system-ui,sans-serif; }
        .font-mono    { font-family:'JetBrains Mono',ui-monospace,monospace; }
      `}</style>

      <div className="relative max-w-lg mx-auto pb-24">
        <Header view={view} entries={entries} workouts={workouts} />

        <main className="px-5 pt-4">
          {view === "log" && (
            <LogView today={todayEntries} all={entries} onDelete={deleteEntry} onEdit={setEditEntry}
              unreviewedCount={unreviewedToday.length} onStartReview={() => { setReviewIdx(0); setView("review"); }} />
          )}
          {view === "review" && (
            <ReviewView unreviewed={unreviewedToday} idx={reviewIdx} setIdx={setReviewIdx}
              onSubmit={(id, patch) => {
                updateEntry(id, patch);
                if (reviewIdx + 1 >= unreviewedToday.length) { setView("log"); setReviewIdx(0); }
                else setReviewIdx(reviewIdx + 1);
              }}
              onExit={() => setView("log")} />
          )}
          {view === "wellness" && (
            <WellnessView workouts={workouts} milestones={milestones}
              onDeleteWorkout={deleteWorkout} onUpdateMilestone={updateMilestone}
              onDeleteMilestone={deleteMilestone} onAddMilestone={() => setShowMilestone(true)} />
          )}
          {view === "patterns" && <PatternsView entries={entries} workouts={workouts} />}
          {view === "settings" && (
            <SettingsView data={data} onImport={setData} onClear={() => setData(loadData())} />
          )}
        </main>

        {/* Modals */}
        {showAdd        && <EntryModal mode="add" onClose={() => setShowAdd(false)} onSave={addEntry} />}
        {editEntry      && <EntryModal mode="edit" initial={editEntry} onClose={() => setEditEntry(null)} onSave={(p) => saveEdit(editEntry.id, p)} />}
        {showWorkoutPicker && (
          <WorkoutPicker
            onSelect={(type) => { setShowWorkoutPicker(false); type === "treadmill" ? setShowTreadmill(true) : setShowYoga(true); }}
            onClose={() => setShowWorkoutPicker(false)} />
        )}
        {showTreadmill  && <TreadmillModal onClose={() => setShowTreadmill(false)} onSave={(w) => { addWorkout(w); setShowTreadmill(false); }} />}
        {showYoga       && <YogaModal      onClose={() => setShowYoga(false)}      onSave={(w) => { addWorkout(w); setShowYoga(false); }} />}
        {showMilestone  && <AddMilestoneModal existing={milestones} onClose={() => setShowMilestone(false)} onSave={(m) => { addMilestone(m); setShowMilestone(false); }} />}

        <BottomNav view={view} setView={setView} onAdd={handleAdd} />
      </div>
    </div>
  );
}

// ============================================================================
// HEADER
// ============================================================================

function Header({ view, entries, workouts }) {
  const titles = { log:"Today", review:"End-of-Day Review", wellness:"Wellness", patterns:"Patterns", settings:"Settings" };
  const count  = view === "wellness"
    ? workouts.filter(w => isToday(w.timestamp)).length
    : entries.filter(e => isToday(e.timestamp)).length;
  const label  = view === "wellness" ? "today" : "logs";

  return (
    <header className="px-5 pt-8 pb-2 border-b border-stone-900">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">{fmtDate(new Date().toISOString())}</div>
          <h1 className="font-display text-3xl italic tracking-tight mt-1">{titles[view]}</h1>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl text-amber-500">{String(count).padStart(2,"0")}</div>
          <div className="font-mono text-[10px] tracking-[0.15em] text-stone-500 uppercase">{label}</div>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// LOG VIEW + ENTRY CARD
// ============================================================================

function LogView({ today, all, onDelete, onEdit, unreviewedCount, onStartReview }) {
  const past = all.filter(e => !isToday(e.timestamp)).slice(0, 10);
  return (
    <div className="space-y-6">
      {today.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-800 rounded">
          <p className="font-display italic text-stone-400 text-lg">No entries yet</p>
          <p className="font-mono text-[11px] tracking-wide text-stone-600 mt-2 uppercase">tap + to log an emotion</p>
        </div>
      ) : (
        <section className="space-y-2">
          {today.map(e => <EntryCard key={e.id} entry={e} onDelete={() => onDelete(e.id)} onEdit={() => onEdit(e)} />)}
        </section>
      )}
      {unreviewedCount > 0 && (
        <button onClick={onStartReview} className="w-full py-4 border border-amber-700/40 bg-amber-900/10 rounded flex items-center justify-between px-5 hover:bg-amber-900/20 transition">
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
          <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3">Previous</div>
          <div className="space-y-2">
            {past.map(e => <EntryCard key={e.id} entry={e} onDelete={() => onDelete(e.id)} onEdit={() => onEdit(e)} compact />)}
          </div>
        </section>
      )}
    </div>
  );
}

function EntryCard({ entry, onDelete, onEdit, compact }) {
  const [expanded, setExpanded] = useState(false);
  const cat   = entry.category || categoryOf(entry.emotion);
  const color = CATEGORY_COLORS[cat];
  return (
    <div className="border border-stone-800 bg-stone-900/40 rounded p-4" style={{ borderLeftWidth:"3px", borderLeftColor:color }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-display text-lg">{entry.emotion}</span>
            <span className="font-mono text-xs text-stone-500">·</span>
            <span className="font-mono text-xs text-stone-400">{entry.intensity}/10</span>
            {entry.reviewed && <span className="font-mono text-[9px] tracking-wider text-emerald-500/80 uppercase ml-1">✓ reviewed</span>}
          </div>
          <div className="font-mono text-[10px] text-stone-500 flex items-center gap-2">
            <Clock className="w-3 h-3" />{fmtTime(entry.timestamp)}
            {compact && <span>· {fmtDate(entry.timestamp)}</span>}
          </div>
          {entry.trigger && <p className="text-sm text-stone-300 mt-2 leading-snug">{entry.trigger}</p>}
          {entry.reviewed && !expanded && <div className="mt-1 font-mono text-[9px] text-stone-600 uppercase tracking-wider">tap to see review ↓</div>}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onEdit}   className="text-stone-600 hover:text-amber-400 p-1.5 rounded transition" aria-label="Edit"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="text-stone-600 hover:text-rose-400 p-1.5 rounded transition"  aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
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

// ============================================================================
// ENTRY MODAL  (shared Add / Edit)
// ============================================================================

function EntryModal({ mode, initial, onClose, onSave }) {
  const isEdit    = mode === "edit";
  const hasReview = isEdit && initial?.reviewed;
  const [step, setStep]           = useState(1);
  const [category, setCategory]   = useState(initial?.category      || "negative");
  const [emotion, setEmotion]     = useState(initial?.emotion        || "");
  const [intensity, setIntensity] = useState(initial?.intensity      || 5);
  const [trigger, setTrigger]     = useState(initial?.trigger        || "");
  const [cls, setCls]             = useState(initial?.classification  || null);
  const [leverage, setLeverage]   = useState(initial?.leverage        || "");
  const totalSteps = hasReview ? 4 : 3;
  const canSave    = emotion && trigger.trim().length > 0;

  const handleSave = () => {
    if (isEdit) {
      onSave({ category, emotion, intensity, trigger: trigger.trim(), ...(hasReview && { classification: cls, leverage: leverage.trim() }) });
    } else {
      onSave({ timestamp: new Date().toISOString(), category, emotion, intensity, trigger: trigger.trim(), reviewed: false, classification: null, leverage: "" });
    }
  };

  return (
    <Modal title={`${isEdit ? "Edit Entry" : "Log Emotion"} · ${step}/${totalSteps}`} onClose={onClose}>
      {step === 1 && (
        <>
          <FieldLabel>Category</FieldLabel>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {["positive","negative","neutral"].map(c => (
              <button key={c} onClick={() => { setCategory(c); setEmotion(""); }}
                className={`py-3 rounded border text-sm capitalize transition ${category===c?"border-stone-400 bg-stone-800":"border-stone-800 text-stone-500 hover:border-stone-700"}`}
                style={category===c?{borderLeftWidth:"3px",borderLeftColor:CATEGORY_COLORS[c]}:{}}>{c}</button>
            ))}
          </div>
          <FieldLabel className="mt-5">Specific emotion</FieldLabel>
          <div className="flex flex-wrap gap-2 mt-2">
            {EMOTIONS[category].map(em => (
              <button key={em} onClick={() => setEmotion(em)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${emotion===em?"bg-stone-100 text-stone-900 border-stone-100":"border-stone-700 text-stone-300 hover:border-stone-500"}`}>{em}</button>
            ))}
          </div>
          <PrimaryBtn className="mt-6" onClick={() => setStep(2)} disabled={!emotion}>Next</PrimaryBtn>
        </>
      )}
      {step === 2 && (
        <>
          <FieldLabel>Intensity</FieldLabel>
          <SliderField value={intensity} onChange={setIntensity} min={1} max={10} />
          <div className="text-center mt-2"><span className="font-display italic text-5xl text-amber-500">{intensity}</span></div>
          <RowBtns onBack={() => setStep(1)} onNext={() => setStep(3)} />
        </>
      )}
      {step === 3 && (
        <>
          <FieldLabel>What triggered it?</FieldLabel>
          {isEdit && <div className="font-mono text-[10px] text-amber-600/70 mt-1 mb-1">Original time is preserved.</div>}
          <textarea value={trigger} onChange={e => setTrigger(e.target.value)} placeholder="e.g. Conversation about finances"
            autoFocus rows={5} className={TEXTAREA_CLS} />
          <div className="flex gap-2 mt-4">
            <SecondaryBtn onClick={() => setStep(2)}>Back</SecondaryBtn>
            {hasReview
              ? <PrimaryBtn onClick={() => setStep(4)} disabled={!canSave}>Next</PrimaryBtn>
              : <PrimaryBtn onClick={handleSave} disabled={!canSave}><Check className="w-4 h-4 mr-1" />{isEdit?"Save changes":"Save"}</PrimaryBtn>}
          </div>
        </>
      )}
      {step === 4 && hasReview && (
        <>
          <FieldLabel>Classification</FieldLabel>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <ClassBtn active={cls==="reflection"} onClick={() => setCls("reflection")} icon={<Brain className="w-4 h-4 text-emerald-400" />} label="Reflection" sub="considered" activeColor="border-emerald-600 bg-emerald-950/30" />
            <ClassBtn active={cls==="reaction"}   onClick={() => setCls("reaction")}   icon={<Flame className="w-4 h-4 text-rose-400" />}    label="Reaction"   sub="impulsive"  activeColor="border-rose-600 bg-rose-950/30" />
          </div>
          <FieldLabel className="mt-5">Leverage plan</FieldLabel>
          <textarea value={leverage} onChange={e => setLeverage(e.target.value)} placeholder="How do you use this better?" autoFocus rows={4} className={TEXTAREA_CLS} />
          <div className="flex gap-2 mt-4">
            <SecondaryBtn onClick={() => setStep(3)}>Back</SecondaryBtn>
            <PrimaryBtn onClick={handleSave} disabled={!cls||leverage.trim().length===0}><Check className="w-4 h-4 mr-1" />Save changes</PrimaryBtn>
          </div>
        </>
      )}
    </Modal>
  );
}

// ============================================================================
// REVIEW VIEW
// ============================================================================

function ReviewView({ unreviewed, idx, setIdx, onSubmit, onExit }) {
  const entry = unreviewed[idx];
  const [cls, setCls]           = useState(null);
  const [leverage, setLeverage] = useState("");
  useEffect(() => { setCls(null); setLeverage(""); }, [idx, entry?.id]);

  if (!entry) return (
    <div className="text-center py-16">
      <Check className="w-8 h-8 mx-auto text-emerald-500 mb-4" />
      <div className="font-display italic text-2xl">All processed</div>
      <button onClick={onExit} className="mt-6 px-6 py-2 border border-stone-700 rounded text-sm">Back to log</button>
    </div>
  );

  const cat = entry.category || categoryOf(entry.emotion);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1">
        {unreviewed.map((_,i) => <div key={i} className={`h-0.5 flex-1 rounded ${i<=idx?"bg-amber-500":"bg-stone-800"}`} />)}
      </div>
      <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">{idx+1} of {unreviewed.length}</div>
      <div className="border border-stone-800 bg-stone-900/50 rounded p-5" style={{ borderLeftWidth:"3px", borderLeftColor:CATEGORY_COLORS[cat] }}>
        <div className="font-mono text-[10px] text-stone-500 mb-2">{fmtTime(entry.timestamp)}</div>
        <div className="font-display text-3xl italic">{entry.emotion}</div>
        <div className="font-mono text-sm text-stone-400 mt-1">intensity {entry.intensity}/10</div>
        <div className="mt-4 pt-4 border-t border-stone-800">
          <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-2">Trigger</div>
          <p className="text-stone-200">{entry.trigger}</p>
        </div>
      </div>
      <div>
        <FieldLabel>Your response</FieldLabel>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <ClassBtn active={cls==="reflection"} onClick={() => setCls("reflection")} icon={<Brain className="w-4 h-4 text-emerald-400" />} label="Reflection" sub="considered" activeColor="border-emerald-600 bg-emerald-950/30" />
          <ClassBtn active={cls==="reaction"}   onClick={() => setCls("reaction")}   icon={<Flame className="w-4 h-4 text-rose-400" />}    label="Reaction"   sub="impulsive"  activeColor="border-rose-600 bg-rose-950/30" />
        </div>
      </div>
      <div>
        <FieldLabel>Leverage plan</FieldLabel>
        <div className="font-display italic text-stone-400 text-sm mb-2 mt-1">How do you use this better, or cause less damage?</div>
        <textarea value={leverage} onChange={e => setLeverage(e.target.value)} placeholder="e.g. Next time, pause 10 min before responding." rows={4} className={TEXTAREA_CLS} />
      </div>
      <div className="flex gap-2">
        <SecondaryBtn onClick={onExit}>Exit</SecondaryBtn>
        <PrimaryBtn onClick={() => onSubmit(entry.id,{reviewed:true,classification:cls,leverage:leverage.trim()})}
          disabled={!cls||leverage.trim().length===0} className="flex-1">
          {idx+1 < unreviewed.length ? <>Next <ChevronRight className="w-4 h-4 ml-1" /></> : <>Finish <Check className="w-4 h-4 ml-1" /></>}
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ============================================================================
// WELLNESS VIEW
// ============================================================================

function WellnessView({ workouts, milestones, onDeleteWorkout, onUpdateMilestone, onDeleteMilestone, onAddMilestone }) {
  const [tab, setTab] = useState("treadmill");
  const treadmill = workouts.filter(w => w.type === "treadmill");
  const yoga      = workouts.filter(w => w.type === "yoga");

  return (
    <div className="space-y-4">
      {/* Tab toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setTab("treadmill")}
          className={`py-2.5 rounded border text-sm flex items-center justify-center gap-2 transition ${tab==="treadmill"?"border-amber-600 bg-amber-900/20 text-amber-200":"border-stone-800 text-stone-500 hover:border-stone-700"}`}>
          <Activity className="w-4 h-4" /> Treadmill
        </button>
        <button onClick={() => setTab("yoga")}
          className={`py-2.5 rounded border text-sm flex items-center justify-center gap-2 transition ${tab==="yoga"?"border-amber-600 bg-amber-900/20 text-amber-200":"border-stone-800 text-stone-500 hover:border-stone-700"}`}>
          <Leaf className="w-4 h-4" /> Yoga
        </button>
      </div>

      {tab === "treadmill" && <TreadmillSection sessions={treadmill} onDelete={onDeleteWorkout} />}
      {tab === "yoga"      && <YogaSection sessions={yoga} milestones={milestones} onDelete={onDeleteWorkout}
          onUpdateMilestone={onUpdateMilestone} onDeleteMilestone={onDeleteMilestone} onAddMilestone={onAddMilestone} />}
    </div>
  );
}

// ─── TREADMILL SECTION ───────────────────────────────────────────────────────

function TreadmillSection({ sessions, onDelete }) {
  const totalKm   = sessions.reduce((s,w) => s + (w.distance||0), 0);
  const totalMins = sessions.reduce((s,w) => s + (w.duration||0), 0);
  const bestKm    = sessions.length > 0 ? Math.max(...sessions.map(w => w.distance||0)) : 0;
  const avgEffort = sessions.length > 0 ? (sessions.reduce((s,w)=>s+(w.effort||0),0)/sessions.length).toFixed(1) : "—";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Sessions"   value={sessions.length} />
        <StatCard label="Total km"   value={totalKm.toFixed(1)} />
        <StatCard label="Total time" value={totalMins >= 60 ? `${Math.floor(totalMins/60)}h ${totalMins%60}m` : `${totalMins}m`} />
        <StatCard label="Avg effort" value={avgEffort} />
      </div>
      {bestKm > 0 && (
        <div className="border border-stone-800 rounded px-4 py-3 flex items-center gap-3">
          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <div className="font-mono text-[9px] text-stone-500 uppercase tracking-wider">Best distance</div>
            <div className="font-display italic text-xl">{bestKm.toFixed(2)} km</div>
          </div>
        </div>
      )}
      {sessions.length === 0 ? (
        <EmptyState icon={<Activity className="w-5 h-5 text-stone-600" />} text="No treadmill sessions yet" sub="tap + to log your first run" />
      ) : (
        <div className="space-y-2">
          <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">Sessions</div>
          {sessions.map(w => <WorkoutCard key={w.id} workout={w} onDelete={() => onDelete(w.id)} />)}
        </div>
      )}
    </div>
  );
}

// ─── YOGA SECTION ────────────────────────────────────────────────────────────

function YogaSection({ sessions, milestones, onDelete, onUpdateMilestone, onDeleteMilestone, onAddMilestone }) {
  const totalMins   = sessions.reduce((s,w) => s+(w.duration||0), 0);
  const avgDelta    = sessions.filter(w=>w.energyBefore&&w.energyAfter).length > 0
    ? (sessions.filter(w=>w.energyBefore&&w.energyAfter).reduce((s,w)=>s+(w.energyAfter-w.energyBefore),0)/sessions.filter(w=>w.energyBefore&&w.energyAfter).length).toFixed(1)
    : null;
  const achieved    = milestones.filter(m=>m.status==="achieved").length;
  const active      = milestones.filter(m=>m.status!=="achieved");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Sessions"   value={sessions.length} />
        <StatCard label="Total time" value={totalMins>=60?`${Math.floor(totalMins/60)}h ${totalMins%60}m`:`${totalMins}m`} />
        {avgDelta !== null && <StatCard label="Avg energy lift" value={(avgDelta>0?"+":"")+avgDelta} color={avgDelta>0?"#7a9b76":avgDelta<0?"#b85c5c":undefined} />}
        <StatCard label="Poses achieved" value={achieved} color="#c9a961" />
      </div>

      {/* Milestone tracker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">Pose milestones</div>
          <button onClick={onAddMilestone} className="font-mono text-[10px] text-amber-500 hover:text-amber-400 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add goal
          </button>
        </div>
        {milestones.length === 0 ? (
          <div className="border border-dashed border-stone-800 rounded p-4 text-center">
            <Target className="w-4 h-4 mx-auto text-stone-600 mb-2" />
            <p className="font-mono text-[11px] text-stone-600">No pose goals yet — add one above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {active.map(m => <MilestoneCard key={m.id} milestone={m} onUpdate={(p)=>onUpdateMilestone(m.id,p)} onDelete={()=>onDeleteMilestone(m.id)} />)}
            {milestones.filter(m=>m.status==="achieved").length > 0 && (
              <>
                <div className="font-mono text-[9px] tracking-[0.2em] text-stone-600 uppercase pt-2">Achieved</div>
                {milestones.filter(m=>m.status==="achieved").map(m => <MilestoneCard key={m.id} milestone={m} onUpdate={(p)=>onUpdateMilestone(m.id,p)} onDelete={()=>onDeleteMilestone(m.id)} />)}
              </>
            )}
          </div>
        )}
      </div>

      {sessions.length === 0 ? (
        <EmptyState icon={<Leaf className="w-5 h-5 text-stone-600" />} text="No yoga sessions yet" sub="tap + to log your first session" />
      ) : (
        <div className="space-y-2">
          <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">Sessions</div>
          {sessions.map(w => <WorkoutCard key={w.id} workout={w} onDelete={() => onDelete(w.id)} />)}
        </div>
      )}
    </div>
  );
}

// ─── WORKOUT CARD ─────────────────────────────────────────────────────────────

function WorkoutCard({ workout: w, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isTreadmill = w.type === "treadmill";
  const accentColor = isTreadmill ? "#c9a961" : "#7a9b76";

  return (
    <div className="border border-stone-800 bg-stone-900/40 rounded p-4" style={{ borderLeftWidth:"3px", borderLeftColor:accentColor }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {isTreadmill ? (
              <>
                <span className="font-display text-lg">{w.distance} km</span>
                <span className="font-mono text-xs text-stone-500">·</span>
                <span className="font-mono text-xs text-stone-400">{fmtMins(w.duration)}</span>
                {w.effort && <><span className="font-mono text-xs text-stone-500">·</span><span className="font-mono text-xs text-stone-400">effort {w.effort}/10</span></>}
              </>
            ) : (
              <>
                <span className="font-display text-lg">{w.style}</span>
                <span className="font-mono text-xs text-stone-500">·</span>
                <span className="font-mono text-xs text-stone-400">{fmtMins(w.duration)}</span>
                {w.energyBefore && w.energyAfter && (
                  <span className={`font-mono text-xs ml-1 ${(w.energyAfter-w.energyBefore)>0?"text-emerald-400":"text-rose-400"}`}>
                    energy {w.energyAfter-w.energyBefore>0?"+":""}{w.energyAfter-w.energyBefore}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="font-mono text-[10px] text-stone-500 flex items-center gap-2">
            <Clock className="w-3 h-3" />{fmtTime(w.timestamp)} · {fmtDate(w.timestamp)}
          </div>
        </div>
        <button onClick={onDelete} className="text-stone-600 hover:text-rose-400 p-1.5 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-stone-800 font-mono text-xs space-y-1.5">
          {isTreadmill ? (
            <>
              {w.speed    && <DetailRow label="Avg speed"  value={`${w.speed} km/h`} />}
              {w.incline  && <DetailRow label="Incline"    value={`${w.incline}%`} />}
              {w.calories && <DetailRow label="Calories"   value={`${w.calories} kcal`} />}
              {w.note     && <DetailRow label="Note"       value={w.note} />}
            </>
          ) : (
            <>
              {w.bodyFocus?.length>0 && <DetailRow label="Focus" value={w.bodyFocus.join(", ")} />}
              {w.guided !== undefined && <DetailRow label="Guided" value={w.guided ? (w.guidedSource || "Yes") : "Self-practice"} />}
              {w.energyBefore && <DetailRow label="Energy before" value={`${w.energyBefore}/10`} />}
              {w.energyAfter  && <DetailRow label="Energy after"  value={`${w.energyAfter}/10`} />}
              {w.discomfort   && <DetailRow label="Discomfort" value={w.discomfort} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-stone-500 w-28 shrink-0 uppercase tracking-wider text-[9px] pt-0.5">{label}</span>
      <span className="text-stone-300 font-body text-sm">{value}</span>
    </div>
  );
}

// ─── MILESTONE CARD ───────────────────────────────────────────────────────────

function MilestoneCard({ milestone: m, onUpdate, onDelete }) {
  const idx     = MILESTONE_STATUS.indexOf(m.status);
  const isAchieved = m.status === "achieved";

  const advance = () => {
    if (idx < MILESTONE_STATUS.length - 1) {
      const next = MILESTONE_STATUS[idx + 1];
      onUpdate({ status: next, ...(next === "achieved" ? { achievedDate: new Date().toISOString() } : {}) });
    }
  };

  return (
    <div className="border border-stone-800 rounded p-3 flex items-center gap-3" style={{ borderLeftWidth:"3px", borderLeftColor:STATUS_COLORS[m.status] }}>
      <div className="flex-1 min-w-0">
        <div className={`font-body text-sm ${isAchieved?"text-stone-400 line-through":""}`}>{m.pose}</div>
        <div className="font-mono text-[9px] uppercase tracking-wider mt-0.5" style={{ color:STATUS_COLORS[m.status] }}>
          {STATUS_LABELS[m.status]}
          {isAchieved && m.achievedDate && ` · ${fmtDate(m.achievedDate)}`}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!isAchieved && (
          <button onClick={advance} className="px-2 py-1 border border-stone-700 rounded font-mono text-[9px] text-stone-400 hover:border-amber-600 hover:text-amber-400 transition">
            {idx === 0 ? "→ Close" : "→ Achieved"}
          </button>
        )}
        <button onClick={onDelete} className="text-stone-600 hover:text-rose-400 p-1"><Trash2 className="w-3 h-3" /></button>
      </div>
    </div>
  );
}

// ─── WORKOUT PICKER ───────────────────────────────────────────────────────────

function WorkoutPicker({ onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-stone-950/90 flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-lg bg-stone-900 border-t border-stone-800 rounded-t-2xl p-5 pb-8" onClick={e => e.stopPropagation()}>
        <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-4">Log workout</div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onSelect("treadmill")}
            className="py-6 border border-stone-700 rounded flex flex-col items-center gap-2 hover:border-amber-600 hover:bg-amber-900/10 transition">
            <Activity className="w-6 h-6 text-amber-500" />
            <span className="font-display italic text-lg">Treadmill</span>
          </button>
          <button onClick={() => onSelect("yoga")}
            className="py-6 border border-stone-700 rounded flex flex-col items-center gap-2 hover:border-emerald-600 hover:bg-emerald-900/10 transition">
            <Leaf className="w-6 h-6 text-emerald-500" />
            <span className="font-display italic text-lg">Yoga</span>
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-3 py-2 text-stone-500 font-mono text-sm">Cancel</button>
      </div>
    </div>
  );
}

// ─── TREADMILL MODAL ──────────────────────────────────────────────────────────

function TreadmillModal({ onClose, onSave }) {
  const [step, setStep]         = useState(1);
  const [duration, setDuration] = useState(30);
  const [distance, setDistance] = useState("");
  const [speed, setSpeed]       = useState("");
  const [incline, setIncline]   = useState(0);
  const [calories, setCalories] = useState("");
  const [effort, setEffort]     = useState(6);
  const [note, setNote]         = useState("");

  const canNext1 = duration > 0 && distance !== "";
  const handleSave = () => onSave({
    type: "treadmill", timestamp: new Date().toISOString(),
    duration, distance: parseFloat(distance)||0,
    speed: speed ? parseFloat(speed) : undefined,
    incline: incline||undefined, calories: calories ? parseInt(calories) : undefined,
    effort, note: note.trim()||undefined
  });

  return (
    <Modal title={`Treadmill · ${step}/3`} onClose={onClose}>
      {step === 1 && (
        <>
          <FieldLabel>Duration (minutes)</FieldLabel>
          <SliderField value={duration} onChange={setDuration} min={10} max={120} step={5} />
          <div className="text-center mt-1"><span className="font-display italic text-4xl text-amber-500">{fmtMins(duration)}</span></div>
          <FieldLabel className="mt-5">Distance (km)</FieldLabel>
          <input type="number" value={distance} onChange={e=>setDistance(e.target.value)} placeholder="e.g. 3.5"
            step="0.1" min="0" className={INPUT_CLS} />
          <PrimaryBtn className="mt-6" onClick={() => setStep(2)} disabled={!canNext1}>Next</PrimaryBtn>
        </>
      )}
      {step === 2 && (
        <>
          <FieldLabel>Avg speed (km/h) <Opt /></FieldLabel>
          <input type="number" value={speed} onChange={e=>setSpeed(e.target.value)} placeholder="e.g. 7.5" step="0.5" min="0" className={INPUT_CLS} />
          <FieldLabel className="mt-4">Incline (%)</FieldLabel>
          <SliderField value={incline} onChange={setIncline} min={0} max={12} step={0.5} />
          <div className="text-center mt-1"><span className="font-display italic text-4xl text-amber-500">{incline}%</span></div>
          <FieldLabel className="mt-4">Calories <Opt /></FieldLabel>
          <input type="number" value={calories} onChange={e=>setCalories(e.target.value)} placeholder="e.g. 320" className={INPUT_CLS} />
          <RowBtns onBack={() => setStep(1)} onNext={() => setStep(3)} />
        </>
      )}
      {step === 3 && (
        <>
          <FieldLabel>Perceived effort</FieldLabel>
          <SliderField value={effort} onChange={setEffort} min={1} max={10} />
          <div className="text-center mt-1"><span className="font-display italic text-5xl text-amber-500">{effort}</span><span className="font-mono text-stone-500 text-sm">/10</span></div>
          <FieldLabel className="mt-5">Note <Opt /></FieldLabel>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Felt strong today" rows={3} className={TEXTAREA_CLS} />
          <div className="flex gap-2 mt-4">
            <SecondaryBtn onClick={() => setStep(2)}>Back</SecondaryBtn>
            <PrimaryBtn onClick={handleSave}><Check className="w-4 h-4 mr-1" />Save</PrimaryBtn>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── YOGA MODAL ───────────────────────────────────────────────────────────────

function YogaModal({ onClose, onSave }) {
  const [step, setStep]               = useState(1);
  const [style, setStyle]             = useState("");
  const [duration, setDuration]       = useState(30);
  const [bodyFocus, setBodyFocus]     = useState([]);
  const [guided, setGuided]           = useState(false);
  const [guidedSource, setGuidedSource] = useState("");
  const [energyBefore, setEnergyBefore] = useState(5);
  const [energyAfter, setEnergyAfter]   = useState(5);
  const [discomfort, setDiscomfort]   = useState("");

  const toggleFocus = (f) => setBodyFocus(prev => prev.includes(f) ? prev.filter(x=>x!==f) : [...prev,f]);
  const handleSave  = () => onSave({
    type: "yoga", timestamp: new Date().toISOString(),
    style, duration, bodyFocus, guided,
    guidedSource: guided ? guidedSource.trim()||undefined : undefined,
    energyBefore, energyAfter,
    discomfort: discomfort.trim()||undefined
  });

  return (
    <Modal title={`Yoga · ${step}/3`} onClose={onClose}>
      {step === 1 && (
        <>
          <FieldLabel>Style</FieldLabel>
          <div className="flex flex-wrap gap-2 mt-2">
            {YOGA_STYLES.map(s => (
              <button key={s} onClick={() => setStyle(s)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${style===s?"bg-stone-100 text-stone-900 border-stone-100":"border-stone-700 text-stone-300 hover:border-stone-500"}`}>{s}</button>
            ))}
          </div>
          <FieldLabel className="mt-5">Duration (minutes)</FieldLabel>
          <SliderField value={duration} onChange={setDuration} min={15} max={120} step={5} />
          <div className="text-center mt-1"><span className="font-display italic text-4xl text-amber-500">{fmtMins(duration)}</span></div>
          <PrimaryBtn className="mt-6" onClick={() => setStep(2)} disabled={!style}>Next</PrimaryBtn>
        </>
      )}
      {step === 2 && (
        <>
          <FieldLabel>Body focus <Opt /></FieldLabel>
          <div className="flex flex-wrap gap-2 mt-2">
            {BODY_FOCUS.map(f => (
              <button key={f} onClick={() => toggleFocus(f)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${bodyFocus.includes(f)?"bg-emerald-900/40 border-emerald-600 text-emerald-200":"border-stone-700 text-stone-300 hover:border-stone-500"}`}>{f}</button>
            ))}
          </div>
          <FieldLabel className="mt-5">Guided?</FieldLabel>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => setGuided(false)}
              className={`py-3 rounded border text-sm transition ${!guided?"border-stone-400 bg-stone-800":"border-stone-800 text-stone-500"}`}>Self-practice</button>
            <button onClick={() => setGuided(true)}
              className={`py-3 rounded border text-sm transition ${guided?"border-stone-400 bg-stone-800":"border-stone-800 text-stone-500"}`}>Guided</button>
          </div>
          {guided && (
            <input value={guidedSource} onChange={e=>setGuidedSource(e.target.value)} placeholder="e.g. YouTube, Yoga with Adriene" className={`${INPUT_CLS} mt-3`} />
          )}
          <RowBtns onBack={() => setStep(1)} onNext={() => setStep(3)} />
        </>
      )}
      {step === 3 && (
        <>
          <FieldLabel>Energy before</FieldLabel>
          <SliderField value={energyBefore} onChange={setEnergyBefore} min={1} max={10} />
          <div className="text-center mt-1"><span className="font-display italic text-3xl text-amber-500">{energyBefore}</span><span className="font-mono text-stone-500 text-sm">/10</span></div>
          <FieldLabel className="mt-4">Energy after</FieldLabel>
          <SliderField value={energyAfter} onChange={setEnergyAfter} min={1} max={10} />
          <div className="text-center mt-1">
            <span className={`font-display italic text-3xl ${energyAfter>energyBefore?"text-emerald-400":energyAfter<energyBefore?"text-rose-400":"text-amber-500"}`}>{energyAfter}</span>
            <span className="font-mono text-stone-500 text-sm">/10</span>
            {energyAfter !== energyBefore && (
              <span className={`font-mono text-sm ml-2 ${energyAfter>energyBefore?"text-emerald-400":"text-rose-400"}`}>
                ({energyAfter>energyBefore?"+":""}{energyAfter-energyBefore})
              </span>
            )}
          </div>
          <FieldLabel className="mt-4">Discomfort or pain notes <Opt /></FieldLabel>
          <textarea value={discomfort} onChange={e=>setDiscomfort(e.target.value)} placeholder="e.g. Tight left hip in pigeon" rows={3} className={TEXTAREA_CLS} />
          <div className="flex gap-2 mt-4">
            <SecondaryBtn onClick={() => setStep(2)}>Back</SecondaryBtn>
            <PrimaryBtn onClick={handleSave}><Check className="w-4 h-4 mr-1" />Save</PrimaryBtn>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── ADD MILESTONE MODAL ─────────────────────────────────────────────────────

function AddMilestoneModal({ existing, onClose, onSave }) {
  const [custom, setCustom]   = useState("");
  const [selected, setSelected] = useState("");
  const existingPoses = new Set(existing.map(m => m.pose));
  const available     = YOGA_POSES.filter(p => !existingPoses.has(p));

  const handleSave = () => {
    const pose = custom.trim() || selected;
    if (!pose) return;
    onSave({ pose, status: "working", achievedDate: null });
  };

  return (
    <Modal title="Add Pose Goal" onClose={onClose}>
      <FieldLabel>Choose a pose</FieldLabel>
      <div className="flex flex-wrap gap-2 mt-2">
        {available.map(p => (
          <button key={p} onClick={() => { setSelected(p); setCustom(""); }}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${selected===p&&!custom?"bg-stone-100 text-stone-900":"border-stone-700 text-stone-300 hover:border-stone-500"}`}>{p}</button>
        ))}
      </div>
      <FieldLabel className="mt-5">Or type a custom pose</FieldLabel>
      <input value={custom} onChange={e => { setCustom(e.target.value); setSelected(""); }}
        placeholder="e.g. Firefly Pose" className={INPUT_CLS} />
      <div className="flex gap-2 mt-6">
        <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
        <PrimaryBtn onClick={handleSave} disabled={!custom.trim() && !selected}>Add goal</PrimaryBtn>
      </div>
    </Modal>
  );
}

// ============================================================================
// PATTERNS VIEW  (updated with cross-correlation)
// ============================================================================

function PatternsView({ entries, workouts }) {
  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const byEmotion  = {};
    const byCategory = { positive:0, negative:0, neutral:0 };
    let reflections=0, reactions=0, intensitySum=0;
    entries.forEach(e => {
      byEmotion[e.emotion] = (byEmotion[e.emotion]||0)+1;
      byCategory[e.category||categoryOf(e.emotion)] += 1;
      intensitySum += e.intensity;
      if (e.reviewed) { if(e.classification==="reflection") reflections++; else if(e.classification==="reaction") reactions++; }
    });
    return {
      total: entries.length, avgIntensity:(intensitySum/entries.length).toFixed(1),
      reflections, reactions,
      topEmotions: Object.entries(byEmotion).sort(([,a],[,b])=>b-a).slice(0,6).map(([name,count])=>({name,count})),
      pieData: Object.entries(byCategory).filter(([,v])=>v>0).map(([name,value])=>({name,value}))
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
        <StatCard label="Total logs"    value={stats.total} />
        <StatCard label="Avg intensity" value={stats.avgIntensity} />
        <StatCard label="Reflections"   value={stats.reflections} color="#7a9b76" />
        <StatCard label="Reactions"     value={stats.reactions}   color="#b85c5c" />
      </div>

      {(stats.reflections+stats.reactions) > 0 && (
        <div className="border border-stone-800 rounded p-4">
          <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3">Response ratio</div>
          <div className="flex h-2 rounded overflow-hidden">
            <div className="bg-emerald-600" style={{ width:`${(stats.reflections/(stats.reflections+stats.reactions))*100}%` }} />
            <div className="bg-rose-600"    style={{ width:`${(stats.reactions/(stats.reflections+stats.reactions))*100}%` }} />
          </div>
          <div className="flex justify-between mt-2 font-mono text-[10px] text-stone-500">
            <span>{stats.reflections} reflection</span><span>{stats.reactions} reaction</span>
          </div>
        </div>
      )}

      <div className="border border-stone-800 rounded p-4">
        <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3">Top emotions</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats.topEmotions} layout="vertical" margin={{left:0,right:10}}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tick={{fill:"#a8a29e",fontSize:11}} axisLine={false} tickLine={false} width={90} />
            <Bar dataKey="count" fill="#c9a961" radius={[0,2,2,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border border-stone-800 rounded p-4">
        <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3">Category split</div>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={stats.pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
              {stats.pieData.map((d,i) => <Cell key={i} fill={CATEGORY_COLORS[d.name]} />)}
            </Pie>
            <Tooltip contentStyle={{background:"#0c0a09",border:"1px solid #292524",fontSize:11}} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-1">
          {stats.pieData.map(d => (
            <div key={d.name} className="flex items-center gap-1.5 font-mono text-[10px]">
              <div className="w-2 h-2 rounded-full" style={{background:CATEGORY_COLORS[d.name]}} />
              <span className="text-stone-400 capitalize">{d.name}</span>
              <span className="text-stone-500">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-correlation — shows once enough data exists */}
      <CrossCorrelation entries={entries} workouts={workouts} />
    </div>
  );
}

function CrossCorrelation({ entries, workouts }) {
  const data = useMemo(() => {
    if (workouts.length < 3 || entries.length < 5) return null;
    const workoutDays = new Set(workouts.map(w => w.timestamp.split("T")[0]));
    const wdEntries   = entries.filter(e => workoutDays.has(e.timestamp.split("T")[0]));
    const nwEntries   = entries.filter(e => !workoutDays.has(e.timestamp.split("T")[0]));
    const avgInt = (arr) => arr.length > 0 ? (arr.reduce((s,e)=>s+e.intensity,0)/arr.length).toFixed(1) : null;

    const yoga = workouts.filter(w => w.type==="yoga" && w.energyBefore && w.energyAfter);
    const avgDelta = yoga.length > 0
      ? (yoga.reduce((s,w)=>s+(w.energyAfter-w.energyBefore),0)/yoga.length).toFixed(1)
      : null;

    const treadmill   = workouts.filter(w => w.type==="treadmill");
    const totalKm     = treadmill.reduce((s,w)=>s+(w.distance||0),0);
    const avgKm       = treadmill.length > 0 ? (totalKm/treadmill.length).toFixed(1) : null;

    const wiWd  = avgInt(wdEntries);
    const wiNwd = avgInt(nwEntries);

    return { wiWd, wiNwd, avgDelta, avgKm, yogaSessions: yoga.length, treadmillSessions: treadmill.length };
  }, [entries, workouts]);

  if (!data) return (
    <div className="border border-dashed border-stone-800 rounded p-4 text-center">
      <TrendingUp className="w-4 h-4 mx-auto text-stone-600 mb-2" />
      <p className="font-mono text-[10px] text-stone-600">Wellness × emotion insights appear after 3+ workouts</p>
    </div>
  );

  return (
    <div className="border border-stone-800 rounded p-4 space-y-3">
      <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">Wellness × emotions</div>

      {data.wiWd && data.wiNwd && (
        <div className="space-y-1">
          <div className="font-mono text-[9px] text-stone-500 uppercase tracking-wider">Emotional intensity</div>
          <div className="flex gap-4">
            <div className="flex-1 bg-stone-900 rounded p-2 text-center">
              <div className="font-display italic text-2xl text-amber-400">{data.wiWd}</div>
              <div className="font-mono text-[9px] text-stone-500 mt-1">workout days</div>
            </div>
            <div className="flex-1 bg-stone-900 rounded p-2 text-center">
              <div className="font-display italic text-2xl text-stone-300">{data.wiNwd}</div>
              <div className="font-mono text-[9px] text-stone-500 mt-1">rest days</div>
            </div>
          </div>
          <div className="font-mono text-[9px] text-stone-500 leading-relaxed">
            {parseFloat(data.wiWd) < parseFloat(data.wiNwd)
              ? "Lower emotional intensity on workout days — exercise is helping."
              : "Emotional intensity higher on workout days — check if stress is driving her to exercise."}
          </div>
        </div>
      )}

      {data.avgDelta !== null && (
        <div className="pt-2 border-t border-stone-900">
          <div className="font-mono text-[9px] text-stone-500 uppercase tracking-wider mb-1">Avg yoga energy lift</div>
          <div className={`font-display italic text-2xl ${parseFloat(data.avgDelta)>0?"text-emerald-400":parseFloat(data.avgDelta)<0?"text-rose-400":"text-stone-300"}`}>
            {parseFloat(data.avgDelta)>0?"+":""}{data.avgDelta} pts
          </div>
          <div className="font-mono text-[9px] text-stone-500 mt-1">across {data.yogaSessions} sessions</div>
        </div>
      )}

      {data.avgKm && (
        <div className="pt-2 border-t border-stone-900">
          <div className="font-mono text-[9px] text-stone-500 uppercase tracking-wider mb-1">Avg treadmill distance</div>
          <div className="font-display italic text-2xl text-amber-400">{data.avgKm} km</div>
          <div className="font-mono text-[9px] text-stone-500 mt-1">across {data.treadmillSessions} runs</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PATTERNS + SETTINGS + BOTTOM NAV (unchanged structure, settings updated)
// ============================================================================

function StatCard({ label, value, color }) {
  return (
    <div className="border border-stone-800 rounded p-3">
      <div className="font-mono text-[9px] tracking-[0.15em] text-stone-500 uppercase">{label}</div>
      <div className="font-display italic text-3xl mt-1" style={{color:color||"#fafaf9"}}>{value}</div>
    </div>
  );
}

function SettingsView({ data, onImport, onClear }) {
  const fileRef = useRef();
  const [message, setMessage]           = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleExport = () => { exportJSON(data); setMessage({type:"ok",text:"Backup file downloaded."}); };
  const handleImport = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { const imported = await importJSON(file); onImport(imported); setMessage({type:"ok",text:`Imported ${imported.entries.length} emotion entries + ${imported.workouts?.length||0} workouts.`}); }
    catch(err) { setMessage({type:"err",text:`Import failed: ${err.message}`}); }
    e.target.value="";
  };
  const handleClear = () => { clearAllData(); onClear(); setConfirmClear(false); setMessage({type:"ok",text:"All data cleared."}); };

  return (
    <div className="space-y-6">
      <div className="border border-stone-800 rounded p-4 space-y-2 font-mono text-xs">
        <div className="flex justify-between"><span className="text-stone-500">App version</span><span>2.0.0</span></div>
        <div className="flex justify-between"><span className="text-stone-500">Data schema</span><span>v{SCHEMA_VERSION}</span></div>
        <div className="flex justify-between"><span className="text-stone-500">Emotion entries</span><span>{data.entries?.length||0}</span></div>
        <div className="flex justify-between"><span className="text-stone-500">Workout sessions</span><span>{data.workouts?.length||0}</span></div>
        <div className="flex justify-between"><span className="text-stone-500">Pose goals</span><span>{data.yogaMilestones?.length||0}</span></div>
      </div>

      {message && (
        <div className={`rounded p-3 text-sm ${message.type==="ok"?"bg-emerald-900/30 text-emerald-200 border border-emerald-800":"bg-rose-900/30 text-rose-200 border border-rose-800"}`}>
          {message.text}
        </div>
      )}

      <div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3">Backup</div>
        <button onClick={handleExport} className="w-full py-3 border border-stone-700 rounded flex items-center justify-center gap-2 hover:bg-stone-900 transition">
          <Download className="w-4 h-4" /><span>Export to JSON file</span>
        </button>
        <p className="font-mono text-[10px] text-stone-500 mt-2">Includes emotions, workouts and pose goals. Export weekly to Google Drive.</p>
      </div>
      <div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mb-3">Restore</div>
        <button onClick={() => fileRef.current?.click()} className="w-full py-3 border border-stone-700 rounded flex items-center justify-center gap-2 hover:bg-stone-900 transition">
          <Upload className="w-4 h-4" /><span>Import from JSON file</span>
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>
      <div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-rose-500/80 uppercase mb-3">Danger</div>
        {!confirmClear ? (
          <button onClick={() => setConfirmClear(true)} className="w-full py-3 border border-rose-900/60 text-rose-300 rounded flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" /><span>Clear all data</span>
          </button>
        ) : (
          <div className="border border-rose-900/60 bg-rose-950/20 rounded p-4 space-y-3">
            <p className="text-rose-200 text-sm">Delete everything permanently?</p>
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

function BottomNav({ view, setView, onAdd }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-800 bg-stone-950/95 backdrop-blur">
      <div className="max-w-lg mx-auto flex items-center">
        <NavBtn active={view==="log"}      onClick={()=>setView("log")}      icon={<BookOpen className="w-4 h-4" />}  label="Log" />
        <NavBtn active={view==="wellness"} onClick={()=>setView("wellness")} icon={<Activity className="w-4 h-4" />}  label="Wellness" />
        <div className="flex-1 flex justify-center relative">
          <button onClick={onAdd} className="absolute -top-5 w-12 h-12 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg hover:bg-amber-400 transition" aria-label="Add">
            <Plus className="w-6 h-6" />
          </button>
        </div>
        <NavBtn active={view==="patterns"} onClick={()=>setView("patterns")} icon={<BarChart3 className="w-4 h-4" />} label="Patterns" />
        <NavBtn active={view==="settings"} onClick={()=>setView("settings")} icon={<Settings className="w-4 h-4" />}  label="Settings" />
      </div>
    </nav>
  );
}

function NavBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition ${active?"text-amber-500":"text-stone-500 hover:text-stone-300"}`}>
      {icon}
      <span className="font-mono text-[8px] tracking-[0.1em] uppercase">{label}</span>
    </button>
  );
}

// ============================================================================
// SHARED UI PRIMITIVES
// ============================================================================

const TEXTAREA_CLS = "w-full mt-2 bg-stone-950 border border-stone-800 rounded p-3 text-stone-100 placeholder:text-stone-600 focus:border-stone-600 focus:outline-none resize-none";
const INPUT_CLS    = "w-full mt-2 bg-stone-950 border border-stone-800 rounded p-3 text-stone-100 placeholder:text-stone-600 focus:border-stone-600 focus:outline-none";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-stone-900 border-t sm:border border-stone-800 rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 sticky top-0 bg-stone-900 z-10">
          <div className="font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase">{title}</div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-6 space-y-1">{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children, className="" }) {
  return <div className={`font-mono text-[10px] tracking-[0.2em] text-stone-500 uppercase mt-4 mb-1 ${className}`}>{children}</div>;
}

function Opt() { return <span className="text-stone-600 normal-case tracking-normal ml-1">(optional)</span>; }

function SliderField({ value, onChange, min, max, step=1 }) {
  return (
    <div className="flex items-center gap-3 mt-2">
      <span className="font-mono text-xs text-stone-500">{min}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} className="flex-1 accent-amber-500" />
      <span className="font-mono text-xs text-stone-500">{max}</span>
    </div>
  );
}

function PrimaryBtn({ onClick, disabled, children, className="" }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex-1 py-3 bg-amber-600 text-stone-950 font-medium rounded disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center ${className}`}>
      {children}
    </button>
  );
}

function SecondaryBtn({ onClick, children }) {
  return <button onClick={onClick} className="flex-1 py-3 border border-stone-700 text-stone-300 rounded">{children}</button>;
}

function RowBtns({ onBack, onNext, nextDisabled=false }) {
  return (
    <div className="flex gap-2 mt-4">
      <SecondaryBtn onClick={onBack}>Back</SecondaryBtn>
      <PrimaryBtn onClick={onNext} disabled={nextDisabled}>Next</PrimaryBtn>
    </div>
  );
}

function ClassBtn({ active, onClick, icon, label, sub, activeColor }) {
  return (
    <button onClick={onClick} className={`p-4 rounded border text-left transition ${active?activeColor:"border-stone-800 hover:border-stone-700"}`}>
      <div className="mb-2">{icon}</div>
      <div className="font-display italic text-base">{label}</div>
      <div className="font-mono text-[10px] text-stone-500 mt-1">{sub}</div>
    </button>
  );
}

function EmptyState({ icon, text, sub }) {
  return (
    <div className="text-center py-12 border border-dashed border-stone-800 rounded">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="font-display italic text-stone-400">{text}</p>
      <p className="font-mono text-[11px] tracking-wide text-stone-600 mt-1 uppercase">{sub}</p>
    </div>
  );
}
