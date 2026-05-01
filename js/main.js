const STORAGE_KEY = 'lyrics-annotation-v1';
const TAGS = [
  { label: 'ブレス',    symbol: '／' },
  { label: 'こぶし',    symbol: '〰' },
  { label: 'しゃくり',  symbol: '↗' },
  { label: 'ハモリ',    symbol: 'H'  },
  { label: 'ビブラート', symbol: '〜' },
  { label: '強調',      symbol: '●' },
  { label: '弱く',      symbol: '○' },
  { label: 'タメ',      symbol: '⌒' },
  { label: '空欄',      symbol: '□' },
];

let lines = [];
let memos = [];
let falsetto = [];
let editingIndex = -1;

function onTitleChange() {
  save();
  renderCard();
}

function save() {
  const title = document.getElementById('titleInput').value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, lines, memos, falsetto }));
  const el = document.getElementById('saveNotice');
  el.textContent = '保存済み ✓';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.textContent = ''; }, 2000);
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    document.getElementById('titleInput').value = data.title || '';
    lines = data.lines || [];
    memos = data.memos || [];
    falsetto = data.falsetto || lines.map(() => false);
    if (lines.length > 0) {
      document.getElementById('lyricsInput').value = lines.join('\n');
      render();
    }
    renderCard();
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
    render();
    renderCard();
  }
}

function parseLyrics() {
  const text = document.getElementById('lyricsInput').value;
  if (!text.trim()) return;
  const newLines = text.split('\n');
  lines = lines.concat(newLines);
  memos = memos.concat(newLines.map(() => ''));
  falsetto = falsetto.concat(newLines.map(() => false));
  document.getElementById('lyricsInput').value = '';
  render();
  renderCard();
  save();
}

function clearAll() {
  if (!confirm('すべてのデータを消去しますか？')) return;
  lines = [];
  memos = [];
  falsetto = [];
  document.getElementById('titleInput').value = '';
  document.getElementById('lyricsInput').value = '';
  localStorage.removeItem(STORAGE_KEY);
  render();
  renderCard();
}

function updateMemo(i, value) {
  memos[i] = value;
  save();
  renderCard();
}

function insertTag(i, symbol) {
  const input = document.getElementById('memo-' + i);
  const sep = input.value ? ' ' : '';
  input.value += sep + symbol;
  memos[i] = input.value;
  save();
  renderCard();
  input.focus();
}

function esc(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escAttr(str) {
  return str.replace(/"/g,'&quot;');
}

// □ を幅だけ保って不可視にする（印刷プレビュー用）
function memoToCardHtml(memo) {
  return esc(memo).replace(/□/g, '<span class="memo-blank">□</span>');
}

function toggleFalsetto(i) {
  falsetto[i] = !falsetto[i];
  render();
  renderCard();
  save();
}

function startEdit(i) {
  editingIndex = i;
  render();
  const input = document.getElementById('lyric-edit');
  if (input) input.focus();
}

function saveEdit(i) {
  const input = document.getElementById('lyric-edit');
  if (input) lines[i] = input.value;
  editingIndex = -1;
  render();
  renderCard();
  save();
}

function cancelEdit() {
  editingIndex = -1;
  render();
}

function render() {
  const list = document.getElementById('annotationList');

  if (lines.length === 0) {
    list.innerHTML = '<div class="empty-state">歌詞を入力して「セット」を押してください</div>';
    return;
  }

  list.innerHTML = lines.map((line, i) => {
    const isEmpty = line.trim() === '';
    const fc = falsetto[i] ? ' lyric-falsetto' : '';
    const lyricHtml = isEmpty
      ? `<span class="lyric empty-line${fc}">（空行）</span>`
      : `<span class="lyric${fc}">${esc(line)}</span>`;

    const tagBtns = TAGS.map(t =>
      `<button class="tag" onclick="insertTag(${i},'${t.symbol}')" title="${t.label}">${t.symbol}</button>`
    ).join('');

    const rowTop = editingIndex === i
      ? `<div class="row-top">
           <span class="line-no">${i + 1}</span>
           <input class="lyric-edit-input" id="lyric-edit" value="${escAttr(line)}"
             onkeydown="if(event.key==='Enter')saveEdit(${i});if(event.key==='Escape')cancelEdit()">
           <button class="btn-save-edit" onclick="saveEdit(${i})">保存</button>
           <button class="btn-cancel-edit" onclick="cancelEdit()">キャンセル</button>
         </div>`
      : `<div class="row-top">
           <span class="line-no">${i + 1}</span>
           ${lyricHtml}
           <button class="${falsetto[i] ? 'btn-falsetto active' : 'btn-falsetto'}" onclick="toggleFalsetto(${i})">ファルセット</button>
           <button class="btn-edit" onclick="startEdit(${i})">編集</button>
         </div>`;

    return `
      <div class="row">
        ${rowTop}
        <div class="tags">${tagBtns}</div>
        <div class="memo-wrap">
          <input
            class="memo-input"
            id="memo-${i}"
            type="text"
            placeholder="メモを入力"
            value="${escAttr(memos[i] || '')}"
            oninput="updateMemo(${i}, this.value)"
          >
        </div>
      </div>
    `;
  }).join('');
}

function renderCard() {
  const title = document.getElementById('titleInput').value.trim();
  const card = document.getElementById('lyricsCard');

  if (lines.length === 0) {
    card.innerHTML = '<div class="card-empty">歌詞がありません</div>';
    return;
  }

  const titleHtml = title
    ? `<div class="card-song-title">${esc(title)}</div>`
    : '';

  const rowsHtml = lines.map((line, i) => `
    <div class="card-row">
      <span class="card-line-no">${i + 1}</span>
      <span class="card-lyric${falsetto[i] ? ' card-lyric-falsetto' : ''}">${esc(line) || '　'}</span>
      <span class="card-memo">${memoToCardHtml(memos[i] || '')}</span>
    </div>
  `).join('');

  const legendHtml = `
    <div class="card-legend">
      ／=ブレス &nbsp;〰=こぶし &nbsp;↗=しゃくり &nbsp;H=ハモリ &nbsp;〜=ビブラート &nbsp;●=強調 &nbsp;○=弱く &nbsp;⌒=タメ
    </div>
  `;

  card.innerHTML = titleHtml + rowsHtml + legendHtml;
}

load();
