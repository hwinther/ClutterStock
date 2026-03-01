namespace ClutterStock.Domain.Abstractions;

[AttributeUsage(AttributeTargets.Class, Inherited = false)]
public sealed class HttpMethodAttribute(HttpVerb verb) : Attribute
{
    public HttpVerb Verb { get; } = verb;
}
