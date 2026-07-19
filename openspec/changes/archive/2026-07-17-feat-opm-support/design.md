</Agent System Instructions>
<Design: feat-opm-support>
## Technical Approach

We will extend `PlatformBridge` to include dependency management methods (`getDependencyManagerStatus` and `installProjectDependencies`). The backend implementation in Tauri will use safe `std::process::Command` patterns to invoke the OpenSCAD Package Manager (`opm`), ensuring paths are canonicalized and execution is secure. On the frontend, a new `ProjectDependenciesPanel` in the settings will parse `scad.json`, display dependency status (checking against `openscad_modules/` existence), and allow users to trigger installation. The file watcher will be configured to ignore the `openscad_modules` directory to avoid thrashing, while `renderService` will clear its cache and trigger a preview update when dependencies are installed.

## Architecture Decisions

### Decision: Tauri Command Security for OPM Execution

**Choice**: Use safe `std::process::Command` to invoke `opm install`, with explicit arguments and working directory set to the canonicalized project root.
**Alternatives considered**: Using a shell command wrapper or a bash script.
**Rationale**: Shell parsing is vulnerable to injection attacks if project paths contain malicious characters. Directly executing the binary with explicit arguments is safer and cross-platform.

### Decision: File Watcher Ignore Strategy

**Choice**: Hardcode an ignore rule for `/openscad_modules/` in `tauriBridge.ts`'s `watchDirectory`.
**Alternatives considered**: Allowing `openscad_modules` to be watched or dynamically reading `.gitignore`.
**Rationale**: `openscad_modules` can contain thousands of files. Watching it would cause severe performance issues and unnecessary re-renders. The renderer will naturally resolve these files on demand.

### Decision: Web Fallback Strategy

**Choice**: Return a disabled status from `webBridge.ts` for dependency manager methods, showing a graceful degradation UI.
**Alternatives considered**: Implementing an in-browser package downloader using WASM or fetch.
**Rationale**: Out of scope for this change. The web version does not have a native filesystem to support `opm install` workflows easily.

## Data Flow

    UI (ProjectDependenciesPanel) ──→ PlatformBridge ──→ Tauri (cmd/opm.rs)
         │                                                      │
         └──────── (Updates State) ◄───── (Returns Result) ─────┘
         │
         └──────── renderService.clearCache() ──→ Trigger Re-render

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/shared/src/opmManifest.ts` | Create | Zod schema and types for parsing `scad.json` manifest. |
| `apps/ui/src/platform/types.ts` | Modify | Add `DependencyManagerStatus`, `DependencyInstallResult` and new methods to `PlatformBridge`. |
| `apps/ui/src/platform/tauriBridge.ts` | Modify | Implement OPM methods invoking Tauri commands; ignore `openscad_modules` in watcher. |
| `apps/ui/src/platform/webBridge.ts` | Modify | Implement stub OPM methods returning unavailable status. |
| `apps/ui/src/stores/settingsStore.ts` | Modify | Add `opmCustomPath?: string` to `ProjectSettings`. |
| `apps/ui/src-tauri/src/cmd/opm.rs` | Create | Safe Rust command execution for `opm --version` and `opm install`. |
| `apps/ui/src-tauri/src/lib.rs` | Modify | Register `opm` Tauri commands. |
| `apps/ui/src/components/Settings/ProjectDependenciesPanel.tsx` | Create | UI panel for dependency status and installation. |

## Interfaces / Contracts

```typescript
// PlatformBridge additions
export interface DependencyManagerStatus {
  isAvailable: boolean;
  version?: string;
  error?: string;
}

export interface DependencyInstallResult {
  success: boolean;
  output: string;
  error?: string;
}

getDependencyManagerStatus(customPath?: string): Promise<DependencyManagerStatus>;
installProjectDependencies(projectRoot: string, customPath?: string): Promise<DependencyInstallResult>;
```

```rust
// Tauri Command (cmd/opm.rs)
#[tauri::command]
pub async fn get_dependency_manager_status(custom_path: Option<String>) -> Result<DependencyManagerStatus, String>;

#[tauri::command]
pub async fn install_project_dependencies(project_root: String, custom_path: Option<String>) -> Result<DependencyInstallResult, String>;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `opmManifest.ts` | Test parsing valid and invalid `scad.json` structures. |
| Integration | Tauri Commands | Use `cargo test` to mock or simulate `opm` execution and verify path canonicalization. |
| E2E | UI Flow | Use playwright to verify that opening a project with `scad.json` renders the dependencies panel, and that Web fallback works. |

## Migration / Rollout

No migration required. The feature defaults to checking the system `PATH` for `opm`.

## Open Questions

- None
</Design: feat-opm-support>
