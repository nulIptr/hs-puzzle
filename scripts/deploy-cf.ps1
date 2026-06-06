# Cloudflare Pages 一键部署脚本
# 用法:
#   1) 仅构建并在本地预览:  pwsh scripts/deploy-cf.ps1 -Action build
#   2) 通过 Wrangler CLI 直接部署:  pwsh scripts/deploy-cf.ps1 -Action deploy
#   3) 打印 Git 集成配置指引:    pwsh scripts/deploy-cf.ps1 -Action guide
#
# 前置条件 (任选其一即可):
#   - 已安装 bun:    https://bun.sh
#   - 已安装 node:   https://nodejs.org (>= 18)
#   - 已安装 wrangler (仅 deploy 模式需要):  npm i -g wrangler

[CmdletBinding()]
param(
    [ValidateSet('build', 'deploy', 'guide')]
    [string]$Action = 'guide',

    # Cloudflare Pages 项目名 (仅 deploy 模式使用)
    [string]$ProjectName = 'hs-puzzle',

    # 生产分支名 (Cloudflare Pages Git 集成会监听此分支的推送)
    [string]$Branch = 'main',

    # 是否以 --dry-run 方式运行 wrangler pages deploy (不实际上传)
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir '..')
Set-Location $ProjectRoot

function Write-Step($msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Write-Ok($msg) {
    Write-Host "    [OK] $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "    [!] $msg" -ForegroundColor Yellow
}

function Get-PackageManager {
    if (Get-Command bun -ErrorAction SilentlyContinue) { return 'bun' }
    if (Get-Command npm  -ErrorAction SilentlyContinue) { return 'npm' }
    throw '未检测到 bun 或 npm，请先安装其中之一。'
}

function Invoke-Build {
    Write-Step "开始构建项目 (Rsbuild -> dist/)"
    $pm = Get-PackageManager
    Write-Host "    使用包管理器: $pm"

    if (-not (Test-Path 'node_modules')) {
        Write-Warn "未发现 node_modules,先执行 $pm install"
        & $pm install
        if ($LASTEXITCODE -ne 0) { throw "依赖安装失败" }
    }

    & $pm run build
    if ($LASTEXITCODE -ne 0) { throw "构建失败" }

    if (-not (Test-Path 'dist')) {
        throw "构建完成但未发现 dist 目录,请检查 rsbuild 配置"
    }
    Write-Ok "构建产物已生成: dist/"
}

function Invoke-Deploy {
    Write-Step "准备通过 Wrangler CLI 直接部署到 Cloudflare Pages"

    # 始终使用 `wrangler pages deploy`(不要用裸的 `wrangler deploy`,那是 Worker 项目的命令)
    $cmd = 'wrangler'
    if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
        $pm = Get-PackageManager
        $cmdBase = if ($pm -eq 'bun') { 'bunx' } else { 'npx' }
        $cmd = "$cmdBase wrangler@latest"
        Write-Warn "未检测到全局 wrangler,改用 $cmd (首次运行会引导登录 Cloudflare)"
    }

    Invoke-Build

    # 关键: 必须是 `pages deploy <dir>`,不能省略 `pages`
    $wranglerArgs = @('pages', 'deploy', 'dist', '--project-name', $ProjectName, '--branch', $Branch, '--commit-dirty=true')
    if ($DryRun) { $wranglerArgs += '--dry-run' }

    Write-Host "    执行: $cmd $($wranglerArgs -join ' ')"
    & $cmd @wranglerArgs
    if ($LASTEXITCODE -ne 0) { throw "部署失败" }
    Write-Ok "部署完成!访问 https://$ProjectName.pages.dev 查看"
}

function Show-Guide {
    Write-Step "Cloudflare Pages + GitHub 自动部署配置指引"

    @"

  1) 将代码推送到 GitHub 仓库 (如 github.com/<you>/hs-puzzle)

  2) 打开 Cloudflare 控制台 -> Workers & Pages -> Create application -> Pages -> Connect to Git
     - 选择你的 GitHub 仓库并授权
     - Project name       : $ProjectName
     - Production branch  : $Branch

  3) 在 "Build settings" 中填入:

     Framework preset   : None (或 Vite/Rsbuild,若列表中有)
     Build command      : bun run build
     Build output       : dist
     Root directory     : (留空,使用仓库根目录)

  4) (推荐) 在 "Environment variables" 中添加:
     NODE_VERSION = 20
     (Cloudflare 默认使用 Node 18,某些依赖可能要求更高版本)

  5) 点击 "Save and Deploy",首次部署会自动触发。
     此后每次向 $Branch 分支推送代码,Cloudflare 都会自动构建并发布。

  6) 后续可以通过 wrangler.jsonc 中的 pages_build_output_dir 与
     public/_redirects 自定义更多行为 (缓存、路由回退、Headers 等)。

"@ | Write-Host -ForegroundColor White
}

switch ($Action) {
    'build'  { Invoke-Build }
    'deploy' { Invoke-Deploy }
    'guide'  { Show-Guide }
    default  { Show-Guide }
}
