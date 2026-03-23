function parseCommaList(value: unknown): string[] {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function yearToRange(minYear: string, maxYear?: string) {
  const untilYear = maxYear ?? minYear;
  return {
    from: `${minYear}-01-01`,
    until: `${untilYear}-12-31`,
  };
}

export { parseCommaList, yearToRange };
