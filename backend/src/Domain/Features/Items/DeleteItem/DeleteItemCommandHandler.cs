using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Items.DeleteItem;

public interface IDeleteItemCommandHandler : ICommandHandler
{
    record Command(int Id);

    Task<bool> HandleAsync(Command command, CancellationToken cancellationToken = default);
}

public class DeleteItemCommandHandler(IAppDbContext context) : IDeleteItemCommandHandler
{
    public async Task<bool> HandleAsync(IDeleteItemCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var item = await context.Items.FirstOrDefaultAsync(i => i.Id == command.Id, cancellationToken);
        if (item is null)
            return false;

        context.Items.Remove(item);
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
