// Biblia Bilingue - App Logic
const BOOK_ORDER = [
    'Génesis','Éxodo','Levítico','Números','Deuteronomio',
    'Josué','Jueces','Rut','1 Samuel','2 Samuel',
    '1 Reyes','2 Reyes','1 Crónicas','2 Crónicas','Esdras',
    'Nehemías','Ester','Job','Salmos','Proverbios',
    'Eclesiastés','Cantares','Isaías','Jeremías','Lamentaciones',
    'Ezequiel','Daniel','Oseas','Joel','Amós',
    'Abdías','Jonás','Miqueas','Nahúm','Habacuc',
    'Sofonías','Hageo','Zacarías','Malaquías',
    'Mateo','Marcos','Lucas','Juan','Hechos',
    'Romanos','1 Corintios','2 Corintios','Gálatas','Efesios',
    'Filipenses','Colosenses','1 Tesalonicenses','2 Tesalonicenses',
    '1 Timoteo','2 Timoteo','Tito','Filemón','Hebreos',
    'Santiago','1 Pedro','2 Pedro','1 Juan','Judas','Apocalipsis'
];

const OLD_TESTAMENT = BOOK_ORDER.slice(0, 39);
const NEW_TESTAMENT = BOOK_ORDER.slice(39);

const BOOK_KO = {
    'Génesis': '창세기', 'Éxodo': '출애굽기', 'Levítico': '레위기', 'Números': '민수기',
    'Deuteronomio': '신명기', 'Josué': '여호수아', 'Jueces': '사사기', 'Rut': '룻기',
    '1 Samuel': '사무엘상', '2 Samuel': '사무엘하', '1 Reyes': '열왕기상', '2 Reyes': '열왕기하',
    '1 Crónicas': '역대상', '2 Crónicas': '역대하', 'Esdras': '에스라', 'Nehemías': '느헤미야',
    'Ester': '에스더', 'Job': '욥기', 'Salmos': '시편', 'Proverbios': '잠언',
    'Eclesiastés': '전도서', 'Cantares': '아가', 'Isaías': '이사야', 'Jeremías': '예레미야',
    'Lamentaciones': '예레미야애가', 'Ezequiel': '에스겔', 'Daniel': '다니엘',
    'Oseas': '호세아', 'Joel': '요엘', 'Amós': '아모스', 'Abdías': '오바댜',
    'Jonás': '요나', 'Miqueas': '미가', 'Nahum': '나훔', 'Habacuc': '하박국',
    'Sofonías': '스바니야', 'Hageo': '하개', 'Zacarías': '스가랴', 'Malaquías': '말라기',
    'Mateo': '마태복음', 'Marcos': '마가복음', 'Lucas': '누가복음', 'Juan': '요한복음',
    'Hechos': '사도행전', 'Romanos': '로마서', '1 Corintios': '고린도전서',
    '2 Corintios': '고린도후서', 'Gálatas': '갈라디아서', 'Efesios': '에베소서',
    'Filipenses': '빌립보서', 'Colosenses': '골로새서', '1 Tesalonicenses': '데살로니가전서',
    '2 Tesalonicenses': '데살로니가후서', '1 Timoteo': '디모데전서', '2 Timoteo': '디모데후서',
    'Tito': '디도서', 'Filemón': '빌레몬서', 'Hebreos': '히브리서',
    'Santiago': '야고보서', '1 Pedro': '베드로전서', '2 Pedro': '베드로후서',
    '1 Juan': '요한일서', 'Judas': '유대서', 'Apocalipsis': '요한계시록'
};

let bibleData = [];
let currentView = 'home';
let currentTestament = 'old';
let currentBook = null;
let currentChapter = 0;
let viewHistory = [];
let searchTimeout = null;
let selectedVerses = new Set();
let langMode = 'dual';
let themes = [];
let currentThemeId = null;
let fontSize = 16;

// Initialize
async function init() {
    updateLoadingProgress(10, 'Cargando base de datos...');
    try {
        const response = await fetch('data/bible-combined.json');
        bibleData = await response.json();
        updateLoadingProgress(80, 'Preparando interfaz...');
    } catch (e) {
        updateLoadingProgress(100, 'Error cargando datos. Recarga la página.');
        console.error(e);
        return;
    }
    loadThemes();
    fontSize = parseInt(localStorage.getItem('font_size') || '16');
    applyFontSize();

    updateLoadingProgress(100, '¡Listo!');
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        updateGitHubStatus();
        initScrubber();
    }, 500);
    loadTheme();
    loadColorTheme();
}

function updateLoadingProgress(percent, text) {
    const bar = document.getElementById('loading-progress');
    const label = document.getElementById('loading-text');
    if (bar) bar.style.width = percent + '%';
    if (label) label.textContent = text;
}

// Theme (dark/light)
function loadTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}

// Font Size
function applyFontSize() {
    const root = document.documentElement;
    if (fontSize <= 14) {
        root.className = 'font-small';
    } else if (fontSize <= 16) {
        root.className = 'font-normal';
    } else if (fontSize <= 18) {
        root.className = 'font-large';
    } else {
        root.className = 'font-xlarge';
    }
    document.getElementById('font-size-label').textContent = fontSize + 'px';
}

