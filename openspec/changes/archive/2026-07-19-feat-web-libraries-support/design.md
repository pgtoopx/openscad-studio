## Technical Approach

To support OpenSCAD libraries in the web version without relying on the desktop OpenSCAD Package Manager (OPM) and filesystem, we will implement a static file fetching mechanism in the `WebBridge`. The web client will fetch a catalog and zipped library archives served statically, unzip them in memory, and commit the extracted source files to the virtual project store in a single batch operation. This ensures libraries are available for WASM rendering seamlessly.

## Architecture Decisions

### Decision: Batch File Addition in Store

**Choice**: Add `addFiles(files: Record<string, string>, options?: { isVirtual?: boolean })` to `projectStore.ts`.
**Alternatives considered**: Calling `addFile` repeatedly in a loop.
**Rationale**: Repeatedly calling `addFile` would trigger multiple React re-renders and `contentVersion` bumps, which is computationally expensive and causes unnecessary WASM FS syncs/renders. A batch method guarantees a single state update.

### Decision: Zip Archive vs Individual Files for Libraries

**Choice**: Serve libraries as `.zip` files (e.g., `/libraries/BOSL2.zip`) and unzip them in-browser using `fflate`.
**Alternatives considered**: Fetching each `.scad` file individually, or a large monolithic JSON of all libraries.
**Rationale**: Libraries like BOSL2 contain hundreds of files. Fetching them individually would cause massive network overhead and HTTP connection limits. A single zip minimizes requests and `fflate` handles decompression very efficiently in the browser.

### Decision: Static Asset Directory for Libraries

**Choice**: Place library zips and `catalog.json` in `apps/ui/public/libraries/`.
**Alternatives considered**: A dedicated backend server or an external CDN.
**Rationale**: Using Vite's `public/` directory allows the files to be served at the root (`/libraries/...`) during both dev and production, keeping the deployment purely static and architecture simple.

## Data Flow

    WebBridge (installProjectDependencies)
         │
         ├── 1. Read 'openscad.json' from ProjectStore
         │
         ├── 2. Fetch '/libraries/catalog.json'
         │
         ├── 3. For each dependency, Fetch '/libraries/<name>.zip'
         │
         ├── 4. Unzip via fflate & TextDecode `.scad`/`.h` files
         │
         └── 5. projectStore.addFiles(extractedFiles)
                   │
                   └── Updates State & bumps contentVersion
                           │
                           └── RenderService syncs new files to WASM FS & Renders

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/ui/src/stores/projectStore.ts` | Modify | Add `addFiles` method and its implementation to update files and emptyFolders in batch. |
| `apps/ui/src/stores/projectTypes.ts` | Modify | Add signature for `addFiles` to `ProjectStore` interface. |
| `apps/ui/src/platform/webBridge.ts` | Modify | Implement `installProjectDependencies` to fetch, unzip (via `fflate`), filter, and load libraries into the store. |
| `apps/ui/public/libraries/catalog.json` | Create | New directory and JSON catalog for available web libraries. |

## Interfaces / Contracts

**`projectTypes.ts`**:
```typescript
export interface ProjectStore {
  // ...
  addFiles: (
    files: Record<string, string>,
    options?: { isVirtual?: boolean; isDirty?: boolean }
  ) => void;
}
```

**`webBridge.ts`**:
```typescript
import * as fflate from 'fflate';

// Internal structure during unzip
type ExtractedFiles = Record<string, string>;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `projectStore.addFiles` | Ensure multiple files are added, `contentVersion` bumps exactly once, and existing files are skipped. |
| E2E | Library Installation Flow | Mock network requests to `/libraries/catalog.json` and a dummy `.zip`. Add `openscad.json` to the virtual project, trigger installation, and verify the store contains the new files and re-rendering succeeds. |

## Migration / Rollout

No migration required. The `public/libraries` directory will simply be populated with supported libraries over time.

## Open Questions

- None
