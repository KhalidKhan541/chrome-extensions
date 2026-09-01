Add-Type -AssemblyName System.Drawing

$sizes = @(16, 32, 48, 128, 24)
foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $gfx = [System.Drawing.Graphics]$bmp
    $gfx.Clear([System.Drawing.Color]::Transparent)
    $path = "E:/Webs/chrome-extensions/page-speed/icons/icon$size.png"
    $bmp.Save($path)
    $gfx.Dispose()
    $bmp.Dispose()
    Write-Host "Created icon $size.png"
}