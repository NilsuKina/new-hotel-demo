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
  try {
    return JSON.parse(localStorage.getItem(RES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveReservations(list) {
  localStorage.setItem(RES_KEY, JSON.stringify(list));
}

function updateBookingUI() {
  // Keep buttons always active; only enforce date min on inputs
  checkIn.min = MIN_DATE;
  checkOut.min = MIN_DATE;
}

function showWidget() {
  msg.textContent = "";
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

// ---- Date helpers & clash rule ----
function toDateStr(d) {
  // returns YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isValidISODate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Overlap rule (check-in inclusive, check-out exclusive):
// [newIn, newOut) overlaps [oldIn, oldOut) if newIn < oldOut && newOut > oldIn
function hasDateClash(newIn, newOut, existingList) {
  return existingList.some((r) => {
    const oldIn = r.check_in;
    const oldOut = r.check_out;
    return newIn < oldOut && newOut > oldIn;
  });
}

function renderReservations() {
  const list = getReservations();
  resListEl.innerHTML = "";

  if (list.length === 0) {
    resListEl.innerHTML = `<div class="resItem">Henüz rezervasyon yok.</div>`;
    return;
  }

  // Sort by check-in ascending (nice demo)
  const sorted = list.slice().sort((a, b) => (a.check_in > b.check_in ? 1 : -1));

  sorted.forEach((r) => {
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

      <div style="margin-top:10px; display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap;">
        <button class="deleteBtn" data-id="${r.id}" type="button">Rezervasyonu Sil</button>
      </div>
    `;
    resListEl.appendChild(div);
  });
}

// Delete button (event delegation)
resListEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".deleteBtn");
  if (!btn) return;

  const id = btn.getAttribute("data-id");
  if (!id) return;

  const list = getReservations();
  const updated = list.filter((r) => r.id !== id);
  saveReservations(updated);
  renderReservations();

  msg.textContent = "✅ Rezervasyon silindi.";
});

// Form submit
form.addEventListener("submit", (e) => {
  e.preventDefault();
  msg.textContent = "";

  const payload = {
    id: crypto.randomUUID(),
    room_id: ROOM.id,
    full_name: fullName.value.trim(),
    email: email.value.trim(),
    check_in: checkIn.value,
    check_out: checkOut.value,
    created_at: new Date().toISOString()
  };

  // Basic validations
  if (!payload.full_name) {
    msg.textContent = "❌ Lütfen Ad Soyad girin.";
    return;
  }
  if (!payload.email) {
    msg.textContent = "❌ Lütfen Email girin.";
    return;
  }
  if (!payload.check_in || !payload.check_out) {
    msg.textContent = "❌ Lütfen Check-in ve Check-out seçin.";
    return;
  }
  if (!isValidISODate(payload.check_in) || !isValidISODate(payload.check_out)) {
    msg.textContent = "❌ Tarih formatı hatalı (YYYY-MM-DD olmalı).";
    return;
  }

  // Date rule: must be >= 2026-01-01
  if (payload.check_in < MIN_DATE || payload.check_out < MIN_DATE) {
    msg.textContent = "❌ Rezervasyonlar 1 Ocak 2026’dan itibaren başlar.";
    return;
  }

  if (payload.check_out <= payload.check_in) {
    msg.textContent = "❌ Check-out, Check-in tarihinden sonra olmalı.";
    return;
  }

  const list = getReservations();

  // ✅ Clash rule for single room
  if (hasDateClash(payload.check_in, payload.check_out, list)) {
    msg.textContent =
      "❌ Bu tarihlerde oda dolu. Lütfen çakışmayan bir tarih aralığı seçin.";
    return;
  }

  // Save
  list.push(payload);
  saveReservations(list);

  msg.textContent = "✅ Rezervasyon kaydedildi!";
  renderReservations();

  // Optional: clear inputs for faster demo
  // checkIn.value = "";
  // checkOut.value = "";
  // fullName.value = "";
  // email.value = "";

  setTimeout(hideWidget, 700);
});

// init
updateBookingUI();
renderReservations();
