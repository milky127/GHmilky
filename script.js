/* ---------------- MOBILE NAV ---------------- */
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if(menuToggle){
  menuToggle.addEventListener('click', ()=>{
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>navLinks.classList.remove('open')));
}

/* ---------------- TOAST ---------------- */
function toast(msg){
  let t = document.getElementById('toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>t.classList.remove('show'), 3200);
}

/* ---------------- SCROLL REVEAL ---------------- */
const revealEls = document.querySelectorAll('.reveal');
if('IntersectionObserver' in window && revealEls.length){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, {threshold:.12});
  revealEls.forEach(el=>io.observe(el));
} else {
  revealEls.forEach(el=>el.classList.add('in'));
}

/* ---------------- FOOTER YEAR ---------------- */
document.querySelectorAll('.year').forEach(el=> el.textContent = new Date().getFullYear());

/* ---------------- LIVE AVAILABILITY (shared with the staff system) ---------------- */
if(typeof HotelStore !== 'undefined'){
  function paintAvailability(){
    const hState = HotelStore.get();
    const byType = HotelStore.availabilityByType(hState);
    document.querySelectorAll('[data-room-type]').forEach(el=>{
      const type = el.dataset.roomType;
      const info = byType[type];
      if(!info) return;
      const target = el.querySelector('.js-avail');
      if(target){
        if(!target.dataset.base) target.dataset.base = target.textContent;
        const liveText = info.available > 0 ? `${info.available} of ${info.total} available` : `Fully booked`;
        target.textContent = target.dataset.base === 'Availability' ? liveText : `${target.dataset.base} · ${liveText}`;
      }
    });
  }
  paintAvailability();
  // Reflect bookings made in the admin panel (or another tab) without a reload
  window.addEventListener('storage', function(e){
    if(e.key === HOTEL_STORAGE_KEY) paintAvailability();
  });
}

/* ---------------- BOOKING FORM ---------------- */
const bookingForm = document.getElementById('bookingForm');
if(bookingForm){
  const params = new URLSearchParams(window.location.search);
  const preselect = params.get('room');
  if(preselect){
    const sel = document.getElementById('bRoom');
    if(sel){
      [...sel.options].forEach(o=>{ if(o.value === preselect) sel.value = preselect; });
    }
  }

  bookingForm.addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('bName').value.trim();
    const email = document.getElementById('bEmail').value.trim();
    const phone = document.getElementById('bPhone').value.trim();
    const checkin = document.getElementById('bCheckin').value;
    const checkout = document.getElementById('bCheckout').value;
    const roomType = document.getElementById('bRoom').value;
    const message = document.getElementById('bMessage').value.trim();

    if(!name || !email || !checkin || !checkout){
      toast('Please fill in name, email and your dates.');
      return;
    }
    if(new Date(checkout) <= new Date(checkin)){
      toast('Check-out must be after check-in.');
      return;
    }

    let result = null;
    if(typeof HotelStore !== 'undefined'){
      result = HotelStore.requestBooking({ name, phone, email, checkin, checkout, roomType, message });
    }

    const successBox = document.getElementById('formSuccess');
    bookingForm.style.display = 'none';
    if(successBox){
      successBox.style.display = 'block';
      successBox.querySelector('.who').textContent = name;
      const detail = successBox.querySelector('.detail');
      if(detail){
        detail.textContent = (result && result.room)
          ? `Room ${result.room.number} (${roomType}) has been reserved for you, pending front-desk confirmation.`
          : `We'll confirm your ${roomType} as soon as the front desk reviews availability.`;
      }
    }
    toast('Request sent — our front desk will confirm shortly.');
  });
}
