using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;

namespace ClutterStock.Domain.Features.Items.AddItem;

public class AddItemEndpoint : IEndpoint
{
    public static string Route => "/items";
    public static string HttpMethod => "POST";

    public static Delegate Handler =>
        (Func<AddItemCommand, AddItemHandler, CancellationToken, Task<IResult>>)Handle;

    private static async Task<IResult> Handle(
        AddItemCommand command,
        AddItemHandler handler,
        CancellationToken cancellationToken)
    {
        var item = await handler.HandleAsync(command, cancellationToken);
        return Results.Created($"/items/{item.Id}", item);
    }
}
