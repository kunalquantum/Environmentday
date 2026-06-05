export type Severity = "low" | "medium" | "high" | "critical";

export interface Activity {
  id: string;
  label: string;
  icon: string;
  unit: string;
  max: number;
  step: number;
  kgCO2perUnit: number;
  color: string;
}

export interface CascadeNode {
  id: string;
  label: string;
  detail: string;
  severity: Severity;
  layer: number;        // 0=source, 1=direct, 2=secondary, 3=tertiary, 4=quaternary
  parentIds: string[];
  metric?: string;      // e.g. "2.3°C rise"
  species?: string;     // specific affected species
}

export const ACTIVITIES: Activity[] = [
  {
    id: "cab",
    label: "Cab / Car Ride",
    icon: "🚕",
    unit: "km",
    max: 200,
    step: 5,
    kgCO2perUnit: 0.21,
    color: "#d4a847",
  },
  {
    id: "flight",
    label: "Air Travel",
    icon: "✈️",
    unit: "km",
    max: 10000,
    step: 100,
    kgCO2perUnit: 0.255,
    color: "#ff9800",
  },
  {
    id: "electricity",
    label: "Electricity",
    icon: "⚡",
    unit: "kWh",
    max: 500,
    step: 10,
    kgCO2perUnit: 0.475,
    color: "#1de9b6",
  },
  {
    id: "beef",
    label: "Beef / Lamb",
    icon: "🥩",
    unit: "kg",
    max: 30,
    step: 0.5,
    kgCO2perUnit: 27,
    color: "#ff5252",
  },
  {
    id: "shopping",
    label: "Shopping",
    icon: "🛍️",
    unit: "USD spent",
    max: 1000,
    step: 10,
    kgCO2perUnit: 0.43,
    color: "#9c27b0",
  },
];

