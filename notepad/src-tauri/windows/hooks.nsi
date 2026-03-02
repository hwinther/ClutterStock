; Register .botx file association for Plate Notepad (runs after NSIS install).
; Double-clicking a .botx file will launch this app and pass the file path as an argument.
!macro NSIS_HOOK_POSTINSTALL
  ; Associate .botx with our app (overwrites existing default; user can change in Windows Settings).
  WriteRegStr HKCR ".botx" "" "PlateNotepad.Document"
  WriteRegStr HKCR "PlateNotepad.Document" "" "Plate Notepad Document"
  WriteRegStr HKCR "PlateNotepad.Document\DefaultIcon" "" "$INSTDIR\Plate Notepad.exe,0"
  WriteRegStr HKCR "PlateNotepad.Document\shell\open\command" "" '$\"$INSTDIR\Plate Notepad.exe$\" $\"%1$\"'
!macroend

; Remove file association when app is uninstalled.
!macro NSIS_HOOK_POSTUNINSTALL
  ReadRegStr $0 HKCR ".botx" ""
  StrCmp $0 "PlateNotepad.Document" 0 +2
  DeleteRegValue HKCR ".botx" ""
  DeleteRegKey HKCR "PlateNotepad.Document\shell\open\command"
  DeleteRegKey HKCR "PlateNotepad.Document\shell\open"
  DeleteRegKey HKCR "PlateNotepad.Document\shell"
  DeleteRegKey HKCR "PlateNotepad.Document\DefaultIcon"
  DeleteRegKey HKCR "PlateNotepad.Document"
!macroend
