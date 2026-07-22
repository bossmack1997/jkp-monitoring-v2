// js/dashboard.js
import { db } from "./firebase.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { showToast, todayStr } from "./utils.js";

export async function loadDashboardStats() {
  const bookingsRef = collection(db, "bookings");
  const today = todayStr();

  let snap;
  try {
    snap = await getDocs(bookingsRef);
  } catch (e) {
    console.error("Error loading stats:", e);
    showToast("Failed to load dashboard stats", "error");
    return;
  }

  let bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  window.allBookings = bookings;

  const todayParties = bookings.filter(b => b.party_date === today && b.status !== "cancelled");
  const upcoming = bookings.filter(b => b.party_date > today && b.status === "upcoming");
  const ongoing = bookings.filter(b => b.status === "ongoing");
  const completed = bookings.filter(b => b.status === "completed");
  const cancelled = bookings.filter(b => b.status === "cancelled");

  animateNumber("totalCount", bookings.length);
  animateNumber("todayCount", todayParties.length);
  animateNumber("upcomingCount", upcoming.length);
  animateNumber("ongoingCount", ongoing.length);
  animateNumber("completedCount", completed.length);
  animateNumber("cancelledCount", cancelled.length);

  renderRecentBookings("recentList", bookings.slice(0, 8));
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  if (start === target) { el.textContent = target; return; }

  const duration = 600;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * (target - start) + start);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function renderRecentBookings(containerId, docs) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!docs || docs.length === 0) {
    container.innerHTML = `<p class="empty-state">No bookings yet.</p>`;
    return;
  }

  container.innerHTML = docs.map(b => `
    <div class="party-card status-${b.status}" onclick="window.showBookingDetailsModal('${b.id}')" style="cursor:pointer;">
      <div class="party-info">
        <strong>${b.customer_name || b.celebrant_name || "Unknown"}</strong>
        <span>${b.booking_no || ""} • ${b.theme || ""} • Room ${b.party_room || ""}</span>
      </div>
      <div class="party-time">${b.party_date || ""} ${b.party_time || ""}</div>
      <span class="badge badge-${b.status}">${b.status}</span>
    </div>
  `).join("");
}

export function exportBookingsToCSV() {
  const bookings = window.allBookings || [];
  if (!bookings.length) {
    showToast("No bookings to export", "error");
    return;
  }

  const headers = ["Booking #", "Customer", "Celebrant", "Age", "Contact", "Party Date", "Party Time", "Package", "Theme", "Room", "Guests", "Remarks", "Status"];
  const rows = bookings.map(b => [
    b.booking_no || "",
    b.customer_name || "",
    b.celebrant_name || "",
    b.age || "",
    b.contact_number || "",
    b.party_date || "",
    b.party_time || "",
    b.package || "",
    b.theme || "",
    b.party_room || "",
    b.guests || "",
    b.remarks || "",
    b.status || ""
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `jkp-bookings-${todayStr()}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  showToast("CSV exported successfully!", "success");
}
