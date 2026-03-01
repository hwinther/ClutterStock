using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Items.UpdateItem;

public interface IUpdateItemCommandHandler : ICommandHandler
{
    record Command(int Id, int RoomId, string Name, string? Description, string? Category, string? Notes);

    Task<IResult> HandleAsync(Command command, CancellationToken cancellationToken = default);
}

public class UpdateItemCommandHandler(IAppDbContext context) : IUpdateItemCommandHandler
{
    public async Task<IResult> HandleAsync(IUpdateItemCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var item = await context.Items.FirstOrDefaultAsync(i => i.Id == command.Id, cancellationToken);
        if (item is null)
            return Results.NotFound();

        item.RoomId = command.RoomId;
        item.Name = command.Name;
        item.Description = command.Description;
        item.Category = command.Category;
        item.Notes = command.Notes;
        item.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
        return Results.Ok(item);
    }
}
