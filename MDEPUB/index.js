(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────
  let splitLevel = 'h1';
  let pendingMeta = null;

  const STORAGE_KEY = 'mdepub_meta';

  // ── DOM refs ──────────────────────────────────────────────────────
  const mdInput      = document.getElementById('md-input');
  const dropZone     = document.getElementById('drop-zone');
  const fileInput    = document.getElementById('file-input');
  const wordCount    = document.getElementById('word-count');
  const chapterCount = document.getElementById('chapter-count');
  const splitToggle  = document.getElementById('split-toggle');
  const downloadBtn  = document.getElementById('download-btn');

  const metaOverlay  = document.getElementById('meta-overlay');
  const metaForm     = document.getElementById('meta-form');
  const metaCancel   = document.getElementById('meta-cancel');
  const metaTitle    = document.getElementById('meta-title');
  const metaAuthor   = document.getElementById('meta-author');
  const metaDate     = document.getElementById('meta-date');
  const metaLang     = document.getElementById('meta-lang');

  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingMsg     = document.getElementById('loading-msg');

  // ── Init ──────────────────────────────────────────────────────────
  metaDate.value = new Date().toISOString().slice(0, 10);
  loadSavedMeta();
  updateStats();

  // ── Markdown input ────────────────────────────────────────────────
  mdInput.addEventListener('input', updateStats);

  function updateStats() {
    const text = mdInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chapters = text ? splitMarkdown(text).length : 0;
    wordCount.textContent    = words.toLocaleString() + ' WORDS';
    chapterCount.textContent = chapters + ' CHAPTER' + (chapters !== 1 ? 'S' : '');

    // Auto-detect title for metadata pre-fill
    const h1Match = text.match(/^#\s+(.+)$/m);
    if (h1Match && !metaTitle.value) {
      metaTitle.value = h1Match[1].trim();
    }
  }

  // ── File drop / input ─────────────────────────────────────────────
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  });

  fileInput.addEventListener('change', e => {
    if (e.target.files[0]) readFile(e.target.files[0]);
  });

  function readFile(file) {
    const reader = new FileReader();
    reader.onload = ev => {
      mdInput.value = ev.target.result;
      document.getElementById('drop-label').textContent = file.name;
      updateStats();
    };
    reader.readAsText(file);
  }

  // ── Split toggle ──────────────────────────────────────────────────
  splitToggle.addEventListener('click', e => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    splitToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    splitLevel = btn.dataset.val;
    updateStats();
  });

  // ── Download button ───────────────────────────────────────────────
  downloadBtn.addEventListener('click', () => {
    const md = mdInput.value.trim();
    if (!md) return alert('PASTE SOME MARKDOWN FIRST!');

    const meta = collectMeta();
    if (!meta.title || !meta.author) {
      pendingMeta = null;
      openMetaModal();
    } else {
      startGeneration(md, meta);
    }
  });

  // ── Metadata modal ────────────────────────────────────────────────
  function openMetaModal() {
    metaOverlay.classList.remove('hidden');
    if (!metaTitle.value) {
      const h1Match = mdInput.value.match(/^#\s+(.+)$/m);
      if (h1Match) metaTitle.value = h1Match[1].trim();
    }
    metaTitle.focus();
  }

  function closeMetaModal() {
    metaOverlay.classList.add('hidden');
  }

  metaCancel.addEventListener('click', closeMetaModal);

  metaForm.addEventListener('submit', e => {
    e.preventDefault();
    const meta = collectMeta();
    if (!meta.title || !meta.author) return;
    saveMeta(meta);
    closeMetaModal();
    startGeneration(mdInput.value.trim(), meta);
  });

  function collectMeta() {
    return {
      title:  metaTitle.value.trim(),
      author: metaAuthor.value.trim(),
      date:   metaDate.value || new Date().toISOString().slice(0, 10),
      lang:   metaLang.value || 'es'
    };
  }

  function saveMeta(meta) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meta)); } catch (_) {}
  }

  function loadSavedMeta() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.title)  metaTitle.value  = saved.title;
      if (saved.author) metaAuthor.value = saved.author;
      if (saved.lang)   metaLang.value   = saved.lang;
    } catch (_) {}
  }

  // ── Generation ────────────────────────────────────────────────────
  async function startGeneration(md, meta) {
    showLoading('SPLITTING CHAPTERS...');
    await tick();

    const chapters = splitMarkdown(md);

    showLoading('CONVERTING MARKDOWN...');
    await tick();

    const chapterFiles = chapters.map((ch, i) => ({
      id: 'chapter-' + String(i + 1).padStart(3, '0'),
      title: ch.title,
      xhtml: markdownToXhtml(ch.content, meta.lang)
    }));

    showLoading('PAINTING COVER...');
    await tick();

    const coverPng = await generateCoverPng(meta.title, meta.author);

    showLoading('ASSEMBLING EPUB...');
    await tick();

    const uuid = generateUUID();
    const enc  = new TextEncoder();

    const files = {};

    // mimetype MUST be first and uncompressed
    files['mimetype'] = [enc.encode('application/epub+zip'), { level: 0 }];

    files['META-INF/container.xml'] = enc.encode(buildContainerXml());

    files['OEBPS/content.opf'] = enc.encode(buildOpf(meta, uuid, chapterFiles));

    files['OEBPS/nav.xhtml'] = enc.encode(buildNav(meta, chapterFiles));

    files['OEBPS/toc.ncx'] = enc.encode(buildNcx(meta, uuid, chapterFiles));

    files['OEBPS/cover.xhtml'] = enc.encode(buildCoverXhtml(meta.lang));

    files['OEBPS/Images/cover.png'] = coverPng;

    files['OEBPS/Styles/style.css'] = enc.encode(buildEpubCss());

    // Fonts folder placeholder
    files['OEBPS/Fonts/.keep'] = enc.encode('');

    chapterFiles.forEach(ch => {
      files[`OEBPS/Text/${ch.id}.xhtml`] = enc.encode(ch.xhtml);
    });

    showLoading('ZIPPING...');
    await tick();

    const zipped = fflate.zipSync(files);
    const blob   = new Blob([zipped], { type: 'application/epub+zip' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = slugify(meta.title) + '.epub';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    hideLoading();
    saveMeta(meta);
  }

  // ── Chapter splitting ─────────────────────────────────────────────
  function splitMarkdown(md) {
    const pattern = splitLevel === 'h1h2' ? /^(#{1,2} .+)$/gm : /^(# .+)$/gm;
    const parts   = md.split(pattern);

    const chapters = [];

    if (parts[0].trim()) {
      chapters.push({ title: 'Preface', content: parts[0].trim() });
    }

    for (let i = 1; i < parts.length; i += 2) {
      const heading = parts[i];
      const body    = parts[i + 1] || '';
      const title   = heading.replace(/^#{1,2}\s+/, '').trim();
      chapters.push({ title, content: heading + '\n' + body.trim() });
    }

    if (!chapters.length) {
      chapters.push({ title: 'Content', content: md });
    }

    return chapters;
  }

  // ── Markdown → XHTML ──────────────────────────────────────────────
  function markdownToXhtml(md, lang) {
    const html = marked.parse(md, { gfm: true, breaks: false });
    const body = fixXhtml(html);
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${lang}" xml:lang="${lang}">
<head>
  <title></title>
  <link rel="stylesheet" type="text/css" href="../Styles/style.css" />
</head>
<body>
${body}
</body>
</html>`;
  }

  function fixXhtml(html) {
    // Self-close void elements
    return html
      .replace(/<br\s*>/gi, '<br />')
      .replace(/<hr\s*>/gi, '<hr />')
      .replace(/<img([^>]*?)(?<!\/)>/gi, '<img$1 />')
      .replace(/<input([^>]*?)(?<!\/)>/gi, '<input$1 />')
      .replace(/<col([^>]*?)(?<!\/)>/gi, '<col$1 />')
      .replace(/<wbr\s*>/gi, '<wbr />');
  }

  // ── ePub XML builders ─────────────────────────────────────────────
  function buildContainerXml() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  }

  function buildOpf(meta, uuid, chapters) {
    const modified = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const items = chapters.map(ch =>
      `    <item id="${ch.id}" href="Text/${ch.id}.xhtml" media-type="application/xhtml+xml"/>`
    ).join('\n');
    const spine = chapters.map(ch =>
      `    <itemref idref="${ch.id}"/>`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId" xml:lang="${meta.lang}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:${uuid}</dc:identifier>
    <dc:title>${escXml(meta.title)}</dc:title>
    <dc:creator>${escXml(meta.author)}</dc:creator>
    <dc:date>${meta.date}</dc:date>
    <dc:language>${meta.lang}</dc:language>
    <meta property="dcterms:modified">${modified}</meta>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="cover-image" href="Images/cover.png" media-type="image/png" properties="cover-image"/>
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="Styles/style.css" media-type="text/css"/>
${items}
  </manifest>
  <spine toc="ncx">
    <itemref idref="cover"/>
${spine}
  </spine>
</package>`;
  }

  function buildNav(meta, chapters) {
    const items = chapters.map((ch, i) =>
      `      <li><a href="Text/${ch.id}.xhtml">${escXml(ch.title)}</a></li>`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${meta.lang}" xml:lang="${meta.lang}">
<head><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Contents</h1>
    <ol>
${items}
    </ol>
  </nav>
</body>
</html>`;
  }

  function buildNcx(meta, uuid, chapters) {
    const points = chapters.map((ch, i) => `  <navPoint id="np-${i + 1}" playOrder="${i + 1}">
    <navLabel><text>${escXml(ch.title)}</text></navLabel>
    <content src="Text/${ch.id}.xhtml"/>
  </navPoint>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="${meta.lang}">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escXml(meta.title)}</text></docTitle>
  <navMap>
${points}
  </navMap>
</ncx>`;
  }

  function buildCoverXhtml(lang) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${lang}" xml:lang="${lang}">
<head>
  <title>Cover</title>
  <style type="text/css">body{margin:0;padding:0;}img{max-width:100%;height:auto;display:block;}</style>
</head>
<body>
  <img src="../Images/cover.png" alt="Cover" />
</body>
</html>`;
  }

  function buildEpubCss() {
    return `body{margin:5%;font-family:serif;font-size:1em;line-height:1.6;}
h1,h2,h3,h4,h5,h6{font-family:sans-serif;line-height:1.3;margin-top:2em;margin-bottom:0.4em;}
h1{font-size:2em;}h2{font-size:1.5em;}h3{font-size:1.2em;}
p{margin:0.5em 0;}
pre,code{font-family:monospace;font-size:0.9em;}
pre{overflow:auto;padding:0.8em;border:1px solid #ccc;white-space:pre-wrap;}
blockquote{margin:1em 2em;border-left:3px solid #ccc;padding-left:1em;font-style:italic;}
table{border-collapse:collapse;width:100%;}
th,td{border:1px solid #ccc;padding:0.4em 0.6em;text-align:left;}
th{background:#f0f0f0;}
ul,ol{padding-left:2em;margin:0.5em 0;}
li{margin:0.2em 0;}
img{max-width:100%;height:auto;}
hr{border:none;border-top:1px solid #ccc;margin:1.5em 0;}
a{color:#00f;}`;
  }

  // ── Canvas cover ──────────────────────────────────────────────────
  function generateCoverPng(title, author) {
    return new Promise(resolve => {
      const W = 600, H = 900;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#080818');
      grad.addColorStop(1, '#0c0c28');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Pixel grid overlay (subtle)
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, 1);
      for (let x = 0; x < W; x += 8) ctx.fillRect(x, 0, 1, H);

      // Outer border (neon green, 6px pixel blocks)
      ctx.fillStyle = '#00ff41';
      [0,1,2].forEach(i => {
        ctx.fillRect(i*8, 0, 8, H);
        ctx.fillRect(W-8-i*8, 0, 8, H);
        ctx.fillRect(0, i*8, W, 8);
        ctx.fillRect(0, H-8-i*8, W, 8);
      });

      // Inner border (cyan)
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(28, 28, W-56, 4);
      ctx.fillRect(28, H-32, W-56, 4);
      ctx.fillRect(28, 28, 4, H-56);
      ctx.fillRect(W-32, 28, 4, H-56);

      // Decorative pixel row (center divider)
      ctx.fillStyle = '#ff2d55';
      for (let x = 40; x < W-40; x += 16) {
        ctx.fillRect(x, H/2 + 80, 8, 8);
      }
      ctx.fillStyle = '#ffdd00';
      for (let x = 48; x < W-48; x += 16) {
        ctx.fillRect(x, H/2 + 96, 8, 8);
      }

      // Title text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00ff41';
      const titleLines = wrapText(ctx, title.toUpperCase(), W - 100, 48);
      const titleFont = titleLines.length > 3 ? 36 : 48;
      ctx.font = `bold ${titleFont}px "Courier New", monospace`;
      const titleLines2 = wrapText(ctx, title.toUpperCase(), W - 100, titleFont);
      const titleStartY = H/2 - (titleLines2.length * (titleFont + 10)) / 2 - 20;
      titleLines2.forEach((line, i) => {
        ctx.fillText(line, W/2, titleStartY + i * (titleFont + 10));
      });

      // Author text
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.fillStyle = '#ffdd00';
      ctx.fillText(author.toUpperCase(), W/2, H/2 + 130);

      // Corner pixels (decorative)
      [[40,40],[W-40,40],[40,H-40],[W-40,H-40]].forEach(([x,y]) => {
        ctx.fillStyle = '#ff2d55';
        ctx.fillRect(x-4, y-4, 8, 8);
        ctx.fillRect(x+8, y-4, 8, 8);
        ctx.fillRect(x-4, y+8, 8, 8);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(x+8, y+8, 8, 8);
      });

      canvas.toBlob(blob => {
        blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf)));
      }, 'image/png');
    });
  }

  function wrapText(ctx, text, maxWidth, fontSize) {
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    const words = text.split(' ');
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  // ── Helpers ───────────────────────────────────────────────────────
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function slugify(str) {
    return str.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60) || 'book';
  }

  function escXml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showLoading(msg) {
    loadingMsg.textContent = msg;
    loadingOverlay.classList.remove('hidden');
  }

  function hideLoading() {
    loadingOverlay.classList.add('hidden');
  }

  function tick() {
    return new Promise(r => setTimeout(r, 0));
  }

})();
