using ClutterStock.Contracts.Locations;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Locations.UpdateLocation;

public interface IUpdateLocationCommandHandler : ICommandHandler
{
    Task<Results<Ok<LocationResponse>, NotFound>> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int Id, string Name, string? Description);
}

public class UpdateLocationCommandHandler(IAppDbContext context) : IUpdateLocationCommandHandler
{
    public async Task<Results<Ok<LocationResponse>, NotFound>> HandleAsync(IUpdateLocationCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var location = await context.Locations.FirstOrDefaultAsync(l => l.Id == command.Id, cancellationToken);
        if (location is null)
            return TypedResults.NotFound();

        location.Name = command.Name;
        location.Description = command.Description;
        location.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok(location.ToResponse());
    }
}