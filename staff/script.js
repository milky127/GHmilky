/* ---------------- STATE ----------------
   Rooms, bookings and guests now live in the shared HotelStore
   (see ../hotel-data.js) so they stay in sync with the public
   website instead of being re-randomized on every page load. */
const roomTypes = HOTEL_ROOM_TYPES;
const floors = HOTEL_FLOORS;

let state = HotelStore.get();
function persist(){ HotelStore.save(state); }

let activeTab = "dashboard";

/* Pick up bookings/room changes made in another tab (e.g. a guest
   submitting the booking form on the website) without a manual refresh. */
window.addEventListener('storage', function(e){
  if(e.key === HOTEL_STORAGE_KEY){
    state = HotelStore.get();
    render();
    toast('Updated — new activity from the website');
  }
});

/* ---------------- HELPERS ---------------- */
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}
function closeModal(){
  document.getElementById('overlay').classList.remove('show');
}
function openModal(html){
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('overlay').classList.add('show');
}
function initials(name){
  return name.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();
}
function fmtDate(d){
  return new Date(d+"T00:00:00").toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

/* ---------------- CLOCK ---------------- */
function tickClock(){
  const now = new Date();
  document.getElementById('clock').innerHTML =
    now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}) + "<br>" +
    now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
}
tickClock();
setInterval(tickClock,30000);

/* ---------------- NAV ---------------- */
document.getElementById('nav').addEventListener('click', e=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  activeTab = btn.dataset.tab;
  render();
});

/* ---------------- RENDER ROUTER ---------------- */
function render(){
  const titles = {
    dashboard:["Dashboard","Overview of tonight's house"],
    rooms:["Rooms","All floors — tap a room to update its status"],
    bookings:["Bookings","Reservations, check-ins and check-outs"],
    guests:["Guests","Guest directory and stay history"],
    staff:["Staff","Roster, roles and current shift"],
    food:["Food Orders","Room service and restaurant orders"],
  };
  document.getElementById('pageTitle').textContent = titles[activeTab][0];
  document.getElementById('pageMeta').textContent = titles[activeTab][1];
  const c = document.getElementById('content');
  if(activeTab==="dashboard") c.innerHTML = renderDashboard();
  if(activeTab==="rooms") c.innerHTML = renderRooms();
  if(activeTab==="bookings") c.innerHTML = renderBookings();
  if(activeTab==="guests") c.innerHTML = renderGuests();
  if(activeTab==="staff") c.innerHTML = renderStaff();
  if(activeTab==="food") c.innerHTML = renderFood();
}

/* ---------------- DASHBOARD ---------------- */
function renderDashboard(){
  const total = state.rooms.length;
  const occupied = state.rooms.filter(r=>r.status==="occupied").length;
  const occRate = Math.round((occupied/total)*100);
  const revenue = state.rooms.filter(r=>r.status==="occupied").reduce((s,r)=>s+r.price,0);
  const arrivals = state.bookings.filter(b=>b.status==="confirmed"||b.status==="pending").length;
  const onShift = state.staff.filter(s=>s.status==="on-shift").length;

  return `
    <div class="stat-row">
      <div class="stat"><div class="label">Occupancy</div><div class="val">${occRate}%</div><div class="sub">${occupied} of ${total} rooms</div></div>
      <div class="stat"><div class="label">Room Revenue Tonight</div><div class="val">$${revenue}</div><div class="sub">from occupied rooms</div></div>
      <div class="stat"><div class="label">Upcoming Arrivals</div><div class="val">${arrivals}</div><div class="sub">confirmed or pending</div></div>
      <div class="stat"><div class="label">Staff On Shift</div><div class="val">${onShift}</div><div class="sub">of ${state.staff.length} total</div></div>
    </div>

    <div class="section-head">
      <div><span class="eyebrow">The House</span><h2>Room Rack</h2></div>
      <button class="btn ghost small" data-tab="rooms" onclick="jump('rooms')">View all rooms →</button>
    </div>
    ${roomRackHTML()}

    <div class="grid-2">
      <div class="panel">
        <h3>Next Arrivals</h3>
        ${state.bookings.filter(b=>b.status!=="checked-in").slice(0,4).map(b=>`
          <div class="staff-card">
            <div class="initials">${initials(b.guest)}</div>
            <div class="info">
              <div class="name">${b.guest} — Room ${b.room}</div>
              <div class="role">${fmtDate(b.checkin)} → ${fmtDate(b.checkout)}</div>
            </div>
            <span class="pill ${b.status}">${b.status}</span>
          </div>
        `).join('') || '<div class="empty">No upcoming arrivals</div>'}
      </div>
      <div class="panel">
        <h3>On Shift Now</h3>
        ${state.staff.filter(s=>s.status==="on-shift").map(s=>`
          <div class="staff-card">
            <div class="initials">${initials(s.name)}</div>
            <div class="info">
              <div class="name">${s.name}</div>
              <div class="role">${s.role} · ${s.shift} shift</div>
            </div>
          </div>
        `).join('') || '<div class="empty">No one currently on shift</div>'}
      </div>
    </div>
  `;
}
function jump(tab){
  activeTab = tab;
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  render();
}

