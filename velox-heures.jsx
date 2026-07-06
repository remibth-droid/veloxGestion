import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Play, Square, Clock3, BarChart3, History, Plus, Pencil, Trash2, X, AlertTriangle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Palette & type — thème "fin de service" : salle sombre, ticket     */
/* ------------------------------------------------------------------ */
const C = {
  bg: "#16130E",        // salle éteinte
  card: "#201C15",
  line: "#2E2820",
  text: "#EDE6D8",
  mut: "#8F8674",
  amber: "#F0A03C",     // lampe chauffante du passe
  amberDark: "#1F1608",
  red: "#D9553C",
  green: "#8FBF6B",
  barDim: "#6B5A3A",
  paper: "#F2ECDD",     // papier ticket
  paperInk: "#211D14",
  paperMut: "#6E6753",
};
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

/* ------------------------------------------------------------------ */
/*  Helpers dates / durées                                             */
/* ------------------------------------------------------------------ */
const pad2 = (n) => String(n).padStart(2, "0");

const fmtDur = (ms) => {
  if (!ms || ms < 0) ms = 0;
  const m = Math.floor(ms / 60000);
  return `${Math.floor(m / 60)}h${pad2(m % 60)}`;
};
const fmtDurSigned = (ms) => (ms >= 0 ? "+" : "−") + fmtDur(Math.abs(ms));
const fmtClock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
};
const fmtTime = (ts) => {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const fmtDayLong = (ts) =>
  new Date(ts).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const fmtDayShort = (ts) =>
  new Date(ts).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" });

const dayStartOf = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
const mondayOf = (ts) => {
  const d = new Date(ts); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
};
const addDays = (ts, n) => { const d = new Date(ts); d.setDate(d.getDate() + n); return d.getTime(); };

const toLocalInput = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const fromLocalInput = (str) => (str ? new Date(str).getTime() : NaN);
const newId = () => `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const STORAGE_KEY = "velox_heures_v1";

/* ------------------------------------------------------------------ */
/*  Composants de présentation (hors App pour rester stables)          */
/* ------------------------------------------------------------------ */
const Card = ({ children, className = "p-4" }) => (
  <div className={`rounded-2xl ${className}`}
    style={{ background: C.card, border: `1px solid ${C.line}` }}>
    {children}
  </div>
);

const Kpi = ({ label, value, sub, subColor }) => (
  <Card>
    <div style={{ color: C.mut, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {label}
    </div>
    <div style={{ color: C.text, fontFamily: MONO, fontSize: 22, fontWeight: 700, marginTop: 4 }}>
      {value}
    </div>
    {sub ? (
      <div style={{ color: subColor || C.mut, fontSize: 11, marginTop: 2, fontFamily: MONO }}>
        {sub}
      </div>
    ) : null}
  </Card>
);

const ChartCard = ({ title, rows, height = 190 }) => (
  <Card>
    <div style={{ color: C.mut, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
      {title}
    </div>
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 5, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: C.mut, fontSize: 10, fontFamily: MONO }}
          axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: C.mut, fontSize: 10, fontFamily: MONO }}
          axisLine={false} tickLine={false} width={34} />
        <Tooltip
          contentStyle={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, fontFamily: MONO, fontSize: 12 }}
          labelStyle={{ color: C.mut }}
          itemStyle={{ color: C.amber }}
          formatter={(v) => [fmtDur(v * 3.6e6), "travaillé"]}
          cursor={{ fill: "rgba(240,160,60,0.08)" }}
        />
        <Bar dataKey="h" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {rows.map((r, i) => (
            <Cell key={i} fill={r.hot ? C.amber : C.barDim} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </Card>
);

/* ------------------------------------------------------------------ */
/*  Éditeur de service (ajout / modification)                          */
/* ------------------------------------------------------------------ */
function ShiftEditor({ initial, onSave, onClose }) {
  const [start, setStart] = useState(toLocalInput(initial.start));
  const [end, setEnd] = useState(toLocalInput(initial.end));
  const [err, setErr] = useState("");

  const submit = () => {
    const s = fromLocalInput(start), e = fromLocalInput(end);
    if (isNaN(s) || isNaN(e)) { setErr("Renseigne les deux horaires."); return; }
    if (e <= s) { setErr("La fin doit être après le début."); return; }
    if (e - s > 24 * 3.6e6) { setErr("Un service ne peut pas dépasser 24 h."); return; }
    onSave(s, e);
  };

  const inputStyle = {
    background: C.bg, border: `1px solid ${C.line}`, color: C.text,
    borderRadius: 10, padding: "10px 12px", fontFamily: MONO, fontSize: 14,
    colorScheme: "dark", width: "100%",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(10,8,5,0.75)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-5"
        style={{ background: C.card, border: `1px solid ${C.line}` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>
            {initial.id ? "Modifier le service" : "Ajouter un service"}
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-1 rounded-md" style={{ color: C.mut }}>
            <X size={18} />
          </button>
        </div>
        <label className="block mb-3">
          <span style={{ color: C.mut, fontSize: 12, display: "block", marginBottom: 6 }}>Début</span>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} style={inputStyle} />
        </label>
        <label className="block mb-3">
          <span style={{ color: C.mut, fontSize: 12, display: "block", marginBottom: 6 }}>Fin</span>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} style={inputStyle} />
        </label>
        {err ? <div style={{ color: C.red, fontSize: 12, marginBottom: 10 }}>{err}</div> : null}
        <button onClick={submit} className="w-full rounded-xl py-3 font-bold"
          style={{ background: C.amber, color: C.amberDark, fontSize: 15 }}>
          Enregistrer
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */
export default function VeloxHeures() {
  const [screen, setScreen] = useState("clock"); // clock | stats | history
  const [data, setData] = useState({ shifts: [], activeStart: null });
  const [loading, setLoading] = useState(true);
  const [storageWarn, setStorageWarn] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [editor, setEditor] = useState(null);       // { id?, start, end }
  const [confirmId, setConfirmId] = useState(null); // suppression / annulation en 2 taps

  const storage = typeof window !== "undefined" && window.storage ? window.storage : null;

  /* --- horloge --- */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  /* --- chargement --- */
  useEffect(() => {
    (async () => {
      if (!storage) { setStorageWarn(true); setLoading(false); return; }
      try {
        const res = await storage.get(STORAGE_KEY);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setData({
            shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
            activeStart: typeof parsed.activeStart === "number" ? parsed.activeStart : null,
          });
        }
      } catch (e) { /* première utilisation : rien à charger */ }
      setLoading(false);
    })();
  }, []);

  /* --- persistance --- */
  const persist = async (next) => {
    setData(next);
    setConfirmId(null);
    if (!storage) { setStorageWarn(true); return; }
    try {
      const res = await storage.set(STORAGE_KEY, JSON.stringify(next));
      if (!res) setStorageWarn(true);
    } catch (e) { setStorageWarn(true); }
  };

  /* --- actions --- */
  const startService = () => persist({ ...data, activeStart: Date.now() });
  const endService = () => {
    if (!data.activeStart) return;
    const shift = { id: newId(), start: data.activeStart, end: Date.now() };
    persist({ shifts: [...data.shifts, shift], activeStart: null });
  };
  const cancelService = () => persist({ ...data, activeStart: null });
  const deleteShift = (id) => persist({ ...data, shifts: data.shifts.filter((s) => s.id !== id) });
  const saveShift = (id, start, end) => {
    const shifts = id
      ? data.shifts.map((s) => (s.id === id ? { ...s, start, end } : s))
      : [...data.shifts, { id: newId(), start, end }];
    persist({ ...data, shifts });
    setEditor(null);
  };

  /* --- statistiques --- */
  const S = useMemo(() => {
    const all = data.shifts
      .filter((s) => s.end > s.start)
      .map((s) => ({ ...s, dur: s.end - s.start }));
    if (data.activeStart)
      all.push({ id: "__live", start: data.activeStart, end: now, dur: now - data.activeStart, live: true });
    all.sort((a, b) => a.start - b.start);

    const byDay = new Map();
    for (const s of all) {
      const k = dayStartOf(s.start);
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k).push(s);
    }
    const dayTotal = (k) => (byDay.get(k) || []).reduce((t, s) => t + s.dur, 0);
    const rangeTotal = (a, b) =>
      all.reduce((t, s) => (s.start >= a && s.start < b ? t + s.dur : t), 0);

    const todayKey = dayStartOf(now);
    const weekStart = mondayOf(now);
    const prevWeekStart = addDays(weekStart, -7);
    const mNow = new Date(now);
    const monthStart = new Date(mNow.getFullYear(), mNow.getMonth(), 1).getTime();
    const prevMonthStart = new Date(mNow.getFullYear(), mNow.getMonth() - 1, 1).getTime();

    /* 14 derniers jours */
    const daily14 = [];
    for (let i = 13; i >= 0; i--) {
      const k = addDays(todayKey, -i);
      const d = new Date(k);
      daily14.push({
        label: d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 2) + " " + pad2(d.getDate()),
        h: +(dayTotal(k) / 3.6e6).toFixed(2),
        hot: k === todayKey,
      });
    }

    /* 8 dernières semaines */
    const weekly8 = [];
    for (let i = 7; i >= 0; i--) {
      const ws = addDays(weekStart, -7 * i);
      const d = new Date(ws);
      weekly8.push({
        label: `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`,
        h: +(rangeTotal(ws, addDays(ws, 7)) / 3.6e6).toFixed(2),
        hot: ws === weekStart,
      });
    }

    /* profil par jour de semaine (moyenne des jours travaillés) */
    const wdTot = Array(7).fill(0), wdCnt = Array(7).fill(0);
    for (const [k] of byDay) {
      const wd = (new Date(k).getDay() + 6) % 7;
      wdTot[wd] += dayTotal(k); wdCnt[wd] += 1;
    }
    const wdLabels = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
    const weekdayAvg = wdLabels.map((label, i) => ({
      label, h: wdCnt[i] ? +((wdTot[i] / wdCnt[i]) / 3.6e6).toFixed(2) : 0, hot: false,
    }));

    /* coupures : trous entre services d'une même journée */
    let gapSum = 0, gapCnt = 0;
    for (const [, list] of byDay) {
      for (let i = 1; i < list.length; i++) {
        const gap = list[i].start - list[i - 1].end;
        if (gap > 0) { gapSum += gap; gapCnt += 1; }
      }
    }

    /* moyenne / jour travaillé & jours travaillés sur 30 j */
    const d30 = addDays(todayKey, -29);
    let workedDays30 = 0, total30 = 0;
    for (const [k] of byDay) if (k >= d30) { workedDays30 += 1; total30 += dayTotal(k); }

    /* plus longue journée */
    let bestDay = null;
    for (const [k] of byDay) {
      const t = dayTotal(k);
      if (!bestDay || t > bestDay.t) bestDay = { k, t };
    }

    const completed = all.filter((s) => !s.live);

    return {
      todayShifts: byDay.get(todayKey) || [],
      todayTotal: dayTotal(todayKey),
      weekTotal: rangeTotal(weekStart, addDays(weekStart, 7)),
      prevWeekTotal: rangeTotal(prevWeekStart, weekStart),
      monthTotal: rangeTotal(monthStart, now + 1),
      prevMonthTotal: rangeTotal(prevMonthStart, monthStart),
      daily14, weekly8, weekdayAvg,
      avgShift: completed.length ? completed.reduce((t, s) => t + s.dur, 0) / completed.length : 0,
      avgGap: gapCnt ? gapSum / gapCnt : 0,
      gapCnt,
      workedDays30,
      avgPerWorkedDay30: workedDays30 ? total30 / workedDays30 : 0,
      bestDay,
      totalAll: completed.reduce((t, s) => t + s.dur, 0),
      nbServices: completed.length,
      hasData: all.length > 0,
    };
  }, [data, now]);

  /* ------------------------------------------------------------------ */
  /*  Vues (simples fonctions de rendu : pas de remount, pas de hooks)   */
  /* ------------------------------------------------------------------ */

  const ticketDuJour = () => {
    const rows = [];
    S.todayShifts.forEach((s, i) => {
      if (i > 0) {
        const gap = s.start - S.todayShifts[i - 1].end;
        if (gap > 0) rows.push(
          <div key={`g${i}`} style={{ color: C.paperMut, textAlign: "center", fontSize: 11, padding: "2px 0" }}>
            · · ·&nbsp;&nbsp;coupure {fmtDur(gap)}&nbsp;&nbsp;· · ·
          </div>
        );
      }
      rows.push(
        <div key={s.id} className="flex justify-between" style={{ fontSize: 13, padding: "2px 0" }}>
          <span>SERVICE {i + 1}{s.live ? " *" : ""}</span>
          <span>{fmtTime(s.start)}–{s.live ? "…" : fmtTime(s.end)}</span>
          <span style={{ fontWeight: 700 }}>{fmtDur(s.dur)}</span>
        </div>
      );
    });

    return (
      <div className="rounded-lg px-4 py-4" style={{ background: C.paper, color: C.paperInk, fontFamily: MONO }}>
        <div style={{ textAlign: "center", fontSize: 11, letterSpacing: "0.18em", color: C.paperMut }}>
          ★ VELOX HEURES ★
        </div>
        <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginTop: 2 }}>
          Ticket du jour — {fmtDayShort(now)}
        </div>
        <div style={{ borderTop: `1px dashed ${C.paperMut}`, margin: "10px 0" }} />
        {rows.length ? rows : (
          <div style={{ textAlign: "center", fontSize: 12, color: C.paperMut, padding: "6px 0" }}>
            aucun service aujourd'hui
          </div>
        )}
        <div style={{ borderTop: `1px dashed ${C.paperMut}`, margin: "10px 0" }} />
        <div className="flex justify-between" style={{ fontSize: 14, fontWeight: 700 }}>
          <span>TOTAL JOUR</span><span>{fmtDur(S.todayTotal)}</span>
        </div>
        <div className="flex justify-between" style={{ fontSize: 11, color: C.paperMut, marginTop: 2 }}>
          <span>SEMAINE EN COURS</span><span>{fmtDur(S.weekTotal)}</span>
        </div>
      </div>
    );
  };

  const clockScreen = () => {
    const active = !!data.activeStart;
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center pt-6 pb-2">
          <div className="flex items-center gap-2"
            style={{ color: active ? C.amber : C.mut, fontSize: 12, letterSpacing: "0.2em", fontWeight: 700 }}>
            <span className={active ? "vh-dot" : ""}
              style={{ width: 8, height: 8, borderRadius: 99, background: active ? C.amber : C.line, display: "inline-block" }} />
            {active ? "EN SERVICE" : "HORS SERVICE"}
          </div>
          <div style={{ color: C.text, fontFamily: MONO, fontSize: 50, fontWeight: 700, marginTop: 10, fontVariantNumeric: "tabular-nums" }}>
            {active ? fmtClock(now - data.activeStart) : fmtDur(S.todayTotal)}
          </div>
          <div style={{ color: C.mut, fontSize: 13, marginTop: 2 }}>
            {active ? `depuis ${fmtTime(data.activeStart)}` : "travaillé aujourd'hui"}
          </div>
        </div>

        <button
          onClick={active ? endService : startService}
          className="w-full rounded-2xl flex items-center justify-center gap-3 font-bold vh-press"
          style={{
            background: active ? C.red : C.amber,
            color: active ? "#2A0E07" : C.amberDark,
            padding: "20px 0", fontSize: 17, border: "none",
          }}>
          {active ? <Square size={20} strokeWidth={2.6} /> : <Play size={20} strokeWidth={2.6} />}
          {active ? "Terminer le service" : "Commencer le service"}
        </button>

        {active ? (
          <button
            onClick={() => (confirmId === "cancel" ? cancelService() : setConfirmId("cancel"))}
            className="mx-auto"
            style={{
              color: confirmId === "cancel" ? C.red : C.mut,
              fontSize: 12, textDecoration: "underline", background: "none", border: "none",
            }}>
            {confirmId === "cancel" ? "Confirmer l'annulation ? (rien ne sera enregistré)" : "Annuler ce service"}
          </button>
        ) : null}

        {ticketDuJour()}
      </div>
    );
  };

  const statsScreen = () => {
    if (!S.hasData)
      return (
        <div className="text-center pt-16" style={{ color: C.mut, fontSize: 14 }}>
          Pas encore de données.<br />Lance ton premier service pour voir les analyses.
        </div>
      );
    const dw = S.weekTotal - S.prevWeekTotal;
    const dm = S.monthTotal - S.prevMonthTotal;
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Kpi label="Cette semaine" value={fmtDur(S.weekTotal)}
            sub={S.prevWeekTotal ? `${fmtDurSigned(dw)} vs sem. passée` : "1re semaine suivie"}
            subColor={S.prevWeekTotal ? (dw >= 0 ? C.green : C.red) : C.mut} />
          <Kpi label="Ce mois-ci" value={fmtDur(S.monthTotal)}
            sub={S.prevMonthTotal ? `${fmtDurSigned(dm)} vs mois passé` : "1er mois suivi"}
            subColor={S.prevMonthTotal ? (dm >= 0 ? C.green : C.red) : C.mut} />
          <Kpi label="Moy. / jour travaillé" value={fmtDur(S.avgPerWorkedDay30)}
            sub={`${S.workedDays30} j travaillés sur 30 j`} />
          <Kpi label="Coupure moyenne" value={S.gapCnt ? fmtDur(S.avgGap) : "—"}
            sub={S.gapCnt ? `${S.gapCnt} coupure${S.gapCnt > 1 ? "s" : ""} enregistrée${S.gapCnt > 1 ? "s" : ""}` : "aucune coupure"} />
        </div>

        <ChartCard title="14 derniers jours" rows={S.daily14} />
        <ChartCard title="Par semaine (8 dernières)" rows={S.weekly8} />
        <ChartCard title="Profil par jour de semaine (moyenne)" rows={S.weekdayAvg} height={160} />

        <div className="grid grid-cols-2 gap-3">
          <Kpi label="Service moyen" value={fmtDur(S.avgShift)}
            sub={`${S.nbServices} service${S.nbServices > 1 ? "s" : ""} au total`} />
          <Kpi label="Record / jour" value={S.bestDay ? fmtDur(S.bestDay.t) : "—"}
            sub={S.bestDay ? fmtDayShort(S.bestDay.k) : ""} />
        </div>

        <div style={{ color: C.mut, fontSize: 12, textAlign: "center", fontFamily: MONO, paddingTop: 4 }}>
          Total enregistré : {fmtDur(S.totalAll)}
        </div>
      </div>
    );
  };

  const historyScreen = () => {
    const m = new Map();
    for (const s of [...data.shifts].sort((a, b) => b.start - a.start)) {
      const k = dayStartOf(s.start);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(s);
    }
    const groups = [...m.entries()];

    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => setEditor({ start: now - 4 * 3.6e6, end: now })}
          className="w-full rounded-xl flex items-center justify-center gap-2 py-3 font-semibold"
          style={{ border: `1px dashed ${C.line}`, color: C.amber, fontSize: 14, background: "none" }}>
          <Plus size={16} /> Ajouter un service oublié
        </button>

        {!groups.length && (
          <div className="text-center pt-10" style={{ color: C.mut, fontSize: 14 }}>
            Aucun service enregistré pour l'instant.
          </div>
        )}

        {groups.map(([k, list]) => {
          const total = list.reduce((t, s) => t + (s.end - s.start), 0);
          return (
            <div key={k}>
              <div className="flex justify-between items-baseline px-1 mb-2">
                <span style={{ color: C.text, fontSize: 13, fontWeight: 700, textTransform: "capitalize" }}>
                  {fmtDayLong(k)}
                </span>
                <span style={{ color: C.amber, fontFamily: MONO, fontSize: 13, fontWeight: 700 }}>
                  {fmtDur(total)}
                </span>
              </div>
              <Card className="p-2 flex flex-col gap-1">
                {[...list].sort((a, b) => a.start - b.start).map((s) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-lg px-2 py-2" style={{ fontFamily: MONO }}>
                    <span style={{ color: C.text, fontSize: 13, flex: 1 }}>
                      {fmtTime(s.start)} → {fmtTime(s.end)}
                      {dayStartOf(s.end) !== dayStartOf(s.start) ? (
                        <span style={{ color: C.mut, fontSize: 10 }}> (+1 j)</span>
                      ) : null}
                    </span>
                    <span style={{ color: C.mut, fontSize: 12, minWidth: 46, textAlign: "right" }}>
                      {fmtDur(s.end - s.start)}
                    </span>
                    <button aria-label="Modifier" className="p-1.5 rounded-md"
                      style={{ color: C.mut, background: "none", border: "none" }}
                      onClick={() => setEditor({ id: s.id, start: s.start, end: s.end })}>
                      <Pencil size={14} />
                    </button>
                    <button aria-label="Supprimer" className="p-1.5 rounded-md"
                      style={{ color: confirmId === s.id ? C.red : C.mut, background: "none", border: "none" }}
                      onClick={() => (confirmId === s.id ? deleteShift(s.id) : setConfirmId(s.id))}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </Card>
            </div>
          );
        })}
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Rendu                                                              */
  /* ------------------------------------------------------------------ */
  const tabs = [
    { id: "clock", label: "Pointage", Icon: Clock3 },
    { id: "stats", label: "Analyses", Icon: BarChart3 },
    { id: "history", label: "Historique", Icon: History },
  ];

  return (
    <div className="min-h-screen w-full" style={{ background: C.bg }}>
      <style>{`
        @keyframes vhPulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        .vh-dot { animation: vhPulse 1.6s ease-in-out infinite; }
        .vh-press { transition: transform .08s ease; }
        .vh-press:active { transform: scale(.985); }
        button { cursor: pointer; }
        button:focus-visible { outline: 2px solid ${C.amber}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .vh-dot { animation: none; } .vh-press { transition: none; }
        }
      `}</style>

      <div className="max-w-md mx-auto px-4 pb-28 pt-4">
        <div className="flex items-baseline justify-between mb-2">
          <div style={{ color: C.text, fontFamily: MONO, fontSize: 13, letterSpacing: "0.22em", fontWeight: 700 }}>
            VELOX<span style={{ color: C.amber }}> HEURES</span>
          </div>
          <div style={{ color: C.mut, fontSize: 12, textTransform: "capitalize" }}>
            {fmtDayShort(now)}
          </div>
        </div>

        {storageWarn ? (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
            style={{ background: "#2A1C10", border: "1px solid #4A331F", color: C.amber, fontSize: 12 }}>
            <AlertTriangle size={14} />
            Sauvegarde indisponible — les données de cette session risquent de ne pas être conservées.
          </div>
        ) : null}

        {loading ? (
          <div className="text-center pt-24" style={{ color: C.mut, fontFamily: MONO, fontSize: 13 }}>
            chargement…
          </div>
        ) : (
          <>
            {screen === "clock" && clockScreen()}
            {screen === "stats" && statsScreen()}
            {screen === "history" && historyScreen()}
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0"
        style={{ background: "rgba(22,19,14,0.92)", backdropFilter: "blur(8px)", borderTop: `1px solid ${C.line}` }}>
        <div className="max-w-md mx-auto grid grid-cols-3">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => { setScreen(id); setConfirmId(null); }}
              className="flex flex-col items-center gap-1 py-3"
              style={{ color: screen === id ? C.amber : C.mut, background: "none", border: "none" }}>
              <Icon size={20} strokeWidth={screen === id ? 2.4 : 1.8} />
              <span style={{ fontSize: 10, letterSpacing: "0.06em", fontWeight: screen === id ? 700 : 400 }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {editor ? (
        <ShiftEditor
          initial={editor}
          onClose={() => setEditor(null)}
          onSave={(s, e) => saveShift(editor.id, s, e)}
        />
      ) : null}
    </div>
  );
}
