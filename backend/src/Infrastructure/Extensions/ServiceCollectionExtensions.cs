using ClutterStock.Domain.Abstractions;
using ClutterStock.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ClutterStock.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<ApplicationContext>(options =>
                                                      options.UseNpgsql(connectionString));

        services.AddScoped<IAppDbContext>(static sp => sp.GetRequiredService<ApplicationContext>());

        return services;
    }
}