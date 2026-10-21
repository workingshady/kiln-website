// Square pixel sparks, like the ones above the chimney in the app icon.
// Fixed values (no Math.random) so server and client render the same markup.
const COLORS = ["#ffc04d", "#ff8a3d", "#ff6f9b", "#ffd66b", "#d9452b"];
const SPARKS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  size: 3 + ((i * 7) % 5),
  dur: 10 + ((i * 5) % 9),
  delay: -((i * 13) % 17),
  drift: ((i * 29) % 80) - 40,
  color: COLORS[i % COLORS.length],
}));

export function Embers() {
  return (
    <div className="embers" aria-hidden>
      {SPARKS.map((s, i) => (
        <i
          key={i}
          style={
            {
              left: `${s.left}%`,
              "--s": `${s.size}px`,
              "--d": `${s.dur}s`,
              "--delay": `${s.delay}s`,
              "--x": `${s.drift}px`,
              "--c": s.color,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
