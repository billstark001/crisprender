
/** Convert a camelCase name to kebab-case. */
export function toKebab(name: string): string {
  return name.replace(/([A-Z])/g, (c) => `-${c.toLowerCase()}`);
}

/** Convert a camelCase name to snake_case. */
export function toSnake(name: string): string {
  return name.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`);
}

/** Capitalise the first letter of a camelCase name → PascalCase. */
export function toPascal(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}