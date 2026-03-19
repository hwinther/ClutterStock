using System.Reflection;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace ClutterStock.Api.Extensions;

internal static class OpenTelemetryServiceExtensions
{
    public static IServiceCollection AddOpenTelemetryObservability(
        this IServiceCollection services,
        IHostEnvironment environment)
    {
        var serviceVersion = Assembly.GetExecutingAssembly().GetName().Version?.ToString();

        services.AddOpenTelemetry()
            .ConfigureResource(resource => resource.AddService(
                serviceName: environment.ApplicationName,
                serviceVersion: serviceVersion))
            .WithTracing(static tracing => tracing
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddOtlpExporter())
            .WithMetrics(static metrics => metrics
                .AddAspNetCoreInstrumentation()
                .AddRuntimeInstrumentation()
                .AddOtlpExporter())
            .WithLogging(static logging => logging
                .AddOtlpExporter());

        return services;
    }
}
