const Swal = window.Swal || null;

function ensureSwal() {
  if (!Swal) {
    console.warn("SweetAlert2 not loaded, falling back to native confirm/alert");
    return null;
  }
  return Swal;
}

export function showConfirm(options = {}) {
  const {
    title = 'Are you sure?',
    text = 'This action cannot be undone.',
    icon = 'warning',
    confirmText = 'Yes, proceed',
    cancelText = 'Cancel',
    confirmColor = '#E31837',
    successText = 'Action completed successfully.',
  } = options;

  const swal = ensureSwal();
  if (!swal) {
    const result = confirm(`${title}\n\n${text}`);
    return Promise.resolve(result);
  }

  return new Promise((resolve) => {
    swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: confirmColor,
      reverseButtons: true,
      customClass: {
        popup: 'swal-popup',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        swal.fire({
          title: 'Success!',
          text: successText,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#22C55E'
        });
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

export async function showSuccess(title, text) {
  const swal = ensureSwal();
  if (!swal) { alert(`${title}\n\n${text}`); return; }
  await swal.fire({ title, text, icon: 'success', confirmButtonText: 'OK', confirmButtonColor: '#22C55E' });
}

export async function showError(title, text) {
  const swal = ensureSwal();
  if (!swal) { alert(`${title}\n\n${text}`); return; }
  await swal.fire({ title, text, icon: 'error', confirmButtonText: 'OK', confirmButtonColor: '#E31837' });
}

export function showLoading(title = 'Please wait...') {
  const swal = ensureSwal();
  if (!swal) return;
  swal.fire({ title, allowOutsideClick: false, didOpen: () => { swal.showLoading(); } });
}

export function closeLoading() {
  const swal = ensureSwal();
  if (!swal) return;
  swal.close();
}
