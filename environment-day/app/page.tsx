"use client";
import { useState, useRef, useMemo } from "react";
import Hero from "@/components/Hero";
import Calculator from "@/components/Calculator";
import CascadeFlow from "@/components/CascadeFlow";
import ImpactSummary from "@/components/ImpactSummary";
import FloatingLeaves from "@/components/FloatingLeaves";
import ForestSilhouette from "@/components/ForestSilhouette";
import { buildCascadeGraph, ActivityValues } from "@/lib/cascadeEngine";

export default function Home() {
  const [values, setValues] = useState<ActivityValues>({
    personal_vehicle: 20,
    aviation: 0,
    electricity: 30,
    beef: 0,
    dairy: 0,
    natural_gas: 0,
    shopping: 0,
  });

  const calcRef = useRef<HTMLDivElement>(null);
  const graph = useMemo(() => buildCascadeGraph(values), [values]);

  function handleChange(id: string, val: number) {
    setValues((prev) => ({ ...prev, [id]: val }));
  }

  function handleBulkChange(vals: Record<string, number>) {
    setValues((prev) => ({ ...prev, ...vals }));
  }

  function scrollToCalc() {
    calcRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main style={{ position: "relative", zIndex: 1 }}>
      {/* Global floating leaves overlay */}
      <FloatingLeaves />

      <Hero onStart={scrollToCalc} />

      {/* Organic forest divider — trees grow up into the calculator */}
      <ForestSilhouette flip height={80} opacity={0.14} />

      <div ref={calcRef}>
        <Calculator values={values} onChange={handleChange} onBulkChange={handleBulkChange} graph={graph} />
      </div>

      {/* Inverted forest divider above cascade */}
      <ForestSilhouette height={72} opacity={0.11} color="#d4a847" />

      <CascadeFlow graph={graph} />

      <ForestSilhouette flip height={72} opacity={0.12} color="#ff7043" />

      <ImpactSummary graph={graph} values={values} />

      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "28px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1rem",
              color: "var(--primary)",
              fontStyle: "italic",
            }}
          >
            Carbon Cascade
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginLeft: 12,
              letterSpacing: "0.05em",
            }}
          >
            World Environment Day 2026
          </span>
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          Emission factors: IPCC AR6 · EPA eGRID · FAO GLEAM
        </div>
      </footer>
    </main>
  );
}
