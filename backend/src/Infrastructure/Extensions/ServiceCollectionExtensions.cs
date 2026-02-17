using ClutterStock.Domain.Abstractions;
using ClutterStock.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ClutterStock.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite(connectionString));

        services.AddScoped<ILocationRepository, LocationRepository>();
        services.AddScoped<IRoomRepository, RoomRepository>();
        services.AddScoped<IItemRepository, ItemRepository>();

        return services;
    }
}
