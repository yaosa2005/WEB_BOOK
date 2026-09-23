const UI_TRANSLATIONS = {
  th: {
    name: "ไทย",
    splashSub: "แด่ท่านนักอ่านผู้แสวงหาความรู้และความสงบ",
    enterBtn: "เปิดประตูสู่คลังหนังสือ",
    shelfTitle: "THIS BOOK FOR YOU",
    backBtn: "← กลับสู่ชั้นวาง",
    prevBtn: "‹ หน้าก่อน",
    nextBtn: "หน้าถัดไป ›",
    goBtn: "ไป",
    bookmarkAdd: "🔖 คั่นหน้านี้",
    bookmarkSaved: "🔖 คั่นหน้านี้แล้ว",
    resumeRead: "📖 อ่านต่อหน้าที่คั่น",
    soundOn: "🔊 เสียง: เปิด",
    soundOff: "🔇 เสียง: ปิด"
  }
};

const ALL_BOOKS = {
  th: BOOKS_TH
};

let currentLang = 'th';
let currentBookIndex = 0;
let pageFlip = null;

// ระบบจัดการเสียง
let pageAudioPlayer = new Audio();
let isAudioMuted = false;

function playPageFlipSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = audioCtx.sampleRate * 0.08;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 750;
    noise.connect(filter);
    filter.connect(audioCtx.destination);
    noise.start();
  } catch (e) {}
}

function playPageAudio(pageIdx) {
  if (isAudioMuted) return;

  const activeBooks = ALL_BOOKS[currentLang] || ALL_BOOKS['th'];
  const currentBook = activeBooks[currentBookIndex];
  if (!currentBook || !currentBook.pages || !currentBook.pages[pageIdx]) return;

  const pageData = currentBook.pages[pageIdx];

  pageAudioPlayer.pause();
  pageAudioPlayer.currentTime = 0;

  if (pageData.audio) {
    pageAudioPlayer.src = pageData.audio;
    pageAudioPlayer.play().catch(() => {});
  }
}

function toggleAudioMute() {
  isAudioMuted = !isAudioMuted;
  const t = UI_TRANSLATIONS[currentLang];
  const btn = document.getElementById('audio-toggle-btn');
  const bgMusic = document.getElementById('bg-music');
  const activeBooks = ALL_BOOKS[currentLang] || ALL_BOOKS['th'];
  const currentBook = activeBooks[currentBookIndex];

  if (isAudioMuted) {
    pageAudioPlayer.pause();
    if (bgMusic) bgMusic.pause();
    btn.innerText = t.soundOff;
  } else {
    btn.innerText = t.soundOn;
    if (bgMusic && currentBook && currentBook.bgMusic) {
      if (!bgMusic.src.includes(currentBook.bgMusic)) {
        bgMusic.src = currentBook.bgMusic;
      }
      bgMusic.volume = 0.3;
      bgMusic.play().catch(() => {});
    }
    if (pageFlip) {
      playPageAudio(pageFlip.getCurrentPageIndex());
    }
  }
}

function updateUITexts() {
  const t = UI_TRANSLATIONS[currentLang];
  document.getElementById('ui-splash-sub').innerText = t.splashSub;
  document.getElementById('ui-enter-btn').innerText = t.enterBtn;
  document.getElementById('ui-shelf-title').innerText = t.shelfTitle;
  document.getElementById('ui-back-btn').innerText = t.backBtn;
  document.getElementById('ui-prev-btn').innerText = t.prevBtn;
  document.getElementById('ui-next-btn').innerText = t.nextBtn;
  document.getElementById('ui-go-btn').innerText = t.goBtn;

  const audioBtn = document.getElementById('audio-toggle-btn');
  if (audioBtn) {
    audioBtn.innerText = isAudioMuted ? t.soundOff : t.soundOn;
  }

  updateBookmarkButtons();
  renderBookshelf();

  if (document.getElementById('reader-view').style.display === 'flex') {
    renderBook(currentBookIndex);
  }
}

function enterLibrary() {
  const splash = document.getElementById('splash-screen');
  splash.style.opacity = '0';
  setTimeout(() => splash.style.visibility = 'hidden', 800);
}

