# Connection System Planning Document

## Scope

This document plans the next round of work on the connection system, working from the current baseline: users can create a starting chain of N chain stitches, and place single crochets into the top of each chain via a single green-dot connection point.

The shell shortcut (right-click to fan multiple double crochets into one stitch) is intentionally **out of scope** for this round and will be planned separately once the basic sc/ch connection behavior is solid.

## Implementation Order

The order below is chosen so that each step either (a) unblocks later steps, (b) is cheap and pays off immediately, or (c) isolates a hard design decision so it doesn't contaminate other work.

---

### 1. Change the single crochet symbol from an X to a plus

**Why first:** This is the cheapest and lowest-risk change on the list. It's a pure visual swap with no implications for connection logic, so getting it out of the way early means every screenshot and test from here on shows the correct, final-looking symbol. It also surfaces any rendering assumptions baked into the current X (anchor point, bounding box, rotation origin) before those assumptions get entangled with the rotation work in step 5.

**Things to watch for:**
- Make sure the plus's center point matches the X's center point so existing placement logic still lines up
- Confirm the plus reads clearly at the current zoom levels and against the chain symbol

---

### 2. Tighten the spacing between connected stitches

**Why second:** Also visual, also cheap, but it changes the geometry that every subsequent feature will be working against. Doing it before rotation and starting-chain differentiation means those features can be designed against the final spacing, not retrofitted.

**Things to watch for:**
- Decide whether spacing is a fixed pixel value, a multiple of stitch size, or tied to the chain's own dimensions — the third option scales best if stitch sizes ever change
- Check that the green connection-point dot is still easy to hit at the tighter spacing

---

### 3. Differentiate starting chains from regular chain stitches

**Why third:** This is the foundation for almost everything that comes after. The distinction (starting chain has no chain space; other chains do) determines which connection points a given chain offers, which in turn determines what the rotation work in step 5 has to handle and what the starting-point indicator in step 4 should point at.

**Suggested approach:**
- Treat "starting chain" as a property of the chain stitch object, not a separate stitch type — that keeps the symbol identical and the logic clean
- The starting chain is created when the user enters the initial length; any chain stitch added later (e.g., turning chains) is a regular chain by default
- Regular chains expose a chain-space connection point; starting chains do not
- Consider whether the user should ever be able to convert one to the other manually — probably yes, eventually, but you can defer the UI for that

**Things to watch for:**
- The data model change here will ripple. Save/load needs to preserve the distinction, and thumbnails should render both identically (since they look the same visually)
- Decide early whether "starting chain" applies to the whole row of chains or to each individual chain stitch — the answer affects how the indicator in step 4 attaches

---

### 4. Add a way to indicate the starting point of the diagram

**Why fourth:** Depends on step 3, because the starting point is conceptually tied to the starting chain (or to a specific stitch within it). Doing this after the starting-chain concept exists means the indicator has a clear thing to attach to.

**Open questions to resolve before building:**
- Is the starting point a property of a stitch (one stitch is flagged as "start") or a separate marker object placed on the canvas?
- Is it auto-assigned to the first chain of the starting chain, user-assigned, or both (auto with override)?
- Visually: arrow, highlighted outline, a small labeled marker? Crochet diagrams traditionally use an arrow or a small "start" label — worth matching convention so users recognize it immediately
- Can there be only one starting point per diagram? (Probably yes, but worth stating explicitly.)

**Things to watch for:**
- Save/load must preserve which stitch is the starting point
- If the starting stitch gets deleted, the indicator needs a defined behavior — clear itself, auto-move to the next stitch, or block the deletion

---

### 5. Rotation of stitches to any angle

**Why last in this round:** You already flagged this as the one with hard reconciliation questions around already-connected stitches. Putting it last means (a) the symbol, spacing, starting-chain, and starting-point work are all locked down before rotation has to interact with them, and (b) you can make rotation decisions with full knowledge of how connections currently behave in the rest of the system.

**The core design question to settle first:**

When a stitch is rotated, what happens to stitches connected to it? The realistic options are roughly:

- **Rigid:** rotating a stitch rotates the whole connected subgraph with it. Predictable but may move things the user didn't want to move.
- **Local:** only the selected stitch rotates; connections bend or stretch. Visually flexible but may break the diagram's logic.
- **Disconnect-on-rotate:** rotating a connected stitch first detaches it, then rotates. Safe but adds a step the user has to undo.
- **Hybrid:** free rotation for unconnected stitches; connected stitches have constrained rotation (e.g., snap to angles that keep the connection valid).

Crochet diagrams in print typically use the hybrid approach — stitches sit at angles determined by their position in the row/round, not independently. That may be the right model here too, but it depends on how freeform you want the tool to feel.

**Sub-steps once the design is settled:**
1. Free rotation for unconnected stitches (no reconciliation needed — safe to ship first)
2. Define the rotation behavior for connected stitches based on the decision above
3. Update connection-point hit detection to account for rotated stitches
4. Verify that save/load round-trips rotation correctly
5. Check that thumbnails render rotated stitches properly

**Things to watch for:**
- The rotation origin matters a lot. Rotating around the stitch's center vs. its connection point gives very different results
- Once stitches can rotate, the "tighter spacing" decision from step 2 may need a second look — the visual gap depends on orientation

---

## Deferred (next round)

- **Shell shortcut** (right-click on a stitch to fan five dc's into it using the existing fan mechanism). Revisit once the items above are done and the connection system feels stable.

## Suggested check-in points

- After step 2: visual-only changes are in, good moment to confirm the new look feels right before touching data model.
- After step 3: data model has shifted, worth verifying save/load and thumbnails still behave before building on top.
- Before step 5: pause to commit to a rotation model in writing, because that decision is hard to walk back once code exists.
