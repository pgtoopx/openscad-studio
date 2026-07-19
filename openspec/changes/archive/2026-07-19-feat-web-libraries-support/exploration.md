## Exploration: Pre-packaged OPM project libraries on-demand in the Web version

### Current State
In `apps/ui/src/platform/webBridge.ts`, the `installProjectDependencies` method currently returns a hardcoded error: `Dependency management is only available in the desktop app.`. The `projectStore` (`apps/ui/src/stores/projectStore.ts`) allows files to be in-memory virtual files (by setting `isVirtual: true`), which is how the web version works. Currently, `projectStore` only supports adding files one-by-one (`addFile`), which could cause performance issues if we inject a large library like BOSL2 file-by-file (due to state updates and content version increments on each addition).

### Affected Areas
- `apps/ui/src/platform/webBridge.ts` — needs an implementation for `installProjectDependencies` using Web fetching.
- `apps/ui/src/stores/projectStore.ts` & `apps/ui/src/stores/projectTypes.ts` — requires a new batch file addition method (e.g., `addFiles`) to efficiently load hundreds of library files in a single state update.
- `apps/web/public/` — new location to host the static libraries (e.g., `libraries/catalog.json` and `libraries/BOSL2.zip`). These assets will be served without CORS issues because they share the same origin as the Web app.
- Tests — Unit tests for `projectStore` will need an update to cover the new `addFiles` action. Playwright tests may require mocks for the network requests fetching the library ZIPs to avoid flake.

### Approaches
1. **Pre-bundle all libraries in the Web Build**
   - Pros: Simple implementation; no runtime fetching or extraction required.
   - Cons: Hugely inflates the initial payload size (BOSL2 is very large). Unacceptable for performance.
   - Effort: Low

2. **On-demand fetching of individual files**
   - Pros: Downloads only what is strictly used.
   - Cons: High latency overhead since `#include <BOSL2/std.scad>` recursively includes dozens of other files, resulting in a waterfall of HTTP requests. Very complex resolution logic.
   - Effort: High

3. **On-demand fetching of Pre-packaged ZIPs**
   - Pros: Single HTTP request per library, fast bulk extraction via `fflate`, minimal initial page weight, exact match for the concept of installing a dependency.
   - Cons: Requires managing zip assets and a catalog.
   - Effort: Medium

### Recommendation
Proceed with Approach 3 (**On-demand fetching of Pre-packaged ZIPs**).

**Design details:** 
We will place a `catalog.json` and `.zip` files in `apps/web/public/libraries/`. When a library is requested, `webBridge` will:
1. Fetch `/libraries/catalog.json` (or use a predefined list) to verify the library.
2. Fetch `/libraries/${name}.zip` as an ArrayBuffer.
3. Decode it using `fflate.unzipSync`.
4. Filter out directories, use `TextDecoder` to convert the `Uint8Array` files to strings.
5. Dispatch them to a new `addFiles` method in `projectStore` under the `openscad_modules/${name}/` path as virtual files.

**Catalog Structure:**
```json
{
  "libraries": {
    "BOSL2": { "version": "1.0.0", "url": "/libraries/BOSL2.zip" },
    "MCAD": { "version": "1.0.0", "url": "/libraries/MCAD.zip" }
  }
}
```

**Update Procedures:**
To update or add a library, the developer drops the new `.zip` in `apps/web/public/libraries/` and updates `catalog.json`. The CI could eventually automate this from OPM, but manual static zips are perfect for the initial iteration.

### Risks
- **Main Thread Blocking:** `fflate` decompression of large libraries (like BOSL2) or bulk text decoding on the main thread might cause a brief UI freeze. If profiling shows this is noticeable, extraction should be moved to a Web Worker (though `unzipSync` is usually extremely fast).
- **Memory Consumption:** Loading many large libraries simultaneously into memory (virtual FS) could risk OOM on very low-end mobile devices.

### Ready for Proposal
Yes — the orchestrator can proceed to write the implementation proposal based on Approach 3.
