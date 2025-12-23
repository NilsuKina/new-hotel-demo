const widget = document.getElementById("widget");
const openWidget = document.getElementById("openWidget");
const openWidgetTop = document.getElementById("openWidgetTop");
const closeWidget = document.getElementById("closeWidget");

const form = document.getElementById("resForm");
const msg = document.getElementById("msg");

const checkIn = document.getElementById("check_in");
const checkOut = document.getElementById("check_out");
const fullName = document.getElementById("full_name");
const email = document.getElementById("email");

const resListEl = document.getElementById("resList");

const RES_KEY = "aurora_premium_single_room_reservations_v1";

// ✅ Only 1 room in the whole demo
const ROOM = {
  id: 1,
  hotel: "Aurora Premium Hotel",
  room: "Deniz Manzaralı Standart Oda"
};

// ✅ Reservations can start only from Jan 1, 2026
const MIN_DATE = "2026-01-01";

function getReservations() {
  try { return JSON.parse(localStorage.getItem(RES_KEY)) || []; }
  catch { return []; }
}
function saveReservations(list) {
  localStorage.setItem(RES_KEY, JSON.stringify(list));
}

// ✅ UI: disable booking if already reserved
function updateBookingUI() {
  const list = getReservations();
  const alreadyReserved = list.length > 0;

  // Disable open buttons if reserved
  openWidget.disabled = alreadyReserved;
  openWidgetTop.disabled = alreadyReserved;

  if (alreadyReserved) {
    openWidget.textContent = "Rezerve Edildi";
    openWidgetTop.textContent = "Rezerve Edildi";
  } else {
    openWidget.textContent = "Rezervasyon Yap";
    openWidgetTop.textContent = "Rezervasyon";
  }

  // Set min date on inputs (extra safety)
  checkIn.min = MIN_DATE;
  checkOut.min = MIN_DATE;
}

function showWidget() {
  const list = getReservations();
  if (list.length > 0) {
    // ✅ Hard block: only one reservation allowed
    msg.textContent = "❌ Bu projede tek oda var. Bir kez rezervasyon yapıldıktan sonra yeni rezervasyon alınmaz.";
    return;
  }

  widget.classList.remove("widget--hidden");
  widget.setAttribute("aria-hidden", "false");
  setTimeout(() => checkIn.focus(), 120);
}

function hideWidget() {
  widget.classList.add("widget--hidden");
  widget.setAttribute("aria-hidden", "true");
  msg.textContent = "";
}

openWidget.addEventListener("click", showWidget);
openWidgetTop.addEventListener("click", showWidget);
closeWidget.addEventListener("click", hideWidget);

function renderReservations() {
  const list = getReservations();
  resListEl.innerHTML = "";

  if (list.length === 0) {
    resListEl.innerHTML = `<div class="resItem">Henüz rezervasyon yok.</div>`;
    return;
  }

  list.slice().reverse().forEach(r => {
    const div = document.createElement("div");
    div.className = "resItem";
    div.innerHTML = `
      <div class="resTop">
        <div>${r.full_name} — <span style="opacity:.8">${ROOM.room}</span></div>
        <div>${r.check_in} → ${r.check_out}</div>
      </div>
      <div class="resMeta">
        Email: ${r.email} • Kaydedildi: ${new Date(r.created_at).toLocaleString("tr-TR")}
      </div>
    `;
    resListEl.appendChild(div);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  msg.textContent = "";

  const list = getReservations();

  // ✅ Block if already reserved
  if (list.length > 0) {
    msg.textContent = "❌ Bu projede tek oda var. Bir kez rezervasyon yapıldıktan sonra yeni rezervasyon alınmaz.";
    return;
  }

  const payload = {
    id: crypto.randomUUID(),
    room_id: ROOM.id,
    full_name: fullName.value.trim(),
    email: email.value.trim(),
    check_in: checkIn.value,
    check_out: checkOut.value,
    created_at: new Date().toISOString()
  };

  if (!payload.check_in || !payload.check_out) {
    msg.textContent = "❌ Lütfen Check-in ve Check-out seçin.";
    return;
  }

  // ✅ Date rule: must be >= 2026-01-01
  if (payload.check_in < MIN_DATE || payload.check_out < MIN_DATE) {
    msg.textContent = "❌ Rezervasyonlar 1 Ocak 2026’dan itibaren başlar.";
    return;
  }

  if (payload.check_out <= payload.check_in) {
    msg.textContent = "❌ Check-out, Check-in tarihinden sonra olmalı.";
    return;
  }

  list.push(payload);
  saveReservations(list);

  msg.textContent = "✅ Rezervasyon kaydedildi! (Tek oda olduğu için artık yeni rezervasyon alınmayacak.)";
  renderReservations();
  updateBookingUI();

  setTimeout(hideWidget, 900);
});

updateBookingUI();
renderReservations();
