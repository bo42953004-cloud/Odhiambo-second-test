---
name: Block library custom block registration
description: How custom Blockly blocks uploaded by admin are registered at runtime
---

Custom block JS code is stored in settings.customBlocks[].code (persisted server-side via admin-settings.json). On mount, AdminPortalProvider runs a useEffect that polls window.Blockly?.Blocks every 500ms until Blockly is initialized, then evaluates each block's code via new Function(code)(). This ensures blocks are registered before any bot XML is loaded.

**Why:** Blockly initializes asynchronously during bot-builder mount; a simple one-shot effect would miss the window.

**How to apply:** When adding other Blockly initialization hooks, use the same polling pattern to wait for window.Blockly?.Blocks to be truthy.
