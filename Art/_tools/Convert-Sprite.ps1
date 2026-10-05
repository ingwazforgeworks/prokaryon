# Converts a generated square icon into a Prokaryon resource sprite.
#
# The existing sprites are a 36 x 32 logical pixel canvas rendered at 37x scale
# (36*37 = 1332, 32*37 = 1184, trimmed to 1330 x 1183). This script quantizes a
# generated image down to that logical grid, keys out the background by flood
# filling from the canvas edge so interior highlights survive, then re-renders
# with nearest-neighbour scaling so the output is true hard-edged pixel art.

param(
    [Parameter(Mandatory = $true)][string]$InPath,
    [Parameter(Mandatory = $true)][string]$OutPath,
    [int]$Grid = 32,             # logical cells across the source image
    [int]$TargetCells = 17,      # desired content size in logical cells (longest edge)
    [int]$CanvasW = 36,
    [int]$CanvasH = 32,
    [int]$Scale = 37,
    [int]$FinalW = 1330,
    [int]$FinalH = 1183
)

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$src = New-Object System.Drawing.Bitmap($InPath)
$cellW = $src.Width / $Grid
$cellH = $src.Height / $Grid

# --- 1. Quantize to the logical grid ---
# Uses the modal colour of each cell's centre rather than the mean. A generated
# image is never perfectly grid-aligned, so averaging blends the dark outline
# into the background and leaves grey fringe pixels. The mode picks the cell's
# dominant colour and discards edge bleed.
$cells = New-Object 'System.Drawing.Color[,]' $Grid, $Grid
for ($gy = 0; $gy -lt $Grid; $gy++) {
    for ($gx = 0; $gx -lt $Grid; $gx++) {
        $x0 = [int]($gx * $cellW + $cellW * 0.2); $x1 = [int]($gx * $cellW + $cellW * 0.8)
        $y0 = [int]($gy * $cellH + $cellH * 0.2); $y1 = [int]($gy * $cellH + $cellH * 0.8)
        $buckets = @{}
        for ($y = $y0; $y -lt $y1; $y++) {
            for ($x = $x0; $x -lt $x1; $x++) {
                $c = $src.GetPixel($x, $y)
                $key = ([int]($c.R / 24) * 10000) + ([int]($c.G / 24) * 100) + [int]($c.B / 24)
                if ($buckets.ContainsKey($key)) {
                    $e = $buckets[$key]
                    $e[0]++; $e[1] += $c.R; $e[2] += $c.G; $e[3] += $c.B
                }
                else { $buckets[$key] = @(1, [int]$c.R, [int]$c.G, [int]$c.B) }
            }
        }
        $best = $null; $bestN = -1
        foreach ($k in $buckets.Keys) {
            $e = $buckets[$k]
            if ($e[0] -gt $bestN) { $bestN = $e[0]; $best = $e }
        }
        $modal = [System.Drawing.Color]::FromArgb(255, [int]($best[1] / $best[0]), [int]($best[2] / $best[0]), [int]($best[3] / $best[0]))
        $cells[$gx, $gy] = $modal
    }
}
$src.Dispose()

# --- 1b. Snap every cell to a small palette ---
# Collapses the remaining near-duplicate tones into flat bands, which is what
# makes the result read as authored pixel art rather than a downscaled render.
$freq = @{}
for ($gy = 0; $gy -lt $Grid; $gy++) {
    for ($gx = 0; $gx -lt $Grid; $gx++) {
        $c = $cells[$gx, $gy]
        $key = ([int]($c.R / 20) * 10000) + ([int]($c.G / 20) * 100) + [int]($c.B / 20)
        if ($freq.ContainsKey($key)) {
            $e = $freq[$key]; $e[0]++; $e[1] += $c.R; $e[2] += $c.G; $e[3] += $c.B
        }
        else { $freq[$key] = @(1, [int]$c.R, [int]$c.G, [int]$c.B) }
    }
}
$palette = @()
foreach ($k in ($freq.Keys | Sort-Object { -$freq[$_][0] })) {
    $e = $freq[$k]
    if ($e[0] -lt 2) { continue }
    $palette += , @([int]($e[1] / $e[0]), [int]($e[2] / $e[0]), [int]($e[3] / $e[0]))
    if ($palette.Count -ge 8) { break }
}
if ($palette.Count -gt 0) {
    for ($gy = 0; $gy -lt $Grid; $gy++) {
        for ($gx = 0; $gx -lt $Grid; $gx++) {
            $c = $cells[$gx, $gy]
            $bd = [double]::MaxValue; $bp = $palette[0]
            foreach ($p in $palette) {
                $d = [Math]::Pow($c.R - $p[0], 2) + [Math]::Pow($c.G - $p[1], 2) + [Math]::Pow($c.B - $p[2], 2)
                if ($d -lt $bd) { $bd = $d; $bp = $p }
            }
            $snapped = [System.Drawing.Color]::FromArgb(255, $bp[0], $bp[1], $bp[2])
            $cells[$gx, $gy] = $snapped
        }
    }
}

