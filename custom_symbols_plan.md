# Custom Symbols Feature — Planning Document

## Scope

Users will be able to create their own stitch symbols by drawing them in a built-in editor and defining the connection points themselves. Once created, custom symbols appear in the stitch bar alongside built-in stitches and can be placed and connected like any other stitch.

This is a larger feature than it first appears. It is essentially three sub-systems:

1. A **drawing editor** for the symbol's shape
2. A **connection point editor** for marking where the symbol connects to other stitches
3. **Integration** with the rest of the application (storage, the stitch bar, placement, save/load)

## Important sequencing note

In the broader roadmap, custom symbols were sequenced first because they sounded purely additive. With user-defined connection points, that's no longer fully true — the application's connection model has to support arbitrary connection points (multiple per symbol, in arbitrary positions, possibly with types) *before* custom symbols can really work.

That generalization was originally planned for the clusters/popcorns/around-post step. The practical implication: **part of the connection model generalization gets pulled forward into this feature.** Custom symbols can't ship without it. The clusters/popcorns step will then be smaller than originally scoped, since it inherits the generalized model.

This isn't a problem, but it's worth being aware of going in — the data-model work in step 1 below is more significant than it looks.

---

## Open design questions to settle before building

These are decisions that will shape the work and are easier to make now than mid-build.

**On the symbol itself:**
- What's the canvas size and resolution of a symbol? Fixed (e.g., 100x100 units) or variable? Fixed is simpler; variable is more flexible but raises scaling questions when symbols sit next to each other on the diagram canvas.
- What drawing tools does the editor offer? At minimum, lines and curves. Possibly: basic shapes (circle, oval), freehand, text. The more tools, the more work — worth starting minimal.
- Is there a grid or snap behavior in the editor?
- Does the symbol have a defined "center" or anchor point (for rotation and placement), and is it user-defined or automatic?
- Should custom symbols match the visual style of built-in ones (similar line weight, monochrome) or can users do whatever they want? Recommend at least defaulting to a consistent style — users can override if needed.

**On connection points:**
- How many connection points can a symbol have? Probably unlimited, but worth being explicit.
- Are connection points typed (top, chain-space, post, etc.) or just generic "this is a place where things connect"? Typed is more powerful and matches where the connection model is heading anyway, but adds complexity to the editor UI.
- If typed, who maintains the list of types? Is it a fixed set (top, bottom, post, side) or extensible?
- Does each connection point have a direction (an angle the connecting stitch should approach from) or just a location?

**On storage and sharing:**
- Are custom symbols saved per-project, globally to the user, or both? Per-project is safer (no orphaned references between projects); global is more convenient. Both is probably the right long-term answer.
- Can custom symbols be exported and shared between users? Probably not in v1, but the data model should not preclude it.

**On lifecycle:**
- What happens when a project is loaded that references a custom symbol the current user doesn't have? Options: bundle symbols into the project file (recommended), show a placeholder, or fail to load.
- Can a custom symbol be edited after it's been used in diagrams? If so, do existing instances update? This is the trickiest lifecycle question and is worth deciding explicitly.

I'll make recommendations on most of these in the relevant steps below, but they're worth confirming up front.

---

## Recommended sub-feature order

### Step 1. Define the data model and storage

**Why first:** Every other step touches this. Getting it wrong means rework later; getting it right means the editor, the bar integration, and the save/load behavior all have a stable foundation.

The data model for a custom symbol needs to hold, at minimum: the drawn shape (probably as a list of paths, lines, and shapes in a vector format), the symbol's dimensions and anchor point, a list of connection points (each with a position and optional type/direction), a name, and a unique identifier.

The storage decision (per-project vs. global vs. both) should be made now. My recommendation: **store custom symbols inside the project file** for v1. This avoids the "missing symbol" problem entirely when sharing or moving projects, and keeps the feature self-contained. A global library can be added later as a convenience — symbols there are just templates that get copied into projects when used.

**Things to watch for:**
- Make sure the connection-point part of the model is general enough to also represent the existing built-in stitches' connection points. If the model can't describe what's already in the app, it's not general enough.
- Decide the file format for the drawn shape now (probably SVG path data or a simple structured list of primitives). Don't invent a custom binary format.

### Step 2. Build the drawing editor (shape only, no connection points yet)

**Why second:** The editor is the biggest single piece of UI work in this feature, and isolating it from the connection-point logic makes it much easier to build and test. At the end of this step, the user can open the editor, draw a shape, give it a name, save it, and see it stored in the project — but it can't yet be placed on the diagram canvas.

Start with a minimal toolset: straight lines and a couple of curve primitives. Resist the urge to build a full vector illustrator. Most stitch symbols are simple geometric figures, and a small toolset will cover the common cases. You can always add tools later based on what people actually try to draw.

Include from the start: undo/redo within the editor, a clear canvas action, and a preview at the size the symbol will actually appear on the diagram.

**Things to watch for:**
- Decide early how the editor opens (modal? separate view? side panel?). This affects how often users will create symbols — a modal interrupts flow; a panel invites experimentation.
- The preview at actual diagram size is important. Things that look fine in a 500px editor canvas can be unreadable at 30px on the diagram.

### Step 3. Add connection point definition to the editor

**Why third:** Now that the editor exists and can produce shapes, the connection point layer can be added on top. The user draws the shape in step 2's mode, then switches to a "place connection points" mode where they click on the shape (or near it) to add a point.

