// js/bookings.js
import { db } from "./firebase.js";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { showToast, todayStr, generateBookingNumber, getStatusLabel, getStatusColor } from "./utils.js";
import { showConfirm } from "./confirm.js";

export async function loadBookings(filters = {}) {
  const { search = "", status = "all", date = "all" } = filters;
  const bookingsRef = collection(db, "bookings");

  let q = bookingsRef;
  try {
    if (status !== "all") {
      q = query(q, where("status", "==", status));
    }
    const snap = await getDocs(q);
    let bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (date === "today") {
      const today = todayStr();
      bookings = bookings.filter(b => b.party_date === today);
    } else if (date === "this-week") {
      const now = new Date();
      const day = now.getDay();
      const start = new Date();
      start.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      bookings = bookings.filter(b => b.party_date >= start.toISOString().split("T")[0] && b.party_date <= end.toISOString().split("T")[0]);
    }

    if (search) {
      const lower = search.toLowerCase();
      bookings = bookings.filter(b =>
        (b.booking_no || "").toLowerCase().includes(lower) ||
        (b.customer_name || "").toLowerCase().includes(lower) ||
        (b.celebrant_name || "").toLowerCase().includes(lower) ||
        (b.contact_number || "").toLowerCase().includes(lower) ||
        (b.theme || "").toLowerCase().includes(lower) ||
        (b.package || "").toLowerCase().includes(lower) ||
        (b.status || "").toLowerCase().includes(lower)
      );
    }

    bookings.sort((a, b) => {
      const dateA = new Date((b.party_date || "") + "T" + (b.party_time || "00:00"));
      const dateB = new Date((a.party_date || "") + "T" + (a.party_time || "00:00"));
      return dateA - dateB;
    });

    return bookings;
  } catch (e) {
    console.error("Error loading bookings:", e);
    showToast("Failed to load bookings", "error");
    return [];
  }
}

export async function saveBooking(bookingData) {
  try {
    const { id, ...data } = bookingData;
    if (id) {
      await updateDoc(doc(db, "bookings", id), {
        ...data,
        updated_at: serverTimestamp()
      });
      showToast("Booking updated successfully!", "success");
    } else {
      const bookingNumber = generateBookingNumber();
      await addDoc(collection(db, "bookings"), {
        ...data,
        booking_no: bookingNumber,
        created_at: serverTimestamp()
      });
      showToast("Booking created successfully!", "success");
    }
    return true;
  } catch (e) {
    console.error("Error saving booking:", e);
    showToast("Failed to save booking", "error");
    return false;
  }
}

export async function deleteBooking(id) {
  try {
    const result = await showConfirm({
      title: "Delete Booking?",
      text: "This action cannot be undone. The booking will be permanently removed.",
      icon: "warning",
      confirmText: "Yes, delete",
      cancelText: "Cancel",
      confirmColor: "#E31837",
      successText: "Booking deleted successfully."
    });
    if (!result) return false;
    await deleteDoc(doc(db, "bookings", id));
    return true;
  } catch (e) {
    console.error("Error deleting booking:", e);
    showToast("Failed to delete booking", "error");
    return false;
  }
}

export function openBookingModal(editId = null) {
  const modal = document.getElementById("bookingModal");
  const form = document.getElementById("bookingForm");
  form.reset();
  document.querySelectorAll(".error-msg").forEach(e => e.style.display = "none");

  if (editId && window.__editBookingData) {
    const booking = window.__editBookingData.find(b => b.id === editId);
    if (booking) {
      document.getElementById("bookingId").value = booking.id;
      document.getElementById("bookingNumber").value = booking.booking_no || "";
      document.getElementById("customerName").value = booking.customer_name || "";
      document.getElementById("celebrantName").value = booking.celebrant_name || "";
      document.getElementById("age").value = booking.age || "";
      document.getElementById("contactNumber").value = booking.contact_number || "";
      document.getElementById("partyDate").value = booking.party_date || "";
      document.getElementById("partyTime").value = booking.party_time || "";
      document.getElementById("guests").value = booking.guests || "";
      document.getElementById("theme").value = booking.theme || "";
      document.getElementById("package_").value = booking.package || "";
      document.getElementById("partyRoom").value = booking.party_room || "";
      document.getElementById("remarks").value = booking.remarks || "";
      document.getElementById("status").value = booking.status || "upcoming";
      document.getElementById("modalTitle").textContent = "Edit Booking";
    }
  } else {
    document.getElementById("bookingId").value = "";
    document.getElementById("modalTitle").textContent = "New Booking";
    const now = new Date().toISOString().split("T")[0];
    document.getElementById("partyDate").value = now;
  }

  modal.classList.add("active");
}

export function closeBookingModal() {
  document.getElementById("bookingModal").classList.remove("active");
}

export async function submitBookingForm() {
  const id = document.getElementById("bookingId").value;
  const data = {
    booking_no: document.getElementById("bookingNumber").value.trim(),
    customer_name: document.getElementById("customerName").value.trim(),
    celebrant_name: document.getElementById("celebrantName").value.trim(),
    age: document.getElementById("age").value.trim(),
    contact_number: document.getElementById("contactNumber").value.trim(),
    party_date: document.getElementById("partyDate").value,
    party_time: document.getElementById("partyTime").value.trim(),
    guests: document.getElementById("guests").value.trim(),
    theme: document.getElementById("theme").value.trim(),
    package: document.getElementById("package_").value.trim(),
    party_room: document.getElementById("partyRoom").value.trim(),
    remarks: document.getElementById("remarks").value.trim(),
    status: document.getElementById("status").value
  };

  if (!data.customer_name || !data.celebrant_name || !data.party_date || !data.party_time || !data.party_room || !data.guests) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  if ((data.status === "cancelled" || data.status === "completed") && id) {
    const statusResult = await showConfirm({
      title: `Mark as ${getStatusLabel(data.status).toUpperCase()}?`,
      text: `This will change the booking status to ${getStatusLabel(data.status)}.`,
      icon: "question",
      confirmText: `Yes, mark ${getStatusLabel(data.status)}`,
      cancelText: "Cancel",
      confirmColor: data.status === "cancelled" ? "#E31837" : "#22C55E",
      successText: `Booking marked as ${getStatusLabel(data.status)}.`
    });
    if (!statusResult) return;
  } else if (!id && !data.booking_no) {
    data.booking_no = generateBookingNumber();
  }

  const success = await saveBooking({ ...data, id });
  if (success) {
    closeBookingModal();
    renderBookingsTable();
    if (window.refreshDashboard) window.refreshDashboard();
    if (window.refreshMonitoring) window.refreshMonitoring();
  }
}

