const STORAGE_KEY = 'lyrics-annotation-v1';
const TAGS = ['ブレス', 'こぶし', 'しゃくり', 'ハモリ', 'ビブラート', '強調', '弱く', 'タメ'];

let lines = [];
let memos = [];

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, memos }));
  const el = document.getElementById('saveNotice');
  el.textContent = '保存済み ✓';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.textContent = ''; }, 2000);
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const data = JSON.parse(raw);
  lines = data.lines || [];
  memos = data.memos || [];
  if (lines.length > 0) {
    document.getElementById('lyricsInput').value = lines.join('\n');
    render();
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
  save();
}

function clearAll() {
  if (!confirm('すべてのデータを消去しますか？')) return;
  lines = [];
  memos = [];
  document.getElementById('lyricsInput').value = '';
  localStorage.removeItem(STORAGE_KEY);
  render();
}

function updateMemo(i, value) {
  memos[i] = value;
  save();
}

function insertTag(i, tag) {
  const input = document.getElementById('memo-' + i);
  const sep = input.value ? ' ' : '';
  input.value += sep + tag;
  memos[i] = input.value;
  save();
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
      `<button class="tag" onclick="insertTag(${i},'${t}')">${t}</button>`
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
            placeholder="メモを入力（例: ここでブレス）"
            value="${escAttr(memos[i] || '')}"
            oninput="updateMemo(${i}, this.value)"
          >
        </div>
      </div>
    `;
  }).join('');
}

load();
