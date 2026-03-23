import { z } from 'zod';

const AuthorSchema = z
  .object({
    given: z.string().nullable().optional(),
    family: z.string().nullable().optional(),
  })
  .passthrough();

export type Author = z.infer<typeof AuthorSchema>;

// Result item
export const WorkSchema = z
  .object({
    DOI: z.string().nullable().optional(),
    title: z.array(z.string()).nullable().optional(),
    author: z.array(AuthorSchema).nullable().optional(),
    type: z.string().nullable().optional(),
    abstract: z
      .union([z.string(), z.array(z.string())])
      .nullable()
      .optional(),
    published: z
      .object({
        'date-parts': z.array(z.array(z.number())).optional(),
      })
      .nullable()
      .optional(),
    'container-title': z.array(z.string()).nullable().optional(),
  })
  .transform((raw) => {
    const yearFromDateParts = (dateParts: number[][] | undefined) => {
      const year = dateParts?.[0]?.[0];
      return typeof year === 'number' ? String(year) : '';
    };

    const publishedYear = yearFromDateParts(raw['published']?.['date-parts']);

    const abstractValue = Array.isArray(raw.abstract)
      ? raw.abstract.filter(Boolean).join(' ')
      : raw.abstract;

    return {
      DOI: raw.DOI ?? '',
      title: raw.title?.[0] ?? '',
      author: raw.author ?? [],
      type: raw.type ?? '',
      published: publishedYear,
      'container-title': raw['container-title']?.[0] ?? '',
      abstract: abstractValue ? String(abstractValue) : undefined,
    };
  });

export type Work = z.infer<typeof WorkSchema>;

export const FacetBucketSchema = z.object({
  value: z.string(),
  count: z.number(),
});

export type FacetBucket = z.infer<typeof FacetBucketSchema>;

const CrossrefFacetValuesSchema = z.object({
  'value-count': z.number().optional(),
  values: z.record(z.string(), z.number()),
});

export const FacetsSchema = z
  .object({
    'type-name': CrossrefFacetValuesSchema.optional(),
    published: CrossrefFacetValuesSchema.optional(),
  })
  .transform((raw) => {
    const toBuckets = (envelope: z.infer<typeof CrossrefFacetValuesSchema> | undefined) => {
      return envelope?.values
        ? Object.entries(envelope.values).map(([value, count]) => ({
            value,
            count,
          }))
        : [];
    };

    return {
      'type-name': toBuckets(raw['type-name']),
      published: toBuckets(raw.published),
    };
  });

export type Facets = z.infer<typeof FacetsSchema>;

export const CrossrefResponseSchema = z.object({
  status: z.string(),
  message: z.object({
    items: z.array(WorkSchema),
    facets: FacetsSchema.optional(),
    'next-cursor': z.string().nullable().optional(),
    'total-results': z.union([z.number(), z.string()]).transform((v) => Number(v)),
  }),
});

export type CrossrefResponse = z.infer<typeof CrossrefResponseSchema>;
