using System.ComponentModel.DataAnnotations;
using ClutterStock.Contracts.Locations;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Extensions;
using ClutterStock.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Locations.UpdateLocation;

[HttpMethod(HttpVerb.Put)]
[OpenApiDescription("Updates an existing location by id.")]
public class UpdateLocationEndpoint : IEndpoint
{
    public static string Route => "/locations/{id}";

    public static Delegate Handler => (Func<int, UpdateLocationRequest, IUpdateLocationCommandHandler, CancellationToken, Task<Results<Ok<LocationResponse>, NotFound>>>) Handle;

    private static async Task<Results<Ok<LocationResponse>, NotFound>> Handle([FromRoute] [Range(1, int.MaxValue)] int id,
                                                                              [FromBody] UpdateLocationRequest request,
                                                                              IUpdateLocationCommandHandler handler,
                                                                              CancellationToken cancellationToken)
    {
        var command = new IUpdateLocationCommandHandler.Command(id, request.Name, request.Description);
        var outcome = await handler.HandleAsync(command, cancellationToken);
        return outcome switch
        {
            Location location => TypedResults.Ok(location.ToResponse()),
            EntityNotFound => TypedResults.NotFound()
        };
    }
}