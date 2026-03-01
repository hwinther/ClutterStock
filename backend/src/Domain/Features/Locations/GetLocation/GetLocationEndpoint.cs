using ClutterStock.Contracts.Locations;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Locations.GetLocation;

[HttpMethod(HttpVerb.Get)]
[OpenApiDescription("Returns a single location by id.")]
public class GetLocationEndpoint : IEndpoint
{
    public static string Route => "/locations/{id}";

    public static Delegate Handler => (Func<int, IGetLocationQueryHandler, CancellationToken, Task<Results<Ok<LocationResponse>, NotFound>>>) Handle;

    private static async Task<Results<Ok<LocationResponse>, NotFound>> Handle([FromRoute] int id,
                                                                              IGetLocationQueryHandler handler,
                                                                              CancellationToken cancellationToken)
    {
        var location = await handler.HandleAsync(new IGetLocationQueryHandler.Query(id), cancellationToken);
        return location is null ? TypedResults.NotFound() : TypedResults.Ok(location.ToResponse());
    }
}