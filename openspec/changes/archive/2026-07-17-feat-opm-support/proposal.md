<Proposal: feat-opm-support>
## Intent

Add support for the OpenSCAD Package Manager (OPM) to OpenSCAD Studio, enabling developers to easily define, detect, and install dependencies for their projects directly from the UI.

## Scope

### In Scope
- Detect `scad.json` in project root.
- Parse and validate manifest in TypeScript (`opmManifest.ts`).
- Add `DependencyManagerStatus` and `DependencyInstallResult` types to `platform/types.ts`.
- Add `getDependencyManagerStatus` and `installProjectDependencies` methods to `PlatformBridge`.
- Implement Tauri command wrappers in `tauriBridge.ts` and web bridge stubs (graceful degradation message) in `webBridge.ts`.
- Implement Rust commands in `apps/ui/src-tauri/src/cmd/opm.rs` with safe execution (no command chaining or shell parsing, canonicalized path, etc.).
- Add OPM settings in `settingsStore.ts` (custom path config).
- UI component `ProjectDependenciesPanel.tsx` located under Settings > Project > Dependencies.
- Clear render cache and re-trigger rendering after dependency installation.
- Handle `openscad_modules` in file tree / watcher (ignore it by default but allow resolving files).

### Out of Scope
- Package explorer, catalog, editing `scad.json` UI.
- Auto-installing dependencies.
- Custom git download logic (relying purely on OPM).
- Bundling OPM binary with OpenSCAD Studio.

## Capabilities

### New Capabilities
- `opm-dependencies`: Support detecting and installing project dependencies via OPM in the desktop application.

### Modified Capabilities
- None

## Approach

Introduce an integration with the external OpenSCAD Package Manager (`opm`) CLI tool. The frontend will detect a `scad.json` file and parse it. A new `ProjectDependenciesPanel` in settings will display the status of `opm` and the project's dependencies, offering a button to install them. This triggers a Tauri command that securely runs the `opm install` process in the project root. We will configure a custom path for the OPM binary in user settings, and ensure the `openscad_modules` directory is handled gracefully by the internal file watcher and render cache.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/core/src/opmManifest.ts` | New | Type definitions and parsing for `scad.json` |
| `packages/core/src/platform/types.ts` | Modified | Add `DependencyManagerStatus` and `DependencyInstallResult` |
| `packages/core/src/platform/PlatformBridge.ts` | Modified | Add dependency manager methods |
| `packages/core/src/platform/tauriBridge.ts` | Modified | Implement Tauri wrappers |
| `packages/core/src/platform/webBridge.ts` | Modified | Implement web stubs |
| `packages/core/src/settingsStore.ts` | Modified | Add custom OPM path setting |
| `apps/ui/src-tauri/src/cmd/opm.rs` | New | Safe Rust commands to execute OPM |
| `apps/ui/src/components/Settings/ProjectDependenciesPanel.tsx` | New | UI for viewing and installing dependencies |
| `apps/ui/src/fileWatcher` | Modified | Ignore `openscad_modules` by default |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| OPM binary not found or outdated | Medium | Display clear UI feedback and fallback stubs in web version; allow custom path. |
| Command execution vulnerabilities | Low | Use strict path canonicalization and safe execution arguments in Tauri/Rust (no shell parsing). |
| Render cache staleness after install | Medium | Explicitly invalidate render cache when installation completes. |

## Rollback Plan

Revert the commits introducing `cmd/opm.rs`, `ProjectDependenciesPanel.tsx`, and the changes to `PlatformBridge` and `tauriBridge`. Remove the `openscad_modules` ignore rules from the file watcher.

## Dependencies

- External OpenSCAD Package Manager (`opm`) installed on the host system.

## Success Criteria

- [ ] Desktop application correctly detects `scad.json` when opening a project.
- [ ] Users can trigger `opm install` from the Project Settings panel.
- [ ] The command executes safely in the background.
- [ ] After successful installation, rendering updates automatically with the new dependencies.
</Proposal: feat-opm-support>