function changeFontSize(delta) {
    fontSize = Math.max(12, Math.min(24, fontSize + delta * 2));
    localStorage.setItem('font_size', fontSize);
    applyFontSize();
}

// Tab Bar
function tabAction(action) {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    if (action === 'old') {
        document.querySelectorAll('.tab-item')[0].classList.add('active');
        currentTestament = 'old';
        showBooksView();
    } else if (action === 'new') {
        document.querySelectorAll('.tab-item')[1].classList.add('active');
        currentTestament = 'new';
        showBooksView();
    } else if (action === 'themes') {
        document.querySelectorAll('.tab-item')[2].classList.add('active');
        showThemesView();
    }
}

function openSettings() {
    showSettingsView();
}

// Navigation
let lastBackTap = 0;

function showView(view, pushState = true) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-' + view).classList.remove('hidden');

    const backBtn = document.getElementById('btn-back');
    const titleEl = document.getElementById('header-title');

    const scrubber = document.getElementById('scroll-scrubber');
    const homeBtn = document.getElementById('floating-home');
    if (view === 'reading') {
        scrubber.classList.add('visible');
        homeBtn.classList.remove('hidden');
    } else if (view === 'chapters' || view === 'books') {
        scrubber.classList.remove('visible');
        homeBtn.classList.remove('hidden');
    } else {
        scrubber.classList.remove('visible');
        homeBtn.classList.add('hidden');
    }

    if (view === 'home') {
        backBtn.classList.add('hidden');
        titleEl.textContent = 'Biblia Bilingüe';
    } else {
        backBtn.classList.remove('hidden');
        if (view === 'chapters') {
            titleEl.textContent = getBookDisplayName(currentBook.book);
        } else if (view === 'reading') {
            titleEl.textContent = `${getBookDisplayName(currentBook.book)} ${currentChapter}`;
        } else if (view === 'search') {
            titleEl.textContent = 'Búsqueda';
        } else if (view === 'themes') {
            titleEl.textContent = 'Mis Temas';
        } else if (view === 'settings') {
            titleEl.textContent = 'Configuración';
        } else if (view === 'theme-detail') {
            const theme = themes.find(t => t.id === currentThemeId);
            titleEl.textContent = theme ? theme.title : 'Tema';
        } else if (view === 'books') {
            titleEl.textContent = currentTestament === 'old' ? 'Antiguo Testamento' : 'Nuevo Testamento';
        }
    }

    currentView = view;
    window.scrollTo(0, 0);
    if (pushState) history.pushState({ view }, '', '');
}

function goBack() {
    if (currentView === 'reading') {
        showView('chapters', false);
    } else if (currentView === 'chapters') {
        showBooksView(false);
    } else if (currentView === 'books') {
        // Reset tab to home state
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        showView('home', false);
    } else if (currentView === 'search') {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        showView('home', false);
    } else if (currentView === 'themes') {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        showView('home', false);
    } else if (currentView === 'settings') {
        if (currentBook) {
            showView('reading', false);
        } else {
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            showView('home', false);
        }
    } else if (currentView === 'theme-detail') {
        showThemesView(false);
    } else if (currentView === 'home') {
        const now = Date.now();
        if (now - lastBackTap < 300) {
            window.close();
        } else {
            lastBackTap = now;
            showToast('Presiona atrás de nuevo para salir');
        }
    }
}

window.addEventListener('popstate', () => {
    if (currentView !== 'home') goBack();
    else {
        const now = Date.now();
        if (now - lastBackTap < 300) window.close();
        else { lastBackTap = now; showToast('Presiona atrás de nuevo para salir'); }
    }
});

history.pushState({ view: 'home' }, '', '');

// Scroll Scrubber
function initScrubber() {
    const thumb = document.getElementById('scroll-scrubber-thumb');
    const scrubber = document.getElementById('scroll-scrubber');
    const label = document.getElementById('scroll-scrubber-label');
    const btnUp = document.getElementById('scroll-scrubber-up');
    const btnDown = document.getElementById('scroll-scrubber-down');
    const trackHeight = () => scrubber.offsetHeight - 80;
    let isDragging = false;
    let startY = 0;
    let startScroll = 0;

    function updateScrubber() {
        const totalHeight = document.body.scrollHeight - window.innerHeight;
        if (totalHeight <= 0) return;
        const progress = window.scrollY / totalHeight;
        const th = trackHeight();
        const thumbTop = 40 + progress * th;
        thumb.style.top = thumbTop + 'px';
        const verses = document.querySelectorAll('.verse-pair');
        if (verses.length > 0) {
            let current = 1;
            verses.forEach((v, i) => { if (v.getBoundingClientRect().top < window.innerHeight / 2) current = i + 1; });
            label.textContent = current + ' / ' + verses.length;
        }
    }

    function onStart(e) {
        isDragging = true;
        startY = e.touches ? e.touches[0].clientY : e.clientY;
        startScroll = window.scrollY;
        thumb.classList.add('dragging');
        e.preventDefault();
    }

    function onMove(e) {
        if (!isDragging) return;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const th = trackHeight();
        const totalHeight = document.body.scrollHeight - window.innerHeight;
        const dy = clientY - startY;
        const dScroll = (dy / th) * totalHeight;
        window.scrollTo(0, startScroll + dScroll);
        e.preventDefault();
    }

    function onEnd() {
        isDragging = false;
        thumb.classList.remove('dragging');
    }

    thumb.addEventListener('mousedown', onStart);
    thumb.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);

    btnUp.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    btnDown.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

    window.addEventListener('scroll', updateScrubber);
    updateScrubber();
}

