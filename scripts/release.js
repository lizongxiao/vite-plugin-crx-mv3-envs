#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    log(`执行命令: ${command}`, 'cyan');
    return execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
  } catch (error) {
    log(`命令执行失败: ${command}`, 'red');
    log(`错误信息: ${error.message}`, 'red');
    throw error;
  }
}

function getCurrentVersion() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

function updateVersionInSourceFiles(version) {
  log(`更新源文件中的版本号到: ${version}`, 'yellow');
  
  // 需要更新版本号的文件列表
  const filesToUpdate = [
    'src/index.ts',
    'src/constants.ts',
    'README.md',
    'README.zh_CN.md'
  ];
  
  filesToUpdate.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // 更新版本号的正则表达式模式
      const versionPatterns = [
        // 匹配 "version": "x.x.x" 格式
        /"version":\s*"[^"]+"/g,
        // 匹配 version: "x.x.x" 格式
        /version:\s*"[^"]+"/g,
        // 匹配 @version x.x.x 格式
        /@version\s+[\d.]+/g,
        // 匹配 vx.x.x 格式
        /v\d+\.\d+\.\d+/g
      ];
      
      let updated = false;
      versionPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          if (pattern.source.includes('"version"')) {
            content = content.replace(pattern, `"version": "${version}"`);
          } else if (pattern.source.includes('version:')) {
            content = content.replace(pattern, `version: "${version}"`);
          } else if (pattern.source.includes('@version')) {
            content = content.replace(pattern, `@version ${version}`);
          } else if (pattern.source.includes('v\\d')) {
            content = content.replace(pattern, `v${version}`);
          }
          updated = true;
        }
      });
      
      if (updated) {
        fs.writeFileSync(fullPath, content, 'utf8');
        log(`已更新文件: ${filePath}`, 'green');
      } else {
        log(`文件 ${filePath} 中未找到版本号模式`, 'yellow');
      }
    } else {
      log(`文件不存在: ${filePath}`, 'yellow');
    }
  });
}

function checkGitStatus() {
  log('检查Git状态...', 'blue');
  
  try {
    // 检查是否有未提交的更改
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      log('发现未提交的更改:', 'yellow');
      log(status, 'yellow');
      throw new Error('请先提交所有更改再执行发布');
    }
    
    // 检查是否在正确的分支
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (branch !== 'main' && branch !== 'master') {
      log(`当前分支: ${branch}`, 'yellow');
      log('建议在main或master分支上执行发布', 'yellow');
    }
    
    log('Git状态检查通过', 'green');
  } catch (error) {
    if (error.message.includes('发布已取消')) {
      process.exit(0);
    }
    throw error;
  }
}

function checkNpmLogin() {
  log('检查npm登录状态...', 'blue');
  
  try {
    const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
    log(`已登录npm账户: ${whoami}`, 'green');
    return whoami;
  } catch (error) {
    log('未登录npm，请先执行 npm login', 'red');
    throw error;
  }
}

function runTests() {
  log('运行测试...', 'blue');
  
  try {
    // 如果有测试脚本，运行测试
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.scripts && packageJson.scripts.test) {
      exec('npm test');
    } else {
      log('未找到测试脚本，跳过测试', 'yellow');
    }
  } catch (error) {
    log('测试失败，发布已取消', 'red');
    throw error;
  }
}

function buildProject() {
  log('构建项目...', 'blue');
  exec('pnpm run build');
  log('项目构建完成', 'green');
}

function publishToNpm(versionType = 'patch') {
  log(`发布到npm (${versionType})...`, 'blue');
  
  try {
    // 更新版本号
    exec(`npm version ${versionType} --no-git-tag-version`);
    
    // 获取新版本号
    const newVersion = getCurrentVersion();
    log(`新版本号: ${newVersion}`, 'green');
    
    // 更新源文件中的版本号
    updateVersionInSourceFiles(newVersion);
    
    // 重新构建
    buildProject();
    
    // 发布到npm
    exec('npm publish');
    
    log(`✅ 成功发布版本 ${newVersion} 到npm`, 'green');
    
    return newVersion;
  } catch (error) {
    log('发布失败', 'red');
    throw error;
  }
}

function createGitTag(version) {
  log(`创建Git标签: v${version}`, 'blue');
  
  try {
    exec(`git add .`);
    exec(`git commit -m "chore: release v${version}"`);
    exec(`git tag v${version}`);
    exec(`git push origin main`);
    exec(`git push origin v${version}`);
    
    log(`✅ Git标签 v${version} 创建并推送成功`, 'green');
  } catch (error) {
    log('Git标签创建失败', 'red');
    throw error;
  }
}

function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch'; // patch, minor, major
  
  if (!['patch', 'minor', 'major'].includes(versionType)) {
    log('无效的版本类型，请使用: patch, minor, major', 'red');
    process.exit(1);
  }
  
  log('🚀 开始自动化发布流程...', 'magenta');
  log(`版本类型: ${versionType}`, 'cyan');
  
  try {
    // 1. 检查Git状态
    checkGitStatus();
    
    // 2. 检查npm登录状态
    checkNpmLogin();
    
    // 3. 运行测试
    runTests();
    
    // 4. 发布到npm
    const newVersion = publishToNpm(versionType);
    
    // 5. 创建Git标签
    createGitTag(newVersion);
    
    log('🎉 发布流程完成！', 'green');
    log(`📦 包版本: ${newVersion}`, 'cyan');
    log(`🔗 npm链接: https://www.npmjs.com/package/vite-plugin-crx-mv3-envs`, 'cyan');
    
  } catch (error) {
    log(`❌ 发布失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  main,
  updateVersionInSourceFiles,
  getCurrentVersion,
  publishToNpm,
  buildProject
};
