export const get = <T, O extends Record<string, unknown> | undefined>(
  obj: O,
  key: string,
  defaultValue: T
): T =>
  ((obj && key in obj
    ? (obj as Record<string, unknown>)[key]
    : undefined) as T) ?? defaultValue;
