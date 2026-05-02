# Crochet Symbol Connection System — Improvement Plan

## Context

This document focuses specifically on improving how crochet symbols connect, snap, and interact on the canvas. The app already has a working drag-and-drop canvas with basic snapping, save/load, undo/redo, and export. This plan replaces and extends the existing connection logic to properly model how crochet diagrams actually work.

**Problems with the current system:**
- Snapping feels abrupt and jumpy — symbols teleport into position
- Only simple one-to-one connections are supported
- Cannot place multiple stitches into the same stitch (shells, increases)
- Cannot work stitches into chain spaces
- Cannot place stitches into chains
- No distinction between working in rows vs. rounds
- Chains don't link together to form foundation chains

---

## Part 1: Smooth Snapping

**Goal:** Replace the abrupt snap-into-place behavior with a smooth, guided experience that feels natural.

### 1.1 Animated Snap Transition

When a symbol crosses the snap threshold, do NOT instantly teleport it to the anchor position. Instead:

- Use a short easing animation (150–200ms, ease-out) to glide the symbol from its current position to the snap target
- Konva supports `.to()` for tweened animations — use this rather than instantly setting `x` and `y`
- During the animation, the symbol should not respond to further drag events — briefly lock input until the tween completes

### 1.2 Proximity Feedback (Pre-Snap)

Before the snap fires, give the user visual feedback that a connection is close:

- **Magnetic zone (outer radius, ~40px):** When a dragged symbol's anchor enters this zone around a compatible target anchor, show a subtle visual cue — e.g., the target anchor glows or pulses, a faint dashed line draws between the two anchors. The dragged symbol should feel slightly "pulled" toward the target (bias the position by 10–20% toward the snap point while still following the cursor).
- **Snap zone (inner radius, ~15px):** When the anchor enters this tighter zone, fire the actual snap with the animated transition from 1.1.
- **Incompatible anchors:** If a dragged anchor is near a target anchor but they aren't compatible (see Part 2), show no feedback at all — don't glow, don't pull. This teaches the user which connections are valid without error messages.

### 1.3 Detach Behavior

When dragging a connected symbol away from its connection:

- Don't break the connection the instant the drag starts — only break it once the user has dragged beyond the magnetic zone radius (~40px from the anchor)
- Use a brief "stretch" visual — draw a faint line between the symbol and its former anchor as it's being pulled away, then break cleanly once past the threshold
- On detach, fire the `disconnectSymbols` store action

### 1.4 Implementation Notes

- Keep the snap threshold distances configurable (store them in a constants file or the symbol config) so they can be tuned by feel during development
- All proximity checks should use squared distances (`dx*dx + dy*dy < r*r`) to avoid unnecessary `Math.sqrt` calls on every drag frame
- Throttle the proximity check to every ~16ms (one frame at 60fps) if performance is an issue with many symbols

---

## Part 2: Connection Type System

**Goal:** Model the different ways crochet stitches connect to each other, replacing the current generic anchor system.

### 2.1 Anchor Types

Redefine anchors with explicit types that encode crochet semantics. Every anchor has:

```typescript
interface Anchor {
  name: string;            // e.g., "top", "base", "slot_1"
  type: AnchorType;        // see enum below
  offsetX: number;         // position relative to symbol center
  offsetY: number;
  connectedTo: string | null;  // "symbolId:anchorName" or null
}

enum AnchorType {
  STITCH_TOP,      // the top of a stitch — where another stitch can be worked into it
  STITCH_BASE,     // the bottom/base of a stitch — attaches down into another stitch's top or a chain
  CHAIN_LEFT,      // left side of a chain link
  CHAIN_RIGHT,     // right side of a chain link
  CHAIN_TOP,       // top of a chain — a stitch can be worked into it
  RING_SLOT,       // a slot on a magic ring — stitches attach here
  SPACE,           // a chain space — stitches can be worked into the gap
}
```

### 2.2 Compatibility Matrix

Define which anchor types can connect to which. This replaces any generic "top connects to bottom" logic:

