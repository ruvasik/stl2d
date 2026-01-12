/**
 * Root tRPC router combining all module routers
 */

import { router } from '@/core';
import { systemRouter } from '@/modules/system';
import { authRouter } from '@/modules/auth';
import { stlRouter } from '@/modules/stl';

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  stl: stlRouter,
});

export type AppRouter = typeof appRouter;
