function generateRandomPassword(length = 28) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function setPasswordExpiration() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const password = generateRandomPassword();
  const expirationTime = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours in milliseconds
  
  localStorage.setItem(`authPassword_${currentPage}`, password);
  localStorage.setItem(`authExpiration_${currentPage}`, expirationTime.getTime());
  localStorage.removeItem(`isAuthenticated_${currentPage}`);
  
  let codeSet = false;
  Object.defineProperty(window, 'Tân', {
    set: function (value) {
      if ((value === '2810' || value === 2810) && !codeSet) {
        console.log(`Mật khẩu cho ${currentPage}: ${password}`);
        console.log(`Hết hạn: ${expirationTime.toLocaleString('vi-VN')} hoặc khi tải lại trang`);
        codeSet = true;
      } else if (!codeSet) {
        console.log('Mã không đúng!');
      }
    },
    get: function () {
      return undefined;
    }
  });
}

// Thêm hệ thống mật khẩu vĩnh viễn
const PERMANENT_PASSWORD = '290220'; // Mật khẩu vĩnh viễn cố định

function setPermanentPassword() {
  // Lưu mật khẩu vĩnh viễn cho tất cả trang
  localStorage.setItem('authPassword_permanent', PERMANENT_PASSWORD);
  
  // Định nghĩa biến toàn cục cho mã 2810203 để xem mật khẩu vĩnh viễn
  let permanentCodeSet = false;
  Object.defineProperty(window, 'TânPermanent', {
    set: function (value) {
      if ((value === '2810203' || value === 2810203) && !permanentCodeSet) {
        console.log(`Mật khẩu vĩnh viễn cho tất cả trang: ${PERMANENT_PASSWORD}`);
        console.log('Mật khẩu này không bao giờ hết hạn và dùng chung cho mọi trang.');
        permanentCodeSet = true;
      } else if (!permanentCodeSet) {
        console.log('Mã không đúng cho mật khẩu vĩnh viễn!');
      }
    },
    get: function () {
      return undefined;
    }
  });
}

function isPasswordValid(inputPassword) {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const storedPassword = localStorage.getItem(`authPassword_${currentPage}`);
  const expiration = parseInt(localStorage.getItem(`authExpiration_${currentPage}`));
  const permanentPassword = localStorage.getItem('authPassword_permanent');
  const now = Date.now();
  
  // Kiểm tra cả mật khẩu tạm thời và vĩnh viễn
  return (inputPassword === storedPassword && now < expiration) || inputPassword === permanentPassword;
}

function showPasswordPrompt() {
  const overlay = document.createElement('div');
  overlay.id = 'passwordOverlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8); display: flex; justify-content: center;
    align-items: center; z-index: 1000;
  `;
  
  const promptBox = document.createElement('div');
  promptBox.style.cssText = `
    background: white; padding: 20px; border-radius: 8px;
    text-align: center; max-width: 400px; width: 90%;
  `;
  
  promptBox.innerHTML = `
    <input type="password" id="passwordInput" placeholder="Nhập mật khẩu..." style="width: 100%; padding: 8px; margin: 10px 0;">
    <p id="errorMessage" style="color: red; display: none;">Mật khẩu không đúng hoặc đã hết hạn!</p>
  `;
  
  overlay.appendChild(promptBox);
  document.body.appendChild(overlay);
  
  document.body.style.overflow = 'hidden';
  const mainContent = document.body.children;
  for (let element of mainContent) {
    if (element !== overlay && element.tagName !== 'SCRIPT') {
      element.style.display = 'none';
    }
  }
  
  document.getElementById('passwordInput').addEventListener('input', () => {
    const inputPassword = document.getElementById('passwordInput').value;
    const errorMessage = document.getElementById('errorMessage');
    
    if (inputPassword.length > 0) {
      if (isPasswordValid(inputPassword)) {
        localStorage.setItem(`isAuthenticated_${currentPage}`, 'true');
        overlay.remove();
        document.body.style.overflow = 'auto';
        for (let element of mainContent) {
          if (element !== overlay && element.tagName !== 'SCRIPT') {
            element.style.display = '';
          }
        }
      } else {
        errorMessage.style.display = 'block';
      }
    } else {
      errorMessage.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Gọi cả hai hệ thống: tạm thời và vĩnh viễn
  setPasswordExpiration();
  setPermanentPassword();
  
  if (localStorage.getItem(`isAuthenticated_${currentPage}`) === 'true' && isPasswordValid(localStorage.getItem(`authPassword_${currentPage}`) || localStorage.getItem('authPassword_permanent'))) {
    document.body.style.overflow = 'auto';
  } else {
    showPasswordPrompt();
  }
});