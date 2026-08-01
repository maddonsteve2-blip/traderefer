import { permanentRedirect } from "next/navigation";

// Legacy hand-built landing page (pre /local tree), orphaned from all
// navigation — 308 into the dynamic directory (audit 2026-06-12 PM, item 6).
export default function LegacyAsbestosRemovalBendigo() {
    permanentRedirect("/local/vic/bendigo");
}
