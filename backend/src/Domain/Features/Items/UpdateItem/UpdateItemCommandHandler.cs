using ClutterStock.Contracts.Items;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Items.UpdateItem;

public interface IUpdateItemCommandHandler : ICommandHandler
{
    Task<Results<Ok<ItemResponse>, NotFound>> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int Id, int RoomId, string Name, string? Description, string? Category, string? Notes);
}

public class UpdateItemCommandHandler(IAppDbContext context) : IUpdateItemCommandHandler
{
    public async Task<Results<Ok<ItemResponse>, NotFound>> HandleAsync(IUpdateItemCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var item = await context.Items.FirstOrDefaultAsync(i => i.Id == command.Id, cancellationToken);
        if (item is null)
            return TypedResults.NotFound();

        item.RoomId = command.RoomId;
        item.Name = command.Name;
        item.Description = command.Description;
        item.Category = command.Category;
        item.Notes = command.Notes;
        item.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok(item.ToResponse());
    }
}