/**
 * System health and status router
 */

import { router, publicProcedure } from '@/core';

export const systemRouter = router({
  health: publicProcedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })),
});