Start simple: each connection point is just a position, no type, no direction. Get the basic flow working — place point, see it appear, save it, see it persist. Then iterate.

Once that works, add the next layer: **typed connection points.** This is where the model needs to align with where the broader connection system is going. The types should at least include "top" (where stitches above connect in), "bottom" (where this stitch connects into a stitch below), and "post" (for around-post stitches). Other types can be added later.

Direction (the angle a connecting stitch should approach from) can come last in this step or be deferred to a polish pass — it improves how connections render but isn't required for them to work.

**Things to watch for:**
- The UI for placing connection points needs to be clearly distinct from the drawing UI, or users will accidentally draw when they meant to place a point and vice versa. Different modes with a clear visual indicator of which is active.
- Make connection points visible but unobtrusive on the symbol preview. The user needs to see them while editing but they shouldn't render on the actual diagram.

### Step 4. Save/load round-trip

**Why fourth:** Before custom symbols can be used on the diagram, the persistence layer needs to handle them correctly. This step is where you verify that a project containing custom symbols can be saved, closed, and reopened with the symbols intact — both the symbols themselves and any references to them from placed stitches (even though no stitches reference them yet at this point — that comes in step 6).

Doing this step before integration into the bar means you can find file-format issues with custom symbols in isolation, without also debugging the placement logic.

**Things to watch for:**
- Thumbnails: project thumbnails should render custom symbols too. The thumbnail generator needs access to the symbol definitions, which is straightforward if they're stored in the project file.
- Versioning: if the symbol data model changes in a later update, old projects need to still load. Worth thinking about a schema version field now even if you don't need it yet.

### Step 5. Integrate into the stitch bar

**Why fifth:** Custom symbols need to appear in the same stitch bar as built-in symbols so they can be selected and placed. This is mostly UI work: rendering custom symbols in the bar (using their stored shape data), and providing a way to access the editor to create new ones or edit existing ones.

Consider how the bar handles a growing list. With built-in stitches the bar has a known length; with custom symbols it can grow indefinitely. Some form of grouping, scrolling, or a separate "custom" section will eventually be needed. For v1, a simple section at the bottom of the bar with a "+" to create a new symbol is probably enough.

**Things to watch for:**
- Editing an existing custom symbol: the editor needs to open with the symbol's current state loaded, not as a blank canvas. Make sure the data flow supports this.
- Deleting a custom symbol that's used in the current project: confirm with the user and decide whether existing instances are removed, converted to a placeholder, or block the deletion.

### Step 6. Placement and connection on the diagram

**Why sixth:** This is where custom symbols become actually usable. The user selects one from the bar, drags it onto the canvas, and it behaves like any other stitch — rendering its shape, exposing its defined connection points, and connecting to other stitches through those points.

This step is where the generalized connection model gets exercised. The existing connection logic was built around a single connection point per stitch; it now needs to handle multiple points per stitch with potentially different types. Custom symbols are the first stitches to exercise this, but the same code will be used by clusters, popcorns, and around-post stitches later.

**Things to watch for:**
- Rotation: when a custom symbol is rotated (per the rotation feature from the previous plan), its connection points need to rotate with it. The math should fall out naturally if connection points are stored as positions within the symbol's local coordinate space.
- Hit detection on connection points needs to scale to multiple points per stitch. The green-dot indicator logic from the current model will need to handle showing the *closest* or *most appropriate* connection point rather than the only one.
- Connection-point types should influence what can connect to what. A "post" connection point probably shouldn't accept a chain-space-style connection. This is where typed points start paying off.

### Step 7. Edit and delete management

**Why last:** Once users can create, place, and connect custom symbols, the remaining work is the management layer — editing existing symbols, deleting them, possibly renaming them, possibly duplicating them as a starting point for a new symbol.

The key question to settle here: **when a custom symbol is edited, do existing placed instances update?** My recommendation is yes, they update — that's what users will expect, and it makes the symbol feel like a "type" rather than a stamp. But this has consequences: if a user edits a symbol's connection points (removes one, moves one), existing instances that have connections through those points may break. The edit flow needs to handle this gracefully — at minimum, warning the user; ideally, showing which existing diagrams will be affected.

**Things to watch for:**
- Renaming should be allowed and should update everywhere the name appears.
- Duplicating a symbol as a starting point for a new one is a small feature but a huge convenience — worth including in this step if time allows.

---

## Summary table

| # | Sub-feature | Notes |
|---|---|---|
| 1 | Data model and storage | Pulls connection-model generalization forward |
| 2 | Drawing editor (shape only) | Biggest UI piece; keep tool set minimal |
| 3 | Connection point definition | Add typed points; direction can come later |
| 4 | Save/load round-trip | Verify persistence before placement |
| 5 | Stitch bar integration | UI for selecting and creating |
| 6 | Placement and connection | Generalized connection model gets exercised |
| 7 | Edit/delete management | Handle the "edit propagates to instances" question |

## Suggested check-in points

- **After step 1:** Data model is the foundation for everything else. Worth a sanity-check that it can represent the existing built-in stitches before building on top of it.
- **After step 3:** The editor is feature-complete at this point even though symbols can't be placed yet. Good moment to draw a handful of test symbols (a quintuple treble, a cluster shape, a picot) and see whether the editor handles them comfortably.
- **Before step 6:** Pause to confirm the generalized connection model design in writing. This is the piece that the later clusters/popcorns/around-post step depends on, and getting it right here saves work later.
