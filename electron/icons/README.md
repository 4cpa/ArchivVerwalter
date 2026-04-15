# App Icons

Place your custom app icons here before building installers.

| File            | Format  | Used for                        | Minimum size  |
|-----------------|---------|---------------------------------|---------------|
| `icon.ico`      | ICO     | Windows installer + taskbar     | 256 × 256 px  |
| `icon.icns`     | ICNS    | macOS .app bundle + dock        | 512 × 512 px  |
| `icon.png`      | PNG     | Linux AppImage / .deb           | 512 × 512 px  |

If no icons are present, electron-builder uses the default Electron icon.

## Quick generation from a single PNG

Install ImageMagick, then:

```bash
# Windows .ico (requires ImageMagick)
convert icon.png -resize 256x256 icon.ico

# Linux — just copy
cp icon.png icon_512.png

# macOS .icns (requires macOS + iconutil)
mkdir icon.iconset
sips -z 16  16  icon.png --out icon.iconset/icon_16x16.png
sips -z 32  32  icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32  32  icon.png --out icon.iconset/icon_32x32.png
sips -z 64  64  icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
iconutil -c icns icon.iconset
```
