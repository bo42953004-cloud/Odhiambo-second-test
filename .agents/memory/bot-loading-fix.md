---
name: Bot loading unknown blocks fix
description: How bots with unknown block types are handled during XML load
---

Original code in src/external/bot-skeleton/scratch/utils/index.js (around line 200) hard-rejected any XML containing block types not in window.Blockly.Blocks. Changed to: filter unknown blocks, remove them from the DOM, warn in the log, continue loading remaining valid blocks. Only fails now if ALL blocks are unknown.

**Why:** Bots built on third-party platforms (the-empiretrader.site etc.) often contain custom blocks not registered in this DBot fork, making every external bot un-loadable.

**How to apply:** When adding new bot sources, check console for "[DBot] Unknown block types" warnings to know which block types would need to be added to support the bot fully.
