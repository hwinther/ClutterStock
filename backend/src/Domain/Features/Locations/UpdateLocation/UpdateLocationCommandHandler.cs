using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Locations.UpdateLocation;

public interface IUpdateLocationCommandHandler : ICommandHandler
{
    record Command(int Id, string Name, string? Description);

    Task<IResult> HandleAsync(Command command, CancellationToken cancellationToken = default);
}

public class UpdateLocationCommandHandler(IAppDbContext context) : IUpdateLocationCommandHandler
{
    public async Task<IResult> HandleAsync(IUpdateLocationCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var location = await context.Locations.FirstOrDefaultAsync(l => l.Id == command.Id, cancellationToken);
        if (location is null)
            return Results.NotFound();

        location.Name = command.Name;
        location.Description = command.Description;
        location.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
        return Results.Ok(location);
    }
}