export async function handleDeleteBooking(id) {
  const success = await deleteBooking(id);
  if (success) {
    renderBookingsTable();
    if (window.refreshDashboard) window.refreshDashboard();
    if (window.refreshMonitoring) window.refreshMonitoring();
  }
}

export function renderBookingsTable(bookings = []) {
  const tbody = document.getElementById("bookingsTableBody");
  if (!tbody) return;

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#999;padding:40px;">No bookings found.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map((b, idx) => `
    <tr>
      <td><strong>${b.booking_no || "—"}</strong></td>
      <td><strong>${b.customer_name || "—"}</strong></td>
      <td>${b.celebrant_name || "—"}</td>
      <td>${b.contact_number || "—"}</td>
      <td>${b.party_date || "—"} ${b.party_time || ""}</td>
      <td>${b.theme || "—"}</td>
      <td>${b.party_room || "—"}</td>
      <td><span class="badge badge-${b.status}">${getStatusLabel(b.status)}</span></td>
      <td>
        <button class="action-btn secondary view-btn" data-id="${b.id}" style="padding:6px 10px;font-size:11px;margin-right:4px;"><i class="fa-solid fa-eye"></i></button>
        <button class="action-btn secondary edit-btn" data-id="${b.id}" style="padding:6px 10px;font-size:11px;margin-right:4px;"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn secondary delete-btn" data-id="${b.id}" style="padding:6px 10px;font-size:11px;"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      window.__editBookingData = bookings;
      openBookingModal(id);
    });
  });

  tbody.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      showBookingDetailsModal(btn.dataset.id);
    });
  });

  tbody.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => handleDeleteBooking(btn.dataset.id));
  });
}

export function showBookingDetailsModal(bookingId) {
  const booking = window.allBookings?.find(b => b.id === bookingId);
  if (!booking) return;

  const modal = document.getElementById("bookingDetailsModal");
  const container = document.getElementById("bookingDetailsContent");
  if (!modal || !container) return;

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
      <div>
        <h3 style="font-family:var(--font-display);font-size:20px;">${booking.booking_no || "N/A"}</h3>
        <span class="badge badge-${booking.status}" style="font-size:12px;padding:4px 12px;">${getStatusLabel(booking.status)}</span>
      </div>
      <button class="modal-close" onclick="document.getElementById('bookingDetailsModal').classList.remove('active')">&times;</button>
    </div>
    <div style="display:grid;gap:20px;">
      <div style="background:var(--jkp-gray-light);padding:16px;border-radius:12px;">
        <h4 style="font-family:var(--font-display);color:var(--jkp-red);margin-bottom:12px;font-size:15px;"><i class="fa-solid fa-user" style="margin-right:8px;"></i>Customer Information</h4>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;font-size:14px;">
          <div><strong>Name:</strong> ${booking.customer_name || "—"}</div>
          <div><strong>Contact:</strong> ${booking.contact_number || "—"}</div>
          <div><strong>Age:</strong> ${booking.age || "—"}</div>
        </div>
      </div>
      <div style="background:var(--jkp-gray-light);padding:16px;border-radius:12px;">
        <h4 style="font-family:var(--font-display);color:var(--jkp-red);margin-bottom:12px;font-size:15px;"><i class="fa-solid fa-cake-candles" style="margin-right:8px;"></i>Celebrant</h4>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;font-size:14px;">
          <div><strong>Name:</strong> ${booking.celebrant_name || "—"}</div>
          <div><strong>Age:</strong> ${booking.age || "—"}</div>
        </div>
      </div>
      <div style="background:var(--jkp-gray-light);padding:16px;border-radius:12px;">
        <h4 style="font-family:var(--font-display);color:var(--jkp-red);margin-bottom:12px;font-size:15px;"><i class="fa-solid fa-calendar-star" style="margin-right:8px;"></i>Party Details</h4>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;font-size:14px;">
          <div><strong>Date:</strong> ${booking.party_date || "—"}</div>
          <div><strong>Time:</strong> ${booking.party_time || "—"}</div>
          <div><strong>Guests:</strong> ${booking.guests || "—"}</div>
          <div><strong>Room:</strong> ${booking.party_room || "—"}</div>
          <div><strong>Theme:</strong> ${booking.theme || "—"}</div>
          <div><strong>Package:</strong> ${booking.package || "—"}</div>
        </div>
      </div>
      <div style="background:var(--jkp-gray-light);padding:16px;border-radius:12px;">
        <h4 style="font-family:var(--font-display);color:var(--jkp-red);margin-bottom:12px;font-size:15px;"><i class="fa-solid fa-note-sticky" style="margin-right:8px;"></i>Remarks</h4>
        <div style="font-size:14px;line-height:1.8;">${booking.remarks || "None"}</div>
      </div>
    </div>
   `;

  modal.classList.add("active");
}

window.showBookingDetailsModal = showBookingDetailsModal;
