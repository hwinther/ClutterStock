use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::FilePath;

#[tauri::command]
async fn open_file(app: tauri::AppHandle) -> Result<Option<(String, String)>, String> {
    let dialog = app.dialog();

    let selected = dialog
        .file()
        .add_filter("JSON", &["json"])
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

    let contents = std::fs::read_to_string(&path_buf).map_err(|e| e.to_string())?;

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
            .set_file_name("document.json")
            .add_filter("JSON", &["json"])
            .blocking_save_file();

        let file = selected.ok_or_else(|| "Save operation was cancelled".to_string())?;
        match file {
            FilePath::Path(p) => p,
            FilePath::Url(url) => url
                .to_file_path()
                .map_err(|_| "Could not convert URL to file path".to_string())?,
        }
    };

    std::fs::write(&path_buf, contents).map_err(|e| e.to_string())?;
    Ok(path_buf.display().to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![open_file, save_file])
        .run(tauri::generate_context!())
        .expect("error while running Plate Notepad");
}