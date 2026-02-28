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
      '**Windows:** 프로젝트 폴더에서 `run.bat` 더블클릭 (npm 설치 여부 확인 후 `npm install` → `npm run dev` 실행)',
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
      '  echo npm이 설치되어 있지 않습니다. Node.js를 설치해 주세요.',
      '  echo https://nodejs.org',
      '  pause',
      '  exit /b 1',
      ')',
      '',
      'echo npm install 실행 중...',
      'npm install',
      'if %errorlevel% neq 0 (',
      '  echo npm install 실패.',
      '  pause',
      '  exit /b 1',
      ')',
      '',
      'echo 개발 서버 실행 중...',
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
    var tailwindIncluded = getTailwindInclude();

    var zip = new JSZip();
    var srcFolder = zip.folder(projectName + '/src');

    zip.file(projectName + '/package.json', getPackageJson(projectName, extraPackages, tailwindIncluded));
    zip.file(projectName + '/vite.config.js', getViteConfig());
    zip.file(projectName + '/index.html', getIndexHtml(projectName));
    zip.file(projectName + '/.gitignore', getGitignore());
    zip.file(projectName + '/README.md', getReadme(projectName));
    zip.file(projectName + '/run.bat', getRunBat());
    srcFolder.file('App.jsx', appCode);
    srcFolder.file('main.jsx', getMainJsx(tailwindIncluded));

    if (tailwindIncluded) {
      zip.file(projectName + '/tailwind.config.js', getTailwindConfig());
      zip.file(projectName + '/postcss.config.js', getPostcssConfig());
      srcFolder.file('index.css', getIndexCss());
    }

    zip.generateAsync({ type: 'blob' }).then(function (content) {
      saveAs(content, projectName + '.zip');
    });
  }

  window.generateProject = generateProject;
})();
