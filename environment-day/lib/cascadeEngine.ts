/**
 * Cascade Engine v2
 * Reads the rule-based knowledge base and dynamically builds the cascade graph
 * based on user activity inputs. Node count, depth, and severity all scale
 * with actual emission levels and activity-specific triggers.
 */

import kb from "./knowledgeBase.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Severity = "low" | "medium" | "high" | "critical";

export interface ActivityValues {
  personal_vehicle?: number;
  aviation?: number;
  electricity?: number;
  beef?: number;
  dairy?: number;
  natural_gas?: number;
  shopping?: number;
  [key: string]: number | undefined;
}

export interface PollutantProfile {
  co2_kg: number;
  ch4_co2e_kg: number;
  n2o_co2e_kg: number;
  nox_g: number;
  pm25_g: number;
  bc_g: number;
  total_co2e_kg: number;
}

export interface ActiveNode {
  id: string;
  label: string;
  description: string;
  layer: number;
  category: string;
  severity: Severity;
  metric: string;
  parentIds: string[];
  affectedSpecies?: string[];
  currentGlobalStatus?: string;
  source?: string;
  activationStrength: number; // 0–1, used for visual intensity
}

export interface CascadeGraph {
  nodes: ActiveNode[];
  totalKgCO2e: number;
  pollutants: PollutantProfile;
  severityLevel: "negligible" | "low" | "moderate" | "high" | "critical";
  maxLayer: number;
  equivalences: { label: string; value: string; icon: string }[];
}

// ─── Step 1: Compute emissions per activity ───────────────────────────────────

export function computeEmissions(values: ActivityValues): {
  byActivity: Record<string, number>;
  pollutants: PollutantProfile;
  total: number;
} {
  const byActivity: Record<string, number> = {};
  let co2_kg = 0, ch4_co2e_kg = 0, n2o_co2e_kg = 0;
  let nox_g = 0, pm25_g = 0, bc_g = 0;

  for (const act of kb.activities) {
    const val = values[act.id] ?? 0;
    if (val <= 0) { byActivity[act.id] = 0; continue; }

    const ef = act.emissionFactors;
    const actCO2e = val * ef.co2e_kg_per_unit;
    byActivity[act.id] = actCO2e;

    co2_kg   += val * (ef.co2_kg_per_unit ?? ef.co2e_kg_per_unit);
    nox_g    += val * (ef.nox_g_per_unit ?? 0);
    pm25_g   += val * (ef.pm25_g_per_unit ?? 0);
    bc_g     += val * (ef.black_carbon_g_per_unit ?? 0);

    // Livestock gets CH4 / N2O decomposition
    if (act.id === "beef" || act.id === "dairy") {
      ch4_co2e_kg += val * (ef.ch4_co2e_kg_per_unit ?? 0);
      n2o_co2e_kg += val * (ef.n2o_co2e_kg_per_unit ?? 0);
    } else if (act.id === "natural_gas") {
      ch4_co2e_kg += val * (ef.ch4_leakage_co2e_kg_per_unit ?? 0);
    } else if (act.id === "agriculture") {
      const efAny = ef as unknown as Record<string, number>;
      n2o_co2e_kg += val * (efAny.n2o_co2e_kg_per_unit ?? 0);
    }
  }

  const total = Object.values(byActivity).reduce((s, v) => s + v, 0);

  return {
    byActivity,
    pollutants: { co2_kg, ch4_co2e_kg, n2o_co2e_kg, nox_g, pm25_g, bc_g, total_co2e_kg: total },
    total,
  };
}

// ─── Step 2: Determine global severity tier ──────────────────────────────────

function getTier(totalKg: number): "negligible" | "low" | "moderate" | "high" | "critical" {
  const t = kb.severityThresholds.global;
  if (totalKg <= t.negligible.maxKgCO2) return "negligible";
  if (totalKg <= t.low.maxKgCO2)        return "low";
  if (totalKg <= t.moderate.maxKgCO2)   return "moderate";
  if (totalKg <= t.high.maxKgCO2)       return "high";
  return "critical";
}

function getSeverity(nodeId: string, totalKg: number, values: ActivityValues): Severity {
  const nodeDef = kb.cascadeNodes.find((n) => n.id === nodeId);
  if (!nodeDef) return "low";

  // Use the node's own threshold if defined
  const t = (nodeDef as Record<string, unknown>).severityThresholds as
    | { low: number; medium: number; high: number; critical: number }
    | undefined;

  const probe = evalFormula(nodeDef.severityFormula, totalKg, values);

  if (!t) return "low";
  if (probe >= t.critical) return "critical";
  if (probe >= t.high)     return "high";
  if (probe >= t.medium)   return "medium";
  return "low";
}

// ─── Step 3: Evaluate simple formula strings ─────────────────────────────────