function goHome() {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    currentBook = null;
    showView('home');
}

// Color Theme
function setColorTheme(color) {
    document.documentElement.setAttribute('data-color', color);
    localStorage.setItem('color_theme', color);
    document.querySelectorAll('.color-theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === color);
    });
    // Update manifest theme-color
    const styles = getComputedStyle(document.documentElement);
    const primary = styles.getPropertyValue('--primary').trim();
    document.querySelector('meta[name="theme-color"]').setAttribute('content', primary);
}

function loadColorTheme() {
    const saved = localStorage.getItem('color_theme') || 'blue';
    document.documentElement.setAttribute('data-color', saved);
    document.querySelectorAll('.color-theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === saved);
    });
}

// Books
function showBooksView(pushState = true) {
    const books = currentTestament === 'old' ? OLD_TESTAMENT : NEW_TESTAMENT;
    const container = document.getElementById('books-list');
    container.innerHTML = '';
    books.forEach((bookName, index) => {
        const bookData = bibleData.find(b => b.book === bookName);
        if (!bookData) return;
        let displayName = langMode === 'ko' ? (BOOK_KO[bookName] || bookName) : bookName;
        const item = document.createElement('div');
        item.className = 'home-book-item';
        item.onclick = () => openBook(bookData);
        item.innerHTML = `<div class="home-book-num">${index + 1}</div><div class="home-book-name">${displayName}</div><div class="home-book-arrow">&#9654;</div>`;
        container.appendChild(item);
    });
    showView('books', pushState);
}

// Language mode
function setLangMode(mode) {
    langMode = mode;
    document.querySelectorAll('.lang-btn-home').forEach(btn => {
        btn.classList.toggle('active',
            (mode === 'dual' && btn.textContent === 'ES+KO') ||
            (mode === 'es' && btn.textContent === 'ES') ||
            (mode === 'ko' && btn.textContent === 'KO')
        );
    });
    if (currentView === 'reading' && currentBook) openChapter(currentChapter);
    else if (currentView === 'books') showBooksView(false);
}

function getBookDisplayName(bookName) {
    return langMode === 'ko' ? (BOOK_KO[bookName] || bookName) : bookName;
}

function openBook(book) {
    currentBook = book;
    const grid = document.getElementById('chapters-grid');
    grid.innerHTML = '';
    book.chapters.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'chapter-btn';
        btn.textContent = ch.chapter;
        btn.onclick = () => openChapter(ch.chapter);
        grid.appendChild(btn);
    });
    document.getElementById('header-title').textContent = getBookDisplayName(book.book);
    document.getElementById('chapters-book-name').textContent = getBookDisplayName(book.book);
    showView('chapters');
}

function openChapter(chapterNum) {
    currentChapter = chapterNum;
    const container = document.getElementById('verses-container');
    document.getElementById('reading-ref').textContent = `${getBookDisplayName(currentBook.book)} ${chapterNum}`;
    document.getElementById('header-title').textContent = `${getBookDisplayName(currentBook.book)} ${chapterNum}`;
    const chapter = currentBook.chapters.find(c => c.chapter === chapterNum);
    if (!chapter) return;
    selectedVerses.clear();
    updateSelectionUI();
    const jumpInput = document.getElementById('verse-jump-input');
    jumpInput.max = chapter.verses.length;
    jumpInput.value = '';
    container.innerHTML = '';
    chapter.verses.forEach(v => {
        const pair = document.createElement('div');
        pair.className = 'verse-pair';
        pair.dataset.book = currentBook.book;
        pair.dataset.chapter = chapterNum;
        pair.dataset.verse = v.verse;
        pair.dataset.es = v.es;
        pair.dataset.ko = v.ko;
        let verseHTML = '';
        if (langMode === 'dual') {
            verseHTML = `<div class="verse-ko"><span class="verse-number">${v.verse}</span><span>${v.ko}</span></div><div class="verse-es">${v.es}</div>`;
        } else if (langMode === 'ko') {
            verseHTML = `<div class="verse-ko"><span class="verse-number">${v.verse}</span><span>${v.ko}</span></div>`;
        } else {
            verseHTML = `<div class="verse-es"><span class="verse-number">${v.verse}</span><span>${v.es}</span></div>`;
        }
        pair.innerHTML = verseHTML;
        let lastTap = 0;
        pair.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTap < 300) { e.preventDefault(); toggleVerseSelection(pair); if (navigator.vibrate) navigator.vibrate(30); }
            lastTap = now;
        });
        pair.addEventListener('click', () => { if (selectedVerses.size > 0) toggleVerseSelection(pair); });
        container.appendChild(pair);
    });
    document.getElementById('btn-prev-chapter').disabled = chapterNum <= 1;
    document.getElementById('btn-next-chapter').disabled = chapterNum >= currentBook.chapters.length;
    showView('reading');
}

