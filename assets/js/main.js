(() => {
  // 1) 모바일 메뉴 토글
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      navToggle.textContent = mobileMenu.classList.contains('hidden') ? '≡' : '×';
    });
    mobileMenu.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        navToggle.textContent = '≡';
      })
    );
  }

  // 2) 스크롤 리빌 애니메이션
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // 3) iframe lazy-load (사용자 클릭 시 로드)
  document.querySelectorAll('[data-project]').forEach((card) => {
    const btn = card.querySelector('.embed-load-btn');
    const poster = card.querySelector('.embed-poster');
    const iframe = card.querySelector('.embed-iframe');
    if (!btn || !poster || !iframe) return;

    const loadIframe = () => {
      const src = iframe.getAttribute('data-src');
      if (!src || iframe.src) return;
      iframe.src = src;
      iframe.addEventListener(
        'load',
        () => {
          iframe.classList.add('is-loaded');
          poster.style.transition = 'opacity .4s ease';
          poster.style.opacity = '0';
          setTimeout(() => (poster.style.display = 'none'), 400);
        },
        { once: true }
      );
    };

    btn.addEventListener('click', loadIframe);
  });

  // 4) 헤더 스크롤 시 진해지기
  const header = document.querySelector('header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 8) header.classList.add('shadow-sm');
      else header.classList.remove('shadow-sm');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 5) 이미지 라이트박스 (멀티 갤러리 + 줌/팬)
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('.lightbox-img');
    const lbCaption = lightbox.querySelector('.lightbox-caption');
    const lbCounter = lightbox.querySelector('.lightbox-counter');
    const lbClose = lightbox.querySelector('.lightbox-close');
    const lbPrev = lightbox.querySelector('.lightbox-prev');
    const lbNext = lightbox.querySelector('.lightbox-next');
    const stage = lightbox.querySelector('.lightbox-stage');

    // ─ 게임 IP 갤러리 데이터 ─
    // 각 게임별 이미지 경로 + 캡션. 폴더에 새 이미지가 추가되면 여기 배열에 한 줄씩 추가하면 됩니다.
    const GAME_BASE = 'assets/images/game';
    const gameGalleries = {
      '섬란카구라': {
        title: '섬란카구라 폭유질주',
        items: [
          '066.jpg','067.jpg','068.jpg','069.jpg','070.jpg','071.jpg',
          '072.jpg','073.jpg','074.jpg','075.jpg','076.jpg','077.jpg','078.jpg',
        ].map(f => ({ src: `${GAME_BASE}/섬란카구라/${f}`, caption: `섬란카구라 폭유질주 · ${f}` })),
      },
      '소울워커': {
        title: '소울워커 SOULWORKER',
        items: [
          '037.jpg','038.jpg','039.jpg','040.jpg','041.jpg','042.jpg','043.jpg',
          '044.jpg','045.jpg','046.jpg','047.jpg','048.jpg','049.jpg','050.jpg',
          '051.jpg','052.jpg','053.jpg','054.jpg',
        ].map(f => ({ src: `${GAME_BASE}/소울워커/${f}`, caption: `소울워커 · ${f}` })),
      },
      'original': {
        title: 'Original Designs',
        items: [
          'Agape_01.jpg','003.jpg','004_01.jpg','006_01.jpg','006_02.jpg',
          '082.jpg','084.jpg','089.jpg','091.jpg','092.jpg',
        ].map(f => ({ src: `${GAME_BASE}/original/${f}`, caption: `Original Design · ${f}` })),
      },
      '메이플스토리': {
        title: '메이플스토리',
        items: [
          { src: `${GAME_BASE}/메이플스토리/01_제논_어센트스킬_네오테릭트라이스.gif`, caption: '제논 · 어센트 스킬 · 네오테릭 트라이스' },
          { src: `${GAME_BASE}/메이플스토리/02_제논_어센트스킬_네오테릭트라이스_퀀텀게이트.GIF`, caption: '제논 · 어센트 스킬 · 네오테릭 트라이스 · 퀀텀 게이트' },
          { src: `${GAME_BASE}/메이플스토리/03_렌_매화검_만리향 시전이펙트.GIF`, caption: '렌 · 매화검 · 만리향 시전 이펙트' },
        ],
      },
      '테르비스': {
        title: '테르비스 TERVIS',
        items: [
          'Cha_Lydia_Swimsuit_Res_End.jpg','018.jpg','020.jpg','021.jpg','027.jpg','032.jpg','033.jpg',
        ].map(f => ({ src: `${GAME_BASE}/테르비스/${f}`, caption: `테르비스 · ${f}` })),
      },
      '로봇걸즈': {
        title: '로봇걸즈 Robot Girls Z',
        items: [
          '056.jpg','057.jpg','058.jpg','059.jpg','060.jpg','061.jpg','062.jpg','063.jpg','064.jpg',
        ].map(f => ({ src: `${GAME_BASE}/로봇걸즈/${f}`, caption: `로봇걸즈 · ${f}` })),
      },
    };

    // 라이트박스 대상: 콘텐츠 영역 figure 안의 이미지 (라이트박스 자체 figure 제외)
    const figureImgs = Array.from(document.querySelectorAll('figure:not(.lightbox-stage) img'));
    figureImgs.forEach((img) => img.classList.add('zoomable'));

    // 현재 활성화된 갤러리(items 배열). 클릭 진입점에 따라 figure-imgs 또는 game-gallery로 바뀜
    let items = [];
    let currentIndex = -1;

    // ─ 줌/팬 상태 ─
    const ZOOM_MIN = 1;
    const ZOOM_MAX = 5;
    const ZOOM_STEP = 0.4;
    const ZOOM_CLICK = 2.2; // 클릭 한번에 확대되는 배율
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let didDrag = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartPanX = 0;
    let dragStartPanY = 0;

    const applyTransform = () => {
      lbImg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    };

    const clampPan = () => {
      // 이미지가 뷰포트보다 작아진 경우 가운데로 강제 정렬
      if (scale <= 1) { panX = 0; panY = 0; return; }
      // 너무 멀리 빠지지 않도록 가벼운 범위 제한
      const r = lbImg.getBoundingClientRect();
      const overX = Math.max(0, (r.width - window.innerWidth) / 2 + 80);
      const overY = Math.max(0, (r.height - window.innerHeight) / 2 + 80);
      panX = Math.max(-overX, Math.min(overX, panX));
      panY = Math.max(-overY, Math.min(overY, panY));
    };

    const setZoom = (next, focusX, focusY) => {
      const prev = scale;
      const newScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
      if (newScale === prev) return;

      // 마우스 위치 기준 줌 (focus 좌표가 주어지면 그 점이 화면상 그대로 유지되도록 pan 조정)
      if (typeof focusX === 'number' && typeof focusY === 'number' && prev > 0) {
        const rect = lbImg.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const offsetX = focusX - cx;
        const offsetY = focusY - cy;
        const ratio = newScale / prev;
        panX = panX - offsetX * (ratio - 1);
        panY = panY - offsetY * (ratio - 1);
      }

      scale = newScale;
      if (scale <= 1) {
        scale = 1;
        panX = 0;
        panY = 0;
        lightbox.classList.remove('is-zoomed');
      } else {
        lightbox.classList.add('is-zoomed');
        clampPan();
      }
      applyTransform();
    };

    const resetZoom = () => {
      scale = 1;
      panX = 0;
      panY = 0;
      lightbox.classList.remove('is-zoomed');
      lightbox.classList.remove('is-panning');
      // 이미지 교체 시에는 transition 없이 즉시 리셋
      const prevTransition = lbImg.style.transition;
      lbImg.style.transition = 'none';
      applyTransform();
      // 다음 프레임에 transition 복원
      requestAnimationFrame(() => { lbImg.style.transition = prevTransition; });
    };

    const renderAt = (idx) => {
      if (idx < 0 || idx >= items.length) return;
      currentIndex = idx;
      const item = items[idx];
      resetZoom();
      lbImg.src = item.src;
      lbImg.alt = item.alt || '';
      lbCaption.textContent = item.caption || '';

      lbCounter.textContent = `${idx + 1} / ${items.length}`;
      lbPrev.style.visibility = idx === 0 ? 'hidden' : 'visible';
      lbNext.style.visibility = idx === items.length - 1 ? 'hidden' : 'visible';
    };

    const open = (newItems, idx) => {
      items = newItems;
      renderAt(idx);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
    };

    const close = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      resetZoom();
      lbImg.src = '';
      items = [];
      currentIndex = -1;
    };

    // 콘텐츠 영역의 figure 이미지로 빌드되는 기본 갤러리(전 페이지 단일 그룹)
    const buildFigureItems = () => figureImgs.map((img) => {
      const fig = img.closest('figure');
      const cap = fig ? fig.querySelector('figcaption') : null;
      return {
        src: img.currentSrc || img.src,
        alt: img.alt || '',
        caption: cap ? (cap.textContent || '').trim().replace(/\s+/g, ' ') : '',
      };
    });

    // 썸네일 클릭 → 페이지 갤러리 라이트박스
    figureImgs.forEach((img, idx) => {
      img.addEventListener('click', (e) => {
        e.preventDefault();
        open(buildFigureItems(), idx);
      });
    });

    // 게임 카드 클릭 → 해당 게임의 갤러리 라이트박스
    document.querySelectorAll('[data-gallery-id]').forEach((card) => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const key = card.getAttribute('data-gallery-id');
        const gallery = gameGalleries[key];
        if (gallery && gallery.items.length) open(gallery.items, 0);
      });
    });

    // 닫기·이전·다음 버튼
    lbClose.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    lbPrev.addEventListener('click', (e) => { e.stopPropagation(); if (currentIndex > 0) renderAt(currentIndex - 1); });
    lbNext.addEventListener('click', (e) => { e.stopPropagation(); if (currentIndex < items.length - 1) renderAt(currentIndex + 1); });

    // stage 영역 클릭 전파 차단(배경 클릭 닫기 방지)
    stage.addEventListener('click', (e) => e.stopPropagation());
    lightbox.addEventListener('click', () => close());

    // ─ 이미지 클릭: 확대 ↔ 원래 크기 토글 ─
    lbImg.addEventListener('click', (e) => {
      e.stopPropagation();
      if (didDrag) { didDrag = false; return; }
      if (scale === 1) {
        setZoom(ZOOM_CLICK, e.clientX, e.clientY);
      } else {
        setZoom(1);
      }
    });

    // 더블클릭은 단일 클릭과 동일 처리(선택)
    lbImg.addEventListener('dblclick', (e) => e.preventDefault());

    // ─ 휠로 줌 ─
    lightbox.addEventListener('wheel', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      setZoom(scale + dir * ZOOM_STEP, e.clientX, e.clientY);
    }, { passive: false });

    // ─ 마우스 드래그로 팬 ─
    lbImg.addEventListener('mousedown', (e) => {
      if (scale === 1) return;
      e.preventDefault();
      isDragging = true;
      didDrag = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartPanX = panX;
      dragStartPanY = panY;
      lightbox.classList.add('is-panning');
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (Math.abs(dx) + Math.abs(dy) > 4) didDrag = true;
      panX = dragStartPanX + dx;
      panY = dragStartPanY + dy;
      clampPan();
      applyTransform();
    });
    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      lightbox.classList.remove('is-panning');
    });

    // ─ 터치 드래그로 팬 (모바일) ─
    let touchStartX = 0, touchStartY = 0, touchStartPanX = 0, touchStartPanY = 0, isTouching = false;
    lbImg.addEventListener('touchstart', (e) => {
      if (scale === 1) return;
      if (e.touches.length !== 1) return;
      isTouching = true;
      didDrag = false;
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchStartPanX = panX;
      touchStartPanY = panY;
    }, { passive: true });
    lbImg.addEventListener('touchmove', (e) => {
      if (!isTouching || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) + Math.abs(dy) > 4) didDrag = true;
      panX = touchStartPanX + dx;
      panY = touchStartPanY + dy;
      clampPan();
      applyTransform();
      e.preventDefault();
    }, { passive: false });
    lbImg.addEventListener('touchend', () => { isTouching = false; });

    // ─ 키보드 ─
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft' && currentIndex > 0 && scale === 1) renderAt(currentIndex - 1);
      else if (e.key === 'ArrowRight' && currentIndex < items.length - 1 && scale === 1) renderAt(currentIndex + 1);
      else if (e.key === '+' || e.key === '=') setZoom(scale + ZOOM_STEP);
      else if (e.key === '-' || e.key === '_') setZoom(scale - ZOOM_STEP);
      else if (e.key === '0') setZoom(1);
    });
  }
})();
