export function greet(name: string): string {
  const trimmed = name?.trim();
  return `Hello world, ${trimmed && trimmed.length > 0 ? trimmed : 'World'} 👋`;
}