function prevChapter() { selectedVerses.clear(); updateSelectionUI(); if (currentChapter > 1) openChapter(currentChapter - 1); }
function nextChapter() { selectedVerses.clear(); updateSelectionUI(); if (currentChapter < currentBook.chapters.length) openChapter(currentChapter + 1); }

function jumpToVerse() {
    const input = document.getElementById('verse-jump-input');
    const verseNum = parseInt(input.value);
    if (!verseNum || verseNum < 1) return;
    const chapter = currentBook.chapters.find(c => c.chapter === currentChapter);
    if (!chapter || verseNum > chapter.verses.length) { showToast('Versículo no encontrado'); return; }
    const verseEl = document.querySelectorAll('.verse-pair')[verseNum - 1];
    if (verseEl) { verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); verseEl.classList.add('verse-highlight'); setTimeout(() => verseEl.classList.remove('verse-highlight'), 2000); }
}

// Verse selection
function toggleVerseSelection(verseEl) {
    const key = verseEl.dataset.verse;
    if (selectedVerses.has(key)) { selectedVerses.delete(key); verseEl.classList.remove('verse-selected'); }
    else { selectedVerses.add(key); verseEl.classList.add('verse-selected'); }
    updateSelectionUI();
}

function updateSelectionUI() {
    const toolbar = document.getElementById('selection-toolbar');
    if (selectedVerses.size > 0) { toolbar.classList.add('visible'); document.getElementById('selection-count').textContent = selectedVerses.size + ' versículo(s) seleccionado(s)'; }
    else toolbar.classList.remove('visible');
}

function selectAllVerses() {
    document.querySelectorAll('.verse-pair').forEach(p => { selectedVerses.add(p.dataset.verse); p.classList.add('verse-selected'); });
    updateSelectionUI();
}

function clearSelection() {
    selectedVerses.clear();
    document.querySelectorAll('.verse-selected').forEach(el => el.classList.remove('verse-selected'));
    updateSelectionUI();
}

function copySelectedVerses() {
    if (selectedVerses.size === 0) return;
    const sorted = [...selectedVerses].map(Number).sort((a, b) => a - b);
    const from = sorted[0], to = sorted[sorted.length - 1];
    let ref = `${currentBook.book} ${currentChapter}:${from}`;
    if (from !== to) ref += `-${to}`;
    let text = ref + '\n\n';
    document.querySelectorAll('.verse-pair').forEach(p => {
        if (selectedVerses.has(p.dataset.verse)) {
            text += `${p.dataset.ko}\n${p.dataset.es}\n\n`;
        }
    });
    copyToClipboard(text.trim());
    showToast('Versículo(s) copiado(s)');
    clearSelection();
}

function copyToClipboard(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (e) { showToast('Error al copiar'); }
    document.body.removeChild(ta);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
}

// ====== THEMES ======
function loadThemes() { try { themes = JSON.parse(localStorage.getItem('bible_themes') || '[]'); } catch (e) { themes = []; } }
function saveThemes() { localStorage.setItem('bible_themes', JSON.stringify(themes)); }

function showNewThemeDialog() {
    const title = prompt('Nombre del tema:');
    if (!title || !title.trim()) return;
    themes.push({ id: Date.now().toString(), title: title.trim(), verses: [] });
    saveThemes();
    renderThemesList();
    showToast('Tema creado');
}

function renderThemesList() {
    const container = document.getElementById('themes-list');
    container.innerHTML = '';
    if (themes.length === 0) { container.innerHTML = '<div class="no-results">No tienes temas guardados.<br>Crea uno para guardar versículos favoritos.</div>'; return; }
    themes.forEach(theme => {
        const item = document.createElement('div');
        item.className = 'theme-item';
        item.onclick = () => openThemeDetail(theme.id);
        item.innerHTML = `<div class="theme-icon">&#128214;</div><div class="theme-info"><div class="theme-name">${theme.title}</div><div class="theme-count">${(theme.verses || []).length} versículo(s)</div></div><div class="theme-arrow">&#9654;</div>`;
        container.appendChild(item);
    });
}

function showThemesView(pushState = true) { renderThemesList(); showView('themes', pushState); }

function openThemeDetail(themeId) {
    currentThemeId = themeId;
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;
    document.getElementById('theme-detail-title').textContent = theme.title;
    renderThemeVerses(theme);
    showView('theme-detail');
}

function renderThemeVerses(theme) {
    const container = document.getElementById('theme-detail-verses');
    container.innerHTML = '';
    if (!theme.verses || theme.verses.length === 0) { container.innerHTML = '<div class="no-results">Este tema no tiene versículos.<br>Selecciona versículos en la lectura y toca "Guardar".</div>'; return; }
    theme.verses.forEach((v, idx) => {
        const item = document.createElement('div');
        item.className = 'theme-verse-item';
        item.innerHTML = `<div class="theme-verse-row"><div class="theme-verse-content" onclick="goToThemeVerse('${v.book}', ${v.chapter}, ${v.verse})"><div class="theme-verse-ref">${v.book} ${v.chapter}:${v.verse}</div><div class="theme-verse-ko">${v.ko}</div><div class="theme-verse-es">${v.es}</div></div><button class="theme-verse-delete" onclick="event.stopPropagation(); removeVerseFromTheme('${theme.id}', ${idx})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>`;
        container.appendChild(item);
    });
}

