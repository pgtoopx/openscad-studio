## Exploration: OPM project dependency integration

### Current State
OpenSCAD Studio currently supports building OpenSCAD code and managing files in a workspace, but it does not natively understand or fetch external OpenSCAD packages. The platform bridges (Tauri and Web) don't include methods for executing the `opm` CLI tool. Dependencies are not shown in the UI, and the render cache (`renderService.ts` and `nativeRenderService.ts`) is unaware of when `openscad_modules` changes.

### Affected Areas
- `apps/ui/src/services/opmManifest.ts` (new) — To parse and validate the `scad.json` manifest.
- `apps/ui/src/platform/types.ts` — To define multiplatform contracts (`checkOpmStatus`, `runOpmInstall`).
- `apps/ui/src/platform/tauriBridge.ts` — To implement Tauri-specific handlers calling Rust commands.
- `apps/ui/src/platform/webBridge.ts` — To implement web stubs (since OPM CLI cannot run in a browser).
- `apps/ui/src-tauri/src/cmd/opm.rs` (new) — To add Rust commands executing the `opm` binary (`check_opm_status`, `run_opm_install`).
- `apps/ui/src-tauri/src/cmd/mod.rs` — To export and register the new `opm` commands with Tauri.
- `apps/ui/src/components/dependencies/ProjectDependenciesPanel.tsx` (new) — A UI component to display OPM dependencies and trigger installs.
- `apps/ui/src/components/panels/PanelComponents.tsx` — To register the new dependencies panel in the side panel system.
- `apps/ui/src/stores/settingsStore.ts` — To manage settings for OPM, like automatic install toggles or binary path (if needed).
- `apps/ui/src/services/renderService.ts` / `nativeRenderService.ts` — Requires calls to `clearCache()` and forcing a re-render when dependencies are installed.

### Approaches

1. **Integrated OPM Binary Execution via Tauri**
   - **Description**: Add Rust Tauri commands to invoke `opm` CLI. The UI detects `scad.json`, parses it, and shows a Dependencies panel. Users can click to install, triggering the Tauri command. Upon success, `clearCache()` is called and the active file is re-rendered.
   - **Pros**:
     - Keeps the implementation encapsulated.
     - Direct execution of standard tools.
     - Easy integration with the existing render service architecture.
   - **Cons**:
     - Only works on Desktop (Tauri).
     - Relies on `opm` being installed and accessible in the system path (or bundled).
   - **Effort**: Medium

2. **Full Node.js/WASM Port of OPM**
   - **Description**: Rewrite or compile OPM to WASM so it runs natively inside the web browser bridge as well as Tauri.
   - **Pros**:
     - Works across Web and Desktop bridges natively.
   - **Cons**:
     - Extreme complexity in porting network requests and filesystem logic of a package manager to WASM.
   - **Effort**: High

### Recommendation
**Approach 1 (Integrated OPM Binary Execution via Tauri)** is highly recommended. OPM relies on system filesystem access and standard dependency management patterns that fit perfectly within the Tauri Desktop model. The Web version can gracefully degrade by providing a message that dependency installation is only available in the desktop app, or by ignoring `scad.json`.

### Risks
- **Path Issues**: The `opm` binary might not be in the system PATH when launched via Tauri (especially on macOS UI launches). We might need to look it up or provide a setting for the custom path.
- **Dependency Paths**: OpenSCAD might need `OPENSCADPATH` updated to correctly point to `openscad_modules` if it doesn't automatically detect it.

### Ready for Proposal
Yes. The orchestrator can proceed with proposing the implementation of Tauri-based OPM CLI execution and the corresponding React UI panel.
