using ClutterStock.Contracts.Locations;
using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Locations.UpdateLocation;

[HttpMethod(HttpVerb.Put)]
[OpenApiDescription("Updates an existing location by id.")]
public class UpdateLocationEndpoint : IEndpoint
{
    public static string Route => "/locations/{id}";

    public static Delegate Handler => (Func<int, UpdateLocationRequest, IUpdateLocationCommandHandler, CancellationToken, Task<IResult>>) Handle;

    private static async Task<IResult> Handle([FromRoute] int id,
                                              [FromBody] UpdateLocationRequest request,
                                              IUpdateLocationCommandHandler handler,
                                              CancellationToken cancellationToken)
    {
        var command = new IUpdateLocationCommandHandler.Command(id, request.Name, request.Description);
        return await handler.HandleAsync(command, cancellationToken);
    }
}