function goToThemeVerse(bookName, chapter, verse) {
    const book = bibleData.find(b => b.book === bookName);
    if (!book) return;
    currentBook = book;
    openChapter(chapter);
    setTimeout(() => {
        const verseEl = document.querySelectorAll('.verse-pair')[verse - 1];
        if (verseEl) { verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); verseEl.classList.add('verse-highlight'); setTimeout(() => verseEl.classList.remove('verse-highlight'), 2000); }
    }, 100);
}

function removeVerseFromTheme(themeId, idx) {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;
    theme.verses.splice(idx, 1);
    saveThemes();
    renderThemeVerses(theme);
    showToast('Versículo eliminado del tema');
}

function renameCurrentTheme() {
    const theme = themes.find(t => t.id === currentThemeId);
    if (!theme) return;
    const newTitle = prompt('Nuevo nombre:', theme.title);
    if (!newTitle || !newTitle.trim()) return;
    theme.title = newTitle.trim();
    saveThemes();
    document.getElementById('theme-detail-title').textContent = theme.title;
    showToast('Nombre actualizado');
}

function deleteCurrentTheme() {
    const theme = themes.find(t => t.id === currentThemeId);
    if (!theme || !confirm(`¿Eliminar el tema "${theme.title}"?`)) return;
    themes = themes.filter(t => t.id !== currentThemeId);
    saveThemes();
    showThemesView(false);
    showToast('Tema eliminado');
}

function copyCurrentTheme() {
    const theme = themes.find(t => t.id === currentThemeId);
    if (!theme || !theme.verses || theme.verses.length === 0) { showToast('No hay versículos para copiar'); return; }
    let text = `📌 ${theme.title}\n\n`;
    theme.verses.forEach(v => { text += `${v.book} ${v.chapter}:${v.verse}\n${v.ko}\n${v.es}\n\n`; });
    copyToClipboard(text.trim());
    showToast('Tema copiado al portapapeles');
}

function showSaveToThemeDialog() {
    if (selectedVerses.size === 0) return;
    if (themes.length === 0) {
        createThemeAndSave();
    } else {
        renderThemePicker();
        document.getElementById('theme-picker-modal').classList.remove('hidden');
    }
}

function closeThemePicker() {
    document.getElementById('theme-picker-modal').classList.add('hidden');
}

function renderThemePicker() {
    const container = document.getElementById('theme-picker-list');
    container.innerHTML = '';
    themes.forEach(theme => {
        const btn = document.createElement('button');
        btn.className = 'theme-picker-item';
        btn.onclick = () => { saveVersesToTheme(theme.id); closeThemePicker(); };
        btn.innerHTML = `<div class="theme-picker-icon">&#128214;</div><div class="theme-picker-info"><div class="theme-picker-name">${theme.title}</div><div class="theme-picker-count">${(theme.verses || []).length} versículo(s)</div></div>`;
        container.appendChild(btn);
    });
}

function createThemeAndSave() {
    const title = prompt('Nombre del nuevo tema:');
    if (!title || !title.trim()) return;
    const theme = { id: Date.now().toString(), title: title.trim(), verses: [] };
    themes.push(theme);
    saveThemes();
    saveVersesToTheme(theme.id);
    closeThemePicker();
    showToast('Tema creado');
}

function saveVersesToTheme(themeId) {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;
    let added = 0;
    document.querySelectorAll('.verse-pair').forEach(p => {
        if (selectedVerses.has(p.dataset.verse)) {
            const v = { book: p.dataset.book, chapter: parseInt(p.dataset.chapter), verse: parseInt(p.dataset.verse), es: p.dataset.es, ko: p.dataset.ko };
            if (!theme.verses.some(ev => ev.book === v.book && ev.chapter === v.chapter && ev.verse === v.verse)) { theme.verses.push(v); added++; }
        }
    });
    saveThemes();
    clearSelection();
    if (added > 0) showToast(`${added} versículo(s) guardado(s) en "${theme.title}"`);
    else showToast('Los versículos ya estaban en el tema');
}

// Settings
function showSettingsView(pushState = true) { updateGitHubStatus(); showView('settings', pushState); }

// Search
function homeSearch() {
    const input = document.getElementById('home-search-input');
    const query = input.value.trim();
    if (!query) return;
    const ref = parseReference(query);
    if (ref) { navigateToReference(ref); return; }
    performTextSearch(query);
}

function navigateToReference(ref) {
    const book = bibleData.find(b => b.book === ref.book);
    if (!book) { alert('Libro no encontrado: ' + ref.book); return; }
    if (!book.chapters.find(c => c.chapter === ref.chapter)) { alert('Capítulo no encontrado'); return; }
    currentBook = book;
    if (ref.verseFrom) {
        openChapter(ref.chapter);
        setTimeout(() => {
            const target = document.querySelectorAll('.verse-pair')[ref.verseFrom - 1];
            if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.classList.add('verse-highlight'); setTimeout(() => target.classList.remove('verse-highlight'), 2000); }
        }, 100);
    } else openChapter(ref.chapter);
}

