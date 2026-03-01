using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ClutterStock.Infrastructure.Database.Configurations;

public class ItemConfiguration : IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> builder)
    {
        builder.ToTable("Item");

        builder.HasKey(static e => e.Id);

        builder.Property(static e => e.RoomId)
               .IsRequired();

        builder.Property(static e => e.Name)
               .IsRequired()
               .HasMaxLength(200);

        builder.Property(static e => e.Description)
               .HasMaxLength(2000);

        builder.Property(static e => e.Category)
               .HasMaxLength(100);

        builder.Property(static e => e.Notes)
               .HasMaxLength(2000);

        builder.Property(static e => e.CreatedAtUtc)
               .IsRequired();

        builder.Property(static e => e.UpdatedAtUtc);
    }
}