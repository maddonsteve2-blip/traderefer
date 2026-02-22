# Implementation Plan - UI Refactor & Sidebar Removal

## Status: IN_PROGRESS 🚀 (Updated: 12:48 AM)
*Last updated: 2026-02-21*

### 1. Sidebar Removal 🛠️
- [ ] Locate the sidebar component or layout logic.
- [ ] Revert `apps/web/app/layout.tsx` to a simple top-nav structure.
- [ ] Ensure `Navbar` handles dashboard navigation correctly.

### 2. shadcn/ui Refactor (Incremental) 🎨
- [ ] Identify core components to swap (Buttons, Inputs, Cards).
- [ ] Create/Update custom themes to preserve "TradeRefer" branding.
- [ ] Refactor Dashboard pages using a "Hybrid Approach".

### 3. Server Management 🖥️
- [x] Restart `pnpm dev` using `python -m uvicorn` for Windows compatibility.
- [x] Verify API and Frontend are running on ports 8000 and 3000.

---
*Note: Making a small edit here to highlight this file for the user.*
