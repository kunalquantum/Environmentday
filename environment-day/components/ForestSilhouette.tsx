"use client";

// Generates a procedural SVG tree-line silhouette as a decorative divider.
// `flip` renders it upside-down for use at the top of a section.
export default function ForestSilhouette({
  flip = false,
  opacity = 0.18,
  height = 120,
  color = "#1de9b6",
}: {
  flip?: boolean;
  opacity?: number;
  height?: number;
  color?: string;
}) {
  // A hand-crafted but natural-looking tree-line path (1400 wide, baseline at y=120)
  const W = 1400, H = height;
  const BASE = H; // y of ground

  // Each "tree" is a triangle-ish pine or broad deciduous shape
  // format: [x-centre, tree-height, half-width, type(0=pine, 1=round)]
  const trees: [number, number, number, number][] = [
    [0,    65, 22, 0],
    [38,   80, 28, 0],
    [75,   55, 18, 1],
    [115,  90, 30, 0],
    [155,  70, 22, 0],
    [195,  50, 20, 1],
    [235,  85, 26, 0],
    [270,  60, 15, 1],
    [305,  75, 24, 0],
    [345,  95, 32, 0],
    [385,  65, 20, 1],
    [420,  80, 26, 0],
    [460,  55, 18, 1],
    [500, 100, 34, 0],
    [540,  70, 22, 0],
    [580,  60, 20, 1],
    [615,  88, 28, 0],
    [655,  72, 24, 0],
    [695,  55, 16, 1],
    [730,  90, 30, 0],
    [770,  78, 26, 0],
    [805,  60, 18, 1],
    [840,  95, 32, 0],
    [880,  68, 22, 0],
    [920,  55, 18, 1],
    [955,  85, 28, 0],
    [995,  72, 24, 0],
    [1030, 55, 16, 1],
    [1065, 90, 30, 0],
    [1105, 78, 26, 0],
    [1140, 62, 20, 1],
    [1175, 88, 28, 0],
    [1215, 70, 22, 0],
    [1250, 55, 18, 1],
    [1290, 95, 32, 0],
    [1330, 68, 22, 0],
    [1370, 80, 26, 0],
    [1400, 58, 18, 1],
  ];

  // Build path: start from bottom-left, trace all tree tops, end bottom-right
  let d = `M 0 ${BASE}`;

  for (const [cx, th, hw, type] of trees) {
    const top = BASE - th;
    if (type === 0) {
      // Pine: two angled sides meeting at a sharp tip
      d += ` L ${cx - hw} ${BASE - th * 0.25} L ${cx} ${top} L ${cx + hw} ${BASE - th * 0.25}`;
    } else {
      // Deciduous: arc approximated with bezier
      d += ` Q ${cx - hw} ${top + 10} ${cx} ${top}`;
      d += ` Q ${cx + hw} ${top + 10} ${cx + hw} ${BASE - th * 0.25}`;
    }
  }

  d += ` L ${W} ${BASE} Z`;

  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden",
        lineHeight: 0,
        transform: flip ? "scaleY(-1)" : undefined,
        pointerEvents: "none",
        position: "relative",
        zIndex: 1,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMax meet"
        style={{ width: "100%", height: height, display: "block" }}
      >
        <defs>
          <linearGradient id="forestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={color} stopOpacity={opacity * 0.6} />
            <stop offset="100%" stopColor={color} stopOpacity={opacity} />
          </linearGradient>
        </defs>
        <path d={d} fill="url(#forestGrad)" />
        {/* Subtle edge glow */}
        <path d={d} fill="none" stroke={color} strokeWidth="0.8" opacity={opacity * 0.5} />
      </svg>
    </div>
  );
}
