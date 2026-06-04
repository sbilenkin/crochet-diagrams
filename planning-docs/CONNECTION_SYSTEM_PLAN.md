# Connection System — Feature Planning Document

## Overview

This document covers four features that together move the connection system toward CAD-level sophistication. They are listed in recommended implementation order. Each section contains full design specifications, open questions to resolve before building, and implementation notes.

Users will invest time learning these interactions — that is expected and acceptable. The interactions should be discoverable and consistent, not necessarily instant.

---

## Feature 1: Multi-Select Mechanism

### Why first
Every subsequent feature on this list requires multi-select. It is the shared input primitive. Build it once here; the later features will call it directly.

### Behavior
- The user holds a modifier key (suggested: **Shift**) and clicks additional stitches to add them to the selection
- Alternatively, the user clicks and drags on empty canvas to draw a selection box; all stitches fully within the box are selected
- Selected stitches receive a consistent visual treatment (e.g., highlight ring or color shift) so the user can see what is in the selection at a glance
- Clicking empty canvas with no modifier key clears the selection
- Pressing Escape clears the selection

### Implementation notes
- Selection state should live at the top level of the canvas state, not inside individual stitch components
- The selection set is a list of stitch IDs
- Both the shift-click and drag-box methods should produce the same selection state — downstream features should not care how the selection was built
- The drag selection box should only trigger if the drag starts on empty canvas, not on a stitch (which should initiate a move)

### Open questions to resolve before building
- Should Shift+click on an already-selected stitch **deselect** it, or do nothing?
- Is there a maximum number of stitches that can be selected at once? (Probably not, but worth being explicit)
- Should the drag-box select stitches that are *partially* within the box, or only fully enclosed ones? (Recommend: fully enclosed, consistent with most diagramming tools)

---

## Feature 2: Hinge Rotation

### Why second
This is the highest-impact feature on the list — it is what finally makes the application functional for building real patterns. It does not depend on multi-select, but multi-select is faster to build and getting it stable first keeps the remaining steps clean. Hinge rotation touches the core connection model deeply, so it should be stable before features build on top of it.

### Behavior
Every connection point between two stitches acts as a **hinge**. The user can grab either side of a connection and rotate it around the shared point.

- When the user hovers over a connection point, a rotation affordance appears (e.g., a circular handle or cursor change)
- Clicking and dragging the affordance rotates the selected side around the connection point
- "Either side" means: the user can grab the stitch *above* the connection and rotate it (keeping the lower stitch fixed), or grab the stitch *below* and rotate it (keeping the upper fixed)
- Rotation snaps to common angles (suggested: every 15°) with the ability to hold a second modifier key to disable snapping for freeform rotation
- All stitches connected *to* the rotated stitch move with it (the rotation propagates through the chain)

### What this unlocks
Without hinge rotation, the user can only build straight or ring-based patterns. With it, fans, shells, chevrons, granny squares, and virtually all real pattern shapes become constructible.

### Implementation notes
- The connection model already supports a single connection point per stitch. Rotation is a property of that connection — specifically, the angle at which the child stitch's base meets the parent's connection point.
- Each connection should store an **angle offset** from its default orientation. Currently this is implicitly 0 for all connections; making it explicit and editable is the core data model change.
- When a stitch is rotated, its stored angle offset updates. Its position is then derived from the parent's connection point + the new angle.
- Propagation: if stitch B is rotated around stitch A's connection point, and stitch C is connected above B, stitch C moves with B (it maintains its own angle relative to B, not relative to the canvas).
- Save/load must be updated to persist angle offsets.

### Open questions to resolve before building
- What is the default orientation of a stitch when it is first placed? (e.g., vertical, pointing away from the center of a ring?) Document this explicitly so rotation is relative to a known baseline.
- When rotating a stitch that has multiple children connected above it, do all children rotate together? (Recommend: yes — the user is rotating a sub-tree, not an individual stitch)
- Should there be a "reset rotation" option in a right-click menu?
- Does the rotation affordance appear on hover, on selection, or always?

---

## Feature 3: Stitches-Together (sc2tog, dc2tog, etc.)

### Why third
Multi-select is already built (Feature 1). This feature is the simpler of the two merge interactions — it produces a modified appearance but does not create a new node type. It should be stable before the more complex popcorn/cluster feature is built.

### Trigger interaction
1. User multi-selects two or more adjacent stitches (using the mechanism from Feature 1)
2. A contextual option appears — either as a floating button near the selection, or as a right-click menu item — labeled **"Join stitches"** or similar
3. The user confirms; the stitches are merged into a stitches-together symbol

### Visual rendering rules (fully specified)

**Post normalization:**
All posts in a stitches-together are rendered at the same length, regardless of the individual stitch heights. The normalized length should be visually consistent with a dc height (a middle-ground that reads naturally for any combination).

**Post angles:**
Posts angle inward symmetrically to meet at a single top point, the same way a dc2tog works in the CYC standard. With N stitches, the posts fan inward evenly.

