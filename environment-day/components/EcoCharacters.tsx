"use client";
import Image from "next/image";
import { CascadeGraph, ActiveNode } from "@/lib/cascadeEngine";

// ─── Status helpers ───────────────────────────────────────────────────────────

export type CharStatus = "thriving" | "okay" | "stressed" | "critical";

function getStatus(nodes: ActiveNode[], relevantIds: string[]): CharStatus {
  const matching = nodes.filter((n) => relevantIds.includes(n.id));
  if (!matching.length) return "thriving";
  const max = matching.reduce((m, n) => {
    const s = { low: 1, medium: 2, high: 3, critical: 4 }[n.severity] ?? 0;
    return Math.max(m, s);
  }, 0);
  if (max >= 4) return "critical";
  if (max >= 3) return "stressed";
  if (max >= 2) return "okay";
  return "thriving";
}

const STATUS_LABEL: Record<CharStatus, string> = {
  thriving: "Thriving",
  okay: "Okay",
  stressed: "Stressed",
  critical: "Critical",
};

const STATUS_COLOR: Record<CharStatus, string> = {
  thriving: "#1de9b6",
  okay:     "#d4a847",
  stressed: "#ff9800",
  critical: "#ff5252",
};

// ─── Per-state CSS config ─────────────────────────────────────────────────────

const STATE_CONFIG: Record<CharStatus, {
  cardGlow: string;
  cardBg: string;
  imgAnim: string;
  imgFilter: string;
  cardAnim: string;
  overlayColor: string;
  overlayOpacity: number;
}> = {
  thriving: {
    cardGlow:       "0 0 28px rgba(29,233,182,0.25), 0 0 60px rgba(29,233,182,0.08)",
    cardBg:         "rgba(8,24,20,0.82)",
    imgAnim:        "charSway 3.5s ease-in-out infinite",
    imgFilter:      "brightness(1.08) saturate(1.1)",
    cardAnim:       "none",
    overlayColor:   "#1de9b6",
    overlayOpacity: 0,
  },
  okay: {
    cardGlow:       "0 0 14px rgba(212,168,71,0.15)",
    cardBg:         "rgba(8,18,22,0.82)",
    imgAnim:        "charFloat 4s ease-in-out infinite",
    imgFilter:      "brightness(1) saturate(1)",
    cardAnim:       "none",
    overlayColor:   "#d4a847",
    overlayOpacity: 0,
  },
  stressed: {
    cardGlow:       "0 0 14px rgba(255,152,0,0.18)",
    cardBg:         "rgba(14,10,4,0.88)",
    imgAnim:        "charDroop 2.2s ease-in-out infinite",
    imgFilter:      "brightness(0.88) saturate(0.75) sepia(0.2)",
    cardAnim:       "none",
    overlayColor:   "#ff9800",
    overlayOpacity: 0.06,
  },
  critical: {
    cardGlow:       "0 0 28px rgba(255,82,82,0.3), 0 0 60px rgba(255,82,82,0.08)",
    cardBg:         "rgba(18,4,4,0.92)",
    imgAnim:        "charTremble 0.55s ease-in-out infinite",
    imgFilter:      "brightness(0.72) saturate(0.45) sepia(0.4) hue-rotate(-10deg)",
    cardAnim:       "none",
    overlayColor:   "#ff5252",
    overlayOpacity: 0.12,
  },
};

// ─── Character image map ──────────────────────────────────────────────────────

const CHAR_IMAGES: Record<string, Record<CharStatus, string>> = {
  tree:     { thriving: "/characters/tree-thriving.png",     okay: "/characters/tree-okay.png",     stressed: "/characters/tree-stressed.png",     critical: "/characters/tree-critical.png"     },
  bird:     { thriving: "/characters/bird-thriving.png",     okay: "/characters/bird-okay.png",     stressed: "/characters/bird-stressed.png",     critical: "/characters/bird-critical.png"     },
  elephant: { thriving: "/characters/elephant-thriving.png", okay: "/characters/elephant-okay.png", stressed: "/characters/elephant-stressed.png", critical: "/characters/elephant-critical.png" },
  fish:     { thriving: "/characters/fish-thriving.png",     okay: "/characters/fish-okay.png",     stressed: "/characters/fish-stressed.png",     critical: "/characters/fish-critical.png"     },
  bee:      { thriving: "/characters/bee-thriving.png",      okay: "/characters/bee-okay.png",      stressed: "/characters/bee-stressed.png",      critical: "/characters/bee-critical.png"      },
  earth:    { thriving: "/characters/earth-thriving.png",    okay: "/characters/earth-okay.png",    stressed: "/characters/earth-stressed.png",    critical: "/characters/earth-critical.png"    },
};

