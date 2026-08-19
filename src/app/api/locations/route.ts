import { createCatalogHandlers } from '@/lib/api/catalog';
import { locationSchema, locationUpdateSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

/**
 * Location catalog.
 *
 * The `is_airport` / `requires_stripe` / `allows_cash` flags on these rows
 * are what `src/lib/locations.ts` reads to decide whether cash is offered,
 * so editing a location here changes payment behaviour immediately.
 */
const handlers = createCatalogHandlers({
  table: 'locations',
  label: 'location',
  createSchema: locationSchema,
  updateSchema: locationUpdateSchema,
  orderBy: 'code',
  describe: (row) => `${row.code} (${row.name})`,
});

export const { GET, POST, PATCH, DELETE } = handlers;
