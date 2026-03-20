using ClutterStock.Api.Extensions;
using ClutterStock.Api.Generated;
using ClutterStock.Infrastructure.Database;
using ClutterStock.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenTelemetryObservability(builder.Environment);

builder.Services.AddInfrastructure(
    builder.Configuration.GetConnectionString("ClutterStock") ?? throw new InvalidOperationException("Missing connection string for ClutterStock in the configuration"));

builder.Services.AddDomainHandlers();
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApiDocumentation(builder.Environment);

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

app.MapGet("/healthz", static () => Results.Text("OK", "text/plain"));
app.MapGet("/healthz/live", static () => Results.Text("OK", "text/plain"));
app.MapGet("/healthz/ready", static async (ApplicationContext db, CancellationToken cancellationToken) =>
    await db.Database.CanConnectAsync(cancellationToken)
        ? Results.Text("OK", "text/plain")
        : Results.StatusCode(StatusCodes.Status503ServiceUnavailable));

app.MapDiscoveredEndpoints();
app.MapControllers();

app.Run();