| Source (being dragged) | Can connect to                        | Example                              |
|------------------------|---------------------------------------|--------------------------------------|
| `STITCH_BASE`          | `STITCH_TOP`, `CHAIN_TOP`, `RING_SLOT`, `SPACE` | dc worked into a sc, into a chain, into a ring, or into a chain space |
| `CHAIN_RIGHT`          | `CHAIN_LEFT`                          | chain linking to next chain          |
| `CHAIN_LEFT`           | `CHAIN_RIGHT`                         | chain linking to previous chain      |
| `STITCH_TOP`           | `STITCH_BASE`                         | a stitch worked into this stitch     |
| `RING_SLOT`            | `STITCH_BASE`                         | a stitch attached to the ring        |
| `CHAIN_TOP`            | `STITCH_BASE`                         | a stitch worked into a chain         |
| `SPACE`                | `STITCH_BASE`                         | a stitch worked into a chain space   |

Store this matrix as a lookup (e.g., a `Map<AnchorType, AnchorType[]>` or a simple object) in the config, not as hardcoded if/else chains. This makes it easy to add new anchor types later.

### 2.3 Updated Symbol Definitions

Update the symbol registry to use the new anchor types. Key changes:

**Chain:**
- `CHAIN_LEFT` on the left side
- `CHAIN_RIGHT` on the right side
- `CHAIN_TOP` on top (so stitches can be worked into the chain)

**Single Crochet / Double Crochet / Half Double / Treble (all standard stitches):**
- `STITCH_BASE` at the bottom
- `STITCH_TOP` at the top

**Magic Ring:**
- Multiple `RING_SLOT` anchors arranged radially (start with 12 slots, spaced evenly around the ring)

**Increase:**
- `STITCH_BASE` at the bottom (single attachment point — it goes into one stitch)
- Two `STITCH_TOP` anchors at the top (two stitches come out)

**Decrease:**
- Two `STITCH_BASE` anchors at the bottom (attaches into two stitches)
- One `STITCH_TOP` at the top

---

## Part 3: Multi-Stitch Connections (Shells, Clusters, Fans)

**Goal:** Allow multiple stitches to be worked into the same anchor point, with automatic radial fan-out arrangement.

### 3.1 Change Anchors from Single to Multi-Occupancy

Currently, each anchor connects to at most one other symbol. Change `STITCH_TOP`, `CHAIN_TOP`, and `RING_SLOT` anchors to accept **multiple** incoming connections:

```typescript
interface Anchor {
  // ... existing fields ...
  connectedTo: string[];        // change from string | null to string[]
  maxConnections: number;       // 1 for STITCH_BASE, CHAIN_LEFT, CHAIN_RIGHT
                                // many for STITCH_TOP (e.g., 6), CHAIN_TOP (e.g., 3), RING_SLOT (e.g., 1 each but ring has many slots)
}
```

When a second stitch is connected to an anchor that already has a connection, don't reject it — accept it and trigger the fan-out layout (see 3.2).

### 3.2 Radial Fan-Out Layout

When multiple stitches connect to the same anchor, automatically arrange them in a fan pattern:

- **1 stitch:** Positioned directly above the anchor (0° — straight up)
- **2 stitches:** Fanned at roughly -20° and +20° from vertical
- **3 stitches:** Fanned at -30°, 0°, +30°
- **N stitches:** Evenly distributed across a fan arc. The arc width should grow with N but cap at ~120° to prevent stitches from going sideways.

Calculation for N stitches:
```
totalArc = min(30° * (N - 1), 120°)
startAngle = -totalArc / 2
angleStep = totalArc / (N - 1)    // for N > 1
```

Each connected stitch is positioned at distance `stitchHeight` from the anchor point, at its computed angle. The stitch symbol itself should also be **rotated** to match its angle so it points outward from the fan center.

### 3.3 Re-Layout on Connect/Disconnect

Every time a stitch is added to or removed from a multi-occupancy anchor:

1. Recalculate the fan angles for all stitches connected to that anchor
2. Animate each stitch to its new position/rotation (use the same 150–200ms easing from Part 1)
3. Recursively update positions of anything connected *above* those stitches (their children), since the parent moved

