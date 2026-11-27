using ClutterStock.Domain.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Locations.DeleteLocation;

public interface IDeleteLocationCommandHandler : ICommandHandler
{
    Task<DeleteOutcome> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int Id);
}

public class DeleteLocationCommandHandler(IAppDbContext context) : IDeleteLocationCommandHandler
{
    public async Task<DeleteOutcome> HandleAsync(IDeleteLocationCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var location = await context.Locations.FirstOrDefaultAsync(l => l.Id == command.Id, cancellationToken);
        if (location is null)
            return new EntityNotFound(command.Id);

        context.Locations.Remove(location);
        await context.SaveChangesAsync(cancellationToken);
        return new Deleted(command.Id);
    }
}