**Per-stitch crossbar:**
Each post retains its own stitch's characteristic crossbar. The crossbar angle is determined by the stitch type, not by the merged symbol:
- **sc**: crossbar is perpendicular to the post
- **hdc, dc, tr, and above**: crossbar is angled (not fully perpendicular), consistent with how those stitches look individually

**Top bar rule:**
A horizontal bar appears across the top of the merged symbol **if and only if at least one stitch in the group is hdc or above**.
- sc + sc → no top bar
- sc + hdc → top bar
- hdc + dc → top bar
- dc + dc → top bar

The full dividing line: **hdc, dc, tr = top bar. sc = no top bar.** Slip stitch is not eligible for stitches-together.

**Mixed stitch types:**
A merge across different stitch types is valid. Each post renders with its own crossbar style. The top bar rule applies across the full group regardless of which specific stitches triggered it.

### Implementation notes
- A stitches-together is a new rendering mode for a set of stitches, not a new stitch type. The underlying stitches retain their identities (their stitch type is preserved in the data model) so the rendering rules can be derived from the group.
- The merged symbol occupies a single connection point at the top (the shared apex) and multiple connection points at the base (one per stitch, matching the original stitches' base connections).
- Save/load must persist the "joined" state and the group membership.
- Consider adding a "separate stitches" option in a right-click menu to undo the merge.

### Open questions to resolve before building
- What is the minimum number of stitches for a stitches-together? (2 is standard, but worth being explicit)
- Is there a maximum? (3-together exists in real crochet but is rarer)
- Can a stitches-together be further combined with another stitch-together or individual stitch? (Edge case — probably out of scope for now)
- What happens if the user tries to join non-adjacent stitches? (Recommend: disallow with a brief error state, e.g., the option grays out)

---

## Feature 4: Popcorns and Clusters

### Why fourth
This builds on all three previous features: multiple stitches into one point (already works), multi-select (Feature 1), and the right-click context menu pattern (introduced in Feature 3). The main new work is the visual distinction between popcorn and cluster, and the context menu.

### Trigger interaction
1. User places multiple stitches into the same connection point (already supported)
2. User multi-selects those stitches
3. A right-click menu appears with two options: **"Create cluster"** and **"Create popcorn"**
4. The user selects one; the stitches are grouped and rendered accordingly

### Visual distinction: cluster vs. popcorn

**Cluster:**
Multiple stitches worked together with their tops joined. Visually similar to a stitches-together — posts fan out from a shared base connection point, and their tops are joined at a shared apex. The top bar rule from Feature 3 applies here as well. The cluster is "closed" at the top.

**Popcorn:**
Multiple stitches worked into the same base, then the first stitch is folded over and joined to the last — creating a raised, rounded effect. Visually, the posts are shown as a group but the top is closed differently than a cluster: a popcorn typically renders with a more pronounced "dome" or closing stitch at the top. Follow the CYC standard symbol for the specific visual.

### Implementation notes
- Both cluster and popcorn share the same trigger interaction; they differ only in their rendered appearance and their semantic meaning to a pattern reader.
- These are new node types in the data model (not just rendering modes), because a popcorn and a cluster behave differently in a pattern even if they look similar at a glance.
- The right-click menu introduced here can also be the home for "Join stitches" from Feature 3, unifying the interaction pattern: multi-select → right-click → choose action.
- Consider whether the "Create cluster" and "Create popcorn" options should gray out if the selected stitches are not all connected to the same base point.
- Save/load must persist the group type (cluster vs. popcorn).

### Open questions to resolve before building
- Should "Join stitches" from Feature 3 be migrated into this right-click menu for consistency? (Recommended: yes, if the right-click menu from Feature 3 was implemented as a floating button instead)
- What is the minimum stitch count for a popcorn/cluster? (Real crochet is typically 3–5 stitches, but the app probably shouldn't enforce this)
- Can a cluster contain mixed stitch types? (Yes, based on the same logic as Feature 3 — each post retains its own crossbar)
- Can a popcorn contain mixed stitch types? (Less common in real crochet — worth deciding whether to allow or restrict)

---

## Cross-Cutting Notes

### Interaction consistency
Features 3 and 4 both involve multi-select → action. By the time Feature 4 is built, consider whether all post-selection actions live in a single right-click context menu. A consistent pattern (select → right-click → choose) is easier to learn than multiple different trigger mechanisms.

### Save/load
Each feature touches the data model. After each feature ships, verify that save/load round-trips correctly before moving to the next feature. The angle offsets from Feature 2 are particularly important to get right early.

### Undo/redo
All four features should be undoable as single actions. A hinge rotation, a stitch merge, and a cluster creation should each be one undo step, not multiple.

### Testing approach
Because users are expected to invest time learning this system, it is worth doing at least one informal usability pass after Feature 2 (hinge rotation) ships — that is the most novel interaction and the one most likely to need iteration on the affordance design before the other features build on top of it.
