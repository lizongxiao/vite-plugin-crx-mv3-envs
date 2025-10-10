# 自动化发布脚本

这个脚本可以帮助你自动化发布流程，包括版本号更新、构建和发布到npm。

## 功能特性

- ✅ 自动更新版本号（patch/minor/major）
- ✅ 更新源文件中的版本号引用
- ✅ 自动构建项目
- ✅ 发布到npm
- ✅ 创建Git标签
- ✅ 推送代码和标签到远程仓库
- ✅ 完整的错误处理和日志输出

## 使用方法

### 1. 本地发布

```bash
# 发布patch版本 (0.1.11 -> 0.1.12)
pnpm run release:patch

# 发布minor版本 (0.1.11 -> 0.2.0)
pnpm run release:minor

# 发布major版本 (0.1.11 -> 1.0.0)
pnpm run release:major

# 默认发布patch版本
pnpm run release
```

### 2. 直接使用脚本

```bash
# 使用node直接运行
node scripts/release.js patch
node scripts/release.js minor
node scripts/release.js major
```

## 发布流程

脚本会按以下顺序执行：

1. **检查Git状态**
   - 确保没有未提交的更改
   - 检查当前分支（建议在main/master分支）

2. **检查npm登录状态**
   - 确保已登录npm账户

3. **运行测试**（如果有测试脚本）

4. **更新版本号**
   - 使用npm version命令更新package.json
   - 自动更新源文件中的版本号引用

5. **构建项目**
   - 运行 `pnpm run build`

6. **发布到npm**
   - 执行 `npm publish`

7. **创建Git标签**
   - 提交更改
   - 创建版本标签
   - 推送到远程仓库

## 版本号更新规则

脚本会自动更新以下文件中的版本号：

- `src/index.ts`
- `src/constants.ts`
- `README.md`
- `README.zh_CN.md`

支持的版本号格式：
- `"version": "x.x.x"`
- `version: "x.x.x"`
- `@version x.x.x`
- `vx.x.x`

## GitHub Actions 自动化

项目还包含了GitHub Actions工作流，当推送标签时会自动发布：

1. 推送标签：`git tag v0.1.12 && git push origin v0.1.12`
2. GitHub Actions会自动：
   - 构建项目
   - 发布到npm
   - 创建GitHub Release

## 环境要求

- Node.js >= 14.18.0
- pnpm
- Git
- npm账户登录

## 注意事项

1. **确保npm登录**：发布前请确保已登录npm账户
2. **提交所有更改**：发布前请提交所有代码更改
3. **检查分支**：建议在main或master分支上执行发布
4. **版本号冲突**：如果版本号已存在，发布会失败

## 错误处理

脚本包含完整的错误处理：
- 如果任何步骤失败，会显示错误信息并退出
- 提供详细的日志输出，便于调试
- 支持彩色输出，提高可读性

## 自定义配置

你可以修改 `scripts/release.js` 文件来自定义：

- 需要更新版本号的文件列表
- 版本号匹配的正则表达式
- 发布流程的步骤
- 日志输出格式

## 示例输出

```
🚀 开始自动化发布流程...
版本类型: patch
执行命令: git status --porcelain
Git状态检查通过
执行命令: npm whoami
已登录npm账户: your-username
执行命令: npm version patch --no-git-tag-version
新版本号: 0.1.12
更新源文件中的版本号到: 0.1.12
已更新文件: src/index.ts
执行命令: pnpm run build
项目构建完成
执行命令: npm publish
✅ 成功发布版本 0.1.12 到npm
执行命令: git add .
执行命令: git commit -m "chore: release v0.1.12"
执行命令: git tag v0.1.12
执行命令: git push origin main
执行命令: git push origin v0.1.12
✅ Git标签 v0.1.12 创建并推送成功
🎉 发布流程完成！
📦 包版本: 0.1.12
🔗 npm链接: https://www.npmjs.com/package/vite-plugin-crx-mv3-envs
```
