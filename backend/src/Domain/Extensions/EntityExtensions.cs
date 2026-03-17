using ClutterStock.Contracts.Items;
using ClutterStock.Contracts.Locations;
using ClutterStock.Contracts.Rooms;
using ClutterStock.Entities;

namespace ClutterStock.Domain.Extensions;

/// <summary>Maps domain entities to API response DTOs.</summary>
internal static class EntityExtensions
{
    extension(Item entity)
    {
        public ItemResponse ToResponse() =>
            new(entity.Id,
                entity.RoomId,
                entity.Name,
                entity.Description,
                entity.Category,
                entity.Notes,
                entity.CreatedAtUtc,
                entity.UpdatedAtUtc);
    } // Test change

    extension(Room entity)
    {
        public RoomResponse ToResponse() =>
            new(entity.Id,
                entity.LocationId,
                entity.Name,
                entity.Description,
                entity.CreatedAtUtc,
                entity.UpdatedAtUtc);
    }

    extension(Location entity)
    {
        public LocationResponse ToResponse() => new(entity.Id, entity.Name, entity.Description, entity.CreatedAtUtc, entity.UpdatedAtUtc);
    }
}