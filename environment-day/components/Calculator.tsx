"use client";
import { useState, useEffect, useRef } from "react";
import { ACTIVITIES_FROM_KB, CascadeGraph } from "@/lib/cascadeEngine";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PERSONAS, Persona, CUSTOM_PERSONA_ID } from "@/lib/personas";
import PersonaPicker from "@/components/PersonaPicker";

interface Props {
  values: Partial<Record<string, number>>;
  onChange: (id: string, val: number) => void;
  onBulkChange: (vals: Record<string, number>) => void;
  graph: CascadeGraph;
}

interface NormAct {
  id: string;
  label: string;
  icon: string;
  unit: string;
  max: number;
  step: number;
  kgCO2perUnit: number;
  color: string;
}

function normalise(acts: typeof ACTIVITIES_FROM_KB): NormAct[] {
  return acts.map((a) => ({
    id: a.id, label: a.label, icon: a.icon, unit: a.unit,
    max: a.inputMax, step: a.inputStep,
    kgCO2perUnit: a.emissionFactors.co2e_kg_per_unit,
    color: a.color,
  }));
}

const BASE_ACTIVITIES = normalise(ACTIVITIES_FROM_KB);

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function ActivityCard({
  act, value, onChange, isPrimary, labelOverride, isMobile, flashing,
}: {
  act: NormAct; value: number; onChange: (v: number) => void;
  isPrimary: boolean; labelOverride?: string; isMobile: boolean; flashing: boolean;
}) {
  const kg  = value * act.kgCO2perUnit;
  const pct = (value / act.max) * 100;

  return (
    <div
      className="glass glass-hover"
      style={{
        padding: isMobile ? "16px" : "22px 24px",
        display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16,
        position: "relative", overflow: "hidden",
        boxShadow: isPrimary
          ? `0 0 0 1px ${act.color}44, 0 4px 20px rgba(0,0,0,0.3)`
          : undefined,
        // Flash animation when persona is applied
        animation: flashing ? `personaFlash 0.7s ease-out` : undefined,
        transition: "box-shadow 0.3s",
      }}
    >
      {/* Accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: isPrimary ? 4 : 3,
        background: act.color, opacity: isPrimary ? 0.9 : 0.6,
        borderRadius: "14px 0 0 14px", transition: "width 0.3s",
      }} />

      {isPrimary && (
        <div style={{
          position: "absolute", top: 8, right: 10,
          fontSize: "0.56rem", color: act.color, opacity: 0.75,
          letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Inter, sans-serif",
        }}>
          ★ key activity
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: isMobile ? "1.3rem" : "1.5rem", lineHeight: 1 }}>{act.icon}</span>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.2 }}>
              {labelOverride ?? act.label}
            </div>
            {labelOverride && (
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: 1, fontStyle: "italic" }}>
                {act.label}
              </div>
            )}
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
              {act.kgCO2perUnit} kg CO₂e / {act.unit}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div className="num" style={{ fontSize: "1.1rem", fontWeight: 500, color: act.color }}>
            {value}
            <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginLeft: 3 }}>{act.unit}</span>
          </div>
          <div className="num" style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: 1 }}>
            ≈ {kg < 1 ? (kg * 1000).toFixed(0) + " g" : kg.toFixed(1) + " kg"} CO₂e
          </div>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", top: "50%", left: 0,
          width: `${pct}%`, height: 2,
          background: act.color, transform: "translateY(-50%)",
          borderRadius: 2, pointerEvents: "none", opacity: 0.6,
          transition: "width 0.35s ease",   // smooth on persona apply
        }} />
        <input
          type="range" min={0} max={act.max} step={act.step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ position: "relative", zIndex: 1 }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "var(--text-muted)" }}>
        <span>0</span>
        <span>{act.max} {act.unit}</span>
      </div>
    </div>
  );
}

export default function Calculator({ values, onChange, onBulkChange, graph }: Props) {
  const isMobile = useIsMobile();

  // ── Persona state ────────────────────────────────────────────────────────
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  // Activity order lives in its own state — only changes on explicit persona select,
  // NOT when the user moves a slider (prevents mid-drag reorder bug)
  const [orderedIds, setOrderedIds] = useState<string[]>(BASE_ACTIVITIES.map(a => a.id));
  // Track which activity ids just had values applied (for flash animation)
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());
  // "Modified from preset" flag — shown on panel but doesn't affect order
  const [modifiedFromPreset, setModifiedFromPreset] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { totalKgCO2e, severityLevel, pollutants } = graph;
  const tCO2     = totalKgCO2e / 1000;
  const dailyAvg = 16.4;
  const pctOfAvg = Math.round((totalKgCO2e / dailyAvg) * 100);

  const gaugeColor =
    severityLevel === "critical" ? "var(--red-harm)"
    : severityLevel === "high"    ? "var(--orange-warn)"
    : severityLevel === "moderate"? "var(--gold)"
    : "var(--primary)";

  // Derive display persona (null if custom)
  const activePersona: Persona | null =
    activePersonaId && activePersonaId !== CUSTOM_PERSONA_ID
      ? PERSONAS.find((p) => p.id === activePersonaId) ?? null
      : null;

  // Activities in stable order (only changes on persona select)
  const ACTIVITIES = orderedIds
    .map(id => BASE_ACTIVITIES.find(a => a.id === id))
    .filter(Boolean) as NormAct[];

  // Clear flash after animation
  useEffect(() => {
    if (flashingIds.size > 0) {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlashingIds(new Set()), 750);
    }
    return () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); };
  }, [flashingIds]);

  function handlePersonaSelect(persona: Persona | null) {
    // null = Custom card clicked
    if (!persona) {
      setActivePersonaId(CUSTOM_PERSONA_ID);
      setModifiedFromPreset(false);
      return;
    }
    // Same persona clicked again → deselect to custom
    if (activePersonaId === persona.id) {
      setActivePersonaId(CUSTOM_PERSONA_ID);
      setModifiedFromPreset(false);
      return;
    }

    // Apply persona
    setActivePersonaId(persona.id);
    setModifiedFromPreset(false);

    // 1. Update activity order — primary activities float to top
    const primary = persona.primaryActivities;
    const newOrder = [
      ...BASE_ACTIVITIES.filter(a => primary.includes(a.id)).map(a => a.id),
      ...BASE_ACTIVITIES.filter(a => !primary.includes(a.id)).map(a => a.id),
    ];
    setOrderedIds(newOrder);

    // 2. Apply preset values — filter out undefined, then bulk-update
    const cleanVals: Record<string, number> = {};
    (Object.entries(persona.values) as [string, number | undefined][]).forEach(([k, v]) => {
      if (v !== undefined) cleanVals[k] = v;
    });
    onBulkChange(cleanVals);

    // 3. Flash all changed activity cards
    const changedIds = new Set(
      Object.keys(cleanVals).filter(k => (values[k] ?? 0) !== cleanVals[k])
    );
    setFlashingIds(changedIds);
  }

  // ── Mobile summary strip ─────────────────────────────────────────────────
  const MobileStrip = () => (
    <div className="glass" style={{ padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
        <svg width="60" height="60" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="30" cy="30" r="24" fill="none" stroke="var(--bg-elevated)" strokeWidth="4" />
          <circle cx="30" cy="30" r="24" fill="none" stroke={gaugeColor} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${Math.min(pctOfAvg / 100, 1) * 150.8} 150.8`}
            style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.5s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div className="num" style={{ fontSize: "0.82rem", fontWeight: 600, lineHeight: 1, color: gaugeColor }}>
            {tCO2 < 1 ? totalKgCO2e.toFixed(0) : tCO2.toFixed(1)}
          </div>
          <div style={{ fontSize: "0.46rem", color: "var(--text-muted)", marginTop: 1 }}>{tCO2 < 1 ? "kg" : "t"}</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 100 }}>
        <div style={{ fontSize: "0.7rem", color: gaugeColor, fontWeight: 500, marginBottom: 3 }}>{pctOfAvg}% of daily avg</div>
        {[
          { label: "CO₂", val: pollutants.co2_kg, color: "var(--primary)" },
          { label: "CH₄", val: pollutants.ch4_co2e_kg, color: "var(--gold)" },
        ].filter(p => p.val > 0).map((p) => (
          <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
            <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", width: 20 }}>{p.label}</span>
            <div style={{ flex: 1, height: 3, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${totalKgCO2e > 0 ? Math.min((p.val/totalKgCO2e)*100,100) : 0}%`, background: p.color, borderRadius: 2, transition: "width 0.4s" }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {ACTIVITIES.filter((a) => (values[a.id] ?? 0) > 0).slice(0, 4).map((a) => {
          const kg  = (values[a.id] ?? 0) * a.kgCO2perUnit;
          const pct = totalKgCO2e > 0 ? (kg / totalKgCO2e) * 100 : 0;
          return (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--bg-elevated)", borderRadius: 99, padding: "2px 7px" }}>
              <span style={{ fontSize: "0.7rem" }}>{a.icon}</span>
              <span className="num" style={{ fontSize: "0.62rem", color: a.color }}>{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <section
      id="calculator"
      style={{
        position: "relative", zIndex: 1,
        padding: isMobile ? "44px 16px 32px" : "80px 24px",
        maxWidth: 1200, margin: "0 auto", width: "100%",
      }}
    >
      <div style={{ marginBottom: isMobile ? 24 : 36, maxWidth: 640 }}>
        <span className="tag tag-gold" style={{ marginBottom: 12, display: "inline-flex" }}>
          Step 01 — Input
        </span>
        <h2 style={{ fontSize: "clamp(1.6rem, 5vw, 2.8rem)", fontWeight: 500, marginBottom: 8 }}>
          What did you do today?
        </h2>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.875rem" }}>
          Pick your profile — sliders pre-fill with realistic values. Adjust freely.
        </p>
      </div>

      {/* Persona picker */}
      <PersonaPicker activeId={activePersonaId} onSelect={handlePersonaSelect} />

      {/* Mobile strip */}
      {isMobile && <MobileStrip />}

      <div style={{ display: "flex", gap: 24, alignItems: "start", flexWrap: "wrap" }}>
        {/* Activity cards — order is STABLE (never changes on slider drag) */}
        <div style={{
          flex: "1 1 300px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
          gap: isMobile ? 10 : 16,
        }}>
          {ACTIVITIES.map((act) => (
            <ActivityCard
              key={act.id}
              act={act}
              value={values[act.id] ?? 0}
              onChange={(v) => {
                onChange(act.id, v);
                // Mark as modified — but DON'T change orderedIds or activePersonaId
                // (that was the drag-interruption bug)
                if (activePersonaId && activePersonaId !== CUSTOM_PERSONA_ID) {
                  setModifiedFromPreset(true);
                }
              }}
              isPrimary={!!activePersona?.primaryActivities.includes(act.id)}
              labelOverride={activePersona?.activityLabels[act.id]}
              isMobile={isMobile}
              flashing={flashingIds.has(act.id)}
            />
          ))}
        </div>

        {/* Desktop summary panel */}
        {!isMobile && (
          <div className="glass" style={{ flex: "0 0 220px", width: 220, padding: "24px", position: "sticky", top: 24, textAlign: "center" }}>

            {/* Persona badge */}
            {activePersona ? (
              <div style={{
                marginBottom: 14, padding: "7px 10px",
                background: `rgba(${hexToRgb(activePersona.color)}, 0.1)`,
                borderRadius: 8,
                border: `1px solid rgba(${hexToRgb(activePersona.color)}, 0.22)`,
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <span style={{ fontSize: "1.1rem" }}>{activePersona.icon}</span>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 500, color: activePersona.color }}>
                    {activePersona.name}
                    {modifiedFromPreset && (
                      <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginLeft: 5 }}>· edited</span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{activePersona.dailyRange} typical</div>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 14, fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                {activePersonaId === CUSTOM_PERSONA_ID ? "✏️ Custom mode" : "No profile selected"}
              </div>
            )}

            <div style={{ fontSize: "0.63rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
              Total Footprint
            </div>

            {/* Gauge */}
            <div style={{ position: "relative", margin: "0 auto 14px", width: 120, height: 120 }}>
              <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="60" cy="60" r="48" fill="none" stroke="var(--bg-elevated)" strokeWidth="6" />
                <circle cx="60" cy="60" r="48" fill="none" stroke={gaugeColor} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${Math.min(pctOfAvg / 100, 1) * 301.6} 301.6`}
                  style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.5s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div className="num" style={{ fontSize: "1.5rem", fontWeight: 500, lineHeight: 1 }}>
                  {tCO2 < 1 ? totalKgCO2e.toFixed(0) : tCO2.toFixed(2)}
                </div>
                <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: 1 }}>
                  {tCO2 < 1 ? "kg" : "t"} CO₂e
                </div>
              </div>
            </div>

            <div className="num" style={{ fontSize: "0.73rem", color: gaugeColor, marginBottom: 3 }}>
              {pctOfAvg}% of daily avg
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", marginBottom: 16 }}>
              Global avg: 16.4 kg/day
            </div>

            {/* Pollutant mix */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 12 }}>
              <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
                Pollutant Mix
              </div>
              {[
                { label: "CO₂", val: pollutants.co2_kg, color: "var(--primary)" },
                { label: "CH₄", val: pollutants.ch4_co2e_kg, color: "var(--gold)" },
                { label: "N₂O", val: pollutants.n2o_co2e_kg, color: "var(--orange-warn)" },
              ].filter(p => p.val > 0).map((p) => {
                const share = totalKgCO2e > 0 ? (p.val / totalKgCO2e) * 100 : 0;
                return (
                  <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    <div style={{ fontSize: "0.66rem", color: "var(--text-secondary)", width: 26 }}>{p.label}</div>
                    <div style={{ flex: 1, height: 3, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${share}%`, background: p.color, borderRadius: 2, transition: "width 0.4s ease" }} />
                    </div>
                    <div className="num" style={{ fontSize: "0.6rem", color: p.color, width: 28, textAlign: "right" }}>
                      {share.toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Activity breakdown */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              {ACTIVITIES.filter((a) => (values[a.id] ?? 0) > 0).map((a) => {
                const kg  = (values[a.id] ?? 0) * a.kgCO2perUnit;
                const pct = totalKgCO2e > 0 ? (kg / totalKgCO2e) * 100 : 0;
                const label = activePersona?.activityLabels[a.id] ?? a.label;
                return (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <span style={{ fontSize: "0.73rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {a.icon} {label.split(" ")[0]}
                    </span>
                    <span className="num" style={{ fontSize: "0.7rem", color: a.color, flexShrink: 0, marginLeft: 4 }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
