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

// Korean book names
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

// Verse selection state
let selectedVerses = new Set();
let langMode = 'dual'; // 'dual', 'es', 'ko'

// Themes state
let themes = [];
let currentThemeId = null;

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

    // Load themes from localStorage
    loadThemes();

    updateLoadingProgress(100, '¡Listo!');
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    }, 500);

    loadTheme();
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

// Main Menu
function toggleMainMenu() {
    const menu = document.getElementById('main-menu');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
    } else {
        menu.classList.add('hidden');
    }
}

function menuAction(action) {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('search-bar').classList.add('hidden');

    if (action === 'old' || action === 'new') {
        currentTestament = action;
        showBooksView();
    } else if (action === 'themes') {
        showThemesView();
    }
}

// Navigation
let lastBackTap = 0;
let canExit = false;

function showView(view, pushState = true) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-' + view).classList.remove('hidden');

    const backBtn = document.getElementById('btn-back');
    const titleEl = document.getElementById('header-title');

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
        } else if (view === 'theme-detail') {
            const theme = themes.find(t => t.id === currentThemeId);
            titleEl.textContent = theme ? theme.title : 'Tema';
        } else if (view === 'books') {
            titleEl.textContent = currentTestament === 'old' ? 'Antiguo Testamento' : 'Nuevo Testamento';
        }
    }

    currentView = view;
    canExit = false;
    window.scrollTo(0, 0);

    // Push history state for back button
    if (pushState) {
        history.pushState({ view }, '', '');
    }
}

function goBack() {
    document.getElementById('search-bar').classList.add('hidden');
    document.getElementById('main-menu').classList.add('hidden');
    if (currentView === 'reading') {
        showView('chapters', false);
    } else if (currentView === 'chapters') {
        showBooksView(false);
    } else if (currentView === 'books') {
        showView('home', false);
    } else if (currentView === 'search') {
        showView('home', false);
    } else if (currentView === 'themes') {
        showView('home', false);
    } else if (currentView === 'theme-detail') {
        showThemesView(false);
    } else if (currentView === 'home') {
        // Double tap to exit
        const now = Date.now();
        if (now - lastBackTap < 300) {
            window.close();
        } else {
            lastBackTap = now;
            showToast('Presiona atrás de nuevo para salir');
        }
    }
}

// Handle Android back button
window.addEventListener('popstate', (e) => {
    if (currentView !== 'home') {
        goBack();
    } else {
        const now = Date.now();
        if (now - lastBackTap < 300) {
            window.close();
        } else {
            lastBackTap = now;
            showToast('Presiona atrás de nuevo para salir');
        }
    }
});

// Push initial state
history.pushState({ view: 'home' }, '', '');

// Show books list view
function showBooksView(pushState = true) {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('search-bar').classList.add('hidden');

    const books = currentTestament === 'old' ? OLD_TESTAMENT : NEW_TESTAMENT;
    const titleEl = document.getElementById('books-title');
    titleEl.textContent = currentTestament === 'old' ? 'Antiguo Testamento' : 'Nuevo Testamento';

    const container = document.getElementById('books-list');
    container.innerHTML = '';

    books.forEach((bookName, index) => {
        const bookData = bibleData.find(b => b.book === bookName);
        if (!bookData) return;

        let displayName = bookName;
        if (langMode === 'ko') {
            displayName = BOOK_KO[bookName] || bookName;
        }

        const item = document.createElement('div');
        item.className = 'home-book-item';
        item.onclick = () => openBook(bookData);
        item.innerHTML = `
            <div class="home-book-num">${index + 1}</div>
            <div class="home-book-name">${displayName}</div>
            <div class="home-book-arrow">&#9654;</div>
        `;
        container.appendChild(item);
    });

    showView('books', pushState);
}

function closeBooksList() {
    showView('home', false);
}

// Language mode
function setLangMode(mode) {
    langMode = mode;
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', 
            (mode === 'dual' && btn.textContent === 'ES+KO') ||
            (mode === 'es' && btn.textContent === 'ES') ||
            (mode === 'ko' && btn.textContent === 'KO')
        );
    });
    // Re-render current view
    if (currentView === 'reading' && currentBook) {
        openChapter(currentChapter);
    } else if (currentView === 'books') {
        showBooksView(false);
    }
}

