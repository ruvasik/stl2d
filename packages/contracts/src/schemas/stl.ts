import { z } from 'zod';

/** Schema for STL upload request */
export const uploadStlSchema = z.object({
  /** Base64 encoded file data */
  fileData: z.string(),
  /** Original file name */
  fileName: z.string(),
});

export type UploadStlInput = z.infer<typeof uploadStlSchema>;

/** Schema for projection view */
export const projectionViewSchema = z.object({
  name: z.string(),
  lines: z.array(z.tuple([
    z.tuple([z.number(), z.number()]),
    z.tuple([z.number(), z.number()]),
  ])),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
});

export type ProjectionViewOutput = z.infer<typeof projectionViewSchema>;

/** Schema for processing result */
export const processingResultSchema = z.object({
  success: z.boolean(),
  modelId: z.string(),
  views: z.array(projectionViewSchema),
});

export type ProcessingResultOutput = z.infer<typeof processingResultSchema>;
