## Intent

Enable support for external library dependencies (like BOSL2) in the web browser environment by resolving and extracting pre-packaged ZIP libraries into the virtual filesystem. This ensures web users can open projects with dependencies without requiring a native file system or a full web-based Git client.

## Scope

### In Scope
- Create a batch file insertion method `addFiles(files: Record<string, string>, options?: { isVirtual?: boolean })` in `apps/ui/src/stores/projectStore.ts` and `projectTypes.ts` to avoid state update performance bottlenecks.
- Implement `installProjectDependencies(projectRoot: string, customPath?: string)` in `apps/ui/src/platform/webBridge.ts` to parse `scad.json` dependencies, map them to a local libraries catalog, fetch the static ZIP files from the `/libraries/` folder, unzip in memory using `fflate`, and batch-write them to the virtual filesystem.
- Set up a static libraries folder under the public assets directory containing a minimal `catalog.json` and zipped packages (like `BOSL2.zip` or a dummy zip for testing).
- Update unit tests in `apps/ui/src/stores/__tests__/projectStore.test.ts` to test the new batch `addFiles` action.

### Out of Scope
- General Git client in WebAssembly, dynamic GitHub API downloads, custom Git URL support in the browser.

## Capabilities

> This section is the CONTRACT between proposal and specs phases.
> The sdd-spec agent reads this to know exactly which spec files to create or update.

### New Capabilities
- `web-opm-dependencies`: Support pre-packaged library resolution and in-memory extraction for web projects.

### Modified Capabilities
- None

## Approach

Use pre-packaged `.zip` files hosted in a static `/libraries/` public folder, mapped via a `catalog.json`. When a web project requires dependencies (via `scad.json`), `installProjectDependencies` will fetch the corresponding ZIP, extract it in-memory using `fflate`, and inject the files into the virtual filesystem using a newly implemented, performant `addFiles` batch method.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/ui/src/stores/projectStore.ts` | Modified | Add `addFiles` batch insertion method |
| `apps/ui/src/stores/projectTypes.ts` | Modified | Add type definition for `addFiles` |
| `apps/ui/src/platform/webBridge.ts` | Modified | Implement `installProjectDependencies` to fetch and extract ZIP libraries |
| `public/libraries/` | New | Static directory for `catalog.json` and library ZIPs |
| `apps/ui/src/stores/__tests__/projectStore.test.ts` | Modified | Add unit tests for batch insertion |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Memory exhaustion from large ZIP extraction | Med | Use `fflate` for efficient processing and limit library sizes in catalog. |
| Performance hit from multiple file insertions | High | Mitigated by implementing a batch `addFiles` method to avoid repeated state updates. |
| Incomplete dependencies in `catalog.json` | Low | Maintain catalog carefully or allow fallback/error messages when library is missing. |

## Rollback Plan

Revert the changes to `projectStore.ts`, `projectTypes.ts`, and `webBridge.ts`. Remove the newly added `addFiles` API usages. Delete the `public/libraries/` directory.

## Dependencies

- `fflate`: Required for efficient in-memory ZIP extraction.

## Success Criteria

- [ ] A project specifying a dependency in `scad.json` correctly loads its required library files into the virtual filesystem in the web environment.
- [ ] The batch file insertion method allows adding multiple files simultaneously without significant UI freezing.
- [ ] Tests for `addFiles` in `projectStore.test.ts` pass successfully.
