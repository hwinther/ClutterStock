using System.ComponentModel.DataAnnotations;
using ClutterStock.Contracts.Locations;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Extensions;
using ClutterStock.Entities;
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

    private static async Task<Results<Ok<LocationResponse>, NotFound>> Handle([FromRoute] [Range(1, int.MaxValue)] int id,
                                                                              IGetLocationQueryHandler handler,
                                                                              CancellationToken cancellationToken)
    {
        var outcome = await handler.HandleAsync(new IGetLocationQueryHandler.Query(id), cancellationToken);
        return outcome switch
        {
            Location location => TypedResults.Ok(location.ToResponse()),
            EntityNotFound => TypedResults.NotFound()
        };
    }
}