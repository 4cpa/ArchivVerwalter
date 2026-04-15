; Declare the NSIS installer as DPI-aware so Windows renders its UI at native
; resolution instead of upscaling a low-DPI bitmap. Without this, text appears
; blurry on HiDPI / Retina displays because Windows applies bitmap scaling to
; installers that do not carry a DPI-awareness manifest.
ManifestDPIAware true
