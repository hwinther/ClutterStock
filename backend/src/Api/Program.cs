using Api.Extensions;
using ClutterStock.Domain.Items.AddItem;
using ClutterStock.Domain.Locations.AddLocation;
using ClutterStock.Domain.Rooms.AddRoom;
using ClutterStock.Infrastructure.Extensions;
using Endpoint = ClutterStock.Domain.Features.Test.Endpoint;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(
    builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=clutterstock.db");

builder.Services.AddScoped<AddLocationHandler>();
builder.Services.AddScoped<AddRoomHandler>();
builder.Services.AddScoped<AddItemHandler>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();

var domainAssembly = typeof(Endpoint).Assembly ?? throw new InvalidOperationException("Domain does not have an assembly loaded");
app.MapEndpointsInAssemblies(domainAssembly!);
app.MapControllers();

app.Run();
