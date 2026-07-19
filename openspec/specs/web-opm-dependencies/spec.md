</Delta for web-opm-dependencies>
<web-opm-dependencies Specification>
## Purpose

Defines the dependency resolution and fetching mechanism for the Web version of OpenSCAD Studio using a JSON catalog and ZIP packages.

## Requirements

### Requirement: Catalog Resolution

The system MUST fetch the JSON catalog of available libraries and map dependency names.

#### Scenario: Successfully resolve dependency

- GIVEN a dependency name is requested in the Web interface
- WHEN the catalog resolution begins
- THEN the system fetches the JSON catalog
- AND successfully maps the dependency name to the corresponding package metadata

#### Scenario: Dependency not found in catalog

- GIVEN a dependency name is requested in the Web interface
- WHEN the catalog resolution begins
- THEN the system fetches the JSON catalog
- AND the dependency name is not found
- AND a resolution error message is produced

### Requirement: ZIP Package Fetch

The system MUST download the ZIP asset from the web server under the `/libraries/` URL.

#### Scenario: Successfully download ZIP

- GIVEN the dependency is successfully resolved to a package
- WHEN the system initiates the download
- THEN it requests the ZIP asset from `/libraries/{package_id}.zip`
- AND the download completes successfully

### Requirement: Memory-based Extraction

The system MUST unzip the files in-memory, filtering only `.scad`/`.h` files, and ignoring nested git/metadata folders.

#### Scenario: Filter valid files from ZIP

- GIVEN a successfully downloaded ZIP package
- WHEN the memory-based extraction processes the files
- THEN only `.scad` and `.h` files are retained
- AND any nested git or metadata folders are ignored

### Requirement: Batch-write to Virtual Filesystem

The system MUST write all unzipped files to the `projectStore` in a single batch, updating the rendering files index, and triggering a re-render of the active file.

#### Scenario: Write extracted files and re-render

- GIVEN the extracted and filtered files in memory
- WHEN the files are committed to the filesystem
- THEN the files are written to the `projectStore` in a single batch
- AND the rendering files index is updated
- AND a re-render of the active file is triggered

### Requirement: UI Feedback

The system MUST update the OPM panel to show download progress, success, and any resolution error message on the Web interface.

#### Scenario: Show successful download progress

- GIVEN a library download is ongoing
- WHEN the download progresses and completes
- THEN the OPM panel displays the download progress
- AND updates to show a success state upon completion

#### Scenario: Show resolution error

- GIVEN a library resolution or download fails
- WHEN the failure occurs
- THEN the OPM panel displays the appropriate resolution error message
