using ClutterStock.Domain.Features.Items.AddItem;
using ClutterStock.Domain.Features.Locations.AddLocation;
using ClutterStock.Domain.Features.Rooms.AddRoom;

namespace ClutterStock.Api.Extensions
{
    public static class ServiceExtensions
    {
        extension(IServiceCollection services)
        {
            public IServiceCollection AddDomainHandlers()
            {
                services.AddScoped<AddLocationHandler>();
                services.AddScoped<AddRoomHandler>();
                services.AddScoped<AddItemHandler>();

                return services;
            }
        }
    }
}
