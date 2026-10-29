Add-Type -AssemblyName System.Drawing

$res = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\android\app\src\main\res'))

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

$files = Get-ChildItem $res -Recurse -Filter splash.png
foreach ($f in $files) {
  $img = [System.Drawing.Image]::FromFile($f.FullName)
  $w = $img.Width
  $h = $img.Height
  $img.Dispose()

  $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(242, 244, 247))

  $s = [Math]::Min($w, $h) * 0.3
  $cx = $w / 2
  $cy = $h / 2
  $x = $cx - $s / 2
  $y = $cy - $s / 2

  $rect = New-Object System.Drawing.RectangleF $x, $y, $s, $s
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(43, 108, 255)), ([System.Drawing.Color]::FromArgb(20, 71, 201)), 45.0
  $path = New-RoundedPath $s $s ($s * 0.22)
  $m = New-Object System.Drawing.Drawing2D.Matrix
  $m.Translate($x, $y)
  $path.Transform($m)
  $g.FillPath($brush, $path)

  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), ($s * 0.051)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $r = $s * 0.211
  $ccx = $x + $s / 2
  $ccy = $y + $s * 0.485
  $g.DrawEllipse($pen, $ccx - $r, $ccy - $r, $r * 2, $r * 2)
  $g.DrawLine($pen, $ccx, $ccy - $r * 0.66, $ccx, $ccy)
  $g.DrawLine($pen, $ccx, $ccy, $ccx + $r * 0.5, $ccy + $r * 0.31)
  $pen.Dispose()

  $b = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(125, 255, 192))
  $bw = $s * 0.3125
  $bh = $s * 0.035
  $bp = New-RoundedPath $bw $bh ($bh / 2)
  $bm = New-Object System.Drawing.Drawing2D.Matrix
  $bm.Translate(($x + $s * 0.34375), ($y + $s * 0.7539))
  $bp.Transform($bm)
  $g.FillPath($b, $bp)

  $g.Dispose()
  $bmp.Save($f.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()

  $path.Dispose()
  $brush.Dispose()
  $m.Dispose()
  $b.Dispose()
  $bp.Dispose()
  $bm.Dispose()
}

Write-Output "splash generated"
