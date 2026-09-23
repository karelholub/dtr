# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## DERTOUR lifecycle demo (approved 2026-09-23)

- Audience: CRM and marketing leadership. Customer copy is German; presenter explanations are English.
- Website + email previews only. Never launch real sends or ad exports as part of this demo.
- Use live Meiro decisions for customer-facing personalization. Label local rule previews explicitly and keep the public website generic until the current run/revision is returned.
- Keep synthetic outcomes and illustrative ROI separate. Native Meiro dashboards use the DTR namespace and must not include the older travel demo.
- Preserve the DERTOUR logo, red/cream palette and existing typography. React owns personalized content; SDK DOM injection must use separate empty slots.
- Native Meiro popup and inline examples are required alongside website-rendered lifecycle cards. Meiro owns their HTML, conditions, caps and triggers. Keep SDK-owned nodes inside empty anchors, reinitialize on route/consent changes, and do not duplicate native interaction events.
- Adjacent homepage banners must have distinct visual hierarchy. Keep the native in-page banner compact and image-free to avoid repeating the lifecycle card’s hotel photograph and large split layout.
