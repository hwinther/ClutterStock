import { Link, Outlet } from "react-router";

export function LocationsLayout() {
  return (
    <main className="page-main">
      <div className="page-header">
        <h1 className="page-title">Locations</h1>
        <Link to="/locations/new" className="btn-primary">
          Add location
        </Link>
      </div>
      <Outlet />
    </main>
  );
}