function performTextSearch(query) {
    const q = normalizeText(query);
    if (q.length < 2) return;
    const results = [];
    for (const book of bibleData) {
        for (const ch of book.chapters) {
            for (const v of ch.verses) {
                if (results.length >= 100) break;
                const matchEs = normalizeText(v.es).includes(q);
                const matchKo = v.ko.toLowerCase().includes(query.toLowerCase());
                if (matchEs || matchKo) results.push({ book: book.book, chapter: ch.chapter, verse: v.verse, es: v.es, ko: v.ko, matchEs });
            }
            if (results.length >= 100) break;
        }
        if (results.length >= 100) break;
    }
    const container = document.getElementById('search-results');
    const header = document.getElementById('search-results-header');
    if (results.length === 0) { header.innerHTML = ''; container.innerHTML = `<div class="no-results">No se encontraron resultados para "${query}"</div>`; }
    else {
        header.innerHTML = `<div class="search-count">${results.length} resultado(s)</div><button class="copy-results-btn" onclick="copySearchResults()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copiar todo</button>`;
        let html = '';
        results.forEach(r => {
            const text = r.matchEs ? r.es : r.ko;
            const highlighted = text.replace(new RegExp(`(${escapeRegex(query)})`, 'gi'), '<mark>$1</mark>');
            html += `<div class="search-result-item" onclick="goToVerse('${r.book}',${r.chapter},${r.verse})"><div class="search-result-ref">${r.book} ${r.chapter}:${r.verse}</div><div class="search-result-text">${highlighted}</div></div>`;
        });
        container.innerHTML = html;
        window._lastSearchResults = results;
        window._lastSearchQuery = query;
    }
    showView('search');
}

function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function goToVerse(bookName, chapter, verse) {
    const book = bibleData.find(b => b.book === bookName);
    if (!book) return;
    currentBook = book;
    openChapter(chapter);
    setTimeout(() => {
        const verseEl = document.querySelectorAll('.verse-pair')[verse - 1];
        if (verseEl) { verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); verseEl.classList.add('verse-highlight'); }
    }, 100);
}

function copySearchResults() {
    const results = window._lastSearchResults;
    const query = window._lastSearchQuery;
    if (!results || results.length === 0) return;
    let text = `Busqueda: "${query}"\nResultados: ${results.length}\n\n`;
    results.forEach(r => { text += `${r.book} ${r.chapter}:${r.verse}\n${r.ko}\n${r.es}\n\n`; });
    copyToClipboard(text.trim());
    showToast('Resultados copiados');
}

function clearHomeSearch() { document.getElementById('home-search-input').value = ''; document.getElementById('home-clear-btn').classList.add('hidden'); }
function toggleClearBtn() { const val = document.getElementById('home-search-input').value; document.getElementById('home-clear-btn').classList.toggle('hidden', !val); }

