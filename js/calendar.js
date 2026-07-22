// js/calendar.js
import { db } from "./firebase.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { showBookingDetailsModal } from "./bookings.js";

export async function loadCalendarBookings(year, month) {
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;

  const q = query(
    collection(db, "bookings"),
    where("party_date", ">=", startDate),
    where("party_date", "<=", endDate)
  );
  const snap = await getDocs(q);
  const bookings = {};

  snap.docs.forEach(d => {
    const data = d.data();
    const date = data.party_date;
    if (!bookings[date]) bookings[date] = [];
    bookings[date].push({ id: d.id, ...data });
  });

  return bookings;
}

export function renderCalendar(year, month, bookingsByDate) {
  const container = document.getElementById("calendarGrid");
  if (!container) return;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  document.getElementById("calendarMonth").textContent = `${monthNames[month]} ${year}`;

  let html = "";

  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  dayHeaders.forEach(d => {
    html += `<div class="calendar-header-day">${d}</div>`;
  });

  for (let i = 0; i < startDayOfWeek; i++) {
    html += `<div class="calendar-cell empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const today = new Date().toISOString().split("T")[0];
    const isToday = dateStr === today;
    const dayBookings = bookingsByDate[dateStr] || [];

    html += `
      <div class="calendar-cell ${isToday ? "today" : ""}">
        <div class="calendar-day-number ${isToday ? "today" : ""}">${day}</div>
        <div class="calendar-bookings">
          ${dayBookings.map(b => {
            const color = b.status === "ongoing" ? "var(--status-ongoing)" :
                          b.status === "upcoming" ? "var(--status-upcoming)" :
                          b.status === "completed" ? "var(--status-completed)" :
                          b.status === "cancelled" ? "var(--status-cancelled)" : "#ccc";
            return `
              <div class="calendar-booking-item" data-id="${b.id}" style="border-left-color:${color};background:${hexToRgba(color, 0.15)};color:${color};">
                <div class="calendar-booking-time">${b.party_time || ""}</div>
                <div class="calendar-booking-info">
                  <strong>${b.celebrant_name || b.customer_name || "Unknown"}</strong>
                  <span>${b.party_room || ""}</span>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  container.querySelectorAll(".calendar-booking-item").forEach(item => {
    item.addEventListener("click", () => {
      showBookingDetailsModal(item.dataset.id);
    });
  });
}

function hexToRgba(hex, alpha) {
  if (hex.startsWith("var(")) return "rgba(128,128,128,0.15)";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
