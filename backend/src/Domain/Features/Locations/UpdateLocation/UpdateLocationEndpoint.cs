using ClutterStock.Contracts.Locations;
using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Locations.UpdateLocation;

[HttpMethod(HttpVerb.Put)]
[OpenApiDescription("Updates an existing location by id.")]
public class UpdateLocationEndpoint : IEndpoint
{
    public static string Route => "/locations/{id}";

    public static Delegate Handler => (Func<int, UpdateLocationRequest, IUpdateLocationCommandHandler, CancellationToken, Task<Results<Ok<LocationResponse>, NotFound>>>) Handle;

    private static async Task<Results<Ok<LocationResponse>, NotFound>> Handle([FromRoute] int id,
                                                                              [FromBody] UpdateLocationRequest request,
                                                                              IUpdateLocationCommandHandler handler,
                                                                              CancellationToken cancellationToken)
    {
        var command = new IUpdateLocationCommandHandler.Command(id, request.Name, request.Description);
        return await handler.HandleAsync(command, cancellationToken);
    }
}