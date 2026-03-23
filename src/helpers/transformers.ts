function parseCommaList(value: unknown): string[] {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function yearToRange(year: string) {
  return {
    from: `${year}-01-01`,
    until: `${year}-12-31`,
  };
}

export { parseCommaList, yearToRange };
