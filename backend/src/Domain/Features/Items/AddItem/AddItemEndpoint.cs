using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Items.AddItem;

[HttpMethod(HttpVerb.Post)]
public class AddItemEndpoint : IEndpoint
{
    public static string Route => "/items";

    public static Delegate Handler => (Func<IAddItemCommandHandler.Command, IAddItemCommandHandler, CancellationToken, Task<IResult>>) Handle;

    private static async Task<IResult> Handle([FromBody] IAddItemCommandHandler.Command command,
                                              IAddItemCommandHandler handler,
                                              CancellationToken cancellationToken)
    {
        var item = await handler.HandleAsync(command, cancellationToken);
        return Results.Created($"/items/{item.Id}", item);
    }
}