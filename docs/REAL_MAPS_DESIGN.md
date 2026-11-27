# Real roads: first prototype

Status: design only. Existing regions are procedural interpretations, not real maps. No geographic data or landmarks have been imported.

## First milestone

Build one short, manually selected drivable stretch on the Jaisalmer–Sam corridor in the Thar Desert, subject to checking road coverage, road access, source licences and suitable data. Rajasthan Tourism lists Sam sand dunes about 42 km from Jaisalmer ([source](https://rtdc.tourism.rajasthan.gov.in/client/hoteldetails.aspx?hotelid=jaisalmermoomal)); the first prototype should use only a small verified portion, not imply the full corridor is implemented. Preserve the current procedural Thar route as a separate option. The previously proposed Srinagar–Sonamarg corridor remains a later candidate. Offline preprocessing should produce a versioned route asset with a target of less than 100 KB compressed for the road centreline and elevation profile; terrain, landmarks and textures require separate budgets. Measure actual sizes before committing to that target.

## Data and licensing

- Road geometry and place metadata: OpenStreetMap extracts, for example [Geofabrik India](https://download.geofabrik.de/asia/india/). Retain source date, extract boundary, attribution and licence information. Display “© OpenStreetMap contributors” with a link to [copyright and licence](https://www.openstreetmap.org/copyright). ODbL attribution and share-alike obligations must be reviewed for the actual derived dataset before distribution.
- Elevation: candidate [USGS SRTM 1 arc-second](https://www.usgs.gov/centers/eros/science/usgs-eros-archive-digital-elevation-shuttle-radar-topography-mission-srtm-1); check coverage, voids and terms for the specific tiles selected. At approximately 30 m resolution, elevation is too coarse to represent road engineering precisely.
- OSM points or building outlines can identify landmarks; they do not provide detailed licensed 3D models. Use original simplified assets or separately approved, properly licensed assets. Check individual landmark representation and legal concerns before public release.
- Do not bulk-download public OSM map tiles for offline use. The [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) prohibits prefetch and offline archives from that service. Use suitable extracts or a separately authorised provider.

## Thar prototype boundaries

- Candidate: a roughly 3–5 km contiguous section along the Jaisalmer–Sam corridor, selected only after examining the actual road data. Exact endpoints, road IDs, access tags and legal usability are not yet verified; do not invent them. Rajasthan Tourism describes Sam and the dunes as a destination near Jaisalmer ([source](https://www.tourism.rajasthan.gov.in/jaisalmer.html)).
- Use an offline regional extract, such as [Geofabrik Western Zone](https://download.geofabrik.de/asia/india/western-zone.html), then filter it to the chosen corridor. The download is much larger than a game route and must not be shipped to players. Preserve extract date and exact source information.
- Start with one finite, junction-free road; show a destination/end screen rather than fabricating an endless loop. Normal driving comes first; racing, branching roads and multiplayer are later milestones.
- Art direction: golden dunes, sparse scrub, sandstone-coloured roadside buildings and clear horizon, using original procedural assets. Dunes are approximate art, not elevation-accurate terrain. Jaisalmer Fort is a later landmark candidate; do not promise it is visible from the first selected segment.
- Working performance targets, not measured results: road centreline and elevation under 100 KB compressed, no new runtime map SDK, reuse existing bounded terrain and scenery pools, and compare frame times/draw calls/triangles on a mid-range Android phone before acceptance.
- Acceptance: the chosen OSM road and its continuity are documented; routing direction and access are checked; road seams and traffic positions match; the finite route ends cleanly; attribution and source records are present; desktop and mobile are manually verified.

## Offline conversion and route format

1. Select a contiguous road segment from a dated extract; validate continuity, direction and road restrictions. Do not infer elevation from the OSM road coordinates alone.
2. Convert coordinates into local metric coordinates, sample the elevation dataset, simplify the path with a documented error tolerance, and retain intersections and notable turns. Smooth extreme slopes and corners for driving; record the changes.
3. Store cumulative distance, local centreline coordinates, elevation, optional landmark references and provenance in a compact versioned asset. Check monotonic distances, finite values, continuity, size and slope limits in automated tests. The first milestone is a finite stretch, with explicit start/end behaviour; it must not silently repeat or invent connections.
4. Produce bounded terrain and scenery chunks separately. Load nearby chunks only, share geometry/materials and test memory and frame rate on a mid-range Android device. No runtime geocoding or map API is required for the prototype.

## Integration constraint

`src/game/world/roadProfile.js` currently treats the road as lateral offset and height functions of a forward distance. `roadFrame()` subtracts those values relative to the player; `EndlessHighway`, traffic, landmarks and camera consume that contract. This is suitable for bounded curves, but a real road with hairpins, intersections or a heading beyond 90 degrees cannot be represented reliably as `x(z)`.

A real-route implementation therefore needs a distance-parameterised 2D centreline, a local moving frame and shared conversion of road, scenery, traffic and camera positions. Introduce that interface alongside the existing procedural routes and test it with synthetic hairpins and junction-free segments before loading real data. Do not claim the existing relative-offset model already supports a full road network. Normal free driving, branching intersections, races and an open-world map are subsequent milestones, not part of the first fixed-route prototype.

## Accuracy and acceptance

Label the area as adapted from real geography, not a navigation product. Log intentional smoothing and missing landmark substitutions. Verify road continuity, terrain seams, transitions at both ends, traffic/collision alignment and pause/restart. Compare draw calls, triangles, memory, frame time and asset size before/after; test desktop and Android across quality settings. Never assume a 30 m elevation grid produces an accurate street scene.

## Future multiplayer and social profiles

Multiplayer races and mutual friend requests need a backend, rate limits, consent, reporting and moderation. Social links should be optional, restricted to validated HTTPS profile URLs, visible only to mutually consenting users, revocable, and not public by default for minors. Avoid open chat until moderation and safeguarding are designed. No implementation or real user data is included here.

## Decisions before real-data implementation

- Select the exact 3–5 km road segment and verify its OSM access tags; the prototype should show a destination/end screen.
- Decide whether landmarks are approximate original geometry or individually sourced, approved assets.
- Confirm the distribution and attribution approach for extracted map and elevation data.
- Set a phone performance budget and offline/download size limit for terrain and scenery, separate from the road-file target.