// Book abbreviations
const BOOK_ALIASES = {
    'genesis': 'Génesis', 'gnesis': 'Génesis', 'gen': 'Génesis', 'ge': 'Génesis',
    'exodo': 'Éxodo', 'exodus': 'Éxodo', 'exo': 'Éxodo', 'ex': 'Éxodo',
    'levitico': 'Levítico', 'lev': 'Levítico', 'lv': 'Levítico',
    'numeros': 'Números', 'num': 'Números', 'nm': 'Números',
    'deuteronomio': 'Deuteronomio', 'deut': 'Deuteronomio', 'dt': 'Deuteronomio',
    'josue': 'Josué', 'joshua': 'Josué', 'jos': 'Josué',
    'jueces': 'Jueces', 'jue': 'Jueces', 'rut': 'Rut', 'ruth': 'Rut',
    '1samuel': '1 Samuel', '1 samuel': '1 Samuel', '1 sam': '1 Samuel', '1sm': '1 Samuel',
    '2samuel': '2 Samuel', '2 samuel': '2 Samuel', '2 sam': '2 Samuel', '2sm': '2 Samuel',
    '1reyes': '1 Reyes', '1 reyes': '1 Reyes', '1 rey': '1 Reyes', '1rey': '1 Reyes',
    '2reyes': '2 Reyes', '2 reyes': '2 Reyes', '2 rey': '2 Reyes', '2rey': '2 Reyes',
    '1cron': '1 Crónicas', '1 cronicas': '1 Crónicas', '1 crónicas': '1 Crónicas',
    '2cron': '2 Crónicas', '2 cronicas': '2 Crónicas', '2 crónicas': '2 Crónicas',
    'esdras': 'Esdras', 'ezr': 'Esdras', 'nehemias': 'Nehemías', 'nehemías': 'Nehemías', 'neh': 'Nehemías',
    'ester': 'Ester', 'est': 'Ester', 'job': 'Job', 'jop': 'Job',
    'salmos': 'Salmos', 'salmo': 'Salmos', 'sal': 'Salmos', 'sl': 'Salmos', 'ps': 'Salmos', 'psa': 'Salmos',
    'proverbios': 'Proverbios', 'prov': 'Proverbios', 'pr': 'Proverbios', 'pro': 'Proverbios',
    'eclesiastes': 'Eclesiastés', 'ecle': 'Eclesiastés', 'ec': 'Eclesiastés', 'qoh': 'Eclesiastés',
    'cantares': 'Cantares', 'cant': 'Cantares', 'cnt': 'Cantares', 'song': 'Cantares',
    'isaias': 'Isaías', 'isaías': 'Isaías', 'isa': 'Isaías',
    'jeremias': 'Jeremías', 'jeremías': 'Jeremías', 'jer': 'Jeremías',
    'lamentaciones': 'Lamentaciones', 'lam': 'Lamentaciones',
    'ezequiel': 'Ezequiel', 'ezeq': 'Ezequiel', 'ezq': 'Ezequiel', 'eze': 'Ezequiel',
    'daniel': 'Daniel', 'dan': 'Daniel', 'dn': 'Daniel',
    'oseas': 'Oseas', 'hos': 'Oseas', 'joel': 'Joel', 'jl': 'Joel',
    'amos': 'Amós', 'amós': 'Amós', 'am': 'Amós',
    'abdias': 'Abdías', 'abdías': 'Abdías', 'obd': 'Abdías', 'ob': 'Abdías',
    'jonas': 'Jonás', 'jonás': 'Jonás', 'jon': 'Jonás',
    'miqueas': 'Miqueas', 'mic': 'Miqueas', 'nahum': 'Nahúm', 'nah': 'Nahúm',
    'habacuc': 'Habacuc', 'hab': 'Habacuc',
    'sofonias': 'Sofonías', 'sof': 'Sofonías', 'zep': 'Sofonías',
    'hageo': 'Hageo', 'hag': 'Hageo',
    'zacarias': 'Zacarías', 'zacarías': 'Zacarías', 'zac': 'Zacarías', 'zech': 'Zacarías',
    'malaquias': 'Malaquías', 'malaquías': 'Malaquías', 'mal': 'Malaquías',
    'mateo': 'Mateo', 'mat': 'Mateo', 'mt': 'Mateo', 'matt': 'Mateo',
    'marcos': 'Marcos', 'mar': 'Marcos', 'mk': 'Marcos', 'mr': 'Marcos', 'san marcos': 'Marcos',
    'lucas': 'Lucas', 'luc': 'Lucas', 'lk': 'Lucas', 'lu': 'Lucas',
    'juan': 'Juan', 'jhn': 'Juan', 'jn': 'Juan', 'san juan': 'Juan',
    'hechos': 'Hechos', 'act': 'Hechos',
    'romanos': 'Romanos', 'rom': 'Romanos', 'rm': 'Romanos',
    '1cor': '1 Corintios', '1 corintios': '1 Corintios', '1 co': '1 Corintios', '1co': '1 Corintios',
    '2cor': '2 Corintios', '2 corintios': '2 Corintios', '2 co': '2 Corintios', '2co': '2 Corintios',
    'galatas': 'Gálatas', 'gal': 'Gálatas', 'efesios': 'Efesios', 'ef': 'Efesios', 'eph': 'Efesios',
    'filipenses': 'Filipenses', 'fil': 'Filipenses', 'phil': 'Filipenses', 'flp': 'Filipenses',
    'colosenses': 'Colosenses', 'col': 'Colosenses',
    '1tes': '1 Tesalonicenses', '1 tesalonicenses': '1 Tesalonicenses', '1 th': '1 Tesalonicenses',
    '2tes': '2 Tesalonicenses', '2 tesalonicenses': '2 Tesalonicenses', '2 th': '2 Tesalonicenses',
    '1tim': '1 Timoteo', '1 timoteo': '1 Timoteo', '2tim': '2 Timoteo', '2 timoteo': '2 Timoteo',
    'tito': 'Tito', 'tit': 'Tito', 'titus': 'Tito',
    'filemon': 'Filemón', 'filemón': 'Filemón', 'flm': 'Filemón', 'phm': 'Filemón',
    'hebreos': 'Hebreos', 'heb': 'Hebreos', 'hrb': 'Hebreos',
    'santiago': 'Santiago', 'sant': 'Santiago', 'stg': 'Santiago', 'jas': 'Santiago',
    '1ped': '1 Pedro', '1 pedro': '1 Pedro', '1pet': '1 Pedro',
    '2ped': '2 Pedro', '2 pedro': '2 Pedro', '2pet': '2 Pedro',
    '1juan': '1 Juan', '1 juan': '1 Juan', '1jn': '1 Juan',
    '2juan': '2 Juan', '2 juan': '2 Juan', '2jn': '2 Juan',
    '3juan': '3 Juan', '3 juan': '3 Juan', '3jn': '3 Juan',
    'judas': 'Judas', 'jud': 'Judas', 'jde': 'Judas',
    'apocalipsis': 'Apocalipsis', 'apoc': 'Apocalipsis', 'rev': 'Apocalipsis', 'ap': 'Apocalipsis'
};