function renderBookshelf() {
  const shelf = document.getElementById('bookshelf-container');
  shelf.innerHTML = '';

  const activeBooks = ALL_BOOKS[currentLang] || ALL_BOOKS['th'];

  activeBooks.forEach((book, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'book-3d-wrapper';
    wrapper.onclick = () => openBook(index);

    const book3D = document.createElement('div');
    book3D.className = 'book-3d';

    const cover = document.createElement('div');
    cover.className = 'book-cover';

    if (book.coverImage) {
      cover.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url('${book.coverImage}')`;
    } else {
      cover.style.background = book.fallbackBg;
    }

    cover.innerHTML = `
      <div class="cover-emboss-frame"></div>
      <div class="cover-title">${book.title}</div>
    `;

    book3D.appendChild(cover);
    wrapper.appendChild(book3D);
    shelf.appendChild(wrapper);
  });
}

function openBook(index) {
  currentBookIndex = index;

  const readerView = document.getElementById('reader-view');
  readerView.style.display = 'flex';
  readerView.classList.remove('reader-enter');
  void readerView.offsetWidth;
  readerView.classList.add('reader-enter');

  document.getElementById('shelf-view').style.display = 'none';
  document.body.style.overflow = 'hidden';

  renderBook(index);

  const activeBooks = ALL_BOOKS[currentLang] || ALL_BOOKS['th'];
  const currentBook = activeBooks[index];
  const bgMusic = document.getElementById('bg-music');

  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;

    if (currentBook.bgMusic && !isAudioMuted) {
      bgMusic.src = currentBook.bgMusic;
      bgMusic.volume = 0.3;
      bgMusic.play().catch(() => {});
    }
  }

  const bookId = currentBook.id;
  const lastPage = localStorage.getItem(`last_page_${bookId}`);
  if (lastPage && pageFlip) {
    const target = parseInt(lastPage, 10);
    setTimeout(() => {
      pageFlip.flip(target);
      playPageAudio(target);
    }, 500);
  } else {
    playPageAudio(0);
  }
}

function backToShelf() {
  pageAudioPlayer.pause();
  pageAudioPlayer.currentTime = 0;

  const bgMusic = document.getElementById('bg-music');
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }

  if (pageFlip) pageFlip.destroy();
  document.getElementById('reader-view').style.display = 'none';
  document.getElementById('shelf-view').style.display = 'block';
  document.body.style.overflow = 'auto';
}

function renderBook(index) {
  const container = document.getElementById('book-container');
  if (pageFlip) pageFlip.destroy();
  container.innerHTML = '';

  const deskStage = document.createElement('div');
  deskStage.className = 'desk-stage';

  const bookDiv = document.createElement('div');
  bookDiv.className = 'flip-book';

  const activeBooks = ALL_BOOKS[currentLang] || ALL_BOOKS['th'];
  const currentBook = activeBooks[index];

  document.getElementById('page-total').innerText = `/ ${currentBook.pages.length}`;
  document.getElementById('page-input').max = currentBook.pages.length;

  // ครอบด้วย page-content ป้องกันข้อความล้นทะลุกรอบ และแยกชั้นจาก page-number อย่างเด็ดขาด
  currentBook.pages.forEach((p, pageIdx) => {
    const pageEl = document.createElement('div');
    pageEl.className = 'page';
    pageEl.innerHTML = `
      <div class="page-content">
        ${p.content}
      </div>
      <div class="page-number">- ${pageIdx + 1} -</div>
    `;
    bookDiv.appendChild(pageEl);
  });

  deskStage.appendChild(bookDiv);
  container.appendChild(deskStage);

  // คำนวณขนาดสมมาตรเพื่อความตรงบล็อก 100% ไม่เอียงหลุดมุม
  const availW = window.innerWidth;
  const availH = window.innerHeight - 80;
  const isMobile = availW < 768;

  let pageW, pageH;
  if (isMobile) {
    pageW = Math.floor(availW * 0.90);
    pageH = Math.min(Math.floor(availH * 0.88), Math.floor(pageW * 1.45));
  } else {
    pageH = Math.min(Math.floor(availH * 0.86), 660);
    pageW = Math.floor(pageH * 0.70);
  }

  pageFlip = new St.PageFlip(bookDiv, {
    width: pageW,
    height: pageH,
    size: 'fixed',
    minWidth: pageW,
    maxWidth: pageW,
    minHeight: pageH,
    maxHeight: pageH,
    maxShadowOpacity: 0.25,
    showCover: false,
    usePortrait: isMobile,
    flippingTime: 800,
    drawShadow: true,
    mobileScrollSupport: false
  });

  pageFlip.loadFromHTML(document.querySelectorAll('.page'));

  pageFlip.on('flip', (e) => {
    playPageFlipSound();
    const currentPageIndex = e.data;
    playPageAudio(currentPageIndex);

    document.getElementById('page-input').value = currentPageIndex + 1;
    const bookId = currentBook.id;
    localStorage.setItem(`last_page_${bookId}`, currentPageIndex);
    updateBookmarkButtons();
  });

  document.getElementById('page-input').value = 1;
  updateBookmarkButtons();
}

function goToInputPage() {
  if (!pageFlip) return;
  const input = document.getElementById('page-input');
  const pageNum = parseInt(input.value, 10);
  const activeBooks = ALL_BOOKS[currentLang] || ALL_BOOKS['th'];
  const maxPages = activeBooks[currentBookIndex].pages.length;

  if (pageNum >= 1 && pageNum <= maxPages) {
    pageFlip.flip(pageNum - 1);
  } else {
    alert(`กรุณาระบุหน้าระหว่าง 1 ถึง ${maxPages}`);
  }
}

document.getElementById('page-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    goToInputPage();
  }
});

function toggleBookmark() {
  if (!pageFlip) return;
  const activeBooks = ALL_BOOKS[currentLang] || ALL_BOOKS['th'];
  const bookId = activeBooks[currentBookIndex].id;
  const currentPage = pageFlip.getCurrentPageIndex();

  const savedBookmark = localStorage.getItem(`bookmark_${bookId}`);
  if (savedBookmark && parseInt(savedBookmark, 10) === currentPage) {
    localStorage.removeItem(`bookmark_${bookId}`);
  } else {
    localStorage.setItem(`bookmark_${bookId}`, currentPage);
  }
  updateBookmarkButtons();
}

function resumeBookmark() {
  if (!pageFlip) return;
  const activeBooks = ALL_BOOKS[currentLang] || ALL_BOOKS['th'];
  const bookId = activeBooks[currentBookIndex].id;
  const savedBookmark = localStorage.getItem(`bookmark_${bookId}`);

  if (savedBookmark !== null) {
    pageFlip.flip(parseInt(savedBookmark, 10));
  }
}

function updateBookmarkButtons() {
  const t = UI_TRANSLATIONS[currentLang];
  const bBtn = document.getElementById('bookmark-btn');
  const rBtn = document.getElementById('resume-btn');

  if (!pageFlip) {
    bBtn.innerText = t.bookmarkAdd;
    rBtn.style.display = 'none';
    return;
  }

  const activeBooks = ALL_BOOKS[currentLang] || ALL_BOOKS['th'];
  const bookId = activeBooks[currentBookIndex].id;
  const currentPage = pageFlip.getCurrentPageIndex();
  const savedBookmark = localStorage.getItem(`bookmark_${bookId}`);

  if (savedBookmark !== null && parseInt(savedBookmark, 10) === currentPage) {
    bBtn.innerText = t.bookmarkSaved;
    bBtn.classList.add('saved');
  } else {
    bBtn.innerText = t.bookmarkAdd;
    bBtn.classList.remove('saved');
  }

  if (savedBookmark !== null) {
    rBtn.style.display = 'inline-block';
    rBtn.innerText = `${t.resumeRead} (${parseInt(savedBookmark, 10) + 1})`;
  } else {
    rBtn.style.display = 'none';
  }
}

function flipPrev() { if (pageFlip) pageFlip.flipPrev(); }
function flipNext() { if (pageFlip) pageFlip.flipNext(); }

window.addEventListener('resize', () => {
  if (document.getElementById('reader-view').style.display === 'flex') {
    renderBook(currentBookIndex);
  }
});

updateUITexts();
