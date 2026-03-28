namespace ClutterStock.Contracts.Locations;

/// <summary>Response payload for a location.</summary>
/// <param name="Id" example="1">Unique identifier of the location.</param>
/// <param name="Name" example="Home">Display name of the location (e.g. home, office).</param>
/// <param name="Description" example="Main residence">Optional description of the location.</param>
/// <param name="CreatedAtUtc" example="2024-01-15T10:30:00Z">UTC timestamp when the location was created.</param>
/// <param name="UpdatedAtUtc" example="2024-02-01T14:00:00Z">UTC timestamp when the location was last updated.</param>
public record LocationResponse(
    int Id,
    string Name,
    string? Description,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc);