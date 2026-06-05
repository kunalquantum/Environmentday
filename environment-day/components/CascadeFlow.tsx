"use client";
import { useState, useMemo } from "react";
import { CascadeGraph, ActiveNode, severityColor } from "@/lib/cascadeEngine";
import { useIsMobile } from "@/hooks/useIsMobile";

const LAYER_LABELS = [
  "Activity",
  "Direct Emissions",
  "Atmospheric Effects",
  "Physical Climate",
  "Ecosystem Damage",
  "Biodiversity Loss",
];

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({ node, onClose }: { node: ActiveNode; onClose: () => void }) {
  const color = severityColor(node.severity);
  const tagClass = node.severity === "low" ? "tag-primary" : node.severity === "medium" ? "tag-gold" : "tag-red";

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${color}33`,
        borderRadius: 14,
        padding: "24px",
        position: "relative",
        boxShadow: `0 0 40px rgba(${hexToRgb(color)}, 0.08)`,
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 12, right: 14,
          background: "none", border: "none", color: "var(--text-muted)",
          cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, fontFamily: "inherit", padding: 4,
        }}
      >×</button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 12px ${color}`, flexShrink: 0 }} />
        <h3 style={{ fontSize: "1.05rem", fontWeight: 500, margin: 0 }}>{node.label}</h3>
        <span className={`tag ${tagClass}`}>{node.severity}</span>
        <span className="tag" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "none", fontSize: "0.6rem" }}>
          Layer {node.layer} · {LAYER_LABELS[node.layer] ?? "Unknown"}
        </span>
      </div>

      <p style={{ color: "var(--text-secondary)", lineHeight: 1.78, fontSize: "0.845rem", marginBottom: 16 }}>
        {node.description}
      </p>

      {node.metric && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Impact metric
          </span>
          <span className="num" style={{ fontSize: "0.9rem", color, fontWeight: 500 }}>{node.metric}</span>
        </div>
      )}

      {node.affectedSpecies && node.affectedSpecies.length > 0 && (
        <div style={{ background: "var(--bg-elevated)", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            Affected species
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {node.affectedSpecies.slice(0, 4).map((s, i) => (
              <div key={i} style={{ fontSize: "0.78rem", color: "var(--gold)", fontStyle: "italic" }}>
                {s}
              </div>
            ))}
            {node.affectedSpecies.length > 4 && (
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                +{node.affectedSpecies.length - 4} more species
              </div>
            )}
          </div>
        </div>
      )}

      {node.currentGlobalStatus && (
        <div style={{ borderLeft: "2px solid " + color + "55", paddingLeft: 12, marginBottom: 12 }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {node.currentGlobalStatus}
          </div>
        </div>
      )}

      {node.source && (
        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 4 }}>
          Source: {node.source}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { graph: CascadeGraph }

export default function CascadeFlow({ graph }: Props) {
  const { nodes } = graph;
  const [selected, setSelected] = useState<ActiveNode | null>(null);
  const [hoveredIds, setHoveredIds] = useState<Set<string>>(new Set());

  // Layer map
  const layers = useMemo(() => {
    const map: Record<number, ActiveNode[]> = {};
    nodes.forEach((n) => { (map[n.layer] ??= []).push(n); });
    return map;
  }, [nodes]);

  const maxLayer = nodes.length ? Math.max(...nodes.map((n) => n.layer)) : 0;

  // Highlight entire chain
  function highlightChain(id: string) {
    const out = new Set<string>();
    function down(nid: string) {
      out.add(nid);
      nodes.forEach((n) => { if (n.parentIds.includes(nid) && !out.has(n.id)) down(n.id); });
    }
    function up(nid: string) {
      out.add(nid);
      const n = nodes.find((x) => x.id === nid);
      n?.parentIds.forEach((pid) => { if (!out.has(pid)) up(pid); });
    }
    down(id); up(id);
    setHoveredIds(out);
  }

  // Layout constants
  const CARD_W  = 175;
  const CARD_H  = 90;
  const LAYER_GAP = 230;
  const NODE_GAP  = 116;
  const LABEL_ZONE = 36;

  // Compute positions
  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    for (let layer = 0; layer <= maxLayer; layer++) {
      const ln = layers[layer] ?? [];
      const totalH = (ln.length - 1) * NODE_GAP + CARD_H;
      const startY = -totalH / 2;
      ln.forEach((n, i) => { pos[n.id] = { x: layer * LAYER_GAP, y: startY + i * NODE_GAP }; });
    }
    return pos;
  }, [layers, maxLayer]);

  const allYs    = Object.values(positions).map((p) => p.y);
  const minY     = allYs.length ? Math.min(...allYs) : 0;
  const maxY     = allYs.length ? Math.max(...allYs) : 0;
  const offsetY  = -minY + LABEL_ZONE + 20;
  const svgH     = maxY - minY + CARD_H + LABEL_ZONE + 60;
  const svgW     = maxLayer * LAYER_GAP + CARD_W + 80;

  // Unique severity list for marker defs
  const severities = ["low", "medium", "high", "critical"] as const;

  return (
    <section style={{ position: "relative", zIndex: 1, padding: "60px 0 80px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "0 24px", maxWidth: 1200, margin: "0 auto" }}>
        <span className="tag tag-primary" style={{ marginBottom: 16, display: "inline-flex" }}>
          Step 02 — Cascade
        </span>
        <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 500, marginBottom: 12 }}>
          The chain reaction
        </h2>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.9rem", maxWidth: 560, marginBottom: 16 }}>
          {nodes.length <= 4
            ? "Add some activities above to see the full cascade unfold."
            : `${nodes.length} effects active across ${maxLayer + 1} layers. Hover to trace a chain — click to inspect.`}
        </p>

        {/* Dynamic node count badge */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 28 }}>
          <span className="num" style={{ fontSize: "1.6rem", fontWeight: 600, color: "var(--primary)" }}>
            {nodes.length}
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>active cascade nodes</span>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          {severities.map((sev) => {
            const count = nodes.filter((n) => n.severity === sev).length;
            if (!count) return null;
            return (
              <div key={sev} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: severityColor(sev) }} />
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{count} {sev}</span>
              </div>
            );
          })}
        </div>

        {/* Layer legend */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          {LAYER_LABELS.slice(0, maxLayer + 1).map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "var(--bg-elevated)", borderRadius: 99, fontSize: "0.7rem", color: "var(--text-secondary)" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: `hsl(${165 - i * 28}, 75%, ${62 - i * 7}%)`, opacity: 0.85 }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable SVG */}
      <div style={{ overflowX: "auto", overflowY: "hidden", padding: "8px 24px 24px" }}>
        <svg width={svgW} height={svgH} style={{ display: "block", minWidth: svgW }}>
          <defs>
            {severities.map((sev) => (
              <marker key={sev} id={`arr-${sev}`} markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0,6 2,0 4" fill={severityColor(sev) + "66"} />
              </marker>
            ))}
          </defs>

          {/* Edges */}
          {nodes.map((node) =>
            node.parentIds.map((pid) => {
              const src = positions[pid];
              const dst = positions[node.id];
              if (!src || !dst) return null;
              const x1 = src.x + CARD_W, y1 = src.y + offsetY + CARD_H / 2;
              const x2 = dst.x,          y2 = dst.y + offsetY + CARD_H / 2;
              const mx = (x1 + x2) / 2;
              const lit = hoveredIds.has(node.id) && hoveredIds.has(pid);
              const c   = severityColor(node.severity);
              return (
                <path
                  key={`${pid}→${node.id}`}
                  d={`M${x1} ${y1} C${mx} ${y1},${mx} ${y2},${x2} ${y2}`}
                  fill="none"
                  stroke={lit ? c : "rgba(29,233,182,0.09)"}
                  strokeWidth={lit ? 1.5 : 1}
                  strokeDasharray={lit ? undefined : "5 4"}
                  markerEnd={`url(#arr-${node.severity})`}
                  style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
                />
              );
            })
          )}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            const x = pos.x, y = pos.y + offsetY;
            const c = severityColor(node.severity);
            const isActive = selected?.id === node.id;
            const isLit    = hoveredIds.has(node.id);
            const species1 = node.affectedSpecies?.[0];

            return (
              <foreignObject
                key={node.id} x={x} y={y} width={CARD_W} height={CARD_H}
                onMouseEnter={() => highlightChain(node.id)}
                onMouseLeave={() => setHoveredIds(new Set())}
              >
                <div
                  style={{
                    width: "100%", height: "100%",
                    background: isActive ? `rgba(${hexToRgb(c)},0.16)` : isLit ? `rgba(${hexToRgb(c)},0.08)` : "rgba(8,18,22,0.86)",
                    backdropFilter: "blur(16px)",
                    border: `1px solid ${isActive || isLit ? c + "70" : "rgba(29,233,182,0.08)"}`,
                    borderRadius: 10,
                    padding: "10px 12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: isLit ? `0 0 22px rgba(${hexToRgb(c)},0.18)` : "none",
                    display: "flex", flexDirection: "column", gap: 5,
                    overflow: "hidden",
                    fontFamily: "Inter, sans-serif",
                  }}
                  onClick={() => setSelected(isActive ? null : node)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}`, flexShrink: 0 }} />
                    <div style={{ fontSize: "0.74rem", fontWeight: 500, color: "#deecea", lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {node.label}
                    </div>
                  </div>
                  {node.metric && (
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.64rem", color: c, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {node.metric}
                    </div>
                  )}
                  {species1 && (
                    <div style={{ fontSize: "0.59rem", color: "rgba(212,168,71,0.7)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontStyle: "italic" }}>
                      ↳ {species1.split("(")[1]?.replace(")", "") ?? species1.split(" ").slice(0,2).join(" ")}
                    </div>
                  )}
                </div>
              </foreignObject>
            );
          })}

          {/* Layer header labels */}
          {LAYER_LABELS.map((label, i) => {
            if (!(i in layers)) return null;
            return (
              <text key={i} x={i * LAYER_GAP + CARD_W / 2} y={LABEL_ZONE - 10}
                textAnchor="middle" fill="rgba(106,157,149,0.45)"
                fontSize="10" fontFamily="Inter,sans-serif" letterSpacing="0.08em"
              >
                {label.toUpperCase()}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ padding: "0 24px", maxWidth: 620, margin: "20px auto 0" }}>
          <DetailPanel node={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </section>
  );
}
