# Convert SVG icons to PNG for Chrome extension
# Run this script to generate PNG icons from SVG files

$sizes = @(16, 32, 48, 128)

foreach ($size in $sizes) {
    $svgFile = "icons\icon${size}.svg"
    $pngFile = "icons\icon${size}.png"
    
    if (Test-Path $svgFile) {
        Write-Host "Converting $svgFile to $pngFile..."
        
        # Use ImageMagick if available
        if (Get-Command magick -ErrorAction SilentlyContinue) {
            & magick convert -background none -density 300 -resize ${size}x${size} $svgFile $pngFile
        }
        # Try using Inkscape if available
        elseif (Get-Command inkscape -ErrorAction SilentlyContinue) {
            & inkscape -w $size -h $size $svgFile --export-filename=$pngFile
        }
        else {
            Write-Warning "Neither ImageMagick nor Inkscape found. Please install one of them to convert SVG to PNG."
            Write-Host "Alternative: You can use an online SVG to PNG converter or manually create PNG files."
            
            # Create a simple placeholder PNG using .NET
            Add-Type -AssemblyName System.Drawing
            
            $bitmap = New-Object System.Drawing.Bitmap($size, $size)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.Clear([System.Drawing.Color]::Transparent)
            
            $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(79, 195, 247))
            $pen = New-Object System.Drawing.Pen($brush, 2)
            
            $center = $size / 2
            $radius = $size * 0.4
            
            $graphics.DrawEllipse($pen, ($center - $radius), ($center - $radius), ($radius * 2), ($radius * 2))
            $graphics.FillEllipse($brush, ($center - $radius * 0.25), ($center - $radius * 0.25), ($radius * 0.5), ($radius * 0.5))
            
            $pen.Dispose()
            $brush.Dispose()
            $graphics.Dispose()
            
            $bitmap.Save($pngFile, [System.Drawing.Imaging.ImageFormat]::Png)
            $bitmap.Dispose()
            
            Write-Host "Created placeholder PNG: $pngFile"
        }
    }
}

Write-Host "`nIcon conversion complete!"