### 3.4 Visual Feedback for Multi-Occupancy

- When dragging a stitch near an anchor that already has connections, show a preview of where the new stitch would fan to (ghost outline at the computed position)
- Show small numbered badges or dots on the anchor to indicate how many stitches are attached (optional, but helpful)

---

## Part 4: Chain Behavior

**Goal:** Chains link together automatically to form foundation chains and chain spaces.

### 4.1 Auto-Linking Chains

When a chain symbol is placed on the canvas:

- If there are other unconnected chain symbols nearby (specifically, if any chain has an open `CHAIN_LEFT` or `CHAIN_RIGHT` anchor within the magnetic zone), auto-snap the new chain to form a continuous line
- If no chains are nearby, place the chain freely

When a chain is connected to another chain via `CHAIN_RIGHT` → `CHAIN_LEFT`, they should visually form a continuous horizontal (or curved) line with no visible gap between them.

### 4.2 Foundation Chain Rendering

A series of connected chains should render as a cohesive line:

- Chains in a line maintain consistent spacing (the `CHAIN_RIGHT` → `CHAIN_LEFT` connection enforces this)
- The entire chain line can be curved by the user: support dragging the middle of a chain sequence to bend it into an arc (useful for working in rounds)
- When a chain line is curved, each individual chain rotates to follow the curve tangent

### 4.3 Chain Spaces

A chain space is the gap between stitches in a row above, bridged by one or more chains. To model this:

- Add a `SPACE` anchor type that exists at the midpoint of a chain (or between two chains in a sequence)
- This `SPACE` anchor accepts `STITCH_BASE` connections — stitches worked into the chain space
- Visually, the connected stitch sits above the gap, not attached to a specific chain's top

### 4.4 Stitches Worked Into Chains

Individual chains (not chain spaces) can also have stitches worked directly into them:

- The `CHAIN_TOP` anchor on each chain symbol accepts `STITCH_BASE` connections
- This is visually distinct from working into a chain space — the stitch sits directly above the specific chain, not in the gap between chains
- Support multi-occupancy on `CHAIN_TOP` (e.g., shell into a chain) with the same fan-out behavior from Part 3

---

## Part 5: Row and Round Modes

**Goal:** Support the two fundamental crochet construction methods, which affect how connections flow.

### 5.1 Working in Rows

When building a flat piece worked in rows:

- **Row 1 (foundation):** A foundation chain runs horizontally. Stitches are worked into the chains from left to right (or right to left).
- **Row 2 and beyond:** The work turns. Stitches are worked into the tops of the row below, going in the opposite direction.
- **Turning chains:** At the end of each row, one or more chain stitches are added to gain height before turning. The number of turning chains depends on the stitch type (1 for sc, 2 for hdc, 3 for dc, 4 for tr).

**What the app should do:**

- When stitches are connected in a row across the `STITCH_TOP` anchors of a lower row, visually align them in a horizontal line matching the row below
- Don't enforce strict row structure — let the user freely place stitches, but provide alignment guides (faint horizontal lines) when a stitch is near the vertical level of other stitches in the same connection generation

### 5.2 Working in Rounds

When building in the round (e.g., amigurumi, granny squares):

- **Round 1:** Stitches are worked into a magic ring, fanning out radially
- **Round 2+:** Stitches are worked into the tops of the round below, forming a concentric ring

**What the app should do:**

- When stitches are connected to a magic ring, use the radial fan-out from Part 3 — this is already the correct behavior for rounds
- For subsequent rounds: when stitches connect to the tops of a radially arranged round, position them further from the center at the same angles, forming a larger concentric arc
- Increases in rounds should visually spread the fan, since adding stitches to a round makes the circumference grow

### 5.3 Mode Toggle (Optional Enhancement)

Consider adding a "Row Mode" / "Round Mode" toggle in the editor toolbar. This wouldn't restrict what the user can do, but would change hint behavior:

