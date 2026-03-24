import { ZodError } from 'zod';
import { WorkSchema, FacetsSchema, CrossrefResponseSchema } from '@/schemas/crossref';

describe('WorkSchema', () => {
  it('should successfully parse valid API data', () => {
    const raw = {
      DOI: '10.1234/abc',
      title: ['My Title'],
      author: [{ given: 'A', family: 'B' }],
      type: 'journal-article',
      abstract: 'text',
      published: { 'date-parts': [[2023]] },
      'container-title': ['Journal'],
    };

    const result = WorkSchema.parse(raw);

    expect(result.DOI).toBe('10.1234/abc');
    expect(result.title).toBe('My Title');
    expect(result.author).toEqual([{ given: 'A', family: 'B' }]);
    expect(result.type).toBe('journal-article');
    expect(result.abstract).toBe('text');
    expect(result.published).toBe('2023');
    expect(result['container-title']).toBe('Journal');
  });

  it('should apply defaults for missing optional fields', () => {
    const result = WorkSchema.parse({});

    expect(result.DOI).toBe('');
    expect(result.title).toBe('');
    expect(result.author).toEqual([]);
    expect(result.type).toBe('');
    expect(result.published).toBe('');
    expect(result['container-title']).toBe('');
    expect(result.abstract).toBeUndefined();
  });

  it('should fail validation if critical fields are missing', () => {
    expect(() => WorkSchema.parse(null)).toThrow(ZodError);
  });

  it('should handle abstract as array of strings', () => {
    const result = WorkSchema.parse({ abstract: ['Part one', 'Part two'] });
    expect(result.abstract).toBe('Part one Part two');
  });

  it('should handle abstract as empty array', () => {
    const result = WorkSchema.parse({ abstract: [] });
    expect(result.abstract).toBeUndefined();
  });

  it('should extract year from nested date-parts', () => {
    const result = WorkSchema.parse({
      published: { 'date-parts': [[2021, 6, 15]] },
    });
    expect(result.published).toBe('2021');
  });

  it('should return empty string for published when date-parts is missing', () => {
    const result = WorkSchema.parse({ published: {} });
    expect(result.published).toBe('');
  });
});

describe('FacetsSchema', () => {
  it('should transform type-name and published facets into bucket arrays', () => {
    const raw = {
      'type-name': { values: { 'journal-article': 5, book: 2 } },
      published: { values: { '2022': 10 } },
    };

    const result = FacetsSchema.parse(raw);

    expect(result['type-name']).toEqual(
      expect.arrayContaining([
        { value: 'journal-article', count: 5 },
        { value: 'book', count: 2 },
      ]),
    );
    expect(result.published).toEqual(expect.arrayContaining([{ value: '2022', count: 10 }]));
  });

  it('should return empty arrays when facets are absent', () => {
    const result = FacetsSchema.parse({});

    expect(result['type-name']).toEqual([]);
    expect(result.published).toEqual([]);
  });
});

describe('CrossrefResponseSchema', () => {
  it('should parse a full valid response', () => {
    const raw = {
      status: 'ok',
      message: {
        items: [],
        facets: {},
        'next-cursor': 'abc',
        'total-results': 42,
      },
    };

    const result = CrossrefResponseSchema.parse(raw);

    expect(result.message['total-results']).toBe(42);
  });

  it('should fail when status is missing', () => {
    const raw = {
      message: {
        items: [],
        'total-results': 0,
      },
    };

    expect(() => CrossrefResponseSchema.parse(raw)).toThrow(ZodError);
  });
});