/* ---------------- ROOMS ---------------- */
function roomRackHTML(){
  return `
    <div class="rack">
      ${floors.map(fl=>`
        <div class="rack-floor">
          <div class="flabel">FLOOR ${fl}</div>
          <div class="room-grid">
            ${state.rooms.filter(r=>r.floor===fl).map(r=>`
              <div class="room-card ${r.status}" onclick="cycleRoomStatus(${r.id})" title="Click to change status">
                <div class="rno mono">${r.number}</div>
                <div class="rtype">${r.type.split(' ')[0]}</div>
                <div class="rstatus">${r.status}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
      <div class="legend">
        <span><i style="background:var(--sage)"></i>Available</span>
        <span><i style="background:var(--hold)"></i>Reserved</span>
        <span><i style="background:var(--rust)"></i>Occupied</span>
        <span><i style="background:var(--slate)"></i>Cleaning</span>
        <span><i style="background:var(--brass)"></i>Maintenance</span>
      </div>
    </div>
  `;
}
const statusCycle = ["available","reserved","occupied","cleaning","maintenance"];
function cycleRoomStatus(id){
  const room = state.rooms.find(r=>r.id===id);
  const idx = statusCycle.indexOf(room.status);
  room.status = statusCycle[(idx+1)%statusCycle.length];
  if(room.status!=="occupied" && room.status!=="reserved") room.guest = null;
  persist();
  render();
  toast(`Room ${room.number} marked ${room.status}`);
}
function renderRooms(){
  return `
    <div class="section-head">
      <div><span class="eyebrow">${state.rooms.length} Rooms</span><h2>Room Rack — All Floors</h2></div>
    </div>
    ${roomRackHTML()}
    <div class="section-head" style="margin-top:30px;">
      <div><span class="eyebrow">Detail</span><h2>Room List</h2></div>
    </div>
    <table>
      <thead><tr><th>Room</th><th>Type</th><th>Floor</th><th>Rate / night</th><th>Status</th><th>Guest</th></tr></thead>
      <tbody>
        ${state.rooms.sort((a,b)=>a.number-b.number).map(r=>`
          <tr>
            <td class="mono">${r.number}</td>
            <td>${r.type}</td>
            <td>${r.floor}</td>
            <td class="mono">$${r.price}</td>
            <td><span class="pill ${r.status}">${r.status}</span></td>
            <td>${r.guest || '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* ---------------- BOOKINGS ---------------- */
function renderBookings(){
  return `
    <div class="section-head">
      <div><span class="eyebrow">${state.bookings.length} Reservations</span><h2>Bookings</h2></div>
      <button class="btn" onclick="openBookingModal()">+ New Booking</button>
    </div>
    <table>
      <thead><tr><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Phone</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${state.bookings.length ? state.bookings.slice().reverse().map(b=>`
          <tr>
            <td>${b.guest}${b.source==='website' ? ' <span class="mono" style="font-size:9.5px;background:var(--slate-bg);color:var(--slate);padding:2px 7px;border-radius:10px;font-weight:600;margin-left:4px;">WEB</span>' : ''}</td>
            <td>${b.room ? `<span class="mono">${b.room}</span>` : `<span class="mono" style="color:var(--text-dim);">Unassigned</span>`}${b.roomType ? `<div style="font-size:11px;color:var(--text-dim);">${b.roomType}</div>` : ''}</td>
            <td>${fmtDate(b.checkin)}</td>
            <td>${fmtDate(b.checkout)}</td>
            <td class="mono">${b.phone}</td>
            <td><span class="pill ${b.status}">${b.status}</span></td>
            <td class="row-actions">
              ${!b.room ? `<button class="link-btn" onclick="assignRoomModal(${b.id})">Assign room</button>` : (b.status!=="checked-in" ? `<button class="link-btn" onclick="checkIn(${b.id})">Check in</button>` : `<button class="link-btn" onclick="checkOut(${b.id})">Check out</button>`)}
            </td>
          </tr>
        `).join('') : `<tr><td colspan="7"><div class="empty">No bookings yet — add one to get started</div></td></tr>`}
      </tbody>
    </table>
  `;
}
function checkIn(id){
  const b = state.bookings.find(x=>x.id===id);
  if(!b.room){ toast("Assign a room before checking in"); return; }
  b.status = "checked-in";
  const room = state.rooms.find(r=>r.number===Number(b.room));
  if(room){ room.status="occupied"; room.guest=b.guest; }
  persist();
  render();
  toast(`${b.guest} checked in to room ${b.room}`);
}
function checkOut(id){
  const b = state.bookings.find(x=>x.id===id);
  const room = state.rooms.find(r=>r.number===Number(b.room));
  if(room){ room.status="cleaning"; room.guest=null; }
  state.bookings = state.bookings.filter(x=>x.id!==id);
  persist();
  render();
  toast(`${b.guest} checked out of room ${b.room}`);
}
function openBookingModal(){
  const availableRooms = state.rooms.filter(r=>r.status==="available");
  openModal(`
    <h3>New Booking</h3>
    <div class="field"><label>Guest name</label><input id="mGuest" placeholder="e.g. R. Mekonnen"></div>
    <div class="field"><label>Phone</label><input id="mPhone" placeholder="+251 9..."></div>
    <div class="field"><label>Room</label>
      <select id="mRoom">${availableRooms.map(r=>`<option value="${r.number}">${r.number} — ${r.type} ($${r.price}/night)</option>`).join('') || '<option value="">No rooms available</option>'}</select>
    </div>
    <div class="field"><label>Check-in</label><input type="date" id="mCheckin" value="2026-08-19"></div>
    <div class="field"><label>Check-out</label><input type="date" id="mCheckout" value="2026-08-21"></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn" onclick="submitBooking()">Create Booking</button>
    </div>
  `);
}
function submitBooking(){
  const guest = document.getElementById('mGuest').value.trim();
  const phone = document.getElementById('mPhone').value.trim();
  const room = document.getElementById('mRoom').value;
  const checkin = document.getElementById('mCheckin').value;
  const checkout = document.getElementById('mCheckout').value;
  if(!guest || !room){ toast("Add a guest name and room"); return; }
  HotelStore.createBookingForRoom(state, {guest, phone, room, checkin, checkout});
  persist();
  closeModal();
  activeTab = "bookings";
  jump("bookings");
  toast(`Booking created for ${guest} — room ${room} reserved`);
}
function assignRoomModal(id){
  const b = state.bookings.find(x=>x.id===id);
  const options = state.rooms.filter(r=>r.status==="available" && (!b.roomType || r.type===b.roomType));
  openModal(`
    <h3>Assign Room</h3>
    <p style="font-size:13px;color:var(--text-dim);margin:-6px 0 16px 0;">${b.guest} requested ${b.roomType || 'a room'} via the website.</p>
    <div class="field"><label>Room</label>
      <select id="aRoom">${options.length ? options.map(r=>`<option value="${r.number}">${r.number} — ${r.type} ($${r.price}/night)</option>`).join('') : '<option value="">No matching rooms available</option>'}</select>
    </div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn" onclick="submitAssignRoom(${id})">Assign</button>
    </div>
  `);
}
function submitAssignRoom(id){
  const roomNum = document.getElementById('aRoom').value;
  if(!roomNum){ toast("No matching room available"); return; }
  const b = state.bookings.find(x=>x.id===id);
  const room = state.rooms.find(r=>r.number===Number(roomNum));
  b.room = Number(roomNum);
  if(b.status === "pending") b.status = "confirmed";
  room.status = "reserved";
  room.guest = b.guest;
  persist();
  closeModal();
  jump("bookings");
  toast(`Room ${roomNum} assigned to ${b.guest}`);
}

/* ---------------- GUESTS ---------------- */
function renderGuests(){
  return `
    <div class="section-head">
      <div><span class="eyebrow">${state.guests.length} Guests</span><h2>Guest Directory</h2></div>
      <button class="btn" onclick="openGuestModal()">+ Add Guest</button>
    </div>
    <table>
      <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Past Visits</th></tr></thead>
      <tbody>
        ${state.guests.map(g=>`
          <tr>
            <td>${g.name}</td>
            <td class="mono">${g.phone}</td>
            <td>${g.email}</td>
            <td class="mono">${g.visits}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
function openGuestModal(){
  openModal(`
    <h3>Add Guest</h3>
    <div class="field"><label>Name</label><input id="gName" placeholder="Full name"></div>
    <div class="field"><label>Phone</label><input id="gPhone" placeholder="+251 9..."></div>
    <div class="field"><label>Email</label><input id="gEmail" placeholder="name@mail.com"></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn" onclick="submitGuest()">Add Guest</button>
    </div>
  `);
}
function submitGuest(){
  const name = document.getElementById('gName').value.trim();
  const phone = document.getElementById('gPhone').value.trim();
  const email = document.getElementById('gEmail').value.trim();
  if(!name){ toast("Add a guest name"); return; }
  state.guests.push({id: state.nextGuestId++, name, phone: phone||"—", email: email||"—", visits:0});
  persist();
  closeModal();
  jump("guests");
  toast(`${name} added to guest directory`);
}

/* ---------------- STAFF ---------------- */
function renderStaff(){
  const depts = [...new Set(state.staff.map(s=>s.dept))];
  return `
    <div class="section-head">
      <div><span class="eyebrow">${state.staff.length} Employees</span><h2>Staff Roster</h2></div>
      <button class="btn" onclick="openStaffModal()">+ Add Staff</button>
    </div>
    <div class="grid-2">
      ${depts.map(d=>`
        <div class="panel">
          <h3>${d}</h3>
          ${state.staff.filter(s=>s.dept===d).map(s=>`
            <div class="staff-card">
              <div class="initials">${initials(s.name)}</div>
              <div class="info">
                <div class="name">${s.name}</div>
                <div class="role">${s.role} · ${s.shift} shift</div>
              </div>
              <button class="link-btn" onclick="toggleShift(${s.id})">
                <span class="pill ${s.status}">${s.status}</span>
              </button>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}
function toggleShift(id){
  const s = state.staff.find(x=>x.id===id);
  s.status = s.status==="on-shift" ? "off-shift" : "on-shift";
  persist();
  render();
  toast(`${s.name} marked ${s.status.replace('-',' ')}`);
}
function openStaffModal(){
  openModal(`
    <h3>Add Staff Member</h3>
    <div class="field"><label>Name</label><input id="sName" placeholder="Full name"></div>
    <div class="field"><label>Role</label><input id="sRole" placeholder="e.g. Night Auditor"></div>
    <div class="field"><label>Department</label>
      <select id="sDept"><option>Front Office</option><option>Housekeeping</option><option>Engineering</option><option>Food & Beverage</option><option>Security</option></select>
    </div>
    <div class="field"><label>Shift</label>
      <select id="sShift"><option>Morning</option><option>Evening</option><option>Night</option></select>
    </div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn" onclick="submitStaff()">Add Staff</button>
    </div>
  `);
}
function submitStaff(){
  const name = document.getElementById('sName').value.trim();
  const role = document.getElementById('sRole').value.trim();
  const dept = document.getElementById('sDept').value;
  const shift = document.getElementById('sShift').value;
  if(!name || !role){ toast("Add a name and role"); return; }
  state.staff.push({id: state.nextStaffId++, name, role, dept, shift, status:"off-shift"});
  persist();
  closeModal();
  jump("staff");
  toast(`${name} added to staff roster`);
}

/* ---------------- FOOD ORDERING ---------------- */
let tempCart = {};
function renderFood(){
  const openOrders = state.foodOrders.filter(o=>o.status!=="delivered").length;
  const categories = new Set(state.menu.map(m=>m.category)).size;
  return `
    <div class="stat-row" style="grid-template-columns:repeat(3,1fr);">
      <div class="stat"><div class="label">Open Orders</div><div class="val">${openOrders}</div><div class="sub">placed or preparing</div></div>
      <div class="stat"><div class="label">Orders Today</div><div class="val">${state.foodOrders.length}</div><div class="sub">across all rooms</div></div>
      <div class="stat"><div class="label">Menu Items</div><div class="val">${state.menu.length}</div><div class="sub">across ${categories} categories</div></div>
    </div>

    <div class="section-head">
      <div><span class="eyebrow">Kitchen</span><h2>Menu</h2></div>
    </div>
    <div class="menu-grid">
      ${state.menu.map(m=>`
        <div class="menu-item">
          <div class="mi-top"><span class="mi-name">${m.name}</span><span class="mi-price mono">$${m.price}</span></div>
          <div class="mi-cat">${m.category}</div>
        </div>
      `).join('')}
    </div>

    <div class="section-head">
      <div><span class="eyebrow">${state.foodOrders.length} Orders</span><h2>Room Service Orders</h2></div>
      <button class="btn" onclick="openFoodOrderModal()">+ New Order</button>
    </div>
    <table>
      <thead><tr><th>Room</th><th>Guest</th><th>Items</th><th>Total</th><th>Time</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${state.foodOrders.length ? state.foodOrders.slice().reverse().map(o=>`
          <tr>
            <td class="mono">${o.room}</td>
            <td>${o.guest}</td>
            <td class="order-items">${o.items.map(i=>`${i.qty}× ${i.name}`).join(', ')}</td>
            <td class="mono">$${o.total}</td>
            <td class="mono">${o.time}</td>
            <td><span class="pill ${o.status}">${o.status}</span></td>
            <td class="row-actions">${o.status!=="delivered" ? `<button class="link-btn" onclick="advanceOrder(${o.id})">Mark ${o.status==="placed"?"preparing":"delivered"}</button>` : ''}</td>
          </tr>
        `).join('') : `<tr><td colspan="7"><div class="empty">No food orders yet</div></td></tr>`}
      </tbody>
    </table>
  `;
}
function openFoodOrderModal(){
  tempCart = {};
  const occupiedRooms = state.rooms.filter(r=>r.status==="occupied");
  openModal(`
    <h3>New Food Order</h3>
    <div class="field"><label>Room</label>
      <select id="fRoom">${occupiedRooms.length ? occupiedRooms.map(r=>`<option value="${r.number}">${r.number} — ${r.guest||'Guest'}</option>`).join('') : '<option value="">No occupied rooms</option>'}</select>
    </div>
    <div class="field"><label>Items</label>
      <div class="cart-list">
        ${state.menu.map(m=>`
          <div class="cart-row">
            <div class="cr-name">${m.name}</div>
            <div class="cr-price mono">$${m.price}</div>
            <input type="number" min="0" value="0" id="qty-${m.id}" oninput="updateCartQty(${m.id}, this.value, ${m.price})">
          </div>
        `).join('')}
      </div>
      <div class="cart-total"><span>Total</span><span class="mono" id="cartTotal">$0</span></div>
    </div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">Cancel</button>
      <button class="btn" onclick="submitFoodOrder()">Place Order</button>
    </div>
  `);
}
function updateCartQty(id, val, price){
  const qty = parseInt(val)||0;
  if(qty<=0){ delete tempCart[id]; }
  else { tempCart[id] = {qty, price, name: state.menu.find(m=>m.id===id).name}; }
  const total = Object.values(tempCart).reduce((s,i)=>s+i.qty*i.price,0);
  document.getElementById('cartTotal').textContent = `$${total}`;
}
function submitFoodOrder(){
  const room = document.getElementById('fRoom').value;
  const items = Object.values(tempCart);
  if(!room){ toast("Select a room"); return; }
  if(!items.length){ toast("Add at least one item"); return; }
  const roomObj = state.rooms.find(r=>r.number===Number(room));
  const total = items.reduce((s,i)=>s+i.qty*i.price,0);
  state.foodOrders.push({
    id: state.nextOrderId++,
    room: Number(room),
    guest: roomObj && roomObj.guest ? roomObj.guest : "Guest",
    items: items.map(i=>({name:i.name, qty:i.qty, price:i.price})),
    status:"placed",
    time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),
    total
  });
  persist();
  closeModal();
  jump("food");
  toast(`Order placed for room ${room}`);
}
const orderStatusCycle = ["placed","preparing","delivered"];
function advanceOrder(id){
  const o = state.foodOrders.find(x=>x.id===id);
  const idx = orderStatusCycle.indexOf(o.status);
  if(idx < orderStatusCycle.length-1){
    o.status = orderStatusCycle[idx+1];
    persist();
    render();
    toast(`Order #${o.id} marked ${o.status}`);
  }
}

/* ---------------- INIT ---------------- */
document.getElementById('overlay').addEventListener('click', e=>{
  if(e.target.id==='overlay') closeModal();
});
render();