- **Row mode:** Show horizontal alignment guides, auto-suggest turning chains
- **Round mode:** Show radial/concentric guides, auto-suggest ring placement

This is a nice-to-have and can be deferred if the core connection improvements are complex enough. Mark it as optional.

---

## Part 6: Group Dragging Improvements

**Goal:** Moving connected symbol groups should feel natural and preserve the diagram structure.

### 6.1 Recursive Group Movement

When a user drags a symbol that is connected to others:

- Traverse the full connection graph from the dragged symbol to find all transitively connected symbols
- Move the entire group together, maintaining relative positions
- The dragged symbol follows the cursor; all others maintain their offset from it

### 6.2 Subtree vs. Full Group

Add a modifier key behavior:

- **Normal drag:** Moves the entire connected group
- **Hold Shift + drag:** Moves only the dragged symbol and its "children" (symbols connected above it in the stitch hierarchy), detaching from siblings and the parent below

This lets users rearrange parts of a diagram without breaking everything apart.

### 6.3 Rotation of Connected Groups

- Allow the user to rotate a group by holding a modifier (e.g., Ctrl + drag) or via a rotation handle on the selected group
- Rotation should pivot around the initially dragged symbol
- All connected symbols rotate around that pivot, maintaining their relative positions and connection angles

---

## Implementation Order

Work through these parts in this order, as each builds on the previous:

1. **Part 2 (Connection Type System)** — Define the new anchor types and compatibility matrix first. This is the foundation everything else depends on. Update the symbol registry. Migrate existing connection data if needed.

2. **Part 1 (Smooth Snapping)** — With the new anchor types in place, implement the proximity feedback, animated transitions, and clean detach behavior.

3. **Part 4 (Chain Behavior)** — Implement chain linking, foundation chain rendering, chain spaces, and stitches-into-chains. This requires the new anchor types from Part 2 and the smooth snapping from Part 1.

4. **Part 3 (Multi-Stitch Connections)** — Implement multi-occupancy anchors and the radial fan-out layout. This is needed before rounds can work properly.

5. **Part 5 (Row and Round Modes)** — With multi-stitch and chain behavior working, implement the row alignment guides and round/concentric positioning.

6. **Part 6 (Group Dragging)** — Polish group movement, add shift-drag for subtree movement, and group rotation.

---

## Data Migration Notes

The changes in Part 2 modify the anchor data structure. Existing saved projects use the old format. Handle this with a version check:

- The `canvas_json` already has a `"version"` field — increment it (e.g., from 1 to 2)
- Write a migration function that runs on load: if `version < 2`, transform old anchor data to the new format (map old anchor names to new `AnchorType` values, convert `connectedTo` from `string | null` to `string[]`)
- Save the migrated data back on next save so migration only runs once per project

---

## Key Technical Notes

1. **Fan-out is a layout concern, not a data concern.** The store tracks connections (which symbols are connected to which anchors). The visual positions and rotation angles of fanned-out stitches are *derived* from the connection data at render time. Don't store computed fan positions — recompute them when connections change.

2. **Animation conflicts with dragging.** During a snap animation, temporarily disable drag handling on the animating symbol. Re-enable it once the tween completes. Use a `isAnimating` flag per symbol or a global animation lock.

3. **Recursive position updates can cascade.** When a fan-out repositions stitches, those stitches may have their own children that also need repositioning. Use a breadth-first traversal from the changed anchor outward to update positions in order, not recursively from leaves.

4. **Chain curves are cosmetic state.** If chains can be bent into arcs, store the curve parameter (e.g., a control point offset) in the chain symbol's data. This is separate from the connection graph — the connections don't change when a chain line is curved, only the visual positions along the curve.

5. **Preserve undo/redo compatibility.** The undo system from the original plan captures state snapshots. The new multi-occupancy anchors and fan-out positions should work transparently with this — since fan positions are derived, undo just needs to restore the connection arrays, and the layout recomputes automatically.

6. **Test with real crochet patterns.** After implementing each part, try building a real pattern — a granny square, a simple amigurumi ball, or a dishcloth swatch. These will surface edge cases faster than abstract testing.