function evalFormula(formula: string, totalKgCO2: number, values: ActivityValues): number {
  try {
    const byAct = computeEmissions(values).byActivity;

    // Build variable map
    const vars: Record<string, number> = {
      totalKgCO2,
      totalKgCO2e: totalKgCO2,
      transportKgCO2: (byAct["personal_vehicle"] ?? 0) + (byAct["aviation"] ?? 0),
      electricityKgCO2: byAct["electricity"] ?? 0,
      gasKgCO2: byAct["natural_gas"] ?? 0,
      beefKgCO2e: byAct["beef"] ?? 0,
      beefKg: values["beef"] ?? 0,
      foodKgCO2e: (byAct["beef"] ?? 0) + (byAct["dairy"] ?? 0),
      aviationKm: values["aviation"] ?? 0,
      shoppingUSD: values["shopping"] ?? 0,
      ppm: totalKgCO2 * 0.00000027,
      value: totalKgCO2,
    };

    let expr = formula;
    for (const [k, v] of Object.entries(vars)) {
      expr = expr.replace(new RegExp(`\\b${k}\\b`, "g"), String(v));
    }

    // Safe arithmetic eval — only numbers and operators
    if (/^[\d\s+\-*/().]+$/.test(expr)) {
      return Function(`"use strict"; return (${expr})`)() as number;
    }
    return 0;
  } catch {
    return 0;
  }
}

// ─── Step 4: Evaluate a chain rule's condition ───────────────────────────────

function evalChainRule(
  rule: (typeof kb.chainRules)[0],
  values: ActivityValues,
  totalKg: number,
  activeNodeIds: Set<string>
): boolean {
  const r = rule as Record<string, unknown>;

  // Total CO2 threshold
  if (r.minTotalKgCO2 !== undefined && totalKg < (r.minTotalKgCO2 as number)) return false;

  // Required single activity minimum value
  if (r.requiredActivity !== undefined) {
    const actId = r.requiredActivity as string;
    const minVal = (r.minValue as number | undefined) ?? 0;
    if ((values[actId] ?? 0) < minVal) return false;
  }

  // Required activities array
  if (r.requiredActivities !== undefined) {
    const acts = r.requiredActivities as string[];
    const logic = (r.logic as string | undefined) ?? "OR";
    const minVal = (r.minValue as number | undefined) ?? 0;
    const results = acts.map((a) => (values[a] ?? 0) >= minVal);
    const passes = logic === "AND" ? results.every(Boolean) : results.some(Boolean);
    if (!passes) return false;
  }

  // Required parent node active
  if (r.requiredParent !== undefined) {
    if (!activeNodeIds.has(r.requiredParent as string)) return false;

    // Required parent severity check
    if (r.minParentSeverity !== undefined) {
      // We just check it's active; deeper severity handled by node's own rules
    }
  }

  // Required parent nodes array
  if (r.requiredParents !== undefined) {
    const parents = r.requiredParents as string[];
    const logic = (r.logic as string | undefined) ?? "OR";
    const results = parents.map((p) => activeNodeIds.has(p));
    const passes = logic === "AND" ? results.every(Boolean) : results.some(Boolean);
    if (!passes) return false;
  }

  return true;
}

// ─── Step 5: Evaluate a cascade node's own activation rules ──────────────────

function evalNodeActivation(
  node: (typeof kb.cascadeNodes)[0],
  values: ActivityValues,
  totalKg: number,
  activeNodeIds: Set<string>
): boolean {
  const rules = node.activationRules as Record<string, unknown>;

  // Always-active node
  if (rules.alwaysActive === true) return true;

  // Required parent nodes
  if (rules.requiredParents !== undefined) {
    const parents = rules.requiredParents as string[];
    const logic = (rules.logic as string | undefined) ?? "OR";
    const minSev = (rules.minParentSeverity as string | undefined) ?? "low";
    const results = parents.map((p) => activeNodeIds.has(p));
    const passes = logic === "AND" ? results.every(Boolean) : results.some(Boolean);
    if (!passes) return false;
  }

  // Required specific activities
  if (rules.requiredActivities !== undefined) {
    const acts = rules.requiredActivities as string[];
    const logic = (rules.logic as string | undefined) ?? "OR";
    const minSum = (rules.minActivitySum as number | undefined) ?? 0;
    const results = acts.map((a) => (values[a] ?? 0) > minSum);
    const passes = logic === "AND" ? results.every(Boolean) : results.some(Boolean);
    if (!passes) return false;
  }

  // Minimum values for specific activities
  if (rules.activityMinValues !== undefined) {
    for (const [actId, minVal] of Object.entries(rules.activityMinValues as Record<string, number>)) {
      if ((values[actId] ?? 0) < minVal) return false;
    }
  }

  return true;
}

// ─── Step 6: Compute metric display string ───────────────────────────────────

function buildMetric(template: string, nodeId: string, totalKg: number, values: ActivityValues): string {
  const raw = evalFormula(
    // strip template wrappers, get the formula inside ${}
    template.replace(/\${([^}]+)}/g, "$1").replace(/[^0-9+\-*/.()\w\s]/g, " "),
    totalKg,
    values
  );

  const formatted = raw > 1000
    ? (raw / 1000).toFixed(2) + "k"
    : raw > 0.01
    ? raw.toFixed(1)
    : raw.toFixed(4);

  return template.replace(/\${value}/, formatted).replace(/\${[^}]+}/, formatted);
}

