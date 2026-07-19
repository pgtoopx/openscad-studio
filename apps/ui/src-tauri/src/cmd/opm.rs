use serde::Serialize;
use std::path::PathBuf;
use std::process::Command;
use tauri_plugin_shell::ShellExt;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DependencyManagerStatus {
    pub is_available: bool,
    pub version: Option<String>,
    pub error: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DependencyInstallResult {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn get_dependency_manager_status(
    app_handle: tauri::AppHandle,
    custom_path: Option<String>,
) -> Result<DependencyManagerStatus, String> {
    if let Some(opm_bin) = custom_path {
        match Command::new(&opm_bin).arg("--version").output() {
            Ok(output) => {
                if output.status.success() {
                    let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    Ok(DependencyManagerStatus {
                        is_available: true,
                        version: Some(version),
                        error: None,
                    })
                } else {
                    let error = String::from_utf8_lossy(&output.stderr).trim().to_string();
                    Ok(DependencyManagerStatus {
                        is_available: false,
                        version: None,
                        error: Some(error),
                    })
                }
            }
            Err(e) => Ok(DependencyManagerStatus {
                is_available: false,
                version: None,
                error: Some(e.to_string()),
            }),
        }
    } else {
        let sidecar = match app_handle.shell().sidecar("opm") {
            Ok(s) => s,
            Err(e) => {
                return Ok(DependencyManagerStatus {
                    is_available: false,
                    version: None,
                    error: Some(format!("Failed to resolve sidecar: {}", e)),
                })
            }
        };

        match sidecar.arg("--version").output().await {
            Ok(output) => {
                if output.status.success() {
                    let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    Ok(DependencyManagerStatus {
                        is_available: true,
                        version: Some(version),
                        error: None,
                    })
                } else {
                    let error = String::from_utf8_lossy(&output.stderr).trim().to_string();
                    Ok(DependencyManagerStatus {
                        is_available: false,
                        version: None,
                        error: Some(error),
                    })
                }
            }
            Err(e) => Ok(DependencyManagerStatus {
                is_available: false,
                version: None,
                error: Some(e.to_string()),
            }),
        }
    }
}

#[tauri::command]
pub async fn install_project_dependencies(
    app_handle: tauri::AppHandle,
    project_root: String,
    custom_path: Option<String>,
) -> Result<DependencyInstallResult, String> {
    let root_path = PathBuf::from(&project_root);
    let canonical_root = match root_path.canonicalize() {
        Ok(p) => p,
        Err(e) => return Err(format!("Invalid project root: {}", e)),
    };

    if let Some(opm_bin) = custom_path {
        match Command::new(&opm_bin)
            .arg("install")
            .current_dir(canonical_root)
            .output()
        {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                let combined = format!("{}{}", stdout, stderr);

                Ok(DependencyInstallResult {
                    success: output.status.success(),
                    output: combined,
                    error: if output.status.success() {
                        None
                    } else {
                        Some("Installation failed".to_string())
                    },
                })
            }
            Err(e) => Ok(DependencyInstallResult {
                success: false,
                output: String::new(),
                error: Some(e.to_string()),
            }),
        }
    } else {
        let sidecar = match app_handle.shell().sidecar("opm") {
            Ok(s) => s,
            Err(e) => {
                return Ok(DependencyInstallResult {
                    success: false,
                    output: String::new(),
                    error: Some(format!("Failed to resolve sidecar: {}", e)),
                })
            }
        };

        match sidecar
            .arg("install")
            .current_dir(canonical_root)
            .output()
            .await
        {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                let combined = format!("{}{}", stdout, stderr);

                Ok(DependencyInstallResult {
                    success: output.status.success(),
                    output: combined,
                    error: if output.status.success() {
                        None
                    } else {
                        Some("Installation failed".to_string())
                    },
                })
            }
            Err(e) => Ok(DependencyInstallResult {
                success: false,
                output: String::new(),
                error: Some(e.to_string()),
            }),
        }
    }
}