function getBookDisplayName(bookName) {
    if (langMode === 'ko') return BOOK_KO[bookName] || bookName;
    return bookName;
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
    showView('chapters');
}

function openChapter(chapterNum) {
    currentChapter = chapterNum;
    const container = document.getElementById('verses-container');
    const refEl = document.getElementById('reading-ref');
    refEl.textContent = `${getBookDisplayName(currentBook.book)} ${chapterNum}`;

    document.getElementById('header-title').textContent = `${getBookDisplayName(currentBook.book)} ${chapterNum}`;

    const chapter = currentBook.chapters.find(c => c.chapter === chapterNum);
    if (!chapter) return;

    // Clear selection
    selectedVerses.clear();
    updateSelectionUI();

    // Set max for verse jump
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
            verseHTML = `
                <div class="verse-ko">
                    <span class="verse-number">${v.verse}</span>
                    <span>${v.ko}</span>
                </div>
                <div class="verse-es">${v.es}</div>
            `;
        } else if (langMode === 'ko') {
            verseHTML = `
                <div class="verse-ko">
                    <span class="verse-number">${v.verse}</span>
                    <span>${v.ko}</span>
                </div>
            `;
        } else {
            verseHTML = `
                <div class="verse-es">
                    <span class="verse-number">${v.verse}</span>
                    <span>${v.es}</span>
                </div>
            `;
        }
        pair.innerHTML = verseHTML;

        // Double tap to select verse
        let lastTap = 0;
        pair.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTap < 300) {
                e.preventDefault();
                toggleVerseSelection(pair);
                if (navigator.vibrate) navigator.vibrate(30);
            }
            lastTap = now;
        });

        // Tap to toggle if in selection mode
        pair.addEventListener('click', () => {
            if (selectedVerses.size > 0) {
                toggleVerseSelection(pair);
            }
        });

        container.appendChild(pair);
    });

    document.getElementById('btn-prev-chapter').disabled = chapterNum <= 1;
    document.getElementById('btn-next-chapter').disabled = chapterNum >= currentBook.chapters.length;

    showView('reading');
}

function prevChapter() {
    selectedVerses.clear();
    updateSelectionUI();
    if (currentChapter > 1) openChapter(currentChapter - 1);
}

function nextChapter() {
    selectedVerses.clear();
    updateSelectionUI();
    const maxCh = currentBook.chapters.length;
    if (currentChapter < maxCh) openChapter(currentChapter + 1);
}

// Verse jump
function jumpToVerse() {
    const input = document.getElementById('verse-jump-input');
    const verseNum = parseInt(input.value);
    if (!verseNum || verseNum < 1) return;

    const chapter = currentBook.chapters.find(c => c.chapter === currentChapter);
    if (!chapter || verseNum > chapter.verses.length) {
        showToast('Versículo no encontrado');
        return;
    }

    const verseEl = document.querySelectorAll('.verse-pair')[verseNum - 1];
    if (verseEl) {
        verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        verseEl.classList.add('verse-highlight');
        setTimeout(() => verseEl.classList.remove('verse-highlight'), 2000);
    }
}

// Verse selection for copying
function toggleVerseSelection(verseEl) {
    const key = verseEl.dataset.verse;
    if (selectedVerses.has(key)) {
        selectedVerses.delete(key);
        verseEl.classList.remove('verse-selected');
    } else {
        selectedVerses.add(key);
        verseEl.classList.add('verse-selected');
    }
    updateSelectionUI();
}

function updateSelectionUI() {
    const toolbar = document.getElementById('selection-toolbar');
    if (selectedVerses.size > 0) {
        toolbar.classList.add('visible');
        document.getElementById('selection-count').textContent = selectedVerses.size + ' versículo(s) seleccionado(s)';
    } else {
        toolbar.classList.remove('visible');
    }
}

