# Bug Report: Caret Jumps to Line 1 After Pressing Enter in `#contenido-etiqueta`

**File:** `index.js`
**Element:** `#contenido-etiqueta` (`contenteditable="plaintext-only"`)
**Date:** 2026-05-11

---

## Summary

When typing in the `#contenido-etiqueta` field, pressing **Enter** and then typing on the new line causes the typed character(s) to appear at the **end of line 1** instead of on line 2. The caret visually jumps back to the previous line on the first keystroke after Enter.

---

## Steps to Reproduce

1. Click inside the `#contenido-etiqueta` editor.
2. Type any text (e.g. `Testing text`).
3. Press **Enter** to move to a new line.
4. Start typing — the character appears appended to line 1, not line 2.

---

## Root Cause

The bug is caused by an interaction between two event handlers in `initContentEditable()`:

### 1. The `keydown` handler (Enter key)

When Enter is pressed, the handler rewrites the entire field content via `textContent`:

```js
field.textContent = old.slice(0, startOff) + "\n" + old.slice(endOff);
```

Setting `textContent` on a `contenteditable` element **destroys and replaces** the existing text node with a brand-new one. The handler then manually places the caret after the inserted `\n` and dispatches an `input` event.

### 2. The `input` event sanitizer

The sanitizer checks whether any non-text nodes have crept into the field:

```js
field.addEventListener("input", () => {
    const hasNonText = [...field.childNodes].some(n => n.nodeType !== Node.TEXT_NODE);
    if (!hasNonText) return;
    // ... sentinel / flattening logic ...
});
```

After the Enter rewrite the field is clean, so the sanitizer exits early — **this is fine**.

### 3. The first keystroke after Enter — where it breaks

When the user types the first character on line 2, some versions of Chrome/Safari momentarily wrap the new character in a `<span>` or insert a second text node before normalizing it. **This transient state makes `hasNonText = true`**, so the sanitizer runs:

1. It inserts a sentinel character (`\uE000`) at the current caret position using `range.insertNode`.
2. It reads `field.innerText` to get the flattened text.
3. It calls `flat.indexOf('\uE000')` to find the caret offset.

**The sentinel lands in the wrong position.** Because the field's content at that moment is `"Testing text\n"` and the caret is nominally at the start of line 2 (offset 13 in the string), but the sentinel insertion into the transient DOM places the marker *before* the `\n` in the flattened `innerText` string — returning an offset that points to the **end of line 1**.

4. `field.textContent` is rewritten with the flattened text and the caret is restored to that wrong offset — i.e. **the end of line 1**.

From that point forward, every keystroke appends to line 1 until the user manually clicks on line 2.

---

## Fix Options

### Option A — Suppress the sanitizer after Enter *(simplest)*

Add a one-shot flag that prevents the sanitizer from running on the `input` event that immediately follows an Enter keypress. This is safe because the `keydown` handler already guarantees the field is a clean single text node after it runs.

```js
// At the top of initContentEditable():
let skipNextSanitize = false;

// Inside the keydown handler, after the textContent rewrite:
field.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    // ... existing newline insertion logic (unchanged) ...

    skipNextSanitize = true; // ← ADD THIS before dispatching 'input'
    field.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }
});

// At the top of the input listener:
field.addEventListener("input", () => {
  if (skipNextSanitize) { skipNextSanitize = false; return; } // ← ADD THIS

  const hasNonText = [...field.childNodes].some(n => n.nodeType !== Node.TEXT_NODE);
  if (!hasNonText) return;
  // ... rest of sanitizer unchanged ...
});
```

**Pros:** Minimal change, easy to review.
**Cons:** Leaves the underlying `textContent` rewrite approach in place.

---

### Option B — Use `execCommand("insertText")` for Enter *(recommended)*

Instead of rewriting `textContent` manually, use the same `insertText` command that the paste handler already uses. This keeps the existing text node intact, never triggers the "non-text node" branch of the sanitizer, and fires the native `input` event automatically.

```js
field.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    document.execCommand("insertText", false, "\n");
    // execCommand fires 'input' natively — no manual dispatch needed.
    // The entire textContent-rewrite block can be removed.
  }
});
```

Because the field already has `contenteditable="plaintext-only"`, the browser guarantees the inserted `\n` stays as a literal newline in a single text node — no block elements, no `<div>` wrapping.

This also makes the complex block-element flattening code inside the `keydown` handler (the sentinel + `innerText` loop) **entirely unnecessary** and can be removed, simplifying the function significantly.

**Pros:** Eliminates the root cause entirely, simplifies the code, consistent with the paste handler pattern already in use.
**Cons:** `execCommand` is deprecated (but still universally supported in all browsers; no replacement API exists yet for this use case).

---

## Recommendation

**Use Option B.** It removes the root cause rather than papering over it, reduces code complexity, and aligns the Enter handler with the paste handler which already works correctly.

If you prefer to keep the `textContent` rewrite for other reasons (e.g. explicit control over undo history), apply **Option A** as a safe interim fix while refactoring.

---

## Affected Code Location

| Location | Description |
|---|---|
| `initContentEditable()` → `keydown` listener | Rewrites `textContent` on Enter, creating a new text node |
| `initContentEditable()` → `input` listener | Sanitizer runs on next keystroke, sentinel mislanded, caret reset to line 1 |

---

*Report generated by automated browser inspection — Mi Prompt-itud · 2026-05-11*
