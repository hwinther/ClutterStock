#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{Read, Write};
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::FilePath;
use tauri::tray::TrayIconBuilder;
use zip::write::SimpleFileOptions;
use zip::ZipArchive;

const BOTX_EXT: &str = "botx";
const DOCUMENT_JSON: &str = "document.json";
const METADATA_JSON: &str = "metadata.json";

/// Unpack a .botx zip and return the document.json contents.
fn unpack_botx(path: &std::path::Path) -> Result<String, String> {
    let file = std::fs::File::open(path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;
    let mut doc_file = archive
        .by_name(DOCUMENT_JSON)
        .map_err(|_| format!("{DOCUMENT_JSON} not found in archive"))?;
    let mut contents = String::new();
    doc_file.read_to_string(&mut contents).map_err(|e| e.to_string())?;
    Ok(contents)
}

/// Pack document and metadata into a .botx zip.
fn pack_botx(
    path: &std::path::Path,
    document_json: &str,
    created_at: Option<&str>,
) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    let created = created_at.unwrap_or(&now);
    let metadata = format!(
        r#"{{"version":1,"app":"Plate Notepad","createdAt":"{created}","modifiedAt":"{now}"}}"#
    );

    let file = std::fs::File::create(path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let opts = SimpleFileOptions::default().unix_permissions(0o644);

    zip.start_file(DOCUMENT_JSON, opts)
        .map_err(|e| e.to_string())?;
    zip.write_all(document_json.as_bytes())
        .map_err(|e| e.to_string())?;

    zip.start_file(METADATA_JSON, opts)
        .map_err(|e| e.to_string())?;
    zip.write_all(metadata.as_bytes())
        .map_err(|e| e.to_string())?;

    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

/// Read metadata.json from an existing .botx to preserve createdAt on save.
fn read_metadata_created_at(path: &std::path::Path) -> Option<String> {
    let file = std::fs::File::open(path).ok()?;
    let mut archive = ZipArchive::new(file).ok()?;
    let mut meta_file = archive.by_name(METADATA_JSON).ok()?;
    let mut buf = String::new();
    meta_file.read_to_string(&mut buf).ok()?;
    let v: serde_json::Value = serde_json::from_str(&buf).ok()?;
    v.get("createdAt")?.as_str().map(String::from)
}

/// Path passed when app is launched via file association (e.g. double-click .botx).
pub struct InitialFile(pub Mutex<Option<String>>);

#[tauri::command]
fn get_initial_file_path(state: tauri::State<InitialFile>) -> Option<String> {
    state.0.lock().ok().and_then(|mut g| g.take())
}

/// Load file at path (used when opening via file association). Unpacks .botx and returns document.
#[tauri::command]
fn load_file_at_path(path: String) -> Result<(String, String), String> {
    let path_buf = std::path::PathBuf::from(&path);
    let contents = unpack_botx(&path_buf)?;
    Ok((path, contents))
}

#[tauri::command]
async fn open_file(app: tauri::AppHandle) -> Result<Option<(String, String)>, String> {
    let dialog = app.dialog();

    let selected = dialog
        .file()
        .add_filter("Plate Notepad Document", &[BOTX_EXT])
        .blocking_pick_file();

    let Some(file) = selected else {
        return Ok(None);
    };

    let path_buf = match file {
        FilePath::Path(p) => p,
        FilePath::Url(url) => url
            .to_file_path()
            .map_err(|_| "Could not convert URL to file path".to_string())?,
    };

    let contents = unpack_botx(&path_buf)?;
    Ok(Some((path_buf.display().to_string(), contents)))
}

#[tauri::command]
async fn save_file(
    app: tauri::AppHandle,
    path: Option<String>,
    contents: String,
) -> Result<String, String> {
    let path_buf = if let Some(p) = path {
        std::path::PathBuf::from(p)
    } else {
        let dialog = app.dialog();
        let selected = dialog
            .file()
            .set_file_name("document.botx")
            .add_filter("Plate Notepad Document", &[BOTX_EXT])
            .blocking_save_file();

        let file = selected.ok_or_else(|| "Save operation was cancelled".to_string())?;
        match file {
            FilePath::Path(p) => p,
            FilePath::Url(url) => url
                .to_file_path()
                .map_err(|_| "Could not convert URL to file path".to_string())?,
        }
    };

    let created_at = if path_buf.exists() {
        read_metadata_created_at(&path_buf)
    } else {
        None
    };

    pack_botx(
        &path_buf,
        &contents,
        created_at.as_deref(),
    )?;
    Ok(path_buf.display().to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            open_file,
            save_file,
            get_initial_file_path,
            load_file_at_path,
        ])
        .setup(|app| {
            // When launched via file association (e.g. double-click .botx), Windows passes path as first arg.
            let initial_file = std::env::args()
                .nth(1)
                .filter(|s| {
                    std::path::Path::new(s)
                        .extension()
                        .and_then(|e| e.to_str())
                        .map_or(false, |e| e.eq_ignore_ascii_case(BOTX_EXT))
                });
            app.manage(InitialFile(Mutex::new(initial_file)));

            #[cfg(target_os = "windows")]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window_vibrancy::apply_acrylic(&window, Some((18, 18, 18, 125)));
                }
            }
            let _tray = TrayIconBuilder::new()
            .icon(app.default_window_icon().unwrap().clone())
            .build(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Plate Notepad");
}