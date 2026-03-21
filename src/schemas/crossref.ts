import { z } from 'zod';

// Result item
export const WorkSchema = z.object({
  DOI: z.string().nullable().optional(),
  title: z.array(z.string()).nullable().optional(),
  type: z.string().nullable().optional(),
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
