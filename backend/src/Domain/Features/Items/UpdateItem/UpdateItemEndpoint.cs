using ClutterStock.Contracts.Items;
using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Items.UpdateItem;

[HttpMethod(HttpVerb.Put)]
[OpenApiDescription("Updates an existing item by id.")]
public class UpdateItemEndpoint : IEndpoint
{
    public static string Route => "/items/{id}";

    public static Delegate Handler => (Func<int, UpdateItemRequest, IUpdateItemCommandHandler, CancellationToken, Task<IResult>>) Handle;

    private static async Task<IResult> Handle([FromRoute] int id,
                                              [FromBody] UpdateItemRequest request,
                                              IUpdateItemCommandHandler handler,
                                              CancellationToken cancellationToken)
    {
        var command = new IUpdateItemCommandHandler.Command(id, request.RoomId, request.Name, request.Description, request.Category, request.Notes);
        return await handler.HandleAsync(command, cancellationToken);
    }
}