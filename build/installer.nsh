; Declare the NSIS installer as DPI-aware so Windows renders its UI at native
; resolution instead of upscaling a low-DPI bitmap. Without this, text appears
; blurry on HiDPI / Retina displays because Windows applies bitmap scaling to
; installers that do not carry a DPI-awareness manifest.
ManifestDPIAware true

; Disable the NSIS CRC integrity check.
; Windows Defender (and other AV engines) scan and can modify the PE file after
; makensis writes it — invalidating the CRC that NSIS embeds in the header.
; The result on end-user machines: "Installer integrity check has failed".
; Disabling the check avoids this false-positive without weakening security:
; download integrity is guaranteed by the GitHub Release SHA-256 checksum and
; (when enabled) Authenticode code-signing of the final .exe.
CRCCheck off

; Fix electron-builder NSIS bug: shortcuts are created while files are still in
; the temp extraction directory, so they point to a path that is deleted after
; install. Re-create them here, after all files are in their final $INSTDIR.
!macro customInstall
  Delete "$DESKTOP\ArchivVerwalter.lnk"
  CreateShortCut "$DESKTOP\ArchivVerwalter.lnk" \
    "$INSTDIR\ArchivVerwalter.exe" "" "$INSTDIR\ArchivVerwalter.exe" 0

  Delete "$SMPROGRAMS\ArchivVerwalter\ArchivVerwalter.lnk"
  CreateDirectory "$SMPROGRAMS\ArchivVerwalter"
  CreateShortCut "$SMPROGRAMS\ArchivVerwalter\ArchivVerwalter.lnk" \
    "$INSTDIR\ArchivVerwalter.exe" "" "$INSTDIR\ArchivVerwalter.exe" 0
!macroend
