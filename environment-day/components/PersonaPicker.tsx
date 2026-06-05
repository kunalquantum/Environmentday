"use client";
import { useRef } from "react";
import { PERSONAS, Persona, CUSTOM_PERSONA_ID } from "@/lib/personas";

interface Props {
  activeId: string | null;
  onSelect: (persona: Persona | null) => void;
}

function PersonaCard({
  persona,
  active,
  onSelect,
}: {
  persona: Persona;
  active: boolean;
  onSelect: () => void;
}) {
  const c = persona.color;
  return (
    <button
      onClick={onSelect}
      style={{
        flexShrink: 0,
        width: 148,
        background: active
          ? `rgba(${hexToRgb(c)}, 0.12)`
          : "rgba(8, 18, 22, 0.7)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${active ? c : "rgba(29,233,182,0.08)"}`,
        borderRadius: 14,
        padding: "18px 12px 14px",
        cursor: "pointer",
        textAlign: "center",
        transition: "all 0.25s ease",
        boxShadow: active ? `0 0 28px rgba(${hexToRgb(c)}, 0.22)` : "none",
        position: "relative",
        overflow: "hidden",
        fontFamily: "inherit",
        color: "inherit",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(${hexToRgb(c)}, 0.35)`;
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLButtonElement).style.background = `rgba(${hexToRgb(c)}, 0.07)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(29,233,182,0.08)";
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(8,18,22,0.7)";
        }
      }}
    >
      {/* Active indicator dot */}
      {active && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: c,
            boxShadow: `0 0 8px ${c}`,
          }}
        />
      )}

      {/* Icon */}
      <div style={{ fontSize: "2.2rem", lineHeight: 1, marginBottom: 10 }}>
        {persona.icon}
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "0.95rem",
          fontWeight: active ? 600 : 500,
          color: active ? c : "var(--text-primary)",
          lineHeight: 1.2,
          marginBottom: 5,
          transition: "color 0.25s",
        }}
      >
        {persona.name}
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: "0.65rem",
          color: "var(--text-muted)",
          lineHeight: 1.4,
          marginBottom: 10,
          minHeight: 28,
        }}
      >
        {persona.tagline}
      </div>

      {/* Daily footprint badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 8px",
          background: active ? `rgba(${hexToRgb(c)}, 0.18)` : "var(--bg-elevated)",
          borderRadius: 99,
          fontSize: "0.62rem",
          color: active ? c : "var(--text-muted)",
          fontFamily: "'JetBrains Mono', monospace",
          transition: "all 0.25s",
          border: active ? `1px solid rgba(${hexToRgb(c)}, 0.3)` : "1px solid transparent",
        }}
      >
        {persona.dailyRange} / day
      </div>
    </button>
  );
}

function CustomCard({ active, onSelect }: { active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      style={{
        flexShrink: 0,
        width: 148,
        background: active ? "rgba(106,157,149,0.1)" : "rgba(8,18,22,0.5)",
        backdropFilter: "blur(16px)",
        border: `1px dashed ${active ? "rgba(106,157,149,0.6)" : "rgba(29,233,182,0.12)"}`,
        borderRadius: 14,
        padding: "18px 12px 14px",
        cursor: "pointer",
        textAlign: "center",
        transition: "all 0.25s ease",
        fontFamily: "inherit",
        color: "inherit",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(29,233,182,0.25)";
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(29,233,182,0.12)";
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
        }
      }}
    >
      <div style={{ fontSize: "2.2rem", lineHeight: 1, marginBottom: 10, opacity: 0.5 }}>✏️</div>
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "0.95rem",
          fontWeight: 500,
          color: active ? "var(--text-primary)" : "var(--text-muted)",
          lineHeight: 1.2,
          marginBottom: 5,
        }}
      >
        Custom
      </div>
      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", lineHeight: 1.4, marginBottom: 10, minHeight: 28 }}>
        Set your own values manually
      </div>
      <div
        style={{
          display: "inline-flex",
          padding: "3px 8px",
          background: "var(--bg-elevated)",
          borderRadius: 99,
          fontSize: "0.62rem",
          color: "var(--text-muted)",
        }}
      >
        free-form
      </div>
    </button>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export default function PersonaPicker({ activeId, onSelect }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ marginBottom: 36 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.15rem",
            fontWeight: 500,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          Who are you today?
        </h3>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Select a profile — sliders pre-fill with realistic values
        </span>
      </div>

      {/* Scrollable card row */}
      <div
        ref={rowRef}
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 12,
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {PERSONAS.map((p) => (
          <PersonaCard
            key={p.id}
            persona={p}
            active={activeId === p.id}
            onSelect={() => onSelect(p)}
          />
        ))}
        <CustomCard
          active={activeId === CUSTOM_PERSONA_ID}
          onSelect={() => onSelect(null)}
        />
      </div>

      {/* Active persona context banner */}
      {activeId && activeId !== CUSTOM_PERSONA_ID && (() => {
        const p = PERSONAS.find((x) => x.id === activeId);
        if (!p) return null;
        const c = p.color;
        return (
          <div
            style={{
              marginTop: 14,
              padding: "14px 18px",
              background: `rgba(${hexToRgb(c)}, 0.06)`,
              border: `1px solid rgba(${hexToRgb(c)}, 0.18)`,
              borderRadius: 10,
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "1.4rem", flexShrink: 0, marginTop: 2 }}>{p.icon}</span>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  color: c,
                  marginBottom: 4,
                }}
              >
                {p.name} · {p.description}
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {p.insights.map((ins, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 6,
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ color: c, fontSize: "0.7rem", marginTop: 2, flexShrink: 0 }}>◆</span>
                    {ins}
                  </div>
                ))}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: "0.62rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Typical daily range
              </div>
              <div
                className="num"
                style={{ fontSize: "1.3rem", fontWeight: 600, color: c, lineHeight: 1 }}
              >
                {p.dailyRange}
              </div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>CO₂e / day</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
