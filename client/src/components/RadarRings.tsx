// Subtle concentric-ring "radar" motif for hero/auth backgrounds, per the
// brand brief. Decorative only - low opacity, absolutely positioned,
// pointer-events disabled so it never intercepts clicks.
export default function RadarRings({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 600"
      className={`pointer-events-none absolute ${className}`}
      aria-hidden="true"
    >
      {[80, 160, 240, 320].map((r) => (
        <circle
          key={r}
          cx="300"
          cy="300"
          r={r}
          fill="none"
          stroke="#1B6187"
          strokeOpacity="0.08"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}
