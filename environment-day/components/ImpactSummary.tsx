"use client";
import { CascadeGraph, ActivityValues, severityColor } from "@/lib/cascadeEngine";
import kb from "@/lib/knowledgeBase.json";
import EcoCharacters from "@/components/EcoCharacters";

interface Props {
  graph: CascadeGraph;
  values: ActivityValues;
}

const TIER_LABELS: Record<string, string> = {
  negligible: "Negligible",
  low: "Low Impact",
  moderate: "Moderate",
  high: "High Impact",
  critical: "Critical",
};

const TIER_DESC: Record<string, string> = {
  negligible: "Virtually no measurable harm at this level — keep it up.",
  low: "Below the global daily average. Small choices add up over a lifetime.",
  moderate: "Around or above the global average. Meaningful reductions are achievable.",
  high: "Significantly above average. Multiple ecosystems are under measurable pressure.",
  critical: "Extreme footprint. Multiple species, reefs, and forest systems are at acute risk.",
};

export default function ImpactSummary({ graph, values }: Props) {
  const { totalKgCO2e, severityLevel, pollutants, equivalences } = graph;
  const tCO2 = totalKgCO2e / 1000;
  const tierColor = severityColor(
    severityLevel === "negligible" || severityLevel === "low" ? "low"
    : severityLevel === "moderate" ? "medium"
    : severityLevel === "high" ? "high"
    : "critical"
  );

  // Pull the largest contributor activity
  const actEmissions = kb.activities.map((a) => ({
    ...a,
    kg: (values[a.id] ?? 0) * a.emissionFactors.co2e_kg_per_unit,
  })).filter((a) => a.kg > 0).sort((a, b) => b.kg - a.kg);

  const topAct = actEmissions[0];

  // Gather all unique affected species from biodiversity-loss nodes
  const biodivNodes = graph.nodes.filter((n) => n.category === "biodiversity_loss");
  const allSpecies = Array.from(
    new Set(biodivNodes.flatMap((n) => n.affectedSpecies ?? []))
  ).slice(0, 12);

  // Treesneeded to offset
  const treesNeeded = Math.max(1, Math.ceil(totalKgCO2e / 21));

  // Offset actions
  const offsets = [
    { icon: "🌳", label: "Plant trees (1 yr)", value: `${treesNeeded} trees` },
    { icon: "⚡", label: "Switch to EV", value: "−1,500 kg/yr" },
    { icon: "🥗", label: "Skip red meat (1 yr)", value: "−700 kg CO₂e" },
    { icon: "☀️", label: "Install 1 kW solar", value: "−1,500 kg/yr" },
    { icon: "✈️", label: "Skip one long-haul flight", value: "−1,500–3,000 kg" },
  ];

  return (
    <section
      style={{ position: "relative", zIndex: 1, padding: "60px 24px 100px", maxWidth: 1200, margin: "0 auto", width: "100%" }}
    >
      <span className="tag tag-red" style={{ marginBottom: 16, display: "inline-flex" }}>
        Step 03 — Impact
      </span>
      <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 500, marginBottom: 40 }}>
        Net verdict
      </h2>

      {/* Verdict banner */}
      <div
        className="glass"
        style={{
          padding: "32px 36px", marginBottom: 28,
          border: `1px solid ${tierColor}33`,
          boxShadow: `0 0 60px rgba(0,0,0,0.3), inset 0 0 30px ${tierColor}06`,
          display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: "0.63rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
            Footprint Level
          </div>
          <div style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 600, color: tierColor, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>
            {TIER_LABELS[severityLevel]}
          </div>
        </div>

        <div style={{ width: 1, height: 56, background: "var(--border)", flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="num" style={{ fontSize: "clamp(1.3rem, 3.5vw, 2rem)", fontWeight: 500, color: tierColor, marginBottom: 6 }}>
            {tCO2 < 0.1 ? totalKgCO2e.toFixed(1) + " kg" : tCO2.toFixed(3) + " t"} CO₂e
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.65 }}>
            {TIER_DESC[severityLevel]}
          </div>
        </div>

        {topAct && (
          <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: "14px 18px", textAlign: "center", minWidth: 130 }}>
            <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 6 }}>Top Source</div>
            <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{topAct.icon}</div>
            <div style={{ fontSize: "0.78rem", color: topAct.color, fontWeight: 500 }}>{topAct.label}</div>
            <div className="num" style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: 2 }}>
              {topAct.kg.toFixed(1)} kg CO₂e
            </div>
          </div>
        )}

        {/* Cascade nodes count badge */}
        <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: "14px 18px", textAlign: "center", minWidth: 110 }}>
          <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 6 }}>Effects Triggered</div>
          <div className="num" style={{ fontSize: "2rem", fontWeight: 600, color: tierColor, lineHeight: 1 }}>{graph.nodes.length}</div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 4 }}>cascade nodes</div>
        </div>
      </div>

      {/* ── Ecosystem character reactions ── */}
      <EcoCharacters graph={graph} />

      {/* Grid of cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 20, marginBottom: 32 }}>

        {/* Equivalences */}
        <div className="glass" style={{ padding: "24px" }}>
          <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 16 }}>
            What this equals
          </div>
          {equivalences.slice(0, 5).map((eq) => (
            <div key={eq.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", flexShrink: 0 }}>
                {eq.icon}
              </div>
              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", flex: 1 }}>{eq.label}</span>
              <span className="num" style={{ fontSize: "0.82rem", color: "var(--primary)", fontWeight: 500 }}>{eq.value}</span>
            </div>
          ))}
        </div>

        {/* Pollutant breakdown */}
        <div className="glass" style={{ padding: "24px" }}>
          <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 16 }}>
            Pollutant Breakdown
          </div>
          {[
            { label: "CO₂ (combustion)", val: pollutants.co2_kg, color: "var(--primary)", note: "300–1000 yr lifetime" },
            { label: "CH₄ (methane)", val: pollutants.ch4_co2e_kg, color: "var(--gold)", note: "84× GWP over 20 yr" },
            { label: "N₂O (nitrous oxide)", val: pollutants.n2o_co2e_kg, color: "var(--orange-warn)", note: "265× GWP, ozone depleter" },
          ].map((p) => {
            const share = totalKgCO2e > 0 ? (p.val / totalKgCO2e) * 100 : 0;
            if (p.val <= 0) return null;
            return (
              <div key={p.label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>{p.label}</span>
                  <span className="num" style={{ fontSize: "0.78rem", color: p.color }}>{p.val.toFixed(1)} kg CO₂e</span>
                </div>
                <div style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden", marginBottom: 3 }}>
                  <div style={{ height: "100%", width: `${share}%`, background: p.color, borderRadius: 2, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{p.note}</div>
              </div>
            );
          })}

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>NOₓ (g)</span>
              <span className="num" style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{pollutants.nox_g.toFixed(0)} g</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>PM2.5 (g)</span>
              <span className="num" style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{pollutants.pm25_g.toFixed(2)} g</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Black Carbon (g)</span>
              <span className="num" style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{pollutants.bc_g.toFixed(3)} g</span>
            </div>
          </div>
        </div>

        {/* Species at risk (dynamic from graph) */}
        <div className="glass" style={{ padding: "24px" }}>
          <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 16 }}>
            Species at Risk — from your cascade
          </div>
          {allSpecies.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              No biodiversity impacts triggered yet. Increase activity levels to see affected species.
            </div>
          ) : (
            allSpecies.slice(0, 8).map((sp, i) => {
              const commonName = sp.split("(")[0].trim();
              const sciName = sp.match(/\(([^)]+)\)/)?.[1] ?? "";
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.9rem", marginTop: 1 }}>🐾</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-primary)" }}>{commonName}</div>
                    {sciName && <div style={{ fontSize: "0.66rem", color: "var(--gold)", fontStyle: "italic" }}>{sciName}</div>}
                  </div>
                </div>
              );
            })
          )}
          {allSpecies.length > 8 && (
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 8 }}>
              +{allSpecies.length - 8} more species affected
            </div>
          )}
        </div>

        {/* Offset actions */}
        <div className="glass" style={{ padding: "24px" }}>
          <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 16 }}>
            How to offset
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
            <span className="num" style={{ fontSize: "2rem", fontWeight: 500, color: "var(--primary)" }}>{treesNeeded}</span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>trees/year needed</span>
          </div>
          <div style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden", marginBottom: 18 }}>
            <div style={{ height: "100%", width: `${Math.min((treesNeeded / 200) * 100, 100)}%`, background: "linear-gradient(90deg, var(--primary), var(--gold))", borderRadius: 2, transition: "width 0.6s ease" }} />
          </div>
          {offsets.map((o) => (
            <div key={o.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{o.icon} {o.label}</span>
              <span className="num" style={{ fontSize: "0.72rem", color: "var(--primary)" }}>{o.value}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Global facts strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 36 }}>
        {[
          { val: `${kb.globalStatusFacts.co2_current_ppm} ppm`, label: "Atmospheric CO₂", color: "var(--primary)" },
          { val: `+${kb.globalStatusFacts.warming_since_1850_degC}°C`, label: "Warming since 1850", color: "var(--orange-warn)" },
          { val: `${kb.globalStatusFacts.coral_reefs_lost_percent}%`, label: "Coral Reefs Lost", color: "var(--red-harm)" },
          { val: `${kb.globalStatusFacts.birds_lost_north_america_billion}B`, label: "Birds Lost (N. America)", color: "var(--gold)" },
          { val: `${kb.globalStatusFacts.arctic_sea_ice_loss_percent_per_decade}%`, label: "Arctic Ice / Decade", color: "#90caf9" },
          { val: `${kb.globalStatusFacts.insect_biomass_decline_percent}%`, label: "Insect Biomass Lost", color: "#ce93d8" },
        ].map((f) => (
          <div key={f.label} className="glass" style={{ padding: "16px 18px", textAlign: "center" }}>
            <div className="num" style={{ fontSize: "1.4rem", fontWeight: 600, color: f.color }}>{f.val}</div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 5 }}>{f.label}</div>
          </div>
        ))}
      </div>

      {/* Sources attribution */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
        {["IPCC AR6 2023", "FAO GLEAM 2.0", "EPA eGRID 2023", "IEA 2023", "IUCN Red List", "BirdLife International 2022"].map((s) => (
          <span key={s} className="tag" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "none", fontSize: "0.62rem" }}>{s}</span>
        ))}
      </div>

      {/* Quote */}
      <div style={{ borderLeft: "2px solid var(--primary)", paddingLeft: 20, opacity: 0.55 }}>
        <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          "We do not inherit the earth from our ancestors, we borrow it from our children."
        </p>
        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 6 }}>— Antoine de Saint-Exupéry</p>
      </div>
    </section>
  );
}