# --- 2. Key out the background: flood fill near-white from the canvas edge ---
# Interior highlights stay opaque because they are enclosed by the dark outline.
$isBg = New-Object 'bool[,]' $Grid, $Grid
function Test-Light([System.Drawing.Color]$c) {
    return ($c.R -gt 216 -and $c.G -gt 216 -and $c.B -gt 216)
}
$queue = New-Object System.Collections.Queue
$seeds = @()
for ($i = 0; $i -lt $Grid; $i++) {
    $seeds += , @($i, 0)
    $seeds += , @($i, ($Grid - 1))
    $seeds += , @(0, $i)
    $seeds += , @(($Grid - 1), $i)
}
foreach ($p in $seeds) {
    $px = $p[0]; $py = $p[1]
    $already = $isBg[$px, $py]
    $col = $cells[$px, $py]
    if ((-not $already) -and (Test-Light $col)) {
        $isBg[$px, $py] = $true
        $queue.Enqueue(@($px, $py))
    }
}
$dirs = @()
$dirs += , @(1, 0); $dirs += , @(-1, 0); $dirs += , @(0, 1); $dirs += , @(0, -1)
while ($queue.Count -gt 0) {
    $p = $queue.Dequeue()
    foreach ($d in $dirs) {
        $nx = $p[0] + $d[0]; $ny = $p[1] + $d[1]
        if ($nx -ge 0 -and $ny -ge 0 -and $nx -lt $Grid -and $ny -lt $Grid) {
            $already = $isBg[$nx, $ny]
            $col = $cells[$nx, $ny]
            if ((-not $already) -and (Test-Light $col)) {
                $isBg[$nx, $ny] = $true
                $queue.Enqueue(@($nx, $ny))
            }
        }
    }
}

# --- 3. Crop to content ---
$minx = $Grid; $maxx = -1; $miny = $Grid; $maxy = -1
for ($gy = 0; $gy -lt $Grid; $gy++) {
    for ($gx = 0; $gx -lt $Grid; $gx++) {
        $bg = $isBg[$gx, $gy]
        if (-not $bg) {
            if ($gx -lt $minx) { $minx = $gx }; if ($gx -gt $maxx) { $maxx = $gx }
            if ($gy -lt $miny) { $miny = $gy }; if ($gy -gt $maxy) { $maxy = $gy }
        }
    }
}
if ($maxx -lt 0) { throw "No opaque content found in $InPath" }
$cw = $maxx - $minx + 1
$ch = $maxy - $miny + 1

# --- 4. Resample content to the target cell count, preserving aspect ---
$longest = [Math]::Max($cw, $ch)
$ratio = $TargetCells / $longest
$tw = [Math]::Max(1, [int][Math]::Round($cw * $ratio))
$th = [Math]::Max(1, [int][Math]::Round($ch * $ratio))

$logical = New-Object System.Drawing.Bitmap($CanvasW, $CanvasH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$offX = [int](($CanvasW - $tw) / 2)
$offY = [int](($CanvasH - $th) / 2)
$transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
for ($y = 0; $y -lt $CanvasH; $y++) { for ($x = 0; $x -lt $CanvasW; $x++) { $logical.SetPixel($x, $y, $transparent) } }
for ($y = 0; $y -lt $th; $y++) {
    for ($x = 0; $x -lt $tw; $x++) {
        $sx = $minx + [int][Math]::Floor($x / $ratio)
        $sy = $miny + [int][Math]::Floor($y / $ratio)
        if ($sx -gt $maxx) { $sx = $maxx }; if ($sy -gt $maxy) { $sy = $maxy }
        $bg = $isBg[$sx, $sy]
        if (-not $bg) {
            $col = $cells[$sx, $sy]
            $logical.SetPixel(($offX + $x), ($offY + $y), $col)
        }
    }
}

# --- 5. Nearest-neighbour upscale, then trim to the exact canvas size ---
$big = New-Object System.Drawing.Bitmap(($CanvasW * $Scale), ($CanvasH * $Scale), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gfx = [System.Drawing.Graphics]::FromImage($big)
$gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$gfx.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$gfx.DrawImage($logical, 0, 0, ($CanvasW * $Scale), ($CanvasH * $Scale))
$gfx.Dispose()

$final = New-Object System.Drawing.Bitmap($FinalW, $FinalH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gfx2 = [System.Drawing.Graphics]::FromImage($final)
$gfx2.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$gfx2.DrawImage($big, [int](($FinalW - $big.Width) / 2), [int](($FinalH - $big.Height) / 2))
$gfx2.Dispose()

$dir = Split-Path $OutPath -Parent
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$final.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)

"{0}  ->  {1}x{2}, content {3}x{4} cells" -f (Split-Path $OutPath -Leaf), $final.Width, $final.Height, $tw, $th

$logical.Dispose(); $big.Dispose(); $final.Dispose()