// Status dot pulse colors
const DOT_ANIM: Record<CharStatus, string> = {
  thriving: "animate-pulse-glow",
  okay:     "",
  stressed: "animate-pulse-glow",
  critical: "animate-pulse-glow",
};

// ─── Sparkle overlay for thriving ────────────────────────────────────────────

function Sparkles({ color }: { color: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: "inherit" }}>
      {[
        { top: "12%", left: "14%", delay: "0s",    size: 6 },
        { top: "18%", left: "80%", delay: "0.5s",  size: 5 },
        { top: "72%", left: "10%", delay: "0.9s",  size: 4 },
        { top: "80%", left: "78%", delay: "0.3s",  size: 6 },
        { top: "45%", left: "92%", delay: "1.1s",  size: 4 },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: s.top, left: s.left,
            width: s.size, height: s.size,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 6px ${color}`,
            animation: `sparkle 1.6s ease-in-out ${s.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Tear overlay for stressed / critical ────────────────────────────────────

function TearDrops() {
  return (
    <div style={{ position: "absolute", bottom: "30%", left: 0, right: 0, pointerEvents: "none", display: "flex", justifyContent: "center", gap: 18 }}>
      {[{ delay: "0s" }, { delay: "0.7s" }].map((t, i) => (
        <div
          key={i}
          style={{
            width: 5, height: 9,
            borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
            background: "rgba(100,181,246,0.85)",
            boxShadow: "0 0 6px rgba(100,181,246,0.5)",
            animation: `tearDrop 1.8s ease-in ${t.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Single character card ────────────────────────────────────────────────────

function CharacterCard({
  id, name, status, reason, large = false,
}: {
  id: string;
  name: string;
  status: CharStatus;
  reason: string;
  large?: boolean;
}) {
  const c    = STATUS_COLOR[status];
  const cfg  = STATE_CONFIG[status];
  const src  = CHAR_IMAGES[id]?.[status] ?? CHAR_IMAGES[id]?.okay;
  const isCritical  = status === "critical";
  const isStressed  = status === "stressed";
  const isThriving  = status === "thriving";

  return (
    <div
      style={{
        position: "relative",
        flex: large ? "0 0 auto" : "1 1 140px",
        minWidth: large ? 175 : 138,
        maxWidth: large ? 195 : 168,
        background: cfg.cardBg,
        backdropFilter: "blur(18px)",
        border: `1px solid ${c}44`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: cfg.cardGlow,
        transition: "box-shadow 0.4s, border-color 0.4s",
      }}
    >
      {/* Coloured overlay tint (stressed/critical) */}
      {cfg.overlayOpacity > 0 && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 2,
          background: cfg.overlayColor,
          opacity: cfg.overlayOpacity,
          pointerEvents: "none",
          borderRadius: "inherit",
        }} />
      )}

      {/* Status badge */}
      <div style={{
        position: "absolute", top: 8, right: 8, zIndex: 4,
        display: "flex", alignItems: "center", gap: 4,
        padding: "2px 8px",
        background: `${c}28`,
        border: `1px solid ${c}55`,
        borderRadius: 99,
        fontSize: "0.56rem",
        color: c,
        fontFamily: "Inter, sans-serif",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        backdropFilter: "blur(6px)",
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: "50%",
          background: c,
          boxShadow: `0 0 5px ${c}`,
          display: "inline-block",
          animation: DOT_ANIM[status] ? "pulseGlow 1.4s ease-in-out infinite" : "none",
        }} />
        {STATUS_LABEL[status]}
      </div>

      {/* Image area */}
      <div style={{
        position: "relative",
        width: "100%",
        height: large ? 155 : 130,
        overflow: "hidden",
      }}>
        {src && (
          <div style={{
            width: "100%", height: "100%",
            animation: cfg.imgAnim,
            transformOrigin: "bottom center",
          }}>
            <Image
              src={src}
              alt={`${name} – ${status}`}
              fill
              style={{
                objectFit: "cover",
                objectPosition: "center top",
                filter: cfg.imgFilter,
                transition: "filter 0.6s ease",
                borderRadius: "14px 14px 0 0",
              }}
              sizes="200px"
              priority={id === "earth"}
            />
          </div>
        )}

        {/* Sparkles for thriving */}
        {isThriving && <Sparkles color={c} />}

        {/* Tear drops for stressed / critical */}
        {(isStressed || isCritical) && <TearDrops />}

        {/* Dark vignette at bottom of image */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 40,
          background: `linear-gradient(to top, ${cfg.cardBg}, transparent)`,
          pointerEvents: "none",
        }} />
      </div>

      {/* Text area */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: large ? "0.92rem" : "0.82rem",
          fontWeight: 500,
          color: c,
          marginBottom: 4,
          lineHeight: 1.2,
        }}>
          {name}
        </div>
        <div style={{
          fontSize: "0.63rem",
          color: "var(--text-muted)",
          lineHeight: 1.5,
        }}>
          {reason}
        </div>
      </div>
    </div>
  );
}

// ─── Reason text ─────────────────────────────────────────────────────────────

const REASONS: Record<string, Partial<Record<CharStatus, string>>> = {
  tree:     { thriving: "Forests thriving, carbon stored",     okay: "Minor deforestation pressure",     stressed: "Forest habitat shrinking",      critical: "Amazon tipping point near"        },
  bird:     { thriving: "Migration routes intact",             okay: "Timing shifts beginning",           stressed: "Migration routes disrupted",    critical: "3 billion birds already lost"     },
  elephant: { thriving: "Habitat healthy & watered",           okay: "Habitat under mild stress",        stressed: "Wildfires & drought spreading",  critical: "Freshwater & habitat collapsing"  },
  fish:     { thriving: "Reefs alive, ocean balanced",         okay: "Ocean warming detected",           stressed: "Coral bleaching underway",       critical: "Reef ecosystem collapsing"        },
  bee:      { thriving: "Pollinators flourishing",             okay: "Pollinator range shrinking",       stressed: "Ozone smog damaging flowers",    critical: "76% insect biomass already lost"  },
  earth:    { thriving: "Atmosphere in balance",               okay: "Above daily average",              stressed: "Multiple systems under pressure", critical: "Cascading tipping points active"  },
};

function getReason(id: string, s: CharStatus) {
  return REASONS[id]?.[s] ?? REASONS[id]?.okay ?? "";
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EcoCharacters({ graph }: { graph: CascadeGraph }) {
  const { nodes, severityLevel } = graph;

  const treeS     = getStatus(nodes, ["amazon_dieback", "deforestation_pressure", "forest_bird_habitat_loss", "wildfire_increase"]);
  const birdS     = getStatus(nodes, ["migratory_bird_disruption", "forest_bird_habitat_loss", "coastal_habitat_loss", "polar_species_decline"]);
  const elephantS = getStatus(nodes, ["amazon_dieback", "freshwater_stress", "wildfire_increase", "global_temperature_rise"]);
  const fishS     = getStatus(nodes, ["coral_bleaching", "marine_food_web", "coral_reef_biodiversity", "ocean_warming_acidification"]);
  const beeS      = getStatus(nodes, ["pollinator_collapse", "ozone_tropospheric_smog", "acid_deposition", "global_temperature_rise"]);
  const earthS: CharStatus =
    severityLevel === "critical"  ? "critical"
    : severityLevel === "high"    ? "stressed"
    : severityLevel === "moderate"? "okay"
    : "thriving";

  const characters = [
    { id: "tree",     name: "Banyan Tree",  status: treeS,     large: false },
    { id: "bird",     name: "Bird",         status: birdS,     large: false },
    { id: "elephant", name: "Elephant",     status: elephantS, large: false },
    { id: "fish",     name: "Reef Fish",    status: fishS,     large: false },
    { id: "bee",      name: "Honey Bee",    status: beeS,      large: false },
    { id: "earth",    name: "Our Earth",    status: earthS,    large: true  },
  ];

  return (
    <div style={{ marginBottom: 36 }}>
      {/* Divider label */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg, transparent, var(--border-hover))" }} />
        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          Ecosystem Reactions
        </span>
        <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg, var(--border-hover), transparent)" }} />
      </div>

      {/* Cards row */}
      <div style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "flex-start",
      }}>
        {characters.map((c) => (
          <CharacterCard
            key={c.id}
            id={c.id}
            name={c.name}
            status={c.status}
            reason={getReason(c.id, c.status)}
            large={c.large}
          />
        ))}
      </div>

      {/* Summary status strip */}
      <div style={{
        marginTop: 16,
        padding: "11px 20px",
        background: "var(--bg-elevated)",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        flexWrap: "wrap",
      }}>
        {characters.map(({ id, name, status }) => (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: STATUS_COLOR[status],
              boxShadow: `0 0 6px ${STATUS_COLOR[status]}`,
              animation: status !== "okay" ? "pulseGlow 1.6s ease-in-out infinite" : "none",
            }} />
            <span style={{ fontSize: "0.65rem", color: STATUS_COLOR[status], fontWeight: 500 }}>
              {name}
            </span>
            <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
              {STATUS_LABEL[status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
