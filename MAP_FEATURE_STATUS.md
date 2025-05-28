# BookDir Map Feature Status

## Summary
The interactive map feature has been **disabled and is being removed** from the BookDir site due to persistent cross-device compatibility issues, especially with marker rendering on mobile and general instability.

---

## Previous Map Implementation

- **Libraries Used:**
  - [Leaflet](https://leafletjs.com/) (via npm and CDN)
  - React-based map components (e.g., `StoreMap`, `StoreMapFixed`, `WorkingMap`)
- **Key Map Pages:**
  - `src/pages/map.astro`
  - `src/pages/maptest.astro`
  - `src/pages/mapfast.astro`
  - `src/pages/mapfixed-test.astro`
  - `src/pages/mapsimple.astro`
  - `src/pages/mapworking.astro`
  - `src/pages/maptest-minimal.astro`
  - `src/pages/map-debug.astro`
  - `src/pages/maptest-debug.astro`
- **Component Files:**
  - `src/components/map/StoreMap.tsx`
  - `src/components/map/StoreMapFixed.tsx`
  - `src/components/map/WorkingMap.tsx`

---

## Troubleshooting & Issues
- Markers (pins) were not rendering reliably on mobile devices.
- Map was not always accessible or interactive across all browsers/devices.
- Multiple attempts to fix (Context7/Leaflet docs, code review, network troubleshooting) did not resolve the core issues.
- Commenting out map logic and displaying a message referencing `DEV_NOTES.md` was used as a temporary measure.

---

## Current State (as of removal)
- All map-related pages have the map logic **commented out** and replaced with a message: "Map feature has been disabled for stability."
- See `DEV_NOTES.md` for the troubleshooting log and workaround details.
- No map or markers are rendered anywhere on the site.

---

## Rationale for Removal
- The map feature was causing more problems than it solved, especially for mobile users.
- Removing the feature improves site stability and user experience.
- The code is being fully removed to prevent confusion and reduce maintenance burden.

---

## If Map Is Needed in the Future
- Consider using a simpler, more robust mapping solution or a static map image.
- Revisit the requirements and test thoroughly on all target devices before re-enabling. 