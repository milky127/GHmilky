/* =====================================================================
   SHARED HOTEL DATA STORE
   Loaded by both the public website and the staff system so that a
   booking made on the website shows up in the admin Bookings tab, and
   the room a guest requests is actually marked taken in the Rooms tab
   — instead of each page keeping its own separate, made-up data.
   Persisted in localStorage under HOTEL_STORAGE_KEY (same browser,
   same origin, shared across tabs).
===================================================================== */

const HOTEL_STORAGE_KEY = "milkyHotelState";

const HOTEL_ROOM_TYPES = ["Standard Twin", "Standard King", "Deluxe Queen", "Suite", "Executive Suite"];
const HOTEL_FLOORS = [1, 2, 3];
const HOTEL_RATES = {
  "Standard Twin": 129,
  "Standard King": 139,
  "Deluxe Queen": 179,
  "Suite": 219,
  "Executive Suite": 289
};

/* Fixed room layout so a room's type doesn't reshuffle on reload —
   only its status/guest changes, and only through real bookings. */
function hotelBuildInitialRooms(){
  const layout = {
    101: ["Standard King", "available"], 102: ["Standard Twin", "available"], 103: ["Standard Twin", "cleaning"],
    104: ["Deluxe Queen", "available"], 105: ["Standard King", "available"], 106: ["Standard Twin", "available"],
    107: ["Suite", "maintenance"], 108: ["Standard King", "available"],
    201: ["Deluxe Queen", "available"], 202: ["Standard Twin", "available"], 203: ["Standard King", "available"],
    204: ["Standard King", "available"], 205: ["Suite", "available"], 206: ["Standard Twin", "cleaning"],
    207: ["Deluxe Queen", "available"], 208: ["Standard King", "available"],
    301: ["Executive Suite", "available"], 302: ["Deluxe Queen", "available"], 303: ["Standard King", "available"],
    304: ["Standard Twin", "available"], 305: ["Deluxe Queen", "available"], 306: ["Suite", "available"],
    307: ["Standard Twin", "cleaning"], 308: ["Executive Suite", "available"]
  };
  return Object.keys(layout).map(numStr => {
    const number = Number(numStr);
    const floor = Math.floor(number / 100);
    const [type, status] = layout[numStr];
    return { id: number, number, floor, type, price: HOTEL_RATES[type], status, guest: null };
  });
}

function hotelBuildInitialState(){
  const rooms = hotelBuildInitialRooms();

  const bookings = [
    { id: 1, guest: "A. Bekele", phone: "+251 91 234 5671", roomType: "Standard King", room: 101, checkin: "2026-08-18", checkout: "2026-08-21", status: "checked-in", source: "front-desk" },
    { id: 2, guest: "M. Haile", phone: "+251 91 234 5672", roomType: "Standard King", room: 204, checkin: "2026-08-19", checkout: "2026-08-20", status: "confirmed", source: "front-desk" },
    { id: 3, guest: "T. Girma", phone: "+251 91 234 5673", roomType: "Deluxe Queen", room: 305, checkin: "2026-08-20", checkout: "2026-08-24", status: "pending", source: "front-desk" }
  ];

  // Reflect those bookings onto the room rack so Rooms and Bookings
  // never disagree, even on first load.
  bookings.forEach(b => {
    const room = rooms.find(r => r.number === b.room);
    if(room){
      room.status = b.status === "checked-in" ? "occupied" : "reserved";
      room.guest = b.guest;
    }
  });

  const guests = [
    { id: 1, name: "A. Bekele", phone: "+251 91 234 5671", email: "a.bekele@mail.com", visits: 3 },
    { id: 2, name: "M. Haile", phone: "+251 91 234 5672", email: "m.haile@mail.com", visits: 1 },
    { id: 3, name: "T. Girma", phone: "+251 91 234 5673", email: "t.girma@mail.com", visits: 5 },
    { id: 4, name: "S. Desta", phone: "+251 91 234 5674", email: "s.desta@mail.com", visits: 2 }
  ];

  const staff = [
    { id: 1, name: "Selam Tesfaye", role: "Front Desk Manager", dept: "Front Office", shift: "Morning", status: "on-shift" },
    { id: 2, name: "Yonas Abera", role: "Housekeeping Lead", dept: "Housekeeping", shift: "Morning", status: "on-shift" },
    { id: 3, name: "Hana Girma", role: "Concierge", dept: "Front Office", shift: "Evening", status: "off-shift" },
    { id: 4, name: "Dawit Kebede", role: "Maintenance Tech", dept: "Engineering", shift: "Morning", status: "on-shift" },
    { id: 5, name: "Ruth Alemu", role: "Housekeeper", dept: "Housekeeping", shift: "Morning", status: "on-shift" },
    { id: 6, name: "Biruk Mesfin", role: "Night Auditor", dept: "Front Office", shift: "Night", status: "off-shift" }
  ];

  const menu = [
    { id: 1, name: "Injera with Doro Wat", category: "Mains", price: 14 },
    { id: 2, name: "Club Sandwich", category: "Mains", price: 11 },
    { id: 3, name: "Margherita Pizza", category: "Mains", price: 13 },
    { id: 4, name: "Caesar Salad", category: "Starters", price: 8 },
    { id: 5, name: "Tomato Soup", category: "Starters", price: 6 },
    { id: 6, name: "Macchiato", category: "Beverages", price: 4 },
    { id: 7, name: "Fresh Orange Juice", category: "Beverages", price: 5 },
    { id: 8, name: "House Red Wine", category: "Beverages", price: 9 },
    { id: 9, name: "Chocolate Cake", category: "Desserts", price: 7 },
    { id: 10, name: "Fruit Plate", category: "Desserts", price: 6 }
  ];

  const foodOrders = [
    { id: 1, room: 101, guest: "A. Bekele", items: [{ name: "Injera with Doro Wat", qty: 1, price: 14 }, { name: "Fresh Orange Juice", qty: 2, price: 5 }], status: "preparing", time: "7:40 PM", total: 24 }
  ];

  return { rooms, bookings, guests, staff, menu, foodOrders, nextBookingId: 4, nextGuestId: 5, nextStaffId: 7, nextOrderId: 2 };
}

