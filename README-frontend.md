# PixelForge Frontend

The PixelForge frontend is the user-facing interface for **PixelForge
--- The Shared Sanctum**, a collaborative infinite-canvas workspace for
visual brainstorming, note-taking, and team collaboration.

## Overview

This frontend provides the workspace shell and UI components used to
interact with the whiteboard. It includes canvas-related controls,
contextual styling tools, text formatting, sticky-note templates,
workspace panels, and collaboration-oriented interface elements.

> **Status:** This README documents the frontend code in the current
> project branch. Features that depend on the canvas engine, backend
> APIs, or real-time collaboration services should be verified in the
> integrated application before being described as fully operational.

## Features

-   **Workspace UI:** Main workspace layout, header, controls, panels,
    and modals.
-   **Canvas controls:** Canvas coordinate indicator and canvas mounting
    placeholder.
-   **Drawing and styling UI:** Toolbars and popovers for brushes,
    eraser, highlighter, shapes, fill, and stroke controls where
    supported by the integrated canvas adapter.
-   **Text formatting:** Text tool popover and formatting toolbar.
-   **Sticky-note templates:** Reusable visual sticky-note assets.
-   **Collaboration UI:** Live cursor overlay and collaboration-related
    interface components.
-   **Keyboard shortcuts:** React hook for supported keyboard
    interactions.
-   **API abstraction:** Board API service and adapter interfaces.
-   **Demo support:** Mock canvas/collaboration adapters and demo data
    for UI development.

## Technology Stack

-   **React**
-   **TypeScript**
-   **Vite**
-   **Tailwind CSS and CSS**
-   **Lucide React** for icons
-   **Fabric.js** for canvas integration
-   **Node.js / Express backend APIs** (integration dependency)

## Frontend Structure

``` text
src/
├── App.tsx
├── main.tsx
├── index.css
├── engine.css
├── adapters/
│   ├── mockCanvasAdapter.ts
│   └── mockCollabAdapter.ts
├── components/
│   ├── canvas/
│   ├── common/
│   ├── controls/
│   ├── entry/
│   ├── header/
│   ├── modals/
│   ├── presence/
│   └── toolbar/
├── context/
│   └── WorkspaceContext.tsx
├── engine/
│   ├── canvasCoordinates.ts
│   ├── chartRenderer.ts
│   ├── fabricCanvasAdapter.ts
│   ├── shapeDefinitions.ts
│   └── stickyNoteTemplates.ts
├── hooks/
│   └── useKeyboardShortcuts.ts
├── mocks/
│   └── demoData.ts
├── services/
│   └── boardApi.ts
└── types/
    ├── contracts.ts
    └── whiteboard.ts

public/
├── brand-mark.jpg
├── brand-mark.png
├── favicon.svg
└── sticky-notes/
```

The repository may contain additional files as branches are integrated.
Refer to the current branch for the exact structure.

## Prerequisites

-   Node.js (LTS recommended)
-   npm
-   Git

## Setup and Run

### 1. Install dependencies

From the frontend project root, run:

``` bash
npm install
```

### 2. Start the development server

When the frontend package configuration is available in the current
working directory:

``` bash
npm run dev
```

Vite prints a local development URL in the terminal, commonly
`http://localhost:5173`.

### 3. Build for production

``` bash
npm run build
```

### 4. Preview the production build

``` bash
npm run preview
```

> **Repository integration note:** In the current integration branch,
> the root `package.json` is backend-oriented and may not yet contain
> the frontend scripts and dependencies. If these commands are
> unavailable, run them from the frontend's own package directory or
> first consolidate the frontend dependencies/scripts with the backend
> package configuration. Preserve the backend scripts when doing so.

## Configuration and Backend Integration

The frontend's `services/boardApi.ts` and adapter contracts provide
integration points for board operations and collaboration behavior. The
exact API base URL and environment variable names depend on the current
implementation.

Before connecting to a deployed backend:

1.  Confirm the API routes and request/response shapes.
2.  Configure the frontend API endpoint using the mechanism implemented
    in the current branch.
3.  Confirm CORS settings on the backend.
4.  Verify WebSocket connectivity if real-time collaboration is enabled.
5.  Test the application using at least two separate browser sessions.

Do not add private keys, database passwords, or other secrets to
frontend source code. Values bundled into a browser application should
be treated as public.

## Validation

The frontend branch was previously checked with:

``` bash
npx tsc --noEmit
npm run build
```

The Vite production build completed, with a warning about a large bundle
chunk. Re-run these checks after integration and dependency changes. A
successful frontend-only build does not by itself verify the backend or
end-to-end collaboration.

## Known Limitations

-   The integrated root package configuration may need frontend
    dependencies and scripts added.
-   Mock adapters may simulate canvas or collaboration behavior when
    live services are not connected.
-   Backend persistence, multi-user synchronization, offline recovery,
    and other service-dependent features require end-to-end validation.
-   Production deployment configuration should be verified against the
    actual hosting environment.

## Development Guidelines

-   Keep UI components focused and reusable.
-   Use the shared TypeScript contracts when coordinating with the
    canvas-engine and backend contributors.
-   Keep canvas-engine implementation separate from UI-shell changes
    where practical.
-   Review changes to shared files before merging branches.
-   Run TypeScript checks and a production build after integration.
-   Avoid committing generated output, local environment files, or
    secrets.

## Contributors

-   **Frontend / UI:** Project team

Update this section with the final contributor name(s) and profile links
if required by the submission.

## License

Refer to the repository's `LICENSE` file, if present, for the applicable
license terms.
