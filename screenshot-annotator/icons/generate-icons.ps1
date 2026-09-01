Add-Type -AssemblyName System.Drawing

$sizes = @(16, 32, 48, 128)
$outDir = "E:\Webs\chrome-extensions\screenshot-annotator\icons"

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $radius = [Math]::Floor($size * 0.1875)
    $path.AddArc($rect.X, $rect.Y, $radius*2, $radius*2, 180, 90)
    $path.AddArc($rect.Right - $radius*2, $rect.Y, $radius*2, $radius*2, 270, 90)
    $path.AddArc($rect.Right - $radius*2, $rect.Bottom - $radius*2, $radius*2, $radius*2, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $radius*2, $radius*2, $radius*2, 90, 90)
    $path.CloseFigure()
    
    $color1 = [System.Drawing.Color]::FromArgb(108, 92, 231)
    $color2 = [System.Drawing.Color]::FromArgb(162, 155, 254)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $color1, $color2, 45)
    $g.FillPath($brush, $path)
    
    $lineW = [Math]::Max(1, [int]($size/24))
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $lineW)
    $g.DrawRectangle($pen, [int]($size*0.14), [int]($size*0.23), [int]($size*0.72), [int]($size*0.53))
    
    $circleR = [int]($size*0.125)
    $cx = [int]($size/2)
    $cy = [int]($size*0.5)
    $g.DrawEllipse($pen, $cx-$circleR, $cy-$circleR, $circleR*2, $circleR*2)
    $g.FillEllipse([System.Drawing.Brushes]::White, $cx-[int]($circleR*0.4), $cy-[int]($circleR*0.4), [int]($circleR*0.8), [int]($circleR*0.8))
    
    $pen2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 217, 61), $lineW)
    $g.DrawLine($pen2, [int]($size*0.14), [int]($size*0.34), [int]($size*0.25), [int]($size*0.23))
    $g.DrawLine($pen2, [int]($size*0.75), [int]($size*0.66), [int]($size*0.86), [int]($size*0.77))
    
    $outPath = Join-Path $outDir "icon${size}.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $brush.Dispose()
    $pen.Dispose()
    $pen2.Dispose()
    $path.Dispose()
    Write-Host "Created icon${size}.png"
}
Write-Host "All icons created"
