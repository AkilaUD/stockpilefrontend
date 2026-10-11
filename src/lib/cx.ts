export type ClassValue = string | null | undefined | false | ClassValue[];

/**
 * Minimal class-name joiner.
 *
 * Deliberately not `clsx`: the whole implementation is a flatten-and-filter,
 * and a third-party dependency in the runtime path would have to be licence-
 * scanned and audited for what amounts to five lines. Kept array-capable so
 * call sites can compose variant lists readably.
 */
export function cx(...values: ClassValue[]): string {
  const parts: string[] = [];

  for (const value of values) {
    if (value === null || value === undefined || value === false || value === "") {
      continue;
    }
    if (Array.isArray(value)) {
      const nested = cx(...value);
      if (nested !== "") parts.push(nested);
      continue;
    }
    parts.push(value);
  }

  return parts.join(" ");
}
