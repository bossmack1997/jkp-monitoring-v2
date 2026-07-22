// js/utils.js
export function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };

  toast.innerHTML = `
    <span style="font-size:18px;">${icons[type] || "ℹ️"}</span>
    <span style="flex:1;font-size:14px;">${message}</span>
    <button onclick="this.parentElement.classList.add('fade-out'); setTimeout(() => this.parentElement.remove(), 300);"
            style="background:none;border:none;cursor:pointer;color:#999;font-size:18px;padding:0;">×</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0
  }).format(amount);
}

export function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function getStatusLabel(status) {
  const labels = {
    upcoming: "Upcoming",
    ongoing: "Ongoing",
    completed: "Completed",
    cancelled: "Cancelled"
  };
  return labels[status] || status;
}

export function getStatusColor(status) {
  const colors = {
    upcoming: "var(--status-upcoming)",
    ongoing: "var(--status-ongoing)",
    completed: "var(--status-completed)",
    cancelled: "var(--status-cancelled)"
  };
  return colors[status] || "#ccc";
}

export function generateBookingNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
  return `JKP-${year}-${random}`;
}
