// js/monitoring.js
import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { showToast, todayStr, getStatusLabel, getStatusColor } from "./utils.js";
import { showBookingDetailsModal } from "./bookings.js";

export async function loadMonitoring() {
  const bookingsRef = collection(db, "bookings");
  const today = todayStr();

  let snap;
  try {
    snap = await getDocs(query(bookingsRef, orderBy("party_date"), orderBy("party_time")));
  } catch (e) {
    console.error("Error loading monitoring data:", e);
    showToast("Failed to load monitoring data", "error");
    return;
  }

  let bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  window.allBookings = bookings;

  const todayParties = bookings.filter(b => b.party_date === today && b.status !== "cancelled");
  const upcoming = bookings.filter(b => b.party_date > today && b.status === "upcoming");
  const ongoing = bookings.filter(b => b.status === "ongoing");
  const completed = bookings.filter(b => b.status === "completed");
  const cancelled = bookings.filter(b => b.status === "cancelled");

  renderMonitorStats({
    today: todayParties.length,
    upcoming: upcoming.length,
    ongoing: ongoing.length,
    completed: completed.length,
    cancelled: cancelled.length
  });

  renderMonitorSection("todaySection", "Today's Parties", todayParties, getNextParty(bookings));
  renderMonitorSection("upcomingSection", "Upcoming Parties", upcoming);
  renderMonitorSection("ongoingSection", "Ongoing Parties", ongoing);
  renderMonitorSection("completedSection", "Completed Parties", completed);
  renderMonitorSection("cancelledSection", "Cancelled Parties", cancelled);

  renderDailyTimeline(bookings);
  renderAvailableRooms(bookings);
  renderNextPartyCard(getNextParty(bookings));
}

function getNextParty(bookings) {
  const today = todayStr();
  const future = bookings
    .filter(b => (b.party_date > today || (b.party_date === today && b.status === "upcoming")) && b.status !== "cancelled" && b.status !== "completed")
    .sort((a, b) => a.party_date.localeCompare(b.party_date) || (a.party_time || "").localeCompare(b.party_time || ""));
  return future[0] || null;
}

