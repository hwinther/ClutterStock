import { Link } from "react-router";

type Crumb = { label: string; to?: string };

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: 13 }}>
      {crumbs.map((crumb, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {i > 0 && <span style={{ color: "var(--c-fg-3)" }}>/</span>}
          {crumb.to ? (
            <Link to={crumb.to} style={{ color: "var(--c-fg-2)", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--c-accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-fg-2)")}>
              {crumb.label}
            </Link>
          ) : (
            <span style={{ color: "var(--c-fg)", fontWeight: 500 }}>{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