function selectAllVerses() {
    const pairs = document.querySelectorAll('.verse-pair');
    pairs.forEach(p => {
        selectedVerses.add(p.dataset.verse);
        p.classList.add('verse-selected');
    });
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
    const from = sorted[0];
    const to = sorted[sorted.length - 1];

    let ref = `${currentBook.book} ${currentChapter}:${from}`;
    if (from !== to) ref += `-${to}`;

    let text = ref + '\n\n';

    const pairs = document.querySelectorAll('.verse-pair');
    pairs.forEach(p => {
        if (selectedVerses.has(p.dataset.verse)) {
            text += `${p.dataset.ko}\n${p.dataset.es}\n\n`;
        }
    });

    const finalText = text.trim();

    const ta = document.createElement('textarea');
    ta.value = finalText;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();

    try {
        document.execCommand('copy');
        showToast('Versículo(s) copiado(s)');
    } catch (err) {
        showToast('Error al copiar');
    }

    document.body.removeChild(ta);
    clearSelection();
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
}

// ====== THEMES ======
function loadThemes() {
    try {
        themes = JSON.parse(localStorage.getItem('bible_themes') || '[]');
    } catch (e) {
        themes = [];
    }
}

function saveThemes() {
    localStorage.setItem('bible_themes', JSON.stringify(themes));
}

function showNewThemeDialog() {
    const title = prompt('Nombre del tema:');
    if (!title || !title.trim()) return;

    const theme = {
        id: Date.now().toString(),
        title: title.trim(),
        verses: []
    };
    themes.push(theme);
    saveThemes();
    renderThemesList();
    showToast('Tema creado');
}

function renderThemesList() {
    const container = document.getElementById('themes-list');
    container.innerHTML = '';

    if (themes.length === 0) {
        container.innerHTML = '<div class="no-results">No tienes temas guardados.<br>Crea uno para guardar versículos favoritos.</div>';
        return;
    }

    themes.forEach(theme => {
        const item = document.createElement('div');
        item.className = 'theme-item';
        item.onclick = () => openThemeDetail(theme.id);
        item.innerHTML = `
            <div class="theme-icon">&#128214;</div>
            <div class="theme-info">
                <div class="theme-name">${theme.title}</div>
                <div class="theme-count">${theme.verseSCount || 0} versículo(s)</div>
            </div>
            <div class="theme-arrow">&#9654;</div>
        `;
        container.appendChild(item);
    });
}

