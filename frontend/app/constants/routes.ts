/**
 * Centralized route path builders. Use these instead of hardcoding URLs.
 */
export const routes = {
  home: () => "/" as const,
  locations: {
    list: () => "/locations" as const,
    new: () => "/locations/new" as const,
    edit: (id: number) => `/locations/${id}/edit` as const,
    rooms: (locationId: number) => `/locations/${locationId}/rooms` as const,
    roomsNew: (locationId: number) =>
      `/locations/${locationId}/rooms/new` as const,
    roomEdit: (locationId: number, roomId: number) =>
      `/locations/${locationId}/rooms/${roomId}/edit` as const,
    roomItems: (locationId: number, roomId: number) =>
      `/locations/${locationId}/rooms/${roomId}/items` as const,
    roomItemsNew: (locationId: number, roomId: number) =>
      `/locations/${locationId}/rooms/${roomId}/items/new` as const,
    itemEdit: (locationId: number, roomId: number, itemId: number) =>
      `/locations/${locationId}/rooms/${roomId}/items/${itemId}/edit` as const,
  },
} as const;
