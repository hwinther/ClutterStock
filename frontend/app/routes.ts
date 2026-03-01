import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("locations", "routes/locations.tsx", [
    index("routes/locations.index.tsx"),
    route("new", "routes/locations.new.tsx"),
    route(":id/edit", "routes/locations.edit.tsx"),
    route(":id/rooms", "routes/locations.rooms.index.tsx"),
    route(":id/rooms/new", "routes/locations.rooms.new.tsx"),
    route(":id/rooms/:roomId/edit", "routes/locations.rooms.edit.tsx"),
    route(":id/rooms/:roomId/items", "routes/locations.rooms.items.index.tsx"),
    route(":id/rooms/:roomId/items/new", "routes/locations.rooms.items.new.tsx"),
    route(":id/rooms/:roomId/items/:itemId/edit", "routes/locations.rooms.items.edit.tsx"),
  ]),
] satisfies RouteConfig;
