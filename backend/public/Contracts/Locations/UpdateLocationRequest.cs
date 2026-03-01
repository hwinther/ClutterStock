namespace ClutterStock.Contracts.Locations;

/// <summary>Request body for updating a location. Id is provided in the route.</summary>
/// <param name="Name" example="Home">Display name of the location (e.g. home, office).</param>
/// <param name="Description" example="Main residence">Optional description of the location.</param>
public record UpdateLocationRequest(string Name, string? Description);