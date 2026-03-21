function parseCommaList(value: unknown): string[] {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

export { parseCommaList };
