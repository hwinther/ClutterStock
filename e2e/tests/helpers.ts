// Stable, collision-resistant suffix to keep parallel tests from stepping on
// each other when they create rows in the shared dev database.
export function uniqueSuffix(label: string): string {
  return `${label}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}
