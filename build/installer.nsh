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
