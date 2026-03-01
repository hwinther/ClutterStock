import { Link, Outlet } from "react-router";
import { routes } from "~/constants/routes";

export function LocationsLayout() {
  return (
    <main className="page-main">
      <div className="page-header">
        <h1 className="page-title">Locations</h1>
        <Link to={routes.locations.new()} className="btn-primary">
          Add location
        </Link>
      </div>
      <Outlet />
    </main>
  );
}
