using System.Reflection;
using System.Security.Claims;
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

        // AddService overrides the OTEL_SERVICE_NAME resource detector, so honor the variable here
        // (deploy and compose set it to clutterstock-api); the assembly name is only a fallback.
        var serviceName = Environment.GetEnvironmentVariable("OTEL_SERVICE_NAME") is { Length: > 0 } configuredName
            ? configuredName
            : environment.ApplicationName;

        services.AddOpenTelemetry()
                .ConfigureResource(resource => resource.AddService(
                                       serviceName,
                                       serviceVersion: serviceVersion))
                .WithTracing(static tracing => tracing
                                               .AddAspNetCoreInstrumentation(static options =>
                                               {
                                                   options.RecordException = true;
                                                   options.Filter = static ctx =>
                                                       !ctx.Request.Path.StartsWithSegments("/healthz");
                                                   options.EnrichWithHttpResponse = static (activity, response) =>
                                                   {
                                                       var user = response.HttpContext.User;
                                                       if (user.Identity?.IsAuthenticated != true)
                                                           return;

                                                       var userId = user.FindFirstValue("sub")
                                                                    ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
                                                       if (!string.IsNullOrEmpty(userId))
                                                           activity.SetTag("enduser.id", userId);
                                                   };
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