using ClutterStock.Contracts.Locations;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace ClutterStock.Domain.Features.Locations.GetLocations;

[HttpMethod(HttpVerb.Get)]
[OpenApiDescription("Returns all locations.")]
public class GetLocationsEndpoint : IEndpoint
{
    public static string Route => "/locations";

    public static Delegate Handler => (Func<IGetLocationsQueryHandler, CancellationToken, Task<Ok<IReadOnlyList<LocationResponse>>>>) Handle;

    private static async Task<Ok<IReadOnlyList<LocationResponse>>> Handle(IGetLocationsQueryHandler handler,
                                                                          CancellationToken cancellationToken)
    {
        var locations = await handler.HandleAsync(cancellationToken);
        return TypedResults.Ok((IReadOnlyList<LocationResponse>) locations.Select(l => l.ToResponse())
                                                                          .ToList());
    }
}