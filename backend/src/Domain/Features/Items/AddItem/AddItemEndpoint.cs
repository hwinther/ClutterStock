using ClutterStock.Contracts.Items;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Items.AddItem;

[HttpMethod(HttpVerb.Post)]
[OpenApiDescription("Creates a new item.")]
public class AddItemEndpoint : IEndpoint
{
    public static string Route => "/items";

    public static Delegate Handler => (Func<AddItemRequest, IAddItemCommandHandler, CancellationToken, Task<Created<ItemResponse>>>) Handle;

    private static async Task<Created<ItemResponse>> Handle([FromBody] AddItemRequest request,
                                                            IAddItemCommandHandler handler,
                                                            CancellationToken cancellationToken)
    {
        var command = new IAddItemCommandHandler.Command(request.RoomId, request.Name, request.Description, request.Category, request.Notes);
        var item = await handler.HandleAsync(command, cancellationToken);
        return TypedResults.Created($"{ApiRoutePrefix.V1}/items/{item.Id}", item.ToResponse());
    }
}