import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';

// Import router type from backend - this creates a type-only dependency
// In development, this is resolved via tsconfig paths
// In production build, the type is bundled
import type { AppRouter } from '../../../../backend/src/routers';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
});
