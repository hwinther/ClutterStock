using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ClutterStock.Infrastructure.Database.Configurations;

public class LocationConfiguration : IEntityTypeConfiguration<Location>
{
    public void Configure(EntityTypeBuilder<Location> builder)
    {
        builder.ToTable("Location");

        builder.HasKey(static e => e.Id);

        builder.Property(static e => e.Name)
               .IsRequired()
               .HasMaxLength(200);

        builder.Property(static e => e.Description)
               .HasMaxLength(2000);

        builder.Property(static e => e.CreatedAtUtc)
               .IsRequired();

        builder.Property(static e => e.UpdatedAtUtc);

        builder.HasMany(static e => e.Rooms)
               .WithOne(static e => e.Location)
               .HasForeignKey(static e => e.LocationId)
               .IsRequired();
    }
}