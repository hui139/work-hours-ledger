Add-Type -AssemblyName System.Drawing

$root = Join-Path $PSScriptRoot '..\android\app\src\main\res'
$res = [System.IO.Path]::GetFullPath($root)

function New-RoundedPath([float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc(0, 0, $d, $d, 180, 90)
  $p.AddArc($w - $d, 0, $d, $d, 270, 90)
  $p.AddArc($w - $d, $h - $d, $d, $d, 0, 90)
  $p.AddArc(0, $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function Draw-Clock($g, [float]$cx, [float]$cy, [float]$r, [float]$sw, $color) {
  $pen = New-Object System.Drawing.Pen $color, $sw
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $g.DrawEllipse($pen, $cx - $r, $cy - $r, $r * 2, $r * 2)
  $g.DrawLine($pen, $cx, $cy - $r * 0.66, $cx, $cy)
  $g.DrawLine($pen, $cx, $cy, $cx + $r * 0.5, $cy + $r * 0.31)
  $pen.Dispose()
}

function Draw-Bar($g, [float]$w, [float]$h) {
  $b = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(125, 255, 192))
  $bw = $w * 0.3125
  $bh = $h * 0.035
  $bx = $w * 0.34375
  $by = $h * 0.7539
  $p = New-RoundedPath $bw $bh ($bh / 2)
  $m = New-Object System.Drawing.Drawing2D.Matrix
  $m.Translate($bx, $by)
  $p.Transform($m)
  $g.FillPath($b, $p)
  $p.Dispose()
  $m.Dispose()
  $b.Dispose()
}

function New-LegacyIcon([int]$size, [bool]$round) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  $rect = New-Object System.Drawing.RectangleF 0, 0, $size, $size
  if ($round) {
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(43, 108, 255)), ([System.Drawing.Color]::FromArgb(20, 71, 201)), 45.0
    $g.FillEllipse($brush, 0, 0, $size, $size)
  } else {
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(43, 108, 255)), ([System.Drawing.Color]::FromArgb(20, 71, 201)), 45.0
    $path = New-RoundedPath $size $size ($size * 0.22)
    $g.FillPath($brush, $path)
    $path.Dispose()
  }
  $brush.Dispose()

  $white = [System.Drawing.Color]::White
  Draw-Clock $g ($size / 2) ($size * 0.485) ($size * 0.211) ($size * 0.051) $white
  Draw-Bar $g $size $size

  $g.Dispose()
  return $bmp
}

function New-Foreground([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  $white = [System.Drawing.Color]::White
  Draw-Clock $g ($size / 2) ($size * 0.46) ($size * 0.175) ($size * 0.042) $white
  Draw-Bar $g $size $size

  $g.Dispose()
  return $bmp
}

$densities = @{ 'mdpi' = 48; 'hdpi' = 72; 'xhdpi' = 96; 'xxhdpi' = 144; 'xxxhdpi' = 192 }

foreach ($k in $densities.Keys) {
  $size = $densities[$k]
  $dir = Join-Path $res "mipmap-$k"

  $img = New-LegacyIcon $size $false
  $img.Save((Join-Path $dir 'ic_launcher.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $img.Dispose()

  $img = New-LegacyIcon $size $true
  $img.Save((Join-Path $dir 'ic_launcher_round.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $img.Dispose()

  $fgSize = [int]($size * 2.25)
  $img = New-Foreground $fgSize
  $img.Save((Join-Path $dir 'ic_launcher_foreground.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $img.Dispose()
}

Write-Output "icons generated"
