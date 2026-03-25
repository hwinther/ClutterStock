using ClutterStock.Api.Extensions;
using ClutterStock.Api.Generated;
using ClutterStock.Infrastructure.Database;
using ClutterStock.Infrastructure.Extensions;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenTelemetryObservability(builder.Environment);

builder.Services.AddInfrastructure(
    builder.Configuration.GetConnectionString("ClutterStock") ?? throw new InvalidOperationException("Missing connection string for ClutterStock in the configuration"));

builder.Services.AddHealthChecks()
       .AddDbContextCheck<ApplicationContext>(tags: ["ready"]);

builder.Services.AddDomainHandlers();
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApiDocumentation();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationContext>();
    await db.Database.MigrateAsync();
}

app.UseOpenApiDocumentation();

app.UseHttpsRedirection();

var liveness = new HealthCheckOptions
{
    Predicate = static _ => false
};

var readiness = new HealthCheckOptions
{
    Predicate = static r => r.Tags.Contains("ready")
};

app.MapHealthChecks("/healthz", liveness)
   .WithTags("Health");

app.MapHealthChecks("/healthz/live", liveness)
   .WithTags("Health");

app.MapHealthChecks("/healthz/ready", readiness)
   .WithTags("Health");

app.MapDiscoveredEndpoints();
app.MapControllers();

app.Run();