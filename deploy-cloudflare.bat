@echo off
echo ===== Running Training Plan - Cloudflare Pages 部署脚本 =====
echo.

echo [1/3] 安装依赖...
call npm install

echo [2/3] 构建项目（静态导出模式）...
call npm run build:static

echo [3/3] 部署到 Cloudflare Pages...
echo 请确保已安装 wrangler: npm install -g wrangler
echo 请确保已登录: wrangler login
echo.
echo 然后运行以下命令部署:
echo   wrangler pages deploy out --project-name=running-training-plan
echo.
echo 或者，在 Cloudflare Dashboard 中连接 Git 仓库进行自动部署。
echo.
echo ===== 部署脚本完成 =====
pause
