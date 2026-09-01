# Build script to generate PNG icons from SVG
# Run this script in PowerShell to generate the icon PNGs

$svgContent = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e74c3c"/>
      <stop offset="100%" style="stop-color:#c0392b"/>
    </linearGradient>
  </defs>
  <path d="M50 5 L90 20 L90 50 C90 75 70 95 50 100 C30 95 10 75 10 50 L10 20 Z" fill="url(#shieldGrad)" stroke="#a93226" stroke-width="2"/>
  <path d="M50 15 L80 28 L80 50 C80 70 65 88 50 92 C35 88 20 70 20 50 L20 28 Z" fill="#2c3e50"/>
  <rect x="42" y="35" width="16" height="30" rx="2" fill="#e74c3c"/>
  <rect x="35" y="42" width="30" height="16" rx="2" fill="#e74c3c"/>
</svg>
"@

$sizes = @(16, 32, 48, 128)
$iconsDir = Join-Path $PSScriptRoot "icons"

foreach ($size in $sizes) {
    $filePath = Join-Path $iconsDir "icon${size}.png"
    
    Add-Type -AssemblyName System.Drawing
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    $graphics.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 0)),
        (New-Object System.Drawing.Point($size, $size)),
        [System.Drawing.Color]::FromArgb(231, 76, 60),
        [System.Drawing.Color]::FromArgb(192, 57, 43)
    )
    
    $graphics.FillEllipse($brush, 0, 0, $size, $size)
    
    $whiteBrush = [System.Drawing.Brushes]::White
    $pen = New-Object System.Drawing.Pen($whiteBrush, [math]::Max(1, $size / 20))
    
    $centerX = $size / 2
    $centerY = $size / 2
    $rectSize = $size * 0.3
    $graphics.DrawRectangle($pen, $centerX - $rectSize/2, $centerY - $rectSize*0.7, $rectSize, $rectSize * 1.4)
    $graphics.DrawRectangle($pen, $centerX - $rectSize*0.7, $centerY - $rectSize/2, $rectSize * 1.4, $rectSize)
    
    $bitmap.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Host "Generated: $filePath"
}

Write-Host "All icons generated successfully!"
