import { Link } from "react-router";
import type { Route } from "./+types/locations";
import { LocationsLayout } from "~/components/locations";
import { ProblemBoundary } from "~/components/problem-boundary";

export default LocationsLayout;

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  // RR7 swaps the parent's element for this boundary when a nested route throws,
  // so we re-render the layout chrome here to keep the active data-theme,
  // page header, and "Add location" entry point intact.
  return (
    <main className="page-main">
      <div className="page-header">
        <h1 className="page-title">Locations</h1>
        <Link to="/locations/new" className="btn-primary">
          + Add location
        </Link>
      </div>
      <ProblemBoundary error={error} scope="section" />
    </main>
  );
}
