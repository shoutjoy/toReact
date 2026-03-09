(function () {
  'use strict';

  var SCRIPT_TAG_END = '</script>';

  function getProjectName() {
    var el = document.getElementById('projectName');
    return el ? (el.value || '').trim() : '';
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

  function generateProject(forceContinue) {
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
    if (!projectName) {
      showError('프로젝트 이름(폴더명)을 입력해 주세요. 이름을 입력한 뒤 다시 Generate ZIP을 실행하세요.');
      var nameEl = document.getElementById('projectName');
      if (nameEl) { nameEl.focus(); nameEl.select(); }
      return;
    }

    if (forceContinue) {
      doGenerateZip();
      return;
    }

    var code = getAppCode();
    var currentCode = (code || '').trim();
    getAllHistory()
      .then(function (items) {
        for (var i = 0; i < items.length; i++) {
          if ((items[i].code || '').trim() === currentCode) {
            showDuplicateZipModal();
            return;
          }
        }
        doGenerateZip();
      })
      .catch(function (err) {
        doGenerateZip();
      });
  }

  function showDuplicateZipModal() {
    var el = document.getElementById('duplicateZipModal');
    if (el) el.classList.add('visible');
  }

  function hideDuplicateZipModal() {
    var el = document.getElementById('duplicateZipModal');
    if (el) el.classList.remove('visible');
  }

  function doGenerateZip() {
    hideDuplicateZipModal();
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
      if (typeof saveToHistory === 'function') saveToHistory();
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

  var DB_NAME = 'StructurizerDB';
  var DB_VERSION = 1;
  var STORE_NAME = 'history';
  var AUTO_SAVE_DELAY = 2000;
  var autoSaveTimer = null;
  var THEME_KEY = 'structurizer-theme';

  function openDB() {
    return new Promise(function (resolve, reject) {
      var r = indexedDB.open(DB_NAME, DB_VERSION);
      r.onerror = function () { reject(r.error); };
      r.onsuccess = function () { resolve(r.result); };
      r.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          var store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  function getCurrentState() {
    var codeEl = document.getElementById('codeArea');
    var projectNameEl = document.getElementById('projectName');
    var tailwindEl = document.getElementById('tailwindInclude');
    var checkboxes = document.querySelectorAll('input[name="extraPkg"]:checked');
    var extraPackages = [];
    for (var i = 0; i < checkboxes.length; i++) extraPackages.push(checkboxes[i].value);
    return {
      projectName: (projectNameEl && projectNameEl.value) || '',
      code: (codeEl && codeEl.value) || '',
      extraPackages: extraPackages,
      tailwindIncluded: tailwindEl ? tailwindEl.checked : true
    };
  }

  function setStateFromData(data) {
    if (!data) return;
    var codeEl = document.getElementById('codeArea');
    var projectNameEl = document.getElementById('projectName');
    var tailwindEl = document.getElementById('tailwindInclude');
    if (projectNameEl && data.projectName != null) projectNameEl.value = data.projectName;
    if (codeEl && data.code != null) codeEl.value = data.code;
    if (tailwindEl && data.tailwindIncluded != null) tailwindEl.checked = !!data.tailwindIncluded;
    var pkgs = data.extraPackages || [];
    var checkboxes = document.querySelectorAll('input[name="extraPkg"]');
    for (var i = 0; i < checkboxes.length; i++) {
      checkboxes[i].checked = pkgs.indexOf(checkboxes[i].value) !== -1;
    }
    syncExtraPackagesFromCode();
  }

  function saveToHistory() {
    var state = getCurrentState();
    if (!state.code.trim()) return;
    var currentCode = state.code.trim();
    getAllHistory()
      .then(function (items) {
        for (var i = 0; i < items.length; i++) {
          if ((items[i].code || '').trim() === currentCode) {
            showError('이미 동일한 컴포넌트 코드가 저장되어 있습니다. 변경 사항이 있을 때만 저장해 주세요.');
            return Promise.reject(new Error('DUPLICATE_CODE'));
          }
        }
        return openDB();
      })
      .then(function (db) {
        if (!db) return;
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        var record = {
          projectName: state.projectName,
          code: state.code,
          extraPackages: state.extraPackages,
          tailwindIncluded: state.tailwindIncluded,
          createdAt: Date.now()
        };
        store.add(record);
        return new Promise(function (res) { tx.oncomplete = res; });
      })
      .then(function () {
        hideError();
        renderHistoryList();
      })
      .catch(function (err) {
        if (err && err.message !== 'DUPLICATE_CODE') console.error('saveToHistory', err);
      });
  }

  function getAllHistory() {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.getAll();
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function getHistoryItem(id) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.get(id);
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function deleteHistoryItem(id) {
    return openDB().then(function (db) {
      return new Promise(function (res) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = res;
      });
    }).then(renderHistoryList);
  }

  function renderHistoryList() {
    var listEl = document.getElementById('historyList');
    if (!listEl) return;
    getAllHistory().then(function (items) {
      items.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      listEl.innerHTML = '';
      items.slice(0, 50).forEach(function (item) {
        var div = document.createElement('div');
        div.className = 'history-item';
        div.setAttribute('data-id', item.id);
        var title = (item.projectName || '작업') + ' – ' + (item.code ? item.code.slice(0, 30).replace(/\n/g, ' ') + '…' : '빈 코드');
        var content = document.createElement('div');
        content.className = 'history-item-content';
        content.innerHTML = '<span>' + escapeHtml(title) + '</span><time>' + formatDate(item.createdAt) + '</time>';
        var delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'history-item-delete';
        delBtn.setAttribute('aria-label', '삭제');
        delBtn.textContent = '×';
        delBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var id = parseInt(div.getAttribute('data-id'), 10);
          deleteHistoryItem(id);
        });
        div.appendChild(content);
        div.appendChild(delBtn);
        div.addEventListener('click', function (e) {
          if (e.target === delBtn || delBtn.contains(e.target)) return;
          var id = parseInt(div.getAttribute('data-id'), 10);
          getHistoryItem(id).then(function (data) {
            setStateFromData(data);
            schedulePreview();
          });
        });
        listEl.appendChild(div);
      });
    }).catch(function (err) { console.error('renderHistoryList', err); });
  }

  function formatDate(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  /** JSX return 부분을 정적 HTML 문자열로 변환 (미리보기용). 반환: { html, errors } */
  function jsxToStaticHtml(code) {
    var errors = [];
    if (!code || typeof code !== 'string') return { html: '', errors: errors };
    var s = code.trim();
    var start = s.search(/\breturn\s*[<(]/);
    if (start === -1) {
      errors.push('return 문을 찾을 수 없습니다.');
      return { html: '', errors: errors };
    }
    s = s.slice(start + 6).trim();
    var open = s.charAt(0);
    if (open === '(') {
      var depth = 1;
      var i = 1;
      var inStr = false, q = '';
      var inExpr = 0;
      for (; i < s.length; i++) {
        var c = s.charAt(i);
        if (inStr) { if (c === q && s.charAt(i - 1) !== '\\') inStr = false; continue; }
        if (c === '"' || c === "'" || c === '`') { inStr = true; q = c; continue; }
        if (inExpr > 0) { if (c === '{') inExpr++; else if (c === '}') inExpr--; continue; }
        if (c === '{') { inExpr = 1; continue; }
        if (c === '(') depth++; else if (c === ')') { depth--; if (depth === 0) break; }
      }
      s = s.slice(1, i).trim();
    } else if (open === '<') {
      var depth = 0;
      var i = 0;
      var inStr = false, q = '';
      var inExpr = 0;
      var startIdx = -1;
      for (i = 0; i < s.length; i++) {
        var c = s.charAt(i);
        if (inStr) { if (c === q && s.charAt(i - 1) !== '\\') inStr = false; continue; }
        if (inExpr > 0) { if (c === '{') inExpr++; else if (c === '}') inExpr--; continue; }
        if (c === '"' || c === "'" || c === '`') { inStr = true; q = c; continue; }
        if (c === '{') { inExpr = 1; continue; }
        if (c === '<') { depth++; if (startIdx === -1) startIdx = i; continue; }
        if (c === '>') { depth--; if (depth === 0) { s = s.slice(startIdx, i + 1); break; } }
      }
      if (depth !== 0) {
        errors.push('JSX 괄호/태그가 일치하지 않습니다.');
        return { html: '', errors: errors };
      }
    } else return { html: '', errors: errors };
    s = s.replace(/\s+/g, ' ').trim();
    s = s.replace(/className\s*=\s*["']([^"']*)["']/g, 'class="$1"');
    s = s.replace(/className\s*=\s*\{[^}]*\}/g, 'class=""');
    s = s.replace(/<>\s*<\/>/g, '');
    s = s.replace(/<>/g, '<div class="fragment">');
    s = s.replace(/<\/>/g, '</div>');
    while (/\{[^{}]*\}/.test(s)) {
      s = s.replace(/\{["']([^"']*)["']\}/g, '$1');
      s = s.replace(/\{`([^`]*)`\}/g, '$1');
      if (/\{[^{}]*\}/.test(s)) s = s.replace(/\{[^{}]*\}/g, '');
    }
    s = s.replace(/<([A-Z][a-zA-Z0-9]*)(\s[^>]*)?\/?\s*>/g, function (_, name, attrs) {
      attrs = (attrs || '').replace(/\s*\/\s*$/, '');
      return '<div class="' + name + '"' + (attrs ? ' ' + attrs.trim() : '') + '></div>';
    });
    var voidTags = /<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\s[^>]*\/?\s*>/gi;
    s = s.replace(voidTags, function (m) { return m.replace(/\/\s*>$/, '>'); });
    return { html: s, errors: errors };
  }

  /** JSX 코드에서 태그/className 구조 추출 (단순 파싱, 폴백용) */
  function parseJsxStructure(code) {
    if (!code || typeof code !== 'string') return null;
    var nodes = [];
    var re = /<([a-z][a-z0-9]*)(?:\s[^>]*?className=(?:["']([^"']*)["']|[\s\S]*?))?[\s>]/g;
    var m;
    while ((m = re.exec(code)) !== null) {
      var tag = m[1];
      var cls = (m[2] || '').trim().slice(0, 80);
      nodes.push({ tag: tag, className: cls });
    }
    return nodes.length ? nodes : null;
  }

  function renderPreview() {
    var code = (document.getElementById('codeArea') && document.getElementById('codeArea').value) || '';
    var placeholder = document.getElementById('previewPlaceholder');
    var iframe = document.getElementById('previewIframe');
    var errorsEl = document.getElementById('previewErrors');
    var errorsBody = document.getElementById('previewErrorsBody');
    if (!placeholder || !iframe) return;
    var result = jsxToStaticHtml(code);
    var html = result.html;
    var useTailwind = document.getElementById('tailwindInclude') && document.getElementById('tailwindInclude').checked;
    if (!html) {
      var nodes = parseJsxStructure(code);
      if (nodes && nodes.length > 0) {
        html = nodes.map(function (n) {
          var cls = n.className ? ' class="' + escapeHtml(n.className) + '"' : '';
          return '<' + n.tag + cls + '></' + n.tag + '>';
        }).join('\n');
        html = '<div class="preview-fallback">' + html + '</div>';
        if (result.errors.length) result.errors.push('return 구문 없이 태그만으로 미리보기를 생성했습니다.');
      }
    }
    if (errorsBody) {
      errorsBody.textContent = result.errors.length ? result.errors.join('\n') : '';
      if (errorsEl) {
        errorsEl.setAttribute('aria-hidden', result.errors.length ? 'false' : 'true');
        errorsEl.classList.toggle('has-error', result.errors.length > 0);
      }
    }
    if (!html) {
      placeholder.style.display = 'block';
      iframe.style.display = 'none';
      try { iframe.srcdoc = ''; } catch (e) {}
      return;
    }
    placeholder.style.display = 'none';
    iframe.style.display = 'block';
    var tailwindLink = useTailwind
      ? '<script src="https://cdn.tailwindcss.com"><\/script>'
      : '';
    var baseCss = 'body{margin:0;padding:12px;font-family:system-ui,sans-serif;}.preview-fallback > * { margin: 6px 0; padding: 8px; border: 1px dashed #ccc; border-radius: 4px; }.fragment{display:contents;}';
    var htmlDoc = '<!DOCTYPE html><html><head><meta charset="utf-8">' + tailwindLink + '<style>' + baseCss + '</style></head><body><div id="root">' + html + '</div></body></html>';
    try {
      iframe.srcdoc = htmlDoc;
    } catch (err) {
      if (errorsBody) {
        errorsBody.textContent = (errorsBody.textContent ? errorsBody.textContent + '\n' : '') + 'iframe 렌더 오류: ' + (err.message || String(err));
        if (errorsEl) { errorsEl.setAttribute('aria-hidden', 'false'); errorsEl.classList.add('has-error'); }
      }
      var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (doc) { doc.open(); doc.write(htmlDoc); doc.close(); }
    }
  }

  var previewTimer = null;
  function schedulePreview() {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(function () {
      renderPreview();
      previewTimer = null;
    }, 400);
  }

  /** 단일 파일 React 컴포넌트(.jsx)로 코드만 저장. VSCode/Cursor에서 React 코드로 열 수 있음 */
  function exportSrc() {
    var code = (document.getElementById('codeArea') && document.getElementById('codeArea').value) || '';
    var projectName = (document.getElementById('projectName') && document.getElementById('projectName').value) || '';
    var fileName = (projectName.trim() || 'Component') + '.jsx';
    var content = '// Single File React Component (React Structurizer MVP by 박중희)\n// VSCode/Cursor: 우하단 "언어 모드"에서 "JavaScript React" 선택 시 JSX 문법 강조\n\n' + code;
    var blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
    if (typeof saveAs !== 'undefined') {
      saveAs(blob, fileName);
    } else {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }

  function exportJSON() {
    var state = getCurrentState();
    state.exportedAt = new Date().toISOString();
    state.app = 'React Structurizer MVP by 박중희';
    var json = JSON.stringify(state, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    if (typeof saveAs !== 'undefined') {
      saveAs(blob, (state.projectName || 'structurizer') + '.json');
    } else {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (state.projectName || 'structurizer') + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }

  function importJSON() {
    var input = document.getElementById('importFile');
    if (!input) return;
    input.value = '';
    input.click();
  }

  function onImportFileChange(e) {
    var file = e.target && e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    var ext = (file.name || '').toLowerCase().split('.').pop();
    reader.onload = function (ev) {
      var text = ev.target.result;
      if (ext === 'json') {
        try {
          var data = JSON.parse(text);
          setStateFromData(data);
          renderHistoryList();
          schedulePreview();
        } catch (err) {
          alert('JSON 파일 형식이 올바르지 않습니다.');
        }
      } else {
        var code = text.replace(/^\/\/ Single File React Component[^\n]*\n?(\/\/[^\n]*\n?)?\s*/i, '').replace(/^\/\*\* Single File React Component[^*]*\*\/\s*\n?/i, '').trim();
        var codeEl = document.getElementById('codeArea');
        if (codeEl) codeEl.value = code;
        syncExtraPackagesFromCode();
        schedulePreview();
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  function scheduleAutoSave() {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(function () {
      saveToHistory();
      autoSaveTimer = null;
    }, AUTO_SAVE_DELAY);
  }

  function getTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || 'light';
    } catch (_) { return 'light'; }
  }

  function setTheme(theme) {
    theme = theme === 'dark' ? 'dark' : 'light';
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : '');
    var btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '다크' : '라이트';
  }

  function toggleTheme() {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }

  var codeArea = document.getElementById('codeArea');
  if (codeArea) {
    codeArea.addEventListener('input', function () {
      syncExtraPackagesFromCode();
      scheduleAutoSave();
      schedulePreview();
    });
    codeArea.addEventListener('paste', function () {
      setTimeout(function () {
        syncExtraPackagesFromCode();
        scheduleAutoSave();
        schedulePreview();
      }, 0);
    });
    syncExtraPackagesFromCode();
  }

  var projectNameEl = document.getElementById('projectName');
  if (projectNameEl) projectNameEl.addEventListener('input', scheduleAutoSave);

  var tailwindEl = document.getElementById('tailwindInclude');
  if (tailwindEl) tailwindEl.addEventListener('change', scheduleAutoSave);

  document.querySelectorAll('input[name="extraPkg"]').forEach(function (cb) {
    cb.addEventListener('change', scheduleAutoSave);
  });

  document.getElementById('btnSave') && document.getElementById('btnSave').addEventListener('click', function () {
    saveToHistory();
  });
  document.getElementById('btnExport') && document.getElementById('btnExport').addEventListener('click', exportSrc);
  document.getElementById('btnImport') && document.getElementById('btnImport').addEventListener('click', importJSON);
  document.getElementById('importFile') && document.getElementById('importFile').addEventListener('change', onImportFileChange);
  document.getElementById('btnTheme') && document.getElementById('btnTheme').addEventListener('click', toggleTheme);
  document.getElementById('themeToggle') && document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('btnClearCode') && document.getElementById('btnClearCode').addEventListener('click', function () {
    var el = document.getElementById('codeArea');
    if (el) el.value = '';
    syncExtraPackagesFromCode();
  });

  document.getElementById('duplicateZipCancel') && document.getElementById('duplicateZipCancel').addEventListener('click', hideDuplicateZipModal);
  document.getElementById('duplicateZipProceed') && document.getElementById('duplicateZipProceed').addEventListener('click', function () {
    hideDuplicateZipModal();
    generateProject(true);
  });

  var sidebar = document.getElementById('sidebar');
  var sidebarToggle = document.getElementById('sidebarToggle');
  var sidebarWrap = document.getElementById('sidebarWrap');
  if (sidebar && sidebarToggle && sidebarWrap) {
    sidebarToggle.addEventListener('click', function () {
      sidebar.classList.toggle('sidebar-hidden');
      sidebarWrap.classList.toggle('sidebar-wrap-collapsed', sidebar.classList.contains('sidebar-hidden'));
      sidebarToggle.textContent = sidebar.classList.contains('sidebar-hidden') ? '▶' : '◀';
      sidebarToggle.title = sidebar.classList.contains('sidebar-hidden') ? '사이드바 표시' : '사이드바 숨기기';
    });
  }

  var SIDEBAR_WIDTH_KEY = 'structurizer_sidebar_width';
  var SIDEBAR_MIN = 180;
  var SIDEBAR_MAX_PCT = 50;

  function getSidebarWidth() {
    var el = document.getElementById('sidebar');
    if (!el) return null;
    var w = el.style.width;
    if (w && w.endsWith('px')) return parseInt(w, 10);
    try {
      var n = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY), 10);
      return isNaN(n) ? null : n;
    } catch (_) { return null; }
  }

  function setSidebarWidth(px) {
    var el = document.getElementById('sidebar');
    if (!el || el.classList.contains('sidebar-hidden')) return;
    var maxPx = window.innerWidth * (SIDEBAR_MAX_PCT / 100);
    if (px >= SIDEBAR_MIN && px <= maxPx) {
      el.style.width = px + 'px';
      try { localStorage.setItem(SIDEBAR_WIDTH_KEY, String(px)); } catch (_) {}
    }
  }

  function initSidebarResize() {
    var handle = document.getElementById('sidebarResizeHandle');
    var sidebarEl = document.getElementById('sidebar');
    if (!handle || !sidebarEl) return;
    var saved = getSidebarWidth();
    if (saved && saved >= SIDEBAR_MIN && !sidebarEl.classList.contains('sidebar-hidden')) {
      sidebarEl.style.width = saved + 'px';
    }
    var startX = 0, startW = 0;
    function onMove(e) {
      var clientX = e.clientX != null ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX);
      if (clientX == null) return;
      var dx = clientX - startX;
      var newW = Math.max(SIDEBAR_MIN, Math.min(window.innerWidth * (SIDEBAR_MAX_PCT / 100), startW + dx));
      setSidebarWidth(newW);
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove, { passive: false });
      document.removeEventListener('touchend', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    handle.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      startX = e.clientX;
      startW = sidebarEl.offsetWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    handle.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startW = sidebarEl.offsetWidth;
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
    }, { passive: true });
  }

  initSidebarResize();

  var PREVIEW_WIDTH_KEY = 'structurizer_preview_width';
  var PREVIEW_MIN = 280;
  var PREVIEW_MAX = 80;

  function getPreviewWidth() {
    var panel = document.getElementById('previewPanel');
    if (!panel) return null;
    var w = panel.style.width;
    if (w && w.endsWith('px')) return parseInt(w, 10);
    try {
      var n = parseInt(localStorage.getItem(PREVIEW_WIDTH_KEY), 10);
      return isNaN(n) ? null : n;
    } catch (_) { return null; }
  }

  function setPreviewWidth(px) {
    var panel = document.getElementById('previewPanel');
    if (!panel) return;
    var maxPx = window.innerWidth * (PREVIEW_MAX / 100);
    if (px >= PREVIEW_MIN && px <= maxPx) {
      panel.style.width = px + 'px';
      try { localStorage.setItem(PREVIEW_WIDTH_KEY, String(px)); } catch (_) {}
    }
  }

  function initPreviewResize() {
    var handle = document.getElementById('previewResizeHandle');
    var panel = document.getElementById('previewPanel');
    if (!handle || !panel) return;
    var saved = getPreviewWidth();
    if (saved && saved >= PREVIEW_MIN) panel.style.width = saved + 'px';
    var startX = 0, startW = 0;
    function onMove(e) {
      var dx = startX - (e.clientX || e.touches && e.touches[0].clientX);
      var newW = Math.max(PREVIEW_MIN, Math.min(window.innerWidth * (PREVIEW_MAX / 100), startW + dx));
      setPreviewWidth(newW);
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove, { passive: false });
      document.removeEventListener('touchend', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    handle.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      startX = e.clientX;
      startW = panel.offsetWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    handle.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startW = panel.offsetWidth;
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onUp);
    }, { passive: true });
  }

  initPreviewResize();
  setTheme(getTheme());
  renderHistoryList();
  renderPreview();
})();
