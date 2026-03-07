(function () {
  'use strict';

  var SCRIPT_TAG_END = '</script>';

  function getProjectName() {
    return document.getElementById('projectName').value || 'generated-react-app';
  }

  function getAppCode() {
    return document.getElementById('codeArea').value.trim();
  }

  function getExtraPackages() {
    var checkboxes = document.querySelectorAll('input[name="extraPkg"]:checked');
    var list = [];
    for (var i = 0; i < checkboxes.length; i++) {
      var val = checkboxes[i].value;
      if (val) list.push(val);
    }
    return list;
  }

  /** 코드에서 import/require 로 사용된 패키지명만 추출 (배열 반환) */
  function getPackagesFromCode(code) {
    var packages = Object.create(null);
    if (!code || typeof code !== 'string') return [];
    var fromRegex = /from\s+['"]([^'"]+)['"]/g;
    var requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    var m;
    while ((m = fromRegex.exec(code)) !== null) {
      var pkg = m[1].split('/')[0].trim();
      if (pkg && pkg !== 'react' && pkg !== 'react-dom') packages[pkg] = true;
    }
    while ((m = requireRegex.exec(code)) !== null) {
      var pkg = m[1].split('/')[0].trim();
      if (pkg && pkg !== 'react' && pkg !== 'react-dom') packages[pkg] = true;
    }
    return Object.keys(packages);
  }

  /** 코드에서 import/require 패키지명 추출 후, 추가 npm 패키지 체크박스 자동 선택 */
  function syncExtraPackagesFromCode() {
    var code = (document.getElementById('codeArea') && document.getElementById('codeArea').value) || '';
    var packages = Object.create(null);
    var fromRegex = /from\s+['"]([^'"]+)['"]/g;
    var requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    var m;
    while ((m = fromRegex.exec(code)) !== null) {
      var pkg = m[1].split('/')[0];
      if (pkg && pkg !== 'react' && pkg !== 'react-dom') packages[pkg] = true;
    }
    while ((m = requireRegex.exec(code)) !== null) {
      var pkg = m[1].split('/')[0];
      if (pkg && pkg !== 'react' && pkg !== 'react-dom') packages[pkg] = true;
    }
    var checkboxes = document.querySelectorAll('input[name="extraPkg"]');
    for (var i = 0; i < checkboxes.length; i++) {
      var cb = checkboxes[i];
      cb.checked = !!packages[cb.value];
    }
  }

  function getTailwindInclude() {
    var el = document.getElementById('tailwindInclude');
    return el ? el.checked : false;
  }

  function showError(msg) {
    var el = document.getElementById('errorMsg');
    el.style.display = 'block';
    el.innerHTML = msg;
  }

  function hideError() {
    document.getElementById('errorMsg').style.display = 'none';
  }

  function setProgress(percent, text) {
    var wrap = document.getElementById('progressWrap');
    var fill = document.getElementById('progressFill');
    var txt = document.getElementById('progressText');
    if (!wrap || !fill || !txt) return;
    percent = Math.min(100, Math.max(0, percent));
    wrap.classList.add('visible');
    fill.style.width = percent + '%';
    txt.textContent = text != null ? text : percent + '%';
  }

  function hideProgress() {
    var wrap = document.getElementById('progressWrap');
    if (wrap) wrap.classList.remove('visible');
  }

  function getDefaultAppJsx() {
    return [
      'function App() {',
      '  return (',
      '    <div style={{ padding: 20 }}>',
      '      <h1>Generated React App</h1>',
      '      <p>App.jsx 코드를 붙여넣은 뒤 ZIP을 다시 생성하세요.</p>',
      '    </div>',
      '  )',
      '}',
      'export default App'
    ].join('\n');
  }

  function getPackageJson(projectName, extraPackages, tailwindIncluded) {
    var deps = ['"react": "^18.2.0"', '"react-dom": "^18.2.0"'];
    extraPackages.forEach(function (pkg) {
      var name = (pkg.split('/')[0]).replace(/@/g, '').replace(/\s/g, '');
      if (name && name !== 'react' && name !== 'react-dom') {
        deps.push('"' + pkg.replace(/"/g, '\\"') + '": "*"');
      }
    });
    var devDeps = ['"vite": "^5.0.0"', '"@vitejs/plugin-react": "^4.0.0"'];
    if (tailwindIncluded) {
      devDeps.push('"tailwindcss": "^3.4.0"', '"postcss": "^8.4.0"', '"autoprefixer": "^10.4.0"');
    }
    return [
      '{',
      '  "name": "' + projectName.replace(/"/g, '\\"') + '",',
      '  "private": true,',
      '  "version": "1.0.0",',
      '  "type": "module",',
      '  "scripts": {',
      '    "dev": "vite",',
      '    "build": "vite build",',
      '    "preview": "vite preview"',
      '  },',
      '  "dependencies": {',
      '    ' + deps.join(',\n    ') + '\n  },',
      '  "devDependencies": {',
      '    ' + devDeps.join(',\n    ') + '\n  }',
      '}'
    ].join('\n');
  }

  function getViteConfig() {
    return [
      "import { defineConfig } from 'vite'",
      "import react from '@vitejs/plugin-react'",
      '',
      'export default defineConfig({',
      '  plugins: [react()],',
      '})'
    ].join('\n');
  }

  function getMainJsx(tailwindIncluded) {
    var lines = [
      "import React from 'react'",
      "import ReactDOM from 'react-dom/client'",
      "import App from './App'"
    ];
    if (tailwindIncluded) {
      lines.push("import './index.css'");
    }
    lines.push(
      '',
      'class ErrorBoundary extends React.Component {',
      "  state = { hasError: false, message: '' }",
      '  static getDerivedStateFromError(err) {',
      "    return { hasError: true, message: err?.message || String(err) }",
      '  }',
      '  componentDidCatch(err, info) {',
      '    console.error(err, info)',
      '  }',
      '  render() {',
      '    if (this.state.hasError)',
      '      return (',
      '        <div style={{ padding: 20, fontFamily: "sans-serif" }}>',
      '          <h2>렌더링 오류</h2>',
      '          <pre style={{ background: "#f5f5f5", padding: 10 }}>{this.state.message}</pre>',
      '          <button onClick={() => this.setState({ hasError: false })}>다시 시도</button>',
      '        </div>',
      '      )',
      '    return this.props.children',
      '  }',
      '}',
      '',
      "ReactDOM.createRoot(document.getElementById('root')).render(",
      '  <React.StrictMode>',
      '    <ErrorBoundary>',
      '      <App />',
      '    </ErrorBoundary>',
      '  </React.StrictMode>,',
      ')'
    );
    return lines.join('\n');
  }

  function getIndexHtml(projectName) {
    return [
      '<!doctype html>',
      '<html>',
      '<head>',
      '<meta charset="UTF-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '<title>' + projectName.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</title>',
      '</head>',
      '<body>',
      '<div id="root"></div>',
      '<script type="module" src="/src/main.jsx">' + SCRIPT_TAG_END,
      '</body>',
      '</html>'
    ].join('\n');
  }

  function getGitignore() {
    return [
      '# Dependencies',
      'node_modules',
      '.pnp',
      '.pnp.js',
      '# Build',
      'dist',
      'dist-ssr',
      '*.local',
      '# Editor',
      '.vscode/*',
      '!.vscode/extensions.json',
      '.idea',
      '# Logs',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      '.env',
      '.env.local',
      '.env.*.local'
    ].join('\n');
  }

  function getReadme(projectName) {
    return [
      '# ' + projectName,
      '',
      'React + Vite 프로젝트입니다.',
      '',
      '## 실행 방법',
      '',
      '**Windows:** 압축 해제 후 `실행.bat` 더블클릭. CMD가 열리며 npm 확인 → 필요 시 npm install → npm run dev 자동 실행.',
      '',
      '### ⚠️ 실행 파일(실행.bat) 사용 시 필수',
      '',
      '**실행 파일을 만들었을 때(압축 해제 후 처음 실행할 때)에는 반드시 bat 파일을 차단 해제해야 합니다.**',
      '',
      '1. **실행.bat** 위에서 **마우스 오른쪽 클릭** → **속성**',
      '2. **일반** 탭 맨 아래 **"차단 해제"** 체크 → **확인**',
      '3. 그 다음 **실행.bat** 더블클릭',
      '',
      '### "파일을 복사할 수 없음" / Windows 보안 경고가 뜨는 경우',
      '',
      '인터넷에서 받은 파일로 인식되어 Windows가 차단한 경우입니다. 위와 같이 **실행.bat 우클릭 → 속성 → 차단 해제** 후 다시 실행하세요.',
      '',
      '**또는 터미널에서:**',
      '',
      '```bash',
      'npm install',
      'npm run dev',
      '```',
      '',
      '브라우저에서 http://localhost:5173 으로 접속하세요.',
      '',
      '## 빌드',
      '',
      '```bash',
      'npm run build',
      'npm run preview',
      '```'
    ].join('\n');
  }

  function getRunFirstTxt() {
    return [
      '========================================',
      '  실행.bat 실행 전 꼭 읽어 주세요',
      '========================================',
      '',
      'ZIP 압축 해제 후 실행.bat을 더블클릭했을 때',
      '"파일을 복사할 수 없음" 또는 Windows 보안 경고가',
      '뜨는 경우가 있습니다.',
      '',
      '▶ 해결 방법:',
      '  1. 실행.bat 우클릭',
      '  2. 속성 클릭',
      '  3. 일반 탭 맨 아래 "차단 해제" 체크',
      '  4. 확인 클릭',
      '  5. 다시 실행.bat 더블클릭',
      '',
      '이렇게 하면 정상적으로 실행됩니다.',
      '========================================'
    ].join('\r\n');
  }

  function getIndexCss() {
    return [
      '@tailwind base;',
      '@tailwind components;',
      '@tailwind utilities;'
    ].join('\n');
  }

  function getTailwindConfig() {
    return [
      '/** @type {import(\'tailwindcss\').Config} */',
      'export default {',
      '  content: [',
      '    "./index.html",',
      '    "./src/**/*.{js,ts,jsx,tsx}",',
      '  ],',
      '  theme: {',
      '    extend: {},',
      '  },',
      '  plugins: [],',
      '}'
    ].join('\n');
  }

  function getPostcssConfig() {
    return [
      'export default {',
      '  plugins: {',
      '    tailwindcss: {},',
      '    autoprefixer: {},',
      '  },',
      '}'
    ].join('\n');
  }

  function getRunBat() {
    return [
      '@echo off',
      'chcp 65001 >nul',
      'cd /d "%~dp0"',
      '',
      'where npm >nul 2>nul',
      'if %errorlevel% neq 0 (',
      '  echo [오류] npm이 설치되어 있지 않습니다.',
      '  echo Node.js를 설치한 뒤 다시 실행해 주세요.',
      '  echo https://nodejs.org/ko',
      '  pause',
      '  exit /b 1',
      ')',
      '',
      'if not exist "node_modules\\" (',
      '  echo [처음 실행] 패키지 설치 중... npm install',
      '  npm install',
      '  if %errorlevel% neq 0 (',
      '    echo npm install 실패.',
      '    pause',
      '    exit /b 1',
      '  )',
      '  echo.',
      ') else (',
      '  echo [이미 설치됨] node_modules가 있으므로 npm install을 건너뜁니다.',
      '  echo.',
      ')',
      '',
      'echo 개발 서버 실행 중... npm run dev',
      'npm run dev',
      'pause'
    ].join('\r\n');
  }

  function generateProject() {
    if (typeof JSZip === 'undefined') {
      showError('JSZip을 불러올 수 없습니다. 로컬 서버(<code>npm start</code> 또는 <code>npx http-server . -p 3000 -o</code>)로 실행한 뒤 접속해 주세요.');
      return;
    }
    if (typeof saveAs === 'undefined') {
      showError('FileSaver를 불러올 수 없습니다. 위와 같이 로컬 서버로 접속해 주세요.');
      return;
    }
    hideError();

    var projectName = getProjectName();
    var code = getAppCode();
    var appCode = code || getDefaultAppJsx();
    var extraPackages = getExtraPackages();
    var packagesFromCode = getPackagesFromCode(appCode);
    var allPackages = extraPackages.slice();
    packagesFromCode.forEach(function (pkg) {
      if (allPackages.indexOf(pkg) === -1) allPackages.push(pkg);
    });
    var tailwindIncluded = getTailwindInclude();

    setProgress(0, '0% - 준비 중...');

    var zip = new JSZip();
    var srcFolder = zip.folder(projectName + '/src');

    zip.file(projectName + '/package.json', getPackageJson(projectName, allPackages, tailwindIncluded));
    setProgress(15, '15% - 파일 구성 중...');
    zip.file(projectName + '/vite.config.js', getViteConfig());
    zip.file(projectName + '/index.html', getIndexHtml(projectName));
    zip.file(projectName + '/.gitignore', getGitignore());
    zip.file(projectName + '/README.md', getReadme(projectName));
    zip.file(projectName + '/실행 전 읽기.txt', getRunFirstTxt());
    zip.file(projectName + '/실행.bat', getRunBat());
    srcFolder.file('App.jsx', appCode);
    srcFolder.file('main.jsx', getMainJsx(tailwindIncluded));
    setProgress(30, '30% - ZIP 압축 중...');

    if (tailwindIncluded) {
      zip.file(projectName + '/tailwind.config.js', getTailwindConfig());
      zip.file(projectName + '/postcss.config.js', getPostcssConfig());
      srcFolder.file('index.css', getIndexCss());
    }

    var progressValue = 30;
    var progressInterval = setInterval(function () {
      if (progressValue < 90) {
        progressValue = Math.min(90, progressValue + 8);
        setProgress(progressValue, progressValue + '% - ZIP 압축 중...');
      }
    }, 200);

    zip.generateAsync({ type: 'blob' }).then(function (content) {
      clearInterval(progressInterval);
      setProgress(100, '100% - 완료! 다운로드 중...');
      saveAs(content, projectName + '.zip');
      setTimeout(function () {
        hideProgress();
      }, 1500);
    }).catch(function (err) {
      clearInterval(progressInterval);
      hideProgress();
      showError('ZIP 생성 실패: ' + (err && err.message ? err.message : String(err)));
    });
  }

  window.generateProject = generateProject;

  var codeArea = document.getElementById('codeArea');
  if (codeArea) {
    codeArea.addEventListener('input', syncExtraPackagesFromCode);
    codeArea.addEventListener('paste', function () {
      setTimeout(syncExtraPackagesFromCode, 0);
    });
    syncExtraPackagesFromCode();
  }
})();
