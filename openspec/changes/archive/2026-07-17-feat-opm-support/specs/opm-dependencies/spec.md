<opm-dependencies Specification>
## Purpose

This specification defines the behavior for managing OpenSCAD dependencies using the OpenSCAD Package Manager (OPM) within the OpenSCAD Studio application. It covers detection of the package manager, parsing of dependency manifests, visual status reporting, background installation via Tauri, live preview refreshing, and graceful degradation for the web platform.

## Requirements

### Requirement: OPM Detection

The system MUST detect the availability of the `opm` executable. It SHALL check the system PATH by default, and MAY fall back to a custom path provided in the user settings.

#### Scenario: OPM found in system PATH
- GIVEN the application starts
- WHEN it checks for the `opm` command in the environment PATH
- THEN it MUST mark OPM as available
- AND enable OPM-related features

#### Scenario: OPM found via custom settings path
- GIVEN `opm` is not in the system PATH
- AND a valid custom path is configured in settings
- WHEN the application checks for OPM
- THEN it MUST mark OPM as available using the custom path

#### Scenario: OPM not found
- GIVEN `opm` is unavailable in PATH and custom settings
- WHEN the application checks for OPM
- THEN it MUST mark OPM as unavailable
- AND display a warning in the OPM side-panel

### Requirement: scad.json Detection

The system MUST monitor the active workspace root for a `scad.json` manifest file to determine project dependencies.

#### Scenario: scad.json present
- GIVEN an active project workspace
- WHEN a `scad.json` file exists in the root directory
- THEN the system MUST parse the file to extract declared dependencies

#### Scenario: scad.json added or removed dynamically
- GIVEN an active project workspace
- WHEN a `scad.json` file is created or deleted
- THEN the system MUST update the dependency state accordingly

### Requirement: Visual Status Reporting

The system MUST provide a side-panel to display dependency status, including a list of declared packages and highlighting any that are missing.

#### Scenario: All dependencies installed
- GIVEN the project has dependencies declared in `scad.json`
- AND all dependencies are installed locally
- WHEN the user opens the OPM side-panel
- THEN all packages MUST be listed with an "Installed" status indicator

#### Scenario: Missing dependencies
- GIVEN the project has dependencies declared in `scad.json`
- AND one or more dependencies are missing locally
- WHEN the user opens the OPM side-panel
- THEN missing packages MUST be highlighted
- AND an "Install Missing" action MUST be visible

### Requirement: Dependency Installation Execution

The system MUST execute OPM installation commands via a background Tauri process and capture its stdout/stderr streams.

#### Scenario: Triggering installation
- GIVEN the user clicks the "Install Missing" button
- WHEN the installation process begins
- THEN the system MUST run `opm install` in the background
- AND capture and display stdout/stderr to the user in a log view

#### Scenario: Installation failure
- GIVEN a dependency installation is in progress
- WHEN the background command exits with a non-zero status
- THEN the system MUST display an error notification
- AND retain the stdout/stderr logs for troubleshooting

### Requirement: Rendering Refresh

The system MUST invalidate rendering caches and trigger a live preview refresh upon successful package installation.

#### Scenario: Successful installation refresh
- GIVEN a successful dependency installation completes
- WHEN the system processes the success event
- THEN it MUST clear any cached renders involving the new dependencies
- AND trigger a live preview refresh

### Requirement: Web Fallback Stub

The system MUST provide a fallback UI explaining that OPM integration is exclusive to the desktop environment when running on the web.

#### Scenario: Running in a web browser
- GIVEN the application is running in the web version
- WHEN the user navigates to the OPM side-panel
- THEN the system MUST display a message stating OPM requires the desktop app
- AND disable all installation controls
</opm-dependencies Specification>
