export default function NavLogo({ height = 38 }: { height?: number }) {
  return (
    <span className="plogo" style={{ "--plogo-h": `${height}px` } as React.CSSProperties}>
      <img className="plogo__mark" src="/logo.png" alt="Pregret" />
      <img className="plogo__text" src="/logo.png" alt="" aria-hidden="true" />
      <span className="plogo__shine" aria-hidden="true" />
    </span>
  );
}
