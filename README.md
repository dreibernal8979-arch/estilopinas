# Estilo Pinas website

- Customer site: `/`
- Owner editor (login required): `/admin` (or `/edit`)

Shop data and photos live in the Supabase project **estilo-pinas** (separate from Lava Craze). Only the owner email in the `owners` table can save changes or upload photos.

## Price list (`/prices`)

- Customers see it at `/prices` (linked as **Price list** in the top menu). It reads the live shop data, so it updates as soon as the owner saves.
- **To update prices:** go to `/admin`, log in with the owner account, open **Price list**, change a price, storage option or model, then tap **Save**. The "Updated" date changes by itself.
  - Untick **Available** to show "Unavailable" instead of the price.
  - **+ Add storage option**, **+ Add model to …**, **+ Add category** add new entries. **Delete model** needs two taps.
  - Leave a price blank to show "Message for price".
  - The reminder text is edited in the same section (one paragraph per line).
- `pricelist.js` holds the starting data and is only used until the first save.
- To print or share a PDF from the latest prices, open `/prices` and tap **Print / Save PDF** at the bottom (A4 layout).
- The Google Doc copy of the price list is separate. Update it by hand when prices change, or ask for it to be regenerated from the saved data.
