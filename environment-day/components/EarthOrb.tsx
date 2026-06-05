"use client";

// Stylised orthographic-projection Earth — no external deps, pure SVG + CSS
export default function EarthOrb({ size = 440 }: { size?: number }) {
  const r = size / 2;   // globe radius  = half the viewBox
  const cx = r, cy = r; // centre

  // ---------- latitude / longitude grid ----------
  const latLines   = [-60, -30, 0, 30, 60];
  const lonLines   = [-120, -60, 0, 60, 120];

  // orthographic helpers
  const ox = (lon: number, lat: number) => cx + r * 0.91 * Math.cos((lat * Math.PI) / 180) * Math.sin((lon * Math.PI) / 180);
  const oy = (lat: number)              => cy - r * 0.91 * Math.sin((lat * Math.PI) / 180);

  // Build a lat circle as a polygon of points (only front hemisphere)
  function latCirclePoints(latDeg: number, steps = 72): string {
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const lon = -180 + (i / steps) * 360;
      const lon_rad = (lon * Math.PI) / 180;
      if (Math.cos(lon_rad) < 0) continue; // back side
      pts.push(`${ox(lon, latDeg).toFixed(1)},${oy(latDeg).toFixed(1)}`);
    }
    return pts.join(" ");
  }

  // Continent paths — simplified orthographic coords on this viewBox
  // Each path was hand-traced on a 440×440 canvas (cx=220, cy=220, r=200).
  // Scale factor: 200/220 = 0.909 of r

  const scale = (r * 0.91) / 200;  // normalise from r=200 to actual r
  const tx = (x: number) => ((x - 220) * scale + cx).toFixed(1);
  const ty = (y: number) => ((y - 220) * scale + cy).toFixed(1);
  const tp = (pts: [number, number][]): string =>
    pts.map(([x, y]) => `${tx(x)},${ty(y)}`).join(" ");

  // Continents as simplified polygons (Atlantic-centred orthographic view)
  const continents: { id: string; points: [number, number][] }[] = [
    {
      id: "na",
      points: [
        [88, 68],[130, 44],[158, 48],[185, 48],[210, 58],[228, 82],
        [230, 110],[220, 148],[218, 178],[208, 196],[195, 215],
        [178, 228],[168, 212],[152, 200],[108, 198],[95, 178],
        [82, 152],[76, 118],[82, 88],
      ],
    },
    {
      id: "sa",
      points: [
        [178, 232],[202, 228],[222, 242],[240, 268],[246, 300],
        [236, 334],[218, 358],[195, 366],[175, 352],[162, 320],
        [158, 284],[165, 256],[170, 238],
      ],
    },
    {
      id: "eu",
      points: [
        [232, 64],[248, 56],[268, 58],[282, 70],[290, 86],[282, 98],
        [270, 106],[254, 108],[240, 100],[230, 84],
      ],
    },
    {
      id: "af",
      points: [
        [238, 108],[275, 108],[296, 124],[308, 156],[312, 195],
        [302, 238],[288, 278],[270, 310],[248, 314],[238, 295],
        [232, 260],[244, 228],[248, 192],[240, 162],[232, 136],
      ],
    },
    {
      id: "as",
      points: [
        [275, 55],[308, 44],[348, 46],[376, 60],[390, 80],[378, 108],
        [360, 132],[350, 158],[355, 180],[340, 195],[315, 192],
        [298, 178],[286, 158],[296, 136],[275, 118],[268, 96],[270, 74],
      ],
    },
    {
      id: "au",
      points: [
        [342, 256],[374, 248],[395, 262],[398, 286],[384, 308],
        [360, 318],[336, 308],[322, 290],[326, 268],
      ],
    },
  ];

  // Longitude arcs (semicircles on front hemisphere)
  function lonArc(lonDeg: number): string {
    const steps = 36;
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const lat = -90 + (i / steps) * 180;
      const lon_rad = (lonDeg * Math.PI) / 180;
      if (Math.cos(lon_rad) <= 0) return "";
      pts.push(`${ox(lonDeg, lat).toFixed(1)} ${oy(lat).toFixed(1)}`);
    }
    if (pts.length === 0) return "";
    return `M ${pts[0]} ` + pts.slice(1).map((p) => `L ${p}`).join(" ");
  }

  const vb = `0 0 ${size} ${size}`;

  return (
    <svg
      viewBox={vb}
      width={size}
      height={size}
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        {/* Outer atmosphere glow */}
        <radialGradient id="atmoGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%"   stopColor="#1de9b6" stopOpacity="0" />
          <stop offset="75%"  stopColor="#1de9b6" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#1de9b6" stopOpacity="0.18" />
        </radialGradient>
        {/* Ocean fill */}
        <radialGradient id="oceanFill" cx="38%" cy="38%" r="65%">
          <stop offset="0%"   stopColor="#071f1a" />
          <stop offset="100%" stopColor="#020a08" />
        </radialGradient>
        {/* Continent fill */}
        <radialGradient id="landFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#0e3d28" />
          <stop offset="100%" stopColor="#082518" />
        </radialGradient>
        {/* Sphere shading (light from top-left) */}
        <radialGradient id="sphereShade" cx="35%" cy="32%" r="70%">
          <stop offset="0%"   stopColor="#1de9b6" stopOpacity="0.06" />
          <stop offset="60%"  stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
        </radialGradient>
        {/* Clip to globe circle */}
        <clipPath id="globeClip">
          <circle cx={cx} cy={cy} r={r * 0.91} />
        </clipPath>
      </defs>

      {/* Outermost atmosphere ring */}
      <circle cx={cx} cy={cy} r={r * 0.98} fill="url(#atmoGlow)" />

      {/* Ocean base */}
      <circle cx={cx} cy={cy} r={r * 0.91} fill="url(#oceanFill)" />

      {/* Grid — latitude arcs */}
      <g clipPath="url(#globeClip)" fill="none" stroke="#1de9b6" strokeWidth="0.6" opacity="0.13">
        {latLines.map((lat) => {
          const pts = latCirclePoints(lat);
          return pts ? <polyline key={`lat${lat}`} points={pts} /> : null;
        })}
        {lonLines.map((lon) => {
          const d = lonArc(lon);
          return d ? <path key={`lon${lon}`} d={d} /> : null;
        })}
      </g>

      {/* Continent fills */}
      <g clipPath="url(#globeClip)" fill="url(#landFill)" opacity="0.9">
        {continents.map((c) => (
          <polygon key={c.id} points={tp(c.points)} />
        ))}
      </g>

      {/* Continent highlight edges */}
      <g clipPath="url(#globeClip)" fill="none" stroke="#1de9b6" strokeWidth="0.8" opacity="0.25">
        {continents.map((c) => (
          <polygon key={`e${c.id}`} points={tp(c.points)} />
        ))}
      </g>

      {/* Sphere shading overlay */}
      <circle cx={cx} cy={cy} r={r * 0.91} fill="url(#sphereShade)" />

      {/* Limb / edge glow */}
      <circle
        cx={cx} cy={cy} r={r * 0.91}
        fill="none"
        stroke="#1de9b6"
        strokeWidth="1.5"
        opacity="0.22"
      />

      {/* Inner rim specular highlight (top-left arc) */}
      <path
        d={`M ${(cx - r * 0.6).toFixed(1)} ${(cy - r * 0.55).toFixed(1)}
            A ${(r * 0.91).toFixed(1)} ${(r * 0.91).toFixed(1)} 0 0 1
            ${(cx + r * 0.2).toFixed(1)} ${(cy - r * 0.88).toFixed(1)}`}
        fill="none"
        stroke="#1de9b6"
        strokeWidth="1.5"
        opacity="0.18"
        strokeLinecap="round"
      />
    </svg>
  );
}
