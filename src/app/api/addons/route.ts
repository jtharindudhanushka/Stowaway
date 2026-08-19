import { createCatalogHandlers } from '@/lib/api/catalog';
import { addonSchema, addonUpdateSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

/** Add-on service catalog. Public read of active rows; SuperAdmin writes. */
const handlers = createCatalogHandlers({
  table: 'addon_services',
  label: 'add-on service',
  createSchema: addonSchema,
  updateSchema: addonUpdateSchema,
  orderBy: 'code',
  describe: (row) => `${row.code} (${row.name})`,
});

export const { GET, POST, PATCH, DELETE } = handlers;
