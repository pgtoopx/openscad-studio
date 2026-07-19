# Apply Progress: feat-opm-support

## Mode
Strict TDD

## TDD Cycle Evidence
| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `opmManifest.test.ts` | Unit | N/A (new) | ✅ Written | ✅ Passed | ✅ 3 cases | ➖ None needed |
| 1.2 | `platform/types.ts` | Unit | N/A | ✅ Written | ✅ Passed | ➖ Single | ➖ None needed |
| 4.2 | `opm-settings.spec.ts` | E2E | N/A (new) | ✅ Written | ✅ Passed | ➖ Single | ➖ None needed |

## Completed Tasks
- [x] 1.1 Create `packages/shared/src/opmManifest.ts` with Zod schema and types for parsing `scad.json`.
- [x] 1.2 Update `apps/ui/src/platform/types.ts` to add `DependencyManagerStatus`, `DependencyInstallResult`, and new `PlatformBridge` methods.
- [x] 1.3 Update `apps/ui/src/platform/tauriBridge.ts` with method signatures for OPM commands.
- [x] 1.4 Update `apps/ui/src/platform/webBridge.ts` with stub OPM methods returning an unavailable status.
- [x] 1.5 Update `apps/ui/src/stores/settingsStore.ts` to add `opmCustomPath` to `ProjectSettings`.
- [x] 2.1 Create `apps/ui/src-tauri/src/cmd/opm.rs` with safe `std::process::Command` implementation for `get_dependency_manager_status` and `install_project_dependencies`.
- [x] 2.2 Update `apps/ui/src-tauri/src/lib.rs` to register the new `opm` Tauri commands.
- [x] 3.1 Create `apps/ui/src/components/Settings/ProjectDependenciesPanel.tsx` for the dependencies UI.
- [x] 3.2 Integrate `ProjectDependenciesPanel` into the existing settings side-panel.
- [x] 3.3 Update `apps/ui/src/platform/tauriBridge.ts` file watcher to ignore the `openscad_modules` directory.
- [x] 3.4 Wire up render cache invalidation and UI refresh hooks in the dependency installation flow.
- [x] 4.1 Write unit tests for `opmManifest.ts` verifying valid and invalid `scad.json` parsing.
- [x] 4.2 Write E2E / Playwright test stubs verifying the UI flow and Web fallback works.
- [x] 4.3 Add manual validation scenarios for verifying actual OPM installations.

## Files Changed
| File | Action | What Was Done |
|------|--------|---------------|
| `packages/shared/src/opmManifest.ts` | Created | Added `opmManifestSchema` and types. |
| `packages/shared/src/index.ts` | Modified | Exported `opmManifest`. |
| `apps/ui/src/platform/types.ts` | Modified | Added `DependencyManagerStatus`, `DependencyInstallResult`, `getDependencyManagerStatus`, `installProjectDependencies`. |
| `apps/ui/src/platform/index.ts` | Modified | Stub implementations for BootstrapBridge. |
| `apps/ui/src/platform/tauriBridge.ts` | Modified | Implemented Tauri methods and ignored `openscad_modules` in file watcher. |
| `apps/ui/src/platform/webBridge.ts` | Modified | Web fallback stubs. |
| `apps/ui/src/stores/settingsStore.ts` | Modified | Added `opmCustomPath`. |
| `apps/ui/src-tauri/src/cmd/opm.rs` | Created | Implemented safe process execution for opm binary. |
| `apps/ui/src-tauri/src/cmd/mod.rs` | Modified | Registered opm module. |
| `apps/ui/src-tauri/src/lib.rs` | Modified | Registered tauri commands. |
| `apps/ui/src/components/settings/ProjectDependenciesPanel.tsx` | Created | UI panel for tracking dependencies. |
| `apps/ui/src/components/settings/ProjectSettings.tsx` | Modified | Integrated `ProjectDependenciesPanel`. |
| `apps/ui/src/services/__tests__/opmManifest.test.ts` | Created | Added unit tests. |
| `e2e/tests/settings/opm-settings.spec.ts` | Created | Added E2E tests for Web UI fallback. |

## Deviations from Design
None — implementation matches design.

## Issues Found
None.

## Remaining Tasks
None.

## Workload / PR Boundary
- Mode: single PR
- Current work unit: N/A
- Boundary: all tasks complete
- Estimated review budget impact: within size-exception limits

## Status
14/14 tasks complete. Ready for verify.
