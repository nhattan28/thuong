// ⏰ Hiển thị đồng hồ
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('vi-VN');
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  document.getElementById('date').textContent = now.toLocaleDateString('vi-VN', options);
}
setInterval(updateClock, 1000);
updateClock();

// ☰ Mở sidebar
function showSidebar() {
  document.getElementById('sidebar').classList.add('show');
  document.getElementById('overlay').classList.add('show');
  document.getElementById('toggleBtn').classList.add('hide');
}

// ❌ Đóng sidebar + collapse thẻ cha
function hideSidebar() {
  document.getElementById('sidebar').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
  setTimeout(() => {
    document.getElementById('toggleBtn').classList.remove('hide');
  }, 300);

  // Collapse all details
  document.querySelectorAll('.sidebar details').forEach(detail => {
    detail.removeAttribute('open');
  });
}

// 🔁 Chuyển trang + tô màu
function loadPage(event, pageUrl) {
  document.getElementById('iframeView').src = pageUrl;

  document.querySelectorAll('.sidebar button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.sidebar details').forEach(detail => detail.classList.remove('active-parent'));

  const clickedBtn = event.target;
  const parentDetail = clickedBtn.closest('details');
  if (parentDetail) parentDetail.classList.add('active-parent');
  clickedBtn.classList.add('active');

  hideSidebar();
}

// 🔄 Chỉ cho mở 1 thẻ cha cùng lúc
document.querySelectorAll('.sidebar details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (detail.open) {
      document.querySelectorAll('.sidebar details').forEach((other) => {
        if (other !== detail) other.removeAttribute('open');
      });
    }
  });
});
