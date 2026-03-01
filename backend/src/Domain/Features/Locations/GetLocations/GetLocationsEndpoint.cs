using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace ClutterStock.Domain.Features.Locations.GetLocations;

[HttpMethod(HttpVerb.Get)]
[OpenApiDescription("Returns all locations.")]
public class GetLocationsEndpoint : IEndpoint
{
    public static string Route => "/locations";

    public static Delegate Handler => (Func<IGetLocationsQueryHandler, CancellationToken, Task<Ok<IReadOnlyList<Location>>>>) Handle;

    private static async Task<Ok<IReadOnlyList<Location>>> Handle(IGetLocationsQueryHandler handler,
                                                                  CancellationToken cancellationToken)
    {
        var locations = await handler.HandleAsync(cancellationToken);
        return TypedResults.Ok(locations);
    }
}