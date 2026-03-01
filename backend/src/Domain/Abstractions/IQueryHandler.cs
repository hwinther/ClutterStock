namespace ClutterStock.Domain.Abstractions;

/// <summary>
///     Marker interface for query handlers. Implemented by handler interfaces (e.g. IGetItemsQueryHandler).
///     Used by the handler registration generator to discover and register all query handlers.
/// </summary>
public interface IQueryHandler;