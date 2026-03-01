namespace ClutterStock.Domain.Abstractions;

[AttributeUsage(AttributeTargets.Class, Inherited = false)]
public sealed class OpenApiDescriptionAttribute(string description) : Attribute
{
    public string Description { get; } = description;
}
