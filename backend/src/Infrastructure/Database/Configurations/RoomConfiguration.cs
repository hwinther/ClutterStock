using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ClutterStock.Infrastructure.Database.Configurations;

public class RoomConfiguration : IEntityTypeConfiguration<Room>
{
    public void Configure(EntityTypeBuilder<Room> builder)
    {
        builder.ToTable("Room");

        builder.HasKey(static e => e.Id);

        builder.Property(static e => e.LocationId)
               .IsRequired();

        builder.Property(static e => e.Name)
               .IsRequired()
               .HasMaxLength(200);

        builder.Property(static e => e.Description)
               .HasMaxLength(2000);

        builder.Property(static e => e.CreatedAtUtc)
               .IsRequired();

        builder.Property(static e => e.UpdatedAtUtc);

        builder.HasMany(static e => e.Items)
               .WithOne(static e => e.Room)
               .HasForeignKey(static e => e.RoomId)
               .IsRequired();
    }
}