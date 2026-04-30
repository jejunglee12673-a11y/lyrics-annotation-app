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
];

let lines = [];
let memos = [];

function onTitleChange() {
  save();
  renderCard();
}

function save() {
  const title = document.getElementById('titleInput').value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, lines, memos }));
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
  // 行が一致する場合は既存メモを引き継ぐ
  const newMemos = newLines.map(line => {
    const i = lines.indexOf(line);
    return i !== -1 ? memos[i] : '';
  });
  lines = newLines;
  memos = newMemos;
  render();
  renderCard();
  save();
}

function clearAll() {
  if (!confirm('すべてのデータを消去しますか？')) return;
  lines = [];
  memos = [];
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

function render() {
  const list = document.getElementById('annotationList');

  if (lines.length === 0) {
    list.innerHTML = '<div class="empty-state">歌詞を入力して「セット」を押してください</div>';
    return;
  }

  list.innerHTML = lines.map((line, i) => {
    const isEmpty = line.trim() === '';
    const lyricHtml = isEmpty
      ? '<span class="lyric empty-line">（空行）</span>'
      : `<span class="lyric">${esc(line)}</span>`;

    const tagBtns = TAGS.map(t =>
      `<button class="tag" onclick="insertTag(${i},'${t.symbol}')" title="${t.label}">${t.symbol}</button>`
    ).join('');

    return `
      <div class="row">
        <div class="row-top">
          <span class="line-no">${i + 1}</span>
          ${lyricHtml}
        </div>
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
      <span class="card-lyric">${esc(line) || '　'}</span>
      <span class="card-memo">${esc(memos[i] || '')}</span>
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
