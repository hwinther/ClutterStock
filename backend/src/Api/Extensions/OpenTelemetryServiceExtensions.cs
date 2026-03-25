using System.Reflection;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace ClutterStock.Api.Extensions;

internal static class OpenTelemetryServiceExtensions
{
    public static IServiceCollection AddOpenTelemetryObservability(this IServiceCollection services,
                                                                   IHostEnvironment environment)
    {
        var serviceVersion = Assembly.GetExecutingAssembly()
                                     .GetName()
                                     .Version?.ToString();

        services.AddOpenTelemetry()
                .ConfigureResource(resource => resource.AddService(
                                       environment.ApplicationName,
                                       serviceVersion: serviceVersion))
                .WithTracing(static tracing => tracing
                                               .AddAspNetCoreInstrumentation(static options =>
                                               {
                                                   options.RecordException = true;
                                                   options.Filter = static ctx =>
                                                       !ctx.Request.Path.StartsWithSegments("/healthz");
                                               })
                                               .AddHttpClientInstrumentation(static options => options.RecordException = true)
                                               .AddEntityFrameworkCoreInstrumentation()
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