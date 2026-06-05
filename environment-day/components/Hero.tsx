"use client";
import { useEffect, useRef, useState } from "react";
import EarthOrb from "@/components/EarthOrb";
import ForestSilhouette from "@/components/ForestSilhouette";

export default function Hero({ onStart }: { onStart: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [orbSize, setOrbSize] = useState(480);

  useEffect(() => {
    const update = () => setOrbSize(Math.min(480, window.innerWidth * (window.innerWidth < 768 ? 0.9 : 0.65)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let t = 0;

    // Mix of plain dots + small leaf-like stretched dots
    const particles: {
      x: number; y: number; vx: number; vy: number;
      r: number; a: number; leaf: boolean; rot: number; rotV: number;
    }[] = [];

    for (let i = 0; i < 70; i++) {
      const leaf = i < 18;
      particles.push({
        x: 0, y: 0,
        vx: (Math.random() - 0.5) * (leaf ? 0.22 : 0.32),
        vy: (Math.random() - 0.5) * (leaf ? 0.22 : 0.32),
        r: leaf ? 2.5 + Math.random() * 3.5 : 0.8 + Math.random() * 1.6,
        a: 0.15 + Math.random() * 0.55,
        leaf,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.008,
      });
    }

    function resize() {
      if (!canvas) return;
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particles.forEach((p) => {
        if (p.x === 0 && p.y === 0) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
        }
      });
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle radial green fog at centre
      const grd = ctx.createRadialGradient(
        canvas.width / 2, canvas.height * 0.42, 0,
        canvas.width / 2, canvas.height * 0.42, canvas.width * 0.55
      );
      grd.addColorStop(0,   "rgba(10,40,28,0.18)");
      grd.addColorStop(0.5, "rgba(5,20,14,0.08)");
      grd.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10)  p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;
        if (p.leaf) p.rot += p.rotV;

        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.leaf) {
          ctx.rotate(p.rot);
          ctx.globalAlpha = p.a * 0.45;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 0.45, p.r, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#1de9b6";
          ctx.fill();
        } else {
          ctx.globalAlpha = p.a * 0.38;
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.a > 0.55 ? "#45c89e" : "#1de9b6";
          ctx.fill();
        }

        ctx.restore();
      });

      // Connection lines (slightly greener tint)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(29,233,182,${(1 - d / 110) * 0.09})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Expanding rings — softer green
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.43;
      for (let ring = 0; ring < 4; ring++) {
        const phase = (t * 0.008 + ring * 0.25) % 1;
        const rr    = phase * canvas.width * 0.38;
        const alpha = (1 - phase) * 0.045;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(29,180,120,${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      t++;
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "clamp(48px,10vh,80px) clamp(16px,5vw,24px) 0",
        zIndex: 1,
      }}
    >
      {/* Animated particle canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
      />

      {/* ── Earth Orb (large, centred, behind text) ── */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -54%)",
          zIndex: 0,
          opacity: 0.28,
          pointerEvents: "none",
          filter: "blur(0.5px)",
          animation: "earthPulse 8s ease-in-out infinite",
        }}
      >
        <EarthOrb size={orbSize} />
      </div>

      {/* Date / edition badge */}
      <div style={{ position: "relative", zIndex: 2, marginBottom: 32, animation: "fadeUp 0.5s ease both" }}>
        <span
          className="tag tag-primary"
          style={{ fontSize: "0.72rem", letterSpacing: "0.1em", paddingLeft: 14, paddingRight: 14, paddingTop: 5, paddingBottom: 5 }}
        >
          🌍 World Environment Day · June 5, 2026
        </span>
      </div>

      {/* Main heading */}
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 780 }}>
        <h1
          style={{
            fontSize: "clamp(2.8rem, 7.5vw, 5.2rem)",
            fontWeight: 600,
            lineHeight: 1.06,
            letterSpacing: "-0.025em",
            marginBottom: 6,
            animation: "fadeUp 0.65s 0.1s ease both",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          Every action
          <br />
          <span className="shimmer-text">leaves a scar</span>
        </h1>

        {/* Leaf-accented divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            margin: "26px auto",
            animation: "fadeUp 0.6s 0.22s ease both",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          <div style={{ flex: 1, maxWidth: 60, height: 1, background: "linear-gradient(90deg, transparent, var(--primary))" }} />
          <span style={{ fontSize: "1rem", opacity: 0.6 }}>🌿</span>
          <div style={{ flex: 1, maxWidth: 60, height: 1, background: "linear-gradient(90deg, var(--primary), transparent)" }} />
        </div>

        <p
          style={{
            fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
            lineHeight: 1.85,
            color: "var(--text-secondary)",
            fontWeight: 300,
            maxWidth: 560,
            margin: "0 auto 44px",
            animation: "fadeUp 0.6s 0.35s ease both",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          A cab ride. A steak. A flight. Trace the full cascade of consequences —
          from fossil fuels to vanishing forests to the last bird species at risk.
        </p>

        <div style={{ animation: "fadeUp 0.6s 0.5s ease both", opacity: 0, animationFillMode: "forwards" }}>
          <button
            onClick={onStart}
            style={{
              padding: "15px 42px",
              background: "transparent",
              border: "1px solid var(--primary)",
              borderRadius: 8,
              color: "var(--primary)",
              fontSize: "0.875rem",
              fontWeight: 500,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.3s",
              fontFamily: "Inter, sans-serif",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-glow)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 32px var(--primary-glow-strong)";
              (e.currentTarget as HTMLButtonElement).style.letterSpacing = "0.12em";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              (e.currentTarget as HTMLButtonElement).style.letterSpacing = "0.09em";
            }}
          >
            🌱 Calculate Your Cascade
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          marginTop: 64,
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "clamp(24px, 5vw, 72px)",
          animation: "fadeUp 0.8s 0.68s ease both",
          opacity: 0,
          animationFillMode: "forwards",
        }}
      >
        {[
          { val: "421 ppm", label: "CO₂ Today", icon: "🌫️" },
          { val: "+1.2°C",  label: "Warming Since 1850", icon: "🌡️" },
          { val: "3B",      label: "Birds Lost Since 1970", icon: "🐦" },
          { val: "50%",     label: "Coral Reefs Gone", icon: "🪸" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.1rem", marginBottom: 4 }}>{s.icon}</div>
            <div className="num" style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", fontWeight: 500, color: "var(--primary)" }}>
              {s.val}
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Forest silhouette at the bottom of the hero */}
      <div style={{ position: "relative", zIndex: 2, width: "100%", marginTop: 48 }}>
        <ForestSilhouette height={100} opacity={0.22} />
      </div>
    </section>
  );
}
