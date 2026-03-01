using ClutterStock.Contracts.Items;
using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Items.AddItem;

[HttpMethod(HttpVerb.Post)]
[OpenApiDescription("Creates a new item.")]
public class AddItemEndpoint : IEndpoint
{
    public static string Route => "/items";

    public static Delegate Handler => (Func<AddItemRequest, IAddItemCommandHandler, CancellationToken, Task<IResult>>) Handle;

    private static async Task<IResult> Handle([FromBody] AddItemRequest request,
                                              IAddItemCommandHandler handler,
                                              CancellationToken cancellationToken)
    {
        var command = new IAddItemCommandHandler.Command(request.RoomId, request.Name, request.Description, request.Category, request.Notes);
        var item = await handler.HandleAsync(command, cancellationToken);
        return Results.Created($"/items/{item.Id}", item);
    }
}