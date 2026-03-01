namespace ClutterStock.Contracts.Locations;

/// <summary>Request body for creating a location.</summary>
/// <param name="Name" example="Home">Display name of the location (e.g. home, office).</param>
/// <param name="Description" example="Main residence">Optional description of the location.</param>
public record AddLocationRequest(string Name, string? Description);