function showThemesView(pushState = true) {
    renderThemesList();
    showView('themes', pushState);
}

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

    if (!theme.verses || theme.verses.length === 0) {
        container.innerHTML = '<div class="no-results">Este tema no tiene versículos.<br>Selecciona versículos en la lectura y toca "Guardar".</div>';
        return;
    }

    theme.verses.forEach((v, idx) => {
        const item = document.createElement('div');
        item.className = 'theme-verse-item';
        item.innerHTML = `
            <div class="theme-verse-row">
                <div class="theme-verse-content" onclick="goToThemeVerse('${v.book}', ${v.chapter}, ${v.verse})">
                    <div class="theme-verse-ref">${v.book} ${v.chapter}:${v.verse}</div>
                    <div class="theme-verse-ko">${v.ko}</div>
                    <div class="theme-verse-es">${v.es}</div>
                </div>
                <button class="theme-verse-delete" onclick="event.stopPropagation(); removeVerseFromTheme('${theme.id}', ${idx})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

function goToThemeVerse(bookName, chapter, verse) {
    const book = bibleData.find(b => b.book === bookName);
    if (!book) return;
    currentBook = book;
    currentChapter = chapter;
    openChapter(chapter);
    setTimeout(() => {
        const verseEl = document.querySelectorAll('.verse-pair')[verse - 1];
        if (verseEl) {
            verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            verseEl.classList.add('verse-highlight');
            setTimeout(() => verseEl.classList.remove('verse-highlight'), 2000);
        }
    }, 100);
}

function removeVerseFromTheme(themeId, idx) {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;
    theme.verses.splice(idx, 1);
    theme.verseSCount = theme.verses.length;
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
    if (!theme) return;
    if (!confirm(`¿Eliminar el tema "${theme.title}"?`)) return;
    themes = themes.filter(t => t.id !== currentThemeId);
    saveThemes();
    showThemesView(false);
    showToast('Tema eliminado');
}

function copyCurrentTheme() {
    const theme = themes.find(t => t.id === currentThemeId);
    if (!theme || !theme.verses || theme.verses.length === 0) {
        showToast('No hay versículos para copiar');
        return;
    }

    let text = `📌 ${theme.title}\n\n`;
    theme.verses.forEach(v => {
        text += `${v.book} ${v.chapter}:${v.verse}\n`;
        text += `${v.ko}\n${v.es}\n\n`;
    });

    const ta = document.createElement('textarea');
    ta.value = text.trim();
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();

    try {
        document.execCommand('copy');
        showToast('Tema copiado al portapapeles');
    } catch (err) {
        showToast('Error al copiar');
    }

    document.body.removeChild(ta);
}

function showSaveToThemeDialog() {
    if (selectedVerses.size === 0) return;

    if (themes.length === 0) {
        const title = prompt('Primero crea un tema. Nombre del tema:');
        if (!title || !title.trim()) return;
        const theme = {
            id: Date.now().toString(),
            title: title.trim(),
            verses: []
        };
        themes.push(theme);
        saveThemes();
        saveVersesToTheme(theme.id);
    } else {
        // Show theme selection
        let msg = 'Selecciona un tema:\n\n';
        themes.forEach((t, i) => {
            msg += `${i + 1}. ${t.title}\n`;
        });
        msg += '\nEscribe el número:';
        const choice = prompt(msg);
        const idx = parseInt(choice) - 1;
        if (idx < 0 || idx >= themes.length) {
            showToast('Selección inválida');
            return;
        }
        saveVersesToTheme(themes[idx].id);
    }
}

function saveVersesToTheme(themeId) {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    let added = 0;
    const pairs = document.querySelectorAll('.verse-pair');
    pairs.forEach(p => {
        if (selectedVerses.has(p.dataset.verse)) {
            const v = {
                book: p.dataset.book,
                chapter: parseInt(p.dataset.chapter),
                verse: parseInt(p.dataset.verse),
                es: p.dataset.es,
                ko: p.dataset.ko
            };
            // Check for duplicates
            const exists = theme.verses.some(ev => 
                ev.book === v.book && ev.chapter === v.chapter && ev.verse === v.verse
            );
            if (!exists) {
                theme.verses.push(v);
                added++;
            }
        }
    });

    theme.verseSCount = theme.verses.length;
    saveThemes();
    clearSelection();

    if (added > 0) {
        showToast(`${added} versículo(s) guardado(s) en "${theme.title}"`);
    } else {
        showToast('Los versículos ya estaban en el tema');
    }
}

// Home search
function homeSearch() {
    const input = document.getElementById('home-search-input');
    const query = input.value.trim();
    if (!query) return;

    const ref = parseReference(query);
    if (ref) {
        navigateToReference(ref);
        return;
    }

    document.getElementById('search-input').value = query;
    performTextSearch(query);
}

function navigateToReference(ref) {
    const book = bibleData.find(b => b.book === ref.book);
    if (!book) {
        alert('Libro no encontrado: ' + ref.book);
        return;
    }

    const chapter = book.chapters.find(c => c.chapter === ref.chapter);
    if (!chapter) {
        alert('Capítulo no encontrado: ' + ref.book + ' ' + ref.chapter);
        return;
    }

    currentBook = book;

    if (ref.verseFrom) {
        openChapter(ref.chapter);
        setTimeout(() => {
            const verses = document.querySelectorAll('.verse-pair');
            const target = verses[ref.verseFrom - 1];
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                target.classList.add('verse-highlight');
                setTimeout(() => target.classList.remove('verse-highlight'), 2000);
            }
        }, 100);
    } else {
        openChapter(ref.chapter);
    }
}

// Header search bar
function toggleSearch() {
    const bar = document.getElementById('search-bar');
    const input = document.getElementById('search-input');
    if (bar.classList.contains('hidden')) {
        bar.classList.remove('hidden');
        input.focus();
    } else {
        bar.classList.add('hidden');
        if (currentView === 'search') goBack();
    }
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    if (currentView === 'search') goBack();
}

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;
        const ref = parseReference(query);
        if (ref) {
            navigateToReference(ref);
            return;
        }
        performTextSearch(query);
    }, 300);
}

function performTextSearch(query) {
    const q = normalizeText(query);
    if (q.length < 2) return;

    const results = [];
    const maxResults = 100;

    for (const book of bibleData) {
        for (const ch of book.chapters) {
            for (const v of ch.verses) {
                if (results.length >= maxResults) break;
                const matchEs = normalizeText(v.es).includes(q);
                const matchKo = v.ko.toLowerCase().includes(query.toLowerCase());
                if (matchEs || matchKo) {
                    results.push({
                        book: book.book,
                        chapter: ch.chapter,
                        verse: v.verse,
                        es: v.es,
                        ko: v.ko,
                        matchEs
                    });
                }
            }
            if (results.length >= maxResults) break;
        }
        if (results.length >= maxResults) break;
    }

    const container = document.getElementById('search-results');
    const header = document.getElementById('search-results-header');

    if (results.length === 0) {
        header.innerHTML = '';
        container.innerHTML = `<div class="no-results">No se encontraron resultados para "${query}"</div>`;
    } else {
        header.innerHTML = `
            <div class="search-count">${results.length} resultado(s) encontrado(s)</div>
            <button class="copy-results-btn" onclick="copySearchResults()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copiar todo
            </button>
        `;
        let html = '';
        results.forEach(r => {
            const text = r.matchEs ? r.es : r.ko;
            const highlighted = text.replace(new RegExp(`(${escapeRegex(query)})`, 'gi'), '<mark>$1</mark>');
            html += `
                <div class="search-result-item" onclick="goToVerse('${r.book}',${r.chapter},${r.verse})">
                    <div class="search-result-ref">${r.book} ${r.chapter}:${r.verse}</div>
                    <div class="search-result-text">${highlighted}</div>
                </div>
            `;
        });
        container.innerHTML = html;

        window._lastSearchResults = results;
        window._lastSearchQuery = query;
    }

    showView('search');
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function goToVerse(bookName, chapter, verse) {
    const book = bibleData.find(b => b.book === bookName);
    if (!book) return;
    currentBook = book;
    currentChapter = chapter;
    openChapter(chapter);
    setTimeout(() => {
        const verseEl = document.querySelectorAll('.verse-pair')[verse - 1];
        if (verseEl) {
            verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            verseEl.classList.add('verse-highlight');
        }
    }, 100);
}

function copySearchResults() {
    const results = window._lastSearchResults;
    const query = window._lastSearchQuery;
    if (!results || results.length === 0) return;

    let text = `Busqueda: "${query}"\nResultados: ${results.length}\n\n`;
    results.forEach(r => {
        text += `${r.book} ${r.chapter}:${r.verse}\n`;
        text += `${r.ko}\n`;
        text += `${r.es}\n\n`;
    });

    const ta = document.createElement('textarea');
    ta.value = text.trim();
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();

    try {
        document.execCommand('copy');
        showToast('Resultados copiados al portapapeles');
    } catch (err) {
        showToast('Error al copiar');
    }

    document.body.removeChild(ta);
}

// Book abbreviations mapping
const BOOK_ALIASES = {
    'genesis': 'Génesis', 'gnesis': 'Génesis', 'gen': 'Génesis', 'ge': 'Génesis',
    'exodo': 'Éxodo', 'exodus': 'Éxodo', 'exo': 'Éxodo', 'ex': 'Éxodo',
    'levitico': 'Levítico', 'lev': 'Levítico', 'lv': 'Levítico',
    'numeros': 'Números', 'num': 'Números', 'nm': 'Números',
    'deuteronomio': 'Deuteronomio', 'deut': 'Deuteronomio', 'dt': 'Deuteronomio',
    'josue': 'Josué', 'joshua': 'Josué', 'jos': 'Josué',
    'jueces': 'Jueces', 'jue': 'Jueces',
    'rut': 'Rut', 'ruth': 'Rut',
    '1samuel': '1 Samuel', '1 samuel': '1 Samuel', '1 sam': '1 Samuel', '1sm': '1 Samuel',
    '2samuel': '2 Samuel', '2 samuel': '2 Samuel', '2 sam': '2 Samuel', '2sm': '2 Samuel',
    '1reyes': '1 Reyes', '1 reyes': '1 Reyes', '1 rey': '1 Reyes', '1rey': '1 Reyes',
    '2reyes': '2 Reyes', '2 reyes': '2 Reyes', '2 rey': '2 Reyes', '2rey': '2 Reyes',
    '1cron': '1 Crónicas', '1 cronicas': '1 Crónicas', '1 crónicas': '1 Crónicas',
    '2cron': '2 Crónicas', '2 cronicas': '2 Crónicas', '2 crónicas': '2 Crónicas',
    'esdras': 'Esdras', 'ezr': 'Esdras',
    'nehemias': 'Nehemías', 'nehemías': 'Nehemías', 'neh': 'Nehemías',
    'ester': 'Ester', 'est': 'Ester',
    'job': 'Job', 'jop': 'Job',
    'salmos': 'Salmos', 'salmo': 'Salmos', 'sal': 'Salmos', 'sl': 'Salmos', 'ps': 'Salmos', 'psa': 'Salmos',
    'proverbios': 'Proverbios', 'prov': 'Proverbios', 'pr': 'Proverbios', 'pro': 'Proverbios',
    'eclesiastes': 'Eclesiastés', 'ecle': 'Eclesiastés', 'ec': 'Eclesiastés', 'qoh': 'Eclesiastés',
    'cantares': 'Cantares', 'cant': 'Cantares', 'cnt': 'Cantares', 'song': 'Cantares',
    'isaias': 'Isaías', 'isaías': 'Isaías', 'isa': 'Isaías',
    'jeremias': 'Jeremías', 'jeremías': 'Jeremías', 'jer': 'Jeremías',
    'lamentaciones': 'Lamentaciones', 'lam': 'Lamentaciones',
    'ezequiel': 'Ezequiel', 'ezeq': 'Ezequiel', 'ezq': 'Ezequiel', 'eze': 'Ezequiel',
    'daniel': 'Daniel', 'dan': 'Daniel', 'dn': 'Daniel',
    'oseas': 'Oseas', 'hos': 'Oseas',
    'joel': 'Joel', 'jl': 'Joel',
    'amos': 'Amós', 'amós': 'Amós', 'am': 'Amós',
    'abdias': 'Abdías', 'abdías': 'Abdías', 'obd': 'Abdías', 'ob': 'Abdías',
    'jonas': 'Jonás', 'jonás': 'Jonás', 'jon': 'Jonás',
    'miqueas': 'Miqueas', 'mic': 'Miqueas',
    'nahum': 'Nahúm', 'nah': 'Nahúm',
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
    'galatas': 'Gálatas', 'gal': 'Gálatas',
    'efesios': 'Efesios', 'ef': 'Efesios', 'eph': 'Efesios',
    'filipenses': 'Filipenses', 'fil': 'Filipenses', 'phil': 'Filipenses', 'flp': 'Filipenses',
    'colosenses': 'Colosenses', 'col': 'Colosenses',
    '1tes': '1 Tesalonicenses', '1 tesalonicenses': '1 Tesalonicenses', '1 th': '1 Tesalonicenses',
    '2tes': '2 Tesalonicenses', '2 tesalonicenses': '2 Tesalonicenses', '2 th': '2 Tesalonicenses',
    '1tim': '1 Timoteo', '1 timoteo': '1 Timoteo',
    '2tim': '2 Timoteo', '2 timoteo': '2 Timoteo',
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

function normalizeText(str) {
    return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ').trim();
}

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
    const q = query.trim();
    const match = q.match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?\s*$/i);
    if (!match) return null;

    const bookInput = match[1].trim();
    const chapter = parseInt(match[2]);
    const verseFrom = match[3] ? parseInt(match[3]) : null;
    const verseTo = match[4] ? parseInt(match[4]) : verseFrom;

    const bookName = matchBookName(bookInput);
    if (!bookName) return null;

    return { book: bookName, chapter, verseFrom, verseTo };
}

function clearHomeSearch() {
    document.getElementById('home-search-input').value = '';
    document.getElementById('home-clear-btn').classList.add('hidden');
}

function toggleClearBtn() {
    const val = document.getElementById('home-search-input').value;
    document.getElementById('home-clear-btn').classList.toggle('hidden', !val);
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(e => console.log('SW registration failed'));
    });
}

// Start
init();
