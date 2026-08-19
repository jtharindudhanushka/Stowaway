-- ================================================================
-- STOWAWAY — Migration 005
-- Item tier artwork becomes real data.
--
-- The admin panel showed a picture per item tier, but the URL was never
-- stored: a client-side helper mapped the tier `code` to a hardcoded path
-- and fell back to a placeholder. Adding a tier therefore gave it no
-- artwork, and the image could not be changed without a redeploy.
-- ================================================================

alter table public.item_tiers
  add column if not exists image_url text;

-- Backfill the paths the client helper had been hardcoding.
update public.item_tiers set image_url = '/items/small_bag.png'      where code = 'ITEM_001' and image_url is null;
update public.item_tiers set image_url = '/items/carry_on.png'       where code = 'ITEM_002' and image_url is null;
update public.item_tiers set image_url = '/items/large_suitcase.png' where code = 'ITEM_003' and image_url is null;
update public.item_tiers set image_url = '/items/odd_size.png'       where code = 'ITEM_004' and image_url is null;
update public.item_tiers set image_url = '/items/tea_chest.png'      where code = 'ITEM_005' and image_url is null;
