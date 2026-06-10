/**
 * Une clases condicionalmente. Versión mínima de clsx — sin dependencias.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