// ─── Step 7: Main build function ─────────────────────────────────────────────

export function buildCascadeGraph(values: ActivityValues): CascadeGraph {
  const { byActivity, pollutants, total } = computeEmissions(values);
  const tier = getTier(total);
  const maxLayer = kb.severityThresholds.layerDepthByImpact[tier];

  // ── Phase A: use chain rules to determine which nodes activate ──
  const activeNodeIds = new Set<string>(["source"]);

  // Iterative passes (nodes can unlock other nodes in order)
  for (let pass = 0; pass < 6; pass++) {
    let changed = false;
    for (const rule of kb.chainRules) {
      const targetId = rule.activates;
      if (activeNodeIds.has(targetId)) continue;
      if (evalChainRule(rule, values, total, activeNodeIds)) {
        activeNodeIds.add(targetId);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // ── Phase B: validate each candidate against its own activation rules ──
  const validatedIds = new Set<string>(["source"]);
  for (const nodeId of activeNodeIds) {
    if (nodeId === "source") continue;
    const nodeDef = kb.cascadeNodes.find((n) => n.id === nodeId);
    if (!nodeDef) continue;
    if (evalNodeActivation(nodeDef, values, total, activeNodeIds)) {
      validatedIds.add(nodeId);
    }
  }

  // ── Phase C: respect layer depth cap and per-layer node limits ──
  const layerLimits = (kb.severityThresholds.maxNodesPerLayer as Record<string, number[]>)[tier] ?? [1, 5, 6, 5, 5];
  const layerCounts: Record<number, number> = {};

  const filteredIds = new Set<string>(["source"]);
  // Sort by layer so we fill layers in order
  const sortedDefs = kb.cascadeNodes
    .filter((n) => validatedIds.has(n.id))
    .sort((a, b) => a.layer - b.layer);

  for (const nodeDef of sortedDefs) {
    if (nodeDef.id === "source") continue;
    const layer = nodeDef.layer;
    if (layer > maxLayer) continue;
    layerCounts[layer] = (layerCounts[layer] ?? 0);
    const limit = layerLimits[layer] ?? 99;
    if (layerCounts[layer] >= limit) continue;
    filteredIds.add(nodeDef.id);
    layerCounts[layer]++;
  }

  // ── Phase D: build ActiveNode list ──
  const activeNodes: ActiveNode[] = [];

  for (const nodeDef of kb.cascadeNodes) {
    if (!filteredIds.has(nodeDef.id)) continue;

    const severity = getSeverity(nodeDef.id, total, values);
    const metric = buildMetric(nodeDef.metricTemplate, nodeDef.id, total, values);
    const activationStrength = Math.min(total / 5000, 1);

    // Filter parentIds to only include nodes that are also active
    const parentIds = ((nodeDef as Record<string, unknown>).parentIds as string[] | undefined ?? [])
      .filter((pid) => filteredIds.has(pid));

    activeNodes.push({
      id: nodeDef.id,
      label: nodeDef.label,
      description: nodeDef.description,
      layer: nodeDef.layer,
      category: nodeDef.category,
      severity,
      metric,
      parentIds,
      affectedSpecies: (nodeDef as Record<string, unknown>).affectedSpecies as string[] | undefined,
      currentGlobalStatus: (nodeDef as Record<string, unknown>).currentGlobalStatus as string | undefined,
      source: (nodeDef as Record<string, unknown>).source as string | undefined,
      activationStrength,
    });
  }

  // ── Phase E: compute equivalences ──
  const equivalences = kb.equivalences.map((eq) => {
    const raw = evalFormula(eq.formula, total, values);
    const value =
      raw > 1_000_000 ? (raw / 1_000_000).toFixed(1) + "M"
      : raw > 1_000 ? Math.round(raw / 1000) + "k"
      : raw > 10 ? Math.round(raw).toString()
      : raw.toFixed(2);
    return { label: eq.label, value, icon: eq.icon };
  });

  return {
    nodes: activeNodes,
    totalKgCO2e: total,
    pollutants,
    severityLevel: tier,
    maxLayer,
    equivalences,
  };
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

export function severityColor(s: Severity): string {
  return { low: "#1de9b6", medium: "#d4a847", high: "#ff9800", critical: "#ff5252" }[s];
}

export function tierColor(tier: ReturnType<typeof getTier>): string {
  return {
    negligible: "#4caf50",
    low:        "#1de9b6",
    moderate:   "#d4a847",
    high:       "#ff9800",
    critical:   "#ff5252",
  }[tier];
}

export function getTierLabel(totalKg: number): string {
  const tier = getTier(totalKg);
  return kb.severityThresholds.global[tier].label;
}

// Re-export activity list from KB for the calculator UI
export const ACTIVITIES_FROM_KB = kb.activities;
export const GLOBAL_STATUS = kb.globalStatusFacts;