function renderMonitorStats(stats) {
  const els = {
    todayCount: stats.today,
    upcomingCount: stats.upcoming,
    ongoingCount: stats.ongoing,
    completedCount: stats.completed,
    cancelledCount: stats.cancelled
  };
  for (const [id, val] of Object.entries(els)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
}

function renderMonitorSection(sectionId, title, parties, highlightParty) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const titles = {
    todaySection: "Today's Parties",
    upcomingSection: "Upcoming Parties",
    ongoingSection: "Ongoing Parties",
    completedSection: "Completed Parties",
    cancelledSection: "Cancelled Parties"
  };
  const icons = {
    todaySection: "📅",
    upcomingSection: "🔜",
    ongoingSection: "🎉",
    completedSection: "✅",
    cancelledSection: "❌"
  };

  let html = `<h3><span>${icons[sectionId] || "📋"}</span> ${titles[sectionId] || title} <span class="count-badge">${parties.length}</span></h3>`;

  if (parties.length === 0) {
    html += `<p class="empty-state">No ${title.toLowerCase()}.</p>`;
  } else {
    html += `<div class="monitoring-grid">`;
    parties.forEach(p => {
      html += `
        <div class="monitor-card ${sectionId === "ongoingSection" ? "ongoing-pulse" : ""}" onclick="window.showBookingDetailsModal('${p.id}')" style="cursor:pointer;">
          <div class="monitor-icon">🎂</div>
          <div class="monitor-number">${p.celebrant_name || p.customer_name || "Unknown"}</div>
          <div class="monitor-label">${p.customer_name || ""}</div>
          <div class="monitor-highlight" style="color:${getStatusColor(p.status)}">${getStatusLabel(p.status)}</div>
          <div style="font-size:13px;color:var(--jkp-text-muted);margin-top:8px;">
            ${p.party_date || ""} • ${p.party_time || ""} • Room ${p.party_room || ""}
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  section.innerHTML = html;
}

function renderDailyTimeline(bookings) {
  const container = document.getElementById("dailyTimeline");
  if (!container) return;

  const today = todayStr();
  const todayBookings = bookings
    .filter(b => b.party_date === today || b.party_date > today)
    .sort((a, b) => a.party_date.localeCompare(b.party_date) || (a.party_time || "").localeCompare(b.party_time || ""))
    .slice(0, 12);

  if (todayBookings.length === 0) {
    container.innerHTML = `<p class="empty-state">No scheduled parties.</p>`;
    return;
  }

  container.innerHTML = `<div class="schedule-timeline">` + todayBookings.map(b => `
    <div class="timeline-entry ${b.status}" onclick="window.showBookingDetailsModal('${b.id}')" style="cursor:pointer;">
      <div class="timeline-time">${b.party_date || ""} ${b.party_time || ""}</div>
      <div class="timeline-title">${b.celebrant_name || b.customer_name || "Unknown"}</div>
      <div class="timeline-meta">Room ${b.party_room || ""} • ${getStatusLabel(b.status)} • ${b.guests || 0} guests</div>
    </div>
  `).join("") + `</div>`;
}

function renderAvailableRooms(bookings) {
  const container = document.getElementById("availableRooms");
  if (!container) return;

  const allRooms = ["Party Room A", "Party Room B", "Party Room C", "Party Room D", "Party Room E"];
  const today = todayStr();
  const usedRooms = new Set(
    bookings.filter(b => b.party_date === today && b.status !== "cancelled" && b.status !== "completed").map(b => b.party_room)
  );

  container.innerHTML = `<div class="rooms-grid">` + allRooms.map(room => {
    const available = !usedRooms.has(room);
    return `
      <div class="room-card ${available ? "available" : "occupied"}">
        <div class="room-name">${room}</div>
        <div class="room-status">${available ? "Available" : "Occupied"}</div>
      </div>
    `;
  }).join("") + `</div>`;
}

function renderNextPartyCard(nextParty) {
  const container = document.getElementById("nextPartyCard");
  if (!container) return;

  if (!nextParty) {
    container.innerHTML = `
      <div class="monitor-card" style="border:2px dashed var(--jkp-gray-mid);">
        <div class="monitor-icon">🎈</div>
        <div class="monitor-label">No upcoming parties scheduled</div>
      </div>
    `;
    return;
  }

  const now = new Date();
  const partyDate = new Date(`${nextParty.party_date}T${nextParty.party_time || "00:00"}`);
  const diff = partyDate - now;
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));

  let countdownHtml = "";
  if (nextParty.party_date === todayStr()) {
    countdownHtml = `
      <div class="countdown-wrap">
        ${days > 0 ? `<div class="countdown-box"><div class="countdown-value">${days}</div><div class="countdown-unit">Days</div></div>` : ""}
        ${days > 0 ? `<span class="countdown-sep">:</span>` : ""}
        <div class="countdown-box"><div class="countdown-value">${String(hours).padStart(2, "0")}</div><div class="countdown-unit">Hours</div></div>
        <span class="countdown-sep">:</span>
        <div class="countdown-box"><div class="countdown-value">${String(minutes).padStart(2, "0")}</div><div class="countdown-unit">Minutes</div></div>
      </div>
    `;
  } else {
    countdownHtml = `<div style="font-size:14px;color:var(--jkp-text-muted);">In ${days} day(s)</div>`;
  }

  container.innerHTML = `
    <div class="monitor-card" style="border:2px solid var(--jkp-yellow);">
      <div class="monitor-icon">⏰</div>
      <div class="monitor-label" style="margin-bottom:8px;">Next Party</div>
      <div class="monitor-number" style="font-size:22px;">${nextParty.celebrant_name || nextParty.customer_name || "Unknown"}</div>
      <div style="font-size:14px;color:var(--jkp-text-muted);margin-top:4px;">Room ${nextParty.party_room || ""} • ${nextParty.party_date || ""} ${nextParty.party_time || ""}</div>
      <div style="margin-top:12px;">${countdownHtml}</div>
    </div>
  `;
}

export function showBookingDetailsById(id) {
  showBookingDetailsModal(id);
}

