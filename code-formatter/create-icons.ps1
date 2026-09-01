Add-Type -AssemblyName System.Drawing

function CreateIcon {
    param([int]$size)
    
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $gp = [System.Drawing.Graphics]::FromImage($bmp)
    $gp.Clear([System.Drawing.Color]::FromArgb(255, 30, 30, 30))
    
    $fn = 'C:\WINDOWS\Fonts\consola.ttf'
    try {
        $ft = New-Object System.Drawing.Font($fn, 16, [System.Drawing.FontStyle]::Bold)
    } catch {
        $ft = New-Object System.Drawing.Font('Consolas', 16, [System.Drawing.FontStyle]::Bold)
    }
    
    $br = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 200, 200, 200))
    $gp.DrawString('CF', $ft, $br, 28, 28)
    
    $outPath = "E:\Webs\chrome-extensions\code-formatter\icons\icon${size}.png"
    $bmp.Save($outPath)
    $bmp.Dispose()
    $gp.Dispose()
    Write-Host "Created $outPath"
}

CreateIcon -size 16
CreateIcon -size 32
CreateIcon -size 48
CreateIcon -size 128
CreateIcon -size 256