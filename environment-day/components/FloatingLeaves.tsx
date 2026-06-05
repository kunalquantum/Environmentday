"use client";
import { useEffect, useRef } from "react";

interface Leaf {
  x: number; y: number;
  vx: number; vy: number;
  rot: number; rotV: number;
  size: number;
  opacity: number; opV: number;
  type: number;
  sway: number; swayPhase: number; swaySpeed: number;
}

// 5 distinct leaf silhouettes drawn with bezier curves (in local [-1..1] space)
function drawLeafShape(ctx: CanvasRenderingContext2D, type: number, size: number) {
  ctx.beginPath();
  const s = size;
  switch (type) {
    case 0: // classic oval leaf
      ctx.moveTo(0, s);
      ctx.bezierCurveTo( s * 0.85,  s * 0.55,  s * 0.95, -s * 0.45, 0, -s);
      ctx.bezierCurveTo(-s * 0.95, -s * 0.45, -s * 0.85,  s * 0.55, 0,  s);
      break;
    case 1: // pointed narrow leaf
      ctx.moveTo(0, s * 1.3);
      ctx.bezierCurveTo( s * 0.45,  s * 0.5,  s * 0.4, -s * 0.7, 0, -s * 1.3);
      ctx.bezierCurveTo(-s * 0.4, -s * 0.7, -s * 0.45,  s * 0.5, 0,  s * 1.3);
      break;
    case 2: // fat rounded leaf
      ctx.moveTo(0, s * 0.6);
      ctx.bezierCurveTo( s * 1.1,  s * 0.5,  s * 1.15, -s * 0.55, 0, -s);
      ctx.bezierCurveTo(-s * 1.15, -s * 0.55, -s * 1.1,  s * 0.5, 0,  s * 0.6);
      break;
    case 3: // asymmetric leaf with little lobe
      ctx.moveTo(0, s);
      ctx.bezierCurveTo( s * 0.9,  s * 0.6,  s * 1.1, -s * 0.2, s * 0.5, -s * 0.7);
      ctx.bezierCurveTo( s * 0.2, -s * 1.1, -s * 0.2, -s * 1.0, 0, -s);
      ctx.bezierCurveTo(-s * 0.8, -s * 0.5, -s * 0.9,  s * 0.4, 0,  s);
      break;
    case 4: // three-lobed hand-like leaf (simplified maple)
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(-s * 0.4,  s * 0.1, -s * 1.1, -s * 0.2, -s * 0.8, -s * 0.7);
      ctx.bezierCurveTo(-s * 0.5, -s * 1.1, -s * 0.1, -s * 0.8, 0, -s);
      ctx.bezierCurveTo( s * 0.1, -s * 0.8,  s * 0.5, -s * 1.1,  s * 0.8, -s * 0.7);
      ctx.bezierCurveTo( s * 1.1, -s * 0.2,  s * 0.4,  s * 0.1, 0,  s * 0.3);
      break;
    default:
      ctx.ellipse(0, 0, s * 0.5, s, 0, 0, Math.PI * 2);
  }
  ctx.closePath();
}

// Midrib (central vein)
function drawMidrib(ctx: CanvasRenderingContext2D, type: number, size: number) {
  const s = size;
  ctx.beginPath();
  if (type === 4) {
    ctx.moveTo(0, s * 0.2);
    ctx.quadraticCurveTo(0, -s * 0.3, 0, -s * 0.95);
  } else {
    ctx.moveTo(0, s * 0.9);
    ctx.quadraticCurveTo(s * 0.05, 0, 0, -s * 0.95);
  }
  ctx.stroke();
}

const LEAF_COLORS = [
  [29,  233, 182],  // teal primary
  [18,  160, 120],  // mid-green
  [10,  120,  80],  // deep forest
  [52,  211, 153],  // lighter teal
  [80,  200, 100],  // yellow-green
  [22,  100,  60],  // dark leaf
];

export default function FloatingLeaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let t = 0;

    const leaves: Leaf[] = [];
    const COUNT = 28;

    function spawn(forceBottom = false): Leaf {
      const fromSide = Math.random() < 0.2;
      const cw = canvas!.width;
      const ch = canvas!.height;
      return {
        x: fromSide
          ? (Math.random() < 0.5 ? -20 : cw + 20)
          : Math.random() * cw,
        y: forceBottom
          ? ch + Math.random() * 300
          : Math.random() * ch,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(0.3 + Math.random() * 0.6),      // drift upward
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.012,
        size: 7 + Math.random() * 18,
        opacity: 0.04 + Math.random() * 0.09,
        opV: (Math.random() - 0.5) * 0.0003,
        type: Math.floor(Math.random() * 5),
        sway: 0.3 + Math.random() * 0.9,        // horizontal sway amplitude
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.005 + Math.random() * 0.008,
      };
    }

    function resize() {
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < COUNT; i++) leaves.push(spawn());

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const lf of leaves) {
        // Horizontal sway
        lf.x  += lf.vx + Math.sin(lf.swayPhase) * lf.sway * 0.04;
        lf.y  += lf.vy;
        lf.rot += lf.rotV;
        lf.swayPhase += lf.swaySpeed;
        lf.opacity = Math.max(0.02, Math.min(0.14, lf.opacity + lf.opV));

        // Respawn at bottom when leaf exits top
        if (lf.y < -60) {
          Object.assign(lf, spawn(true));
        }
        // Respawn if gone too far sideways
        if (lf.x < -80 || lf.x > canvas.width + 80) {
          lf.x = Math.random() * canvas.width;
          lf.y = canvas.height + 20;
        }

        const [r, g, b] = LEAF_COLORS[Math.floor(Math.random() * 0.01 + lf.type) % LEAF_COLORS.length];

        ctx.save();
        ctx.translate(lf.x, lf.y);
        ctx.rotate(lf.rot);
        ctx.globalAlpha = lf.opacity;

        // Leaf fill
        drawLeafShape(ctx, lf.type, lf.size);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fill();

        // Outline
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = `rgba(${r + 30},${g + 30},${b + 20},0.6)`;
        ctx.stroke();

        // Midrib
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = `rgba(${r + 40},${g + 50},${b + 30},0.45)`;
        drawMidrib(ctx, lf.type, lf.size);

        ctx.restore();
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
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.75,
      }}
      aria-hidden="true"
    />
  );
}
