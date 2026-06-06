# Cloudflare Pages 一键部署脚本
# 用法:
#   1) 仅构建并在本地预览:  pwsh scripts/deploy-cf.ps1 -Action build
#   2) 通过 Wrangler CLI 直接部署:  pwsh scripts/deploy-cf.ps1 -Action deploy
#   3) 创建 D1 排行榜数据库 (首次部署时执行一次):  pwsh scripts/deploy-cf.ps1 -Action d1:create
#   4) 把 db/schema.sql 应用到 D1 数据库:            pwsh scripts/deploy-cf.ps1 -Action d1:migrate
#   5) 打印 Git 集成配置指引:                       pwsh scripts/deploy-cf.ps1 -Action guide
#
# 前置条件 (任选其一即可):
#   - 已安装 bun:    https://bun.sh
#   - 已安装 node:   https://nodejs.org (>= 18)
#   - 已安装 wrangler (仅 deploy 模式需要):  npm i -g wrangler
#
# 排行榜 (D1) 首次部署流程 (仅需执行一次):
#   1) pwsh scripts/deploy-cf.ps1 -Action d1:create
#      -> 将打印 database_id, 复制后填到 wrangler.jsonc 的 d1_databases[0].database_id
#   2) 填好 database_id 后:
#      pwsh scripts/deploy-cf.ps1 -Action d1:migrate
#      -> 把 db/schema.sql 同步到远程 D1
#   3) pwsh scripts/deploy-cf.ps1 -Action deploy
#      -> 部署静态资源 + Pages Functions

[CmdletBinding()]
param(
    [ValidateSet('build', 'deploy', 'guide', 'd1:create', 'd1:migrate', 'd1:migrate:local')]
    [string]$Action = 'guide',

    # Cloudflare Pages 项目名 (仅 deploy 模式使用)
    [string]$ProjectName = 'hs-puzzle',

    # 生产分支名 (Cloudflare Pages Git 集成会监听此分支的推送)
    [string]$Branch = 'main',

    # D1 数据库名
    [string]$D1DatabaseName = 'hs-puzzle-leaderboard',

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
    throw '未检测到 bun 或 npm, 请先安装其中之一。'
}

function Resolve-WranglerCmd {
    if (Get-Command wrangler -ErrorAction SilentlyContinue) {
        return @{ Cmd = 'wrangler'; Args = @() }
    }
    $pm = Get-PackageManager
    $cmdBase = if ($pm -eq 'bun') { 'bunx' } else { 'npx' }
    Write-Warn "未检测到全局 wrangler, 改用 $cmdBase wrangler@latest (首次运行会引导登录 Cloudflare)"
    return @{ Cmd = $cmdBase; Args = @('wrangler@latest') }
}

function Invoke-Build {
    Write-Step "开始构建项目 (Rsbuild -> dist/)"
    $pm = Get-PackageManager
    Write-Host "    使用包管理器: $pm"

    if (-not (Test-Path 'node_modules')) {
        Write-Warn "未发现 node_modules, 先执行 $pm install"
        & $pm install
        if ($LASTEXITCODE -ne 0) { throw "依赖安装失败" }
    }

    & $pm run build
    if ($LASTEXITCODE -ne 0) { throw "构建失败" }

    if (-not (Test-Path 'dist')) {
        throw "构建完成但未发现 dist 目录, 请检查 rsbuild 配置"
    }
    Write-Ok "构建产物已生成: dist/"
}

function Invoke-Deploy {
    Write-Step "准备通过 Wrangler CLI 直接部署到 Cloudflare Pages"

    $w = Resolve-WranglerCmd

    Invoke-Build

    $wranglerArgs = @('pages', 'deploy', 'dist', '--project-name', $ProjectName, '--branch', $Branch, '--commit-dirty=true')
    if ($DryRun) { $wranglerArgs += '--dry-run' }

    Write-Host "    执行: $($w.Cmd) $($w.Args -join ' ') $($wranglerArgs -join ' ')"
    & $w.Cmd @w.Args @wranglerArgs
    if ($LASTEXITCODE -ne 0) { throw "部署失败" }
    Write-Ok "部署完成! 访问 https://$ProjectName.pages.dev 查看"
}

function Invoke-D1Create {
    Write-Step "创建 D1 排行榜数据库: $D1DatabaseName"
    $w = Resolve-WranglerCmd
    & $w.Cmd @w.Args d1 create $D1DatabaseName
    if ($LASTEXITCODE -ne 0) { throw "创建 D1 失败" }
    Write-Host ""
    Write-Host "    请把上面输出中的 'database_id' 复制到 wrangler.jsonc:" -ForegroundColor Yellow
    Write-Host "      d1_databases[0].database_id = "<新建的 id>"" -ForegroundColor Yellow
    Write-Host "    然后再执行:" -ForegroundColor Yellow
    Write-Host "      pwsh scripts/deploy-cf.ps1 -Action d1:migrate" -ForegroundColor Yellow
}

function Invoke-D1Migrate {
    param([switch]$Local)

    if (-not (Test-Path 'db/schema.sql')) {
        throw "未找到 db/schema.sql"
    }

    # 读取 wrangler.jsonc 检查 database_id 是否还是占位符
    $wrc = Get-Content 'wrangler.jsonc' -Raw
    if ($wrc -match 'REPLACE_ME_AFTER_wrangler_d1_create') {
        throw "wrangler.jsonc 中的 database_id 仍是占位符. 请先执行 d1:create 并把 id 填入 wrangler.jsonc."
    }

    $w = Resolve-WranglerCmd
    $label = if ($Local) { '本地 (--local)' } else { '远程 (--remote)' }
    Write-Step "应用 db/schema.sql 到 D1: $D1DatabaseName ($label)"

    $flag = if ($Local) { '--local' } else { '--remote' }
    & $w.Cmd @w.Args d1 execute $D1DatabaseName --file=db/schema.sql $flag
    if ($LASTEXITCODE -ne 0) { throw "应用 schema 失败" }
    Write-Ok "Schema 已应用"
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

     Framework preset   : None (或 Vite/Rsbuild, 若列表中有)
     Build command      : bun run build
     Build output       : dist
     Root directory     : (留空, 使用仓库根目录)

  4) (推荐) 在 "Environment variables" 中添加:
     NODE_VERSION = 20
     (Cloudflare 默认使用 Node 18, 某些依赖可能要求更高版本)

  5) 首次部署排行榜需要先在本地创建 D1 并应用 schema (也可用 Cloudflare 控制台 SQL 控制台):
       pwsh scripts/deploy-cf.ps1 -Action d1:create
       (把输出的 database_id 填到 wrangler.jsonc)
       pwsh scripts/deploy-cf.ps1 -Action d1:migrate

  6) 点击 "Save and Deploy", 首次部署会自动触发。
     此后每次向 $Branch 分支推送代码, Cloudflare 都会自动构建并发布。

  7) 后续可以通过 wrangler.jsonc 中的 pages_build_output_dir 与
     public/_redirects 自定义更多行为 (缓存、路由回退、Headers 等)。

"@ | Write-Host -ForegroundColor White
}

switch ($Action) {
    'build'             { Invoke-Build }
    'deploy'            { Invoke-Deploy }
    'd1:create'         { Invoke-D1Create }
    'd1:migrate'        { Invoke-D1Migrate }
    'd1:migrate:local'  { Invoke-D1Migrate -Local }
    'guide'             { Show-Guide }
    default             { Show-Guide }
}