const HotelStore = {
  load(){
    try{
      const raw = localStorage.getItem(HOTEL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  },
  save(state){
    try{
      localStorage.setItem(HOTEL_STORAGE_KEY, JSON.stringify(state));
      return true;
    }catch(e){ return false; }
  },
  /** Always reads the latest saved state — call this fresh before
      any read or write so two open tabs never clobber each other. */
  get(){
    let state = this.load();
    if(!state){
      state = hotelBuildInitialState();
      this.save(state);
    }
    return state;
  },
  reset(){
    const state = hotelBuildInitialState();
    this.save(state);
    return state;
  },
  findAvailableRoomByType(state, type){
    return state.rooms.find(r => r.type === type && r.status === "available") || null;
  },
  /** Used by the public website: a guest requests a room TYPE (not a
      specific room). We auto-assign the first available room of that
      type and mark it reserved immediately, so it stops showing as
      free the moment someone requests it. If nothing is free, the
      booking still goes in as unassigned for the front desk to sort out. */
  requestBooking({ name, phone, email, checkin, checkout, roomType, message }){
    const state = this.get();
    const room = this.findAvailableRoomByType(state, roomType);

    const booking = {
      id: state.nextBookingId++,
      guest: name,
      phone: phone || "—",
      email: email || "—",
      roomType,
      room: room ? room.number : null,
      checkin, checkout,
      status: "pending",
      message: message || "",
      source: "website"
    };
    state.bookings.push(booking);

    if(room){
      room.status = "reserved";
      room.guest = name;
    }

    const existing = state.guests.find(g => g.name.toLowerCase() === name.toLowerCase());
    if(existing){
      if(phone) existing.phone = phone;
      if(email) existing.email = email;
    } else {
      state.guests.push({ id: state.nextGuestId++, name, phone: phone || "—", email: email || "—", visits: 0 });
    }

    this.save(state);
    return { booking, room, state };
  },
  /** Used by the staff system: front desk books a SPECIFIC room directly. */
  createBookingForRoom(state, { guest, phone, room, checkin, checkout }){
    const roomObj = state.rooms.find(r => r.number === Number(room));
    const booking = {
      id: state.nextBookingId++,
      guest, phone: phone || "—",
      roomType: roomObj ? roomObj.type : null,
      room: Number(room),
      checkin, checkout,
      status: "confirmed",
      source: "front-desk"
    };
    state.bookings.push(booking);
    if(roomObj){ roomObj.status = "reserved"; roomObj.guest = guest; }
    if(!state.guests.find(g => g.name === guest)){
      state.guests.push({ id: state.nextGuestId++, name: guest, phone: phone || "—", email: "—", visits: 1 });
    }
    return booking;
  },
  availabilityByType(state){
    const out = {};
    HOTEL_ROOM_TYPES.forEach(t => {
      const rooms = state.rooms.filter(r => r.type === t);
      out[t] = { available: rooms.filter(r => r.status === "available").length, total: rooms.length };
    });
    return out;
  }
};
