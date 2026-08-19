import { createCatalogHandlers } from '@/lib/api/catalog';
import { itemTierSchema, itemTierUpdateSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

/**
 * Item tier catalog.
 *
 * GET is public (active tiers only) and drives the booking flow's item
 * picker. GET ?all=1, POST, PATCH and DELETE require SuperAdmin.
 *
 * There is deliberately no hardcoded fallback list here any more: serving
 * stale rates during a DB outage meant customers could be quoted and billed
 * prices the operator had already changed.
 */
const handlers = createCatalogHandlers({
  table: 'item_tiers',
  label: 'item tier',
  createSchema: itemTierSchema,
  updateSchema: itemTierUpdateSchema,
  orderBy: 'display_order',
  describe: (row) => `${row.code} (${row.name})`,
});

export const { GET, POST, PATCH, DELETE } = handlers;
