/**
 * Look up a field error from a ProblemDetails `errors` map. Backend keys are
 * usually PascalCase (`Name`, `LocationId`); HTML form fields are lowercase.
 * Match case-insensitively and join multiple messages.
 */
export function fieldError(
  fieldErrors: Record<string, string[]> | undefined,
  field: string,
): string | undefined {
  if (!fieldErrors) return undefined;
  const key = Object.keys(fieldErrors).find(
    (k) => k.toLowerCase() === field.toLowerCase(),
  );
  return key ? fieldErrors[key]?.join(", ") : undefined;
}
