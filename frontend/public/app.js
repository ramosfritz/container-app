document.addEventListener('DOMContentLoaded', () => {
  const statusBadge = document.getElementById('backend-status');

  async function checkBackendStatus() {
    try {
      const response = await fetch('/api/status');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'ok') {
          updateStatusBadge('ok', 'ok');
        } else {
          updateStatusBadge('error', 'error');
        }
      } else {
        updateStatusBadge('error', 'error');
      }
    } catch (error) {
      console.error('Error fetching backend status:', error);
      updateStatusBadge('error', 'disconnected');
    }
  }

  function updateStatusBadge(state, labelText) {
    // Clear all status classes
    statusBadge.classList.remove('status-loading', 'status-ok', 'status-error');
    
    // Add specific state class and update HTML structure for pulsing dot
    if (state === 'ok') {
      statusBadge.classList.add('status-ok');
      statusBadge.innerHTML = `<span class="pulse-dot"></span> ${labelText}`;
    } else {
      statusBadge.classList.add('status-error');
      statusBadge.innerHTML = `<span class="pulse-dot"></span> ${labelText}`;
    }
  }

  // Initial check on load
  checkBackendStatus();

  // Poll backend status every 5 seconds
  setInterval(checkBackendStatus, 5000);
});