function normalizeText(str) { return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim(); }

function matchBookName(input) {
    const normalized = normalizeText(input);
    if (BOOK_ALIASES[normalized]) return BOOK_ALIASES[normalized];
    const cleaned = normalized.replace(/^(san|santa|el|la|los|las|s)\s+/i, '');
    if (BOOK_ALIASES[cleaned]) return BOOK_ALIASES[cleaned];
    for (const [alias, fullName] of Object.entries(BOOK_ALIASES)) {
        if (normalized.startsWith(alias) || alias.startsWith(normalized)) return fullName;
    }
    return null;
}

function parseReference(query) {
    const match = query.trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?\s*$/i);
    if (!match) return null;
    const bookName = matchBookName(match[1].trim());
    if (!bookName) return null;
    return { book: bookName, chapter: parseInt(match[2]), verseFrom: match[3] ? parseInt(match[3]) : null, verseTo: match[4] ? parseInt(match[4]) : (match[3] ? parseInt(match[3]) : null) };
}

// ====== GITHUB BACKUP ======
function getGitHubToken() { return localStorage.getItem('github_token') || ''; }
function getGistId() { return localStorage.getItem('github_gist_id') || ''; }

function updateGitHubStatus() {
    const token = getGitHubToken();
    const gistId = getGistId();
    const status = document.getElementById('settings-github-status');
    const btnBackup = document.getElementById('settings-btn-backup');
    const btnRestore = document.getElementById('settings-btn-restore');
    if (!token) { status.textContent = 'No configurado'; status.classList.remove('configured'); btnBackup.disabled = true; btnRestore.disabled = true; }
    else if (!gistId) { status.textContent = 'Token configurado. Guarda tu primer respaldo.'; status.classList.remove('configured'); btnBackup.disabled = false; btnRestore.disabled = true; }
    else { status.textContent = 'Respaldo activo en GitHub'; status.classList.add('configured'); btnBackup.disabled = false; btnRestore.disabled = false; }
}

function setupGitHubToken() {
    const current = getGitHubToken();
    const token = prompt('Ingresa tu Personal Access Token de GitHub:\n\n1. Ve a https://github.com/settings/tokens\n2. Generate new token (classic)\n3. Marca: gist\n4. Pega el token aquí:', current);
    if (token === null) return;
    if (!token.trim()) { localStorage.removeItem('github_token'); localStorage.removeItem('github_gist_id'); showToast('Token eliminado'); }
    else { localStorage.setItem('github_token', token.trim()); showToast('Token guardado'); }
    updateGitHubStatus();
}

async function backupThemesToGitHub() {
    const token = getGitHubToken();
    if (!token) { showToast('Configura el token primero'); return; }
    const gistId = getGistId();
    const data = JSON.stringify(themes, null, 2);
    try {
        let response;
        if (gistId) { response = await fetch(`https://api.github.com/gists/${gistId}`, { method: 'PATCH', headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ files: { 'biblia-temas.json': { content: data } } }) }); }
        else { response = await fetch('https://api.github.com/gists', { method: 'POST', headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ description: 'Biblia Bilingüe - Respaldo de Temas', public: false, files: { 'biblia-temas.json': { content: data } } }) }); }
        if (!response.ok) { const err = await response.json(); throw new Error(err.message || 'Error de GitHub'); }
        const result = await response.json();
        localStorage.setItem('github_gist_id', result.id);
        updateGitHubStatus();
        showToast('Respaldo guardado en GitHub');
    } catch (e) { showToast('Error: ' + e.message); }
}

async function restoreThemesFromGitHub() {
    const token = getGitHubToken();
    const gistId = getGistId();
    if (!token || !gistId) { showToast('No hay respaldo configurado'); return; }
    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, { headers: { 'Authorization': `token ${token}` } });
        if (!response.ok) throw new Error('No se pudo acceder al respaldo');
        const gist = await response.json();
        const file = gist.files['biblia-temas.json'];
        if (!file) throw new Error('Archivo no encontrado');
        const remoteThemes = JSON.parse(file.content);
        if (!Array.isArray(remoteThemes)) throw new Error('Formato inválido');
        const localIds = new Set(themes.map(t => t.id));
        let added = 0;
        remoteThemes.forEach(rt => { if (!localIds.has(rt.id)) { themes.push(rt); added++; } });
        saveThemes();
        renderThemesList();
        showToast(`${added} tema(s) restaurado(s) desde GitHub`);
    } catch (e) { showToast('Error: ' + e.message); }
}

// ====== LOCAL EXPORT/IMPORT ======
function exportThemesLocal() {
    if (themes.length === 0) { showToast('No hay temas para exportar'); return; }
    const data = JSON.stringify(themes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'biblia-temas-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Archivo descargado');
}

function importThemesLocal() { document.getElementById('import-file-input').click(); }

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) throw new Error('Formato inválido');
            const localIds = new Set(themes.map(t => t.id));
            let added = 0;
            imported.forEach(t => { if (!localIds.has(t.id)) { themes.push(t); added++; } });
            saveThemes();
            showToast(`${added} tema(s) importado(s)`);
        } catch (err) { showToast('Error: archivo inválido'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

init();
