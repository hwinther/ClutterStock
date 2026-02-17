using Microsoft.AspNetCore.Http;

namespace ClutterStock.Domain.Locations.AddLocation;

public class AddLocationEndpoint : IEndpoint
{
    public static string Route => "/locations";
    public static string HttpMethod => "POST";

    public static Delegate Handler =>
        (Func<AddLocationCommand, AddLocationHandler, CancellationToken, Task<IResult>>)Handle;

    private static async Task<IResult> Handle(
        AddLocationCommand command,
        AddLocationHandler handler,
        CancellationToken cancellationToken)
    {
        var location = await handler.HandleAsync(command, cancellationToken);
        return Results.Created($"/locations/{location.Id}", location);
    }
}
