// Le Ziryab — premium interactions
(function(){
  'use strict';

  // Map UI seating labels -> DB enum codes
  const SEAT_CODE = {
    'Main Andalusian Hall': 'MAIN',
    'VIP Lounge': 'VIP',
    'Intimate Corner': 'CORNER',
  };

  // i18n labels for wizard dynamic strings — defaults are English.
  // Localized pages set window.WIZ_LABELS BEFORE loading this script.
  const L = Object.assign({
    next: 'Continue',
    confirm: 'Confirm Reservation',
    close: 'Close',
    sending: 'Sending…',
    errDate: 'Please select a date',
    errTime: 'Please select a time',
    errSeat: 'Please select a seating type',
    errFail: 'Reservation failed: ',
    closedMon: 'We are closed on Mondays — please select another date',
    available: 'Available — choose your preferred time',
    tableOk: 'Table available — continue to next step',
    soldOut: 'Sold out — try another time',
  }, window.WIZ_LABELS || {});

  /* ---------- Navbar scroll ---------- */
  const nav = document.querySelector('.nav');
  if(nav){
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  /* ---------- Mobile toggle ---------- */
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.querySelector('.nav__menu');
  if(toggle && menu){
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      menu.classList.toggle('open');
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      toggle.classList.remove('open');
      menu.classList.remove('open');
    }));
  }

  /* ---------- Active section in nav ---------- */
  const navLinks = document.querySelectorAll('.nav__menu a[href^="#"]');
  const sections = Array.from(navLinks).map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if(sections.length){
    const navObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if(e.isIntersecting){
          const id = '#' + e.target.id;
          navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
        }
      });
    }, {rootMargin:'-45% 0px -50% 0px'});
    sections.forEach(s => navObs.observe(s));
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, {threshold:0.1, rootMargin:'0px 0px -60px 0px'});
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- Menu tabs ---------- */
  const tabs = document.querySelectorAll('.menu-tabs button');
  const panels = document.querySelectorAll('.menu-panel');
  if(tabs.length && panels.length){
    tabs.forEach(btn => btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      tabs.forEach(b => b.classList.toggle('active', b === btn));
      panels.forEach(p => p.classList.toggle('active', p.id === target));
    }));
  }

  /* ---------- Booking wizard ---------- */
  const wizOverlay = document.getElementById('wiz');
  const openers = document.querySelectorAll('[data-open-wiz]');
  const closeBtn = wizOverlay && wizOverlay.querySelector('.wiz__close');
  const stepEls = wizOverlay && wizOverlay.querySelectorAll('.wiz__step');
  const panelEls = wizOverlay && wizOverlay.querySelectorAll('.wiz__panel');
  const backBtn = wizOverlay && wizOverlay.querySelector('[data-wiz-back]');
  const nextBtn = wizOverlay && wizOverlay.querySelector('[data-wiz-next]');

  const state = {
    step: 1,
    date: '',
    time: '',
    guests: 2,
    seating: '',
    name: '',
    phone: '',
    email: '',
    occasion: '',
    notes: '',
  };

  function openWiz(){
    if(!wizOverlay) return;
    wizOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setStep(1);
    // Default date = today
    const di = wizOverlay.querySelector('input[name="date"]');
    if(di && !di.value){
      const today = new Date().toISOString().split('T')[0];
      di.min = today;
      di.value = today;
      state.date = today;
    }
  }
  function closeWiz(){
    if(!wizOverlay) return;
    wizOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  openers.forEach(b => b.addEventListener('click', e => { e.preventDefault(); openWiz(); }));
  if(closeBtn) closeBtn.addEventListener('click', closeWiz);
  if(wizOverlay) wizOverlay.addEventListener('click', e => { if(e.target === wizOverlay) closeWiz(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && wizOverlay && wizOverlay.classList.contains('open')) closeWiz(); });

  function setStep(n){
    state.step = n;
    if(!stepEls) return;
    stepEls.forEach((s, i) => {
      s.classList.toggle('active', i+1 === n);
      s.classList.toggle('done', i+1 < n);
    });
    panelEls.forEach((p, i) => p.classList.toggle('active', i+1 === n));
    if(backBtn) backBtn.style.visibility = (n === 1 || n === 4) ? 'hidden' : 'visible';
    if(nextBtn){
      nextBtn.textContent = (n === 3) ? L.confirm : (n === 4 ? L.close : L.next);
    }
    const wiz = wizOverlay.querySelector('.wiz');
    if(wiz) wiz.scrollTop = 0;
  }

  // Time pills
  const timeGrid = wizOverlay && wizOverlay.querySelector('.time-grid');
  if(timeGrid){
    const slots = ['19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30'];
    // Mark 20:30 + 21:00 as taken (demo)
    const taken = new Set(['20:30','21:00']);
    timeGrid.innerHTML = slots.map(t => `<button type="button" class="time-pill ${taken.has(t)?'disabled':''}" data-time="${t}">${t}</button>`).join('');
    timeGrid.addEventListener('click', e => {
      const b = e.target.closest('.time-pill');
      if(!b || b.classList.contains('disabled')) return;
      timeGrid.querySelectorAll('.time-pill').forEach(p => p.classList.remove('active'));
      b.classList.add('active');
      state.time = b.dataset.time;
      showAvail(true);
    });
  }

  // Seat options
  const seatGrid = wizOverlay && wizOverlay.querySelector('.seat-grid');
  if(seatGrid){
    seatGrid.addEventListener('click', e => {
      const o = e.target.closest('.seat-opt');
      if(!o) return;
      seatGrid.querySelectorAll('.seat-opt').forEach(x => x.classList.remove('active'));
      o.classList.add('active');
      state.seating = o.dataset.seat;
    });
  }

  // Date change
  const dateInput = wizOverlay && wizOverlay.querySelector('input[name="date"]');
  if(dateInput){
    dateInput.addEventListener('change', () => {
      state.date = dateInput.value;
      // Mondays closed
      const d = new Date(dateInput.value);
      const closed = d.getDay() === 1;
      const avail = wizOverlay.querySelector('.avail');
      if(avail){
        avail.classList.add('show');
        if(closed){
          avail.className = 'avail warn show';
          avail.textContent = L.closedMon;
        } else {
          avail.className = 'avail ok show';
          avail.textContent = L.available;
        }
      }
    });
  }

  function showAvail(ok){
    const avail = wizOverlay.querySelector('.avail');
    if(!avail) return;
    avail.classList.add('show');
    avail.className = ok ? 'avail ok show' : 'avail warn show';
    avail.textContent = ok ? L.tableOk : L.soldOut;
  }

  // Guests counter
  const guestsCount = wizOverlay && wizOverlay.querySelector('.guests-row .count');
  const guestsMinus = wizOverlay && wizOverlay.querySelector('[data-guests-minus]');
  const guestsPlus = wizOverlay && wizOverlay.querySelector('[data-guests-plus]');
  function setGuests(n){
    state.guests = Math.max(1, Math.min(20, n));
    if(guestsCount) guestsCount.textContent = state.guests;
  }
  if(guestsMinus) guestsMinus.addEventListener('click', () => setGuests(state.guests - 1));
  if(guestsPlus) guestsPlus.addEventListener('click', () => setGuests(state.guests + 1));

  // Nav: validate & advance
  if(nextBtn){
    nextBtn.addEventListener('click', async () => {
      if(state.step === 1){
        if(!state.date){ flashErr(L.errDate); return; }
        if(!state.time){ flashErr(L.errTime); return; }
        setStep(2);
      } else if(state.step === 2){
        if(!state.seating){ flashErr(L.errSeat); return; }
        setStep(3);
      } else if(state.step === 3){
        const form = wizOverlay.querySelector('#wiz-details');
        if(!form.reportValidity()) return;
        state.name = form.elements['name'].value;
        state.phone = form.elements['phone'].value;
        state.email = form.elements['email'].value;
        state.occasion = form.elements['occasion'].value;
        state.notes = form.elements['notes'].value;

        // Submit to Supabase
        const originalLabel = nextBtn.textContent;
        nextBtn.disabled = true;
        nextBtn.textContent = L.sending;
        const result = await window.createReservation({
          name: state.name,
          phone: state.phone,
          email: state.email,
          date: state.date,
          time: state.time,
          guests: state.guests,
          seating: SEAT_CODE[state.seating] || state.seating,
        });
        nextBtn.disabled = false;
        nextBtn.textContent = originalLabel;

        if(!result.success){
          flashErr(L.errFail + (result.error || 'unknown'));
          return;
        }

        // Persist locally (cache last booking)
        try { localStorage.setItem('leziryab:lastBooking', JSON.stringify({...state, supabaseId: result.data?.[0]?.id})); } catch(_){}
        setStep(4);

        // Also offer WhatsApp shortcut
        const wa = wizOverlay.querySelector('[data-wa-send]');
        if(wa){
          const txt = `Hello Le Ziryab, I would like to reserve a table.%0A%0AName: ${enc(state.name)}%0APhone: ${enc(state.phone)}%0AEmail: ${enc(state.email)}%0ADate: ${enc(state.date)}%0ATime: ${enc(state.time)}%0AGuests: ${state.guests}%0ASeating: ${enc(state.seating)}%0AOccasion: ${enc(state.occasion)}%0ANotes: ${enc(state.notes)}`;
          wa.href = `https://wa.me/212500000000?text=${txt}`;
        }
      } else if(state.step === 4){
        closeWiz();
      }
    });
  }
  if(backBtn) backBtn.addEventListener('click', () => { if(state.step > 1) setStep(state.step - 1); });

  function enc(s){ return encodeURIComponent(s || ''); }
  function flashErr(msg){
    const avail = wizOverlay.querySelector('.avail');
    if(avail){
      avail.classList.add('show');
      avail.className = 'avail warn show';
      avail.textContent = msg;
    }
  }

  /* ---------- Year ---------- */
  const yr = document.querySelector('[data-year]');
  if(yr) yr.textContent = new Date().getFullYear();
})();
