using System.Diagnostics.CodeAnalysis;

namespace ClutterStock.Domain.Abstractions;

public interface IEndpoint
{
    [StringSyntax("Route")]
    static abstract string Route { get; }

    static abstract Delegate Handler { get; }
}