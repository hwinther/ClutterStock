using ClutterStock.Contracts.Locations;
using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Locations.AddLocation;

[HttpMethod(HttpVerb.Post)]
[OpenApiDescription("Creates a new location.")]
public class AddLocationEndpoint : IEndpoint
{
    public static string Route => "/locations";

    public static Delegate Handler => (Func<AddLocationRequest, IAddLocationCommandHandler, CancellationToken, Task<IResult>>) Handle;

    private static async Task<IResult> Handle([FromBody] AddLocationRequest request,
                                              IAddLocationCommandHandler handler,
                                              CancellationToken cancellationToken)
    {
        var command = new IAddLocationCommandHandler.Command(request.Name, request.Description);
        var location = await handler.HandleAsync(command, cancellationToken);
        return Results.Created($"/locations/{location.Id}", location);
    }
}