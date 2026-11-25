# MILKIT — Himatnagar Milk Delivery

MILKIT is a yellow-themed, mobile-responsive prototype for an Amul Gold doorstep delivery service.

## Open the prototype
Visit `milkit/index.html` in the repository, or use GitHub Pages with the repository root configured and open `/milkit/`.

## Included in this prototype
- Customer view: Amul Gold daily quantity, ₹299/month membership presentation, delivery slot, save preferences, and skip/undo today's delivery.
- Admin view: 100 demo households, dispatch quantity recalculation, skipped-order count, sample financial snapshot, customer table and CSV export.
- Driver view: sample numbered stops, delivery completion controls and route progress.
- Role switcher to preview Customer, Admin and Driver interfaces.
- Responsive yellow, charcoal and white visual system.
- Demo state saved in browser localStorage.

## Important prototype limitations
- All customer records and addresses are illustrative demo data, not real Himatnagar households.
- The driver route graphic and stop sequence are illustrative only. There is no real geocoding, road-network optimization, GPS tracking or turn-by-turn navigation yet.
- Data is stored only in the current browser. There is no shared database or multi-user synchronization.
- No real login, role-based authorization, payment gateway, WhatsApp messages, supplier integration or production order processing is connected.
- The ₹34 milk price, 2.5% commission and financial figures are planning assumptions. Confirm actual distributor terms and current MRP before relying on them.
- MILKIT is an independent delivery-service concept. Amul product names are used only to describe the intended product; this prototype does not imply an official Amul partnership or authorization.

## Next production steps
1. Create Supabase schema for customers, addresses, subscriptions, daily orders, skips, inventory, drivers and delivery events.
2. Add secure authentication and server-enforced Customer/Admin/Driver permissions.
3. Integrate payments and membership billing with explicit customer consent.
4. Geocode verified customer addresses and configure a route-optimization provider.
5. Add driver GPS/navigation, delivery proof and live admin tracking.
6. Add deployment environment variables and production monitoring.

## Local preview
Open `milkit/index.html` directly in a modern browser. No build step is required for this prototype.
