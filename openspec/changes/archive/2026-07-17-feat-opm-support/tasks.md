## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Not needed |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

## Phase 1: Foundation

- [x] 1.1 Create `packages/shared/src/opmManifest.ts` with Zod schema and types for parsing `scad.json`.
- [x] 1.2 Update `apps/ui/src/platform/types.ts` to add `DependencyManagerStatus`, `DependencyInstallResult`, and new `PlatformBridge` methods.
- [x] 1.3 Update `apps/ui/src/platform/tauriBridge.ts` with method signatures for OPM commands.
- [x] 1.4 Update `apps/ui/src/platform/webBridge.ts` with stub OPM methods returning an unavailable status.
- [x] 1.5 Update `apps/ui/src/stores/settingsStore.ts` to add `opmCustomPath` to `ProjectSettings`.

## Phase 2: Rust Commands Backend

- [x] 2.1 Create `apps/ui/src-tauri/src/cmd/opm.rs` with safe `std::process::Command` implementation for `get_dependency_manager_status` and `install_project_dependencies`.
- [x] 2.2 Update `apps/ui/src-tauri/src/lib.rs` to register the new `opm` Tauri commands.

## Phase 3: Frontend UI and Integration

- [x] 3.1 Create `apps/ui/src/components/Settings/ProjectDependenciesPanel.tsx` for the dependencies UI.
- [x] 3.2 Integrate `ProjectDependenciesPanel` into the existing settings side-panel.
- [x] 3.3 Update `apps/ui/src/platform/tauriBridge.ts` file watcher to ignore the `openscad_modules` directory.
- [x] 3.4 Wire up render cache invalidation and UI refresh hooks in the dependency installation flow.

## Phase 4: Verification / Testing

- [x] 4.1 Write unit tests for `opmManifest.ts` verifying valid and invalid `scad.json` parsing.
- [x] 4.2 Write E2E / Playwright test stubs verifying the UI flow and Web fallback works.
- [x] 4.3 Add manual validation scenarios for verifying actual OPM installations.
