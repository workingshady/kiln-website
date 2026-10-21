import Link from "next/link";

export default function NotFound() {
  return (
    <section className="lost">
      <div>
        <h1 className="hot">404</h1>
        <p className="lede" style={{ margin: "24px auto 32px" }}>This page cracked in the kiln. It happens to the best pots.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link className="btn btn-fire" href="/">Back to the start</Link>
          <Link className="btn" href="/download">Download Kiln</Link>
        </div>
      </div>
    </section>
  );
}
