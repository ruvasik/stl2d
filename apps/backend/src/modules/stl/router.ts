/**
 * tRPC Router for STL processing and projection generation
 */

import { nanoid } from 'nanoid';
import { uploadStlSchema, MAX_FILE_SIZE } from '@stl2d/contracts';
import { publicProcedure, router } from '@/core';
import { parseSTL } from './stl-parser';
import { generateProjections } from './projection-engine';

export const stlRouter = router({
  uploadAndProcess: publicProcedure
    .input(uploadStlSchema)
    .mutation(async ({ input }) => {
      try {
        // Validate file size
        const buffer = Buffer.from(input.fileData, 'base64');
        if (buffer.length > MAX_FILE_SIZE) {
          throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
        }

        // Parse STL
        const mesh = parseSTL(buffer);

        // Generate projections
        const views = generateProjections(mesh);

        // Generate unique model ID
        const modelId = nanoid();

        return {
          success: true,
          modelId,
          views,
        };
      } catch (error) {
        throw new Error(
          `Processing failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }),
});
