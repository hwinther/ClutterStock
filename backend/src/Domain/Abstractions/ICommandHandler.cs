namespace ClutterStock.Domain.Abstractions;

/// <summary>
///     Marker interface for command handlers. Implemented by handler interfaces (e.g. IAddItemCommandHandler).
///     Used by the handler registration generator to discover and register all command handlers.
/// </summary>
public interface ICommandHandler;