export function buildCascade(totalKgCO2: number): CascadeNode[] {
  const co2t = totalKgCO2 / 1000; // tonnes
  const intensity = Math.min(co2t / 5, 1); // 0–1 scale

  const sev = (base: Severity, boost = 0): Severity => {
    const levels: Severity[] = ["low", "medium", "high", "critical"];
    const idx = Math.min(levels.indexOf(base) + boost, 3);
    return levels[idx];
  };

  const nodes: CascadeNode[] = [
    // ── Layer 0: source activities ──
    {
      id: "source",
      label: "Human Activity",
      detail: `${totalKgCO2.toFixed(1)} kg CO₂e released`,
      severity: "low",
      layer: 0,
      parentIds: [],
      metric: `${totalKgCO2.toFixed(1)} kg CO₂e`,
    },

    // ── Layer 1: direct emissions ──
    {
      id: "fuel_burn",
      label: "Fossil Fuel Combustion",
      detail: "Burning petrol, diesel & aviation fuel releases CO₂, NOₓ, black carbon",
      severity: sev("medium", intensity > 0.4 ? 1 : 0),
      layer: 1,
      parentIds: ["source"],
      metric: `${(totalKgCO2 * 0.6).toFixed(0)} kg CO₂`,
    },
    {
      id: "methane",
      label: "Methane & N₂O Leakage",
      detail: "Supply-chain leakage — methane is 84× more potent than CO₂ over 20 years",
      severity: sev("medium", intensity > 0.5 ? 1 : 0),
      layer: 1,
      parentIds: ["source"],
      metric: `${(totalKgCO2 * 0.15).toFixed(0)} kg CO₂e`,
    },

    // ── Layer 2: secondary atmospheric ──
    {
      id: "atmo_co2",
      label: "Atmospheric CO₂ Rise",
      detail: "CO₂ accumulates for 300–1000 years. Each ppm warms oceans and shifts jet streams.",
      severity: sev("medium", intensity > 0.3 ? 1 : 0),
      layer: 2,
      parentIds: ["fuel_burn"],
      metric: `+${(totalKgCO2 * 0.00000027).toFixed(7)} ppm`,
    },
    {
      id: "ozone",
      label: "Stratospheric Ozone Stress",
      detail: "NOₓ & halons from aviation react with O₃ molecules, thinning the protective layer",
      severity: sev("high"),
      layer: 2,
      parentIds: ["fuel_burn"],
      metric: "+NOₓ flux",
    },
    {
      id: "urban_heat",
      label: "Urban Heat Island",
      detail: "Black carbon & waste heat increase local temps by 2–4°C, intensifying heat stress",
      severity: sev("medium", intensity > 0.6 ? 1 : 0),
      layer: 2,
      parentIds: ["fuel_burn", "methane"],
      metric: "+2–4°C local",
    },
    {
      id: "ocean_absorb",
      label: "Ocean CO₂ Absorption",
      detail: "Oceans absorb ~25% of emissions — dropping pH, triggering acidification cascade",
      severity: sev("high"),
      layer: 2,
      parentIds: ["atmo_co2"],
      metric: "pH −0.1 per century",
    },

    // ── Layer 3: ecosystem damage ──
    {
      id: "coral_bleach",
      label: "Coral Bleaching",
      detail: "Acidified, warmer water causes mass coral bleaching. 50% of reefs lost since 1950.",
      severity: sev("high", intensity > 0.4 ? 1 : 0),
      layer: 3,
      parentIds: ["ocean_absorb"],
      metric: "50% reef loss",
      species: "Staghorn Coral",
    },
    {
      id: "arctic_melt",
      label: "Arctic Ice Melt",
      detail: "Ice-albedo feedback loop — less ice means more heat absorbed, accelerating warming",
      severity: sev("critical"),
      layer: 3,
      parentIds: ["atmo_co2", "urban_heat"],
      metric: "−13%/decade",
    },
    {
      id: "uv_increase",
      label: "UV Radiation Surge",
      detail: "Ozone thinning allows more UVB through. Disrupts photoperiod cues birds use to migrate.",
      severity: sev("high"),
      layer: 3,
      parentIds: ["ozone"],
      metric: "+10% UVB",
      species: "Arctic Tern",
    },
    {
      id: "deforest_pressure",
      label: "Deforestation Pressure",
      detail: "Climate stress weakens forests; economic pressure expands agricultural burning",
      severity: sev("high"),
      layer: 3,
      parentIds: ["urban_heat", "atmo_co2"],
      metric: "15B trees/year lost",
    },

    // ── Layer 4: species & biodiversity loss ──
    {
      id: "marine_collapse",
      label: "Marine Ecosystem Collapse",
      detail: "Coral loss removes habitat for 25% of all marine species, triggering trophic collapse",
      severity: "critical",
      layer: 4,
      parentIds: ["coral_bleach"],
      metric: "25% species habitat",
      species: "Clownfish, Sea Turtle",
    },
    {
      id: "bird_migration",
      label: "Migratory Bird Disruption",
      detail: "UV changes & magnetic-field shifts confuse navigation. Timing mismatches reduce survival.",
      severity: sev("high", intensity > 0.3 ? 1 : 0),
      layer: 4,
      parentIds: ["uv_increase", "arctic_melt"],
      metric: "2–4 wk shift",
      species: "Arctic Tern, Bar-tailed Godwit",
    },
    {
      id: "bird_habitat",
      label: "Forest Bird Habitat Loss",
      detail: "Deforestation removes nesting grounds. Canopy loss reduces insect prey by up to 60%.",
      severity: "critical",
      layer: 4,
      parentIds: ["deforest_pressure"],
      metric: "3B birds lost",
      species: "Cerulean Warbler, Harpy Eagle",
    },
    {
      id: "sea_level",
      label: "Coastal Flooding & Displacement",
      detail: "Melting ice raises sea levels, drowning nesting grounds and displacing 1B+ people by 2050",
      severity: "critical",
      layer: 4,
      parentIds: ["arctic_melt"],
      metric: "+0.3–1m by 2100",
      species: "Piping Plover, Least Tern",
    },
  ];

  return nodes;
}

export function totalEmissions(values: Record<string, number>): number {
  return ACTIVITIES.reduce((sum, act) => {
    return sum + (values[act.id] ?? 0) * act.kgCO2perUnit;
  }, 0);
}

export function severityColor(s: Severity): string {
  return {
    low: "#1de9b6",
    medium: "#d4a847",
    high: "#ff9800",
    critical: "#ff5252",
  }[s];
}

export function equivalence(kg: number): string[] {
  return [
    `${(kg / 0.21).toFixed(0)} km in a cab`,
    `${(kg * 2.4).toFixed(0)} plastic bags produced`,
    `${(kg / 120).toFixed(2)} tree-years to offset`,
    `${(kg / 8.1).toFixed(1)} burgers worth of emissions`,
  ];
}
