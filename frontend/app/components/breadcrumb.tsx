import { Link } from "react-router";

type Crumb = { label: string; to?: string };

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="mb-4 flex items-center gap-2 text-sm text-muted">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden>/</span>}
          {crumb.to ? (
            <Link to={crumb.to} className="link-text">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-gray-100">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
