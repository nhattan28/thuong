      const score = localStorage.getItem("quizScore");
      const correct = localStorage.getItem("quizCorrect");
      const total = localStorage.getItem("quizTotal");
      const time = localStorage.getItem("quizTime");
      const wrongAnswers = JSON.parse(localStorage.getItem("quizWrongAnswers") || "[]");
      const correctAnswers = JSON.parse(localStorage.getItem("quizCorrectAnswers") || "[]");
      const scale = localStorage.getItem("quizScale") || 10;
      const violation = localStorage.getItem("quizViolation");
      const fileName = localStorage.getItem("currentFileName") || "Unknown";

      // Initialize retry data and save current score
      let retryData = JSON.parse(localStorage.getItem("retryData")) || {};
      if (!retryData[fileName]) {
        retryData[fileName] = { attempts: 0, scores: [] };
      }
      if (score) {
        retryData[fileName].scores.push(parseFloat(score));
        localStorage.setItem("retryData", JSON.stringify(retryData));
      }

      // Update retry count and scores display
      function updateRetryInfo() {
        document.getElementById("retryCount").textContent = `Làm lại lần: ${retryData[fileName].attempts}`;
        const scores = retryData[fileName].scores;
        const highestScore = scores.length ? Math.max(...scores) : 0;
        const lowestScore = scores.length ? Math.min(...scores) : 0;
        document.getElementById("scoreStats").textContent = `Điểm cao nhất: ${highestScore.toFixed(1)} | Điểm thấp nhất: ${lowestScore.toFixed(1)}`;
      }

      const scoreValue = parseFloat(score);
      const formattedScore = scoreValue % 1 === 0 ? scoreValue.toFixed(0) : scoreValue.toFixed(1);
      document.getElementById("score").textContent = `${formattedScore}/${scale}`;
      document.getElementById("correct").textContent = correct;
      document.getElementById("total").textContent = total;
      document.getElementById("time").textContent = time;
      document.getElementById("wrong").textContent = total - correct;

      const motivationalMessage = document.getElementById("motivationalMessage");
      const scorePercentage = (parseFloat(score) / parseFloat(scale)) * 10;
      let message = "";

      if (scorePercentage >= 9) message = "👏 Xuất sắc! Bạn gần như hoàn hảo!";
      else if (scorePercentage >= 7) message = "👍 Rất tốt! Hãy xem lại vài câu để cải thiện nhé!";
      else if (scorePercentage >= 5) message = "💪 Khá ổn! Cố gắng thêm một chút nữa!";
      else message = "🚀 Đừng nản! Ôn tập lại, lần sau bạn sẽ làm tốt hơn!";

      motivationalMessage.classList.remove("hidden");
      motivationalMessage.textContent = message;

      if (violation) {
        const notice = document.getElementById("violationNotice");
        notice.classList.remove("hidden");
        notice.textContent = "🚫 Bài thi bị kết thúc do vi phạm nguyên tắc thi";
        localStorage.removeItem("quizViolation");
      }

      const wrongContainer = document.getElementById("wrongAnswersContainer");
      const wrongSection = document.getElementById("wrongAnswersSection");
      const toggleWrongBtn = document.getElementById("toggleWrongBtn");
      const correctContainer = document.getElementById("correctAnswersContainer");
      const correctSection = document.getElementById("correctAnswersSection");
      const toggleCorrectBtn = document.getElementById("toggleCorrectBtn");
      const violationsSection = document.getElementById("violations");
      const toggleViolationsBtn = document.getElementById("toggleViolationsBtn");

      if (wrongAnswers.length === 0) {
        wrongSection.style.display = "none";
        document.getElementById("perfectMessage").classList.remove("hidden");
        triggerFireworks();
      } else {
        wrongSection.style.display = "none";
      }

      wrongAnswers.forEach((item) => {
        const div = document.createElement("div");
        div.className = "p-4 rounded-xl bg-red-50 border border-red-200 shadow-sm";
        div.innerHTML = `
          <p class="mb-2 text-lg font-semibold">${item.question}</p>
          <p class="text-blue-700"><strong>Đáp án bạn chọn:</strong> ${item.selected}</p>
          <p class="text-green-700"><strong>Đáp án đúng:</strong> ${item.correct}</p>
        `;
        wrongContainer.appendChild(div);
      });

      if (correctAnswers.length === 0) {
        correctSection.style.display = "none";
      } else {
        correctSection.style.display = "none";
      }

      correctAnswers.forEach((item) => {
        const div = document.createElement("div");
        div.className = "p-4 rounded-xl bg-green-50 border border-green-200 shadow-sm";
        div.innerHTML = `
          <p class="mb-2 text-lg font-semibold">${item.question}</p>
          <p class="text-green-700"><strong>Đáp án bạn chọn:</strong> ${item.selected}</p>
          <p class="text-green-700"><strong>Đáp án đúng:</strong> ${item.correct}</p>
        `;
        correctContainer.appendChild(div);
      });

      toggleWrongBtn.addEventListener("click", function() {
        if (wrongSection.style.display === "none") {
          wrongSection.style.display = "block";
          toggleWrongBtn.textContent = "Ẩn câu sai";
        } else {
          wrongSection.style.display = "none";
          toggleWrongBtn.textContent = "Hiển thị câu sai";
        }
      });

      toggleCorrectBtn.addEventListener("click", function() {
        if (correctSection.style.display === "none") {
          correctSection.style.display = "block";
          toggleCorrectBtn.textContent = "Ẩn câu đúng";
        } else {
          correctSection.style.display = "none";
          toggleCorrectBtn.textContent = "Hiển thị câu đúng";
        }
      });

      toggleViolationsBtn.addEventListener("click", function() {
        if (violationsSection.style.display === "none") {
          violationsSection.style.display = "block";
          toggleViolationsBtn.textContent = "Ẩn vi phạm";
        } else {
          violationsSection.style.display = "none";
          toggleViolationsBtn.textContent = "Hiển thị vi phạm";
        }
      });

      function triggerFireworks() {
        for (let i = 0; i < 100; i++) setTimeout(() => createFirework(), i * 50);
      }

      function createFirework() {
        const f = document.createElement("div");
        f.className = "firework";
        f.style.left = Math.random() * window.innerWidth + "px";
        f.style.top = Math.random() * window.innerHeight + "px";
        f.style.background = `hsl(${Math.random() * 360}, 100%, 60%)`;
        document.body.appendChild(f);
        setTimeout(() => f.remove(), 1200);
      }

      function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      function scrollToBottom() {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }

      function restartQuiz() {
        retryData[fileName].attempts += 1;
        localStorage.setItem("retryData", JSON.stringify(retryData));
        localStorage.setItem("restartQuiz", "true");
        window.location.href = "kiemtra.html";
      }

      function goBack() {
        localStorage.removeItem("quizQuestions");
        localStorage.removeItem("currentFileName");
        localStorage.removeItem("quizScore");
        localStorage.removeItem("quizCorrect");
        localStorage.removeItem("quizTotal");
        localStorage.removeItem("quizTime");
        localStorage.removeItem("quizWrongAnswers");
        localStorage.removeItem("quizCorrectAnswers");
        localStorage.removeItem("quizScale");
        localStorage.removeItem("retryData");
        localStorage.removeItem("restartQuiz");
        window.location.href = "index.html";
      }

      let violations = JSON.parse(sessionStorage.getItem('violations')) || [];
      let fileUploads = JSON.parse(sessionStorage.getItem('fileUploads')) || [];

      function displayViolations() {
        const violationList = document.getElementById('violation-list');
        if (violations.length === 0) {
          violationList.innerHTML = '<li class="text-gray-600">Không có vi phạm nào.</li>';
        } else {
          violationList.innerHTML = violations.map(v => `<li>${v.message} (Thời gian: ${v.time})</li>`).join('');
        }
      }

      function displayFileUploads() {
        const fileUploadList = document.getElementById('file-upload-list');
        if (fileUploads.length === 0 && fileName === "Unknown") {
          fileUploadList.innerHTML = '<li class="text-gray-600">Không có file nào được tải lên.</li>';
        } else {
          const currentFile = fileUploads.find(f => f.file === fileName) || { file: fileName, time: new Date().toLocaleString('vi-VN') };
          fileUploadList.innerHTML = `<li>File: ${currentFile.file} (Thời gian: ${currentFile.time})</li>`;
        }
      }

      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });

      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
          if (['c', 'u', 's', 'p', 't'].includes(e.key.toLowerCase()) || e.shiftKey && e.key === 'I' || e.key === 'F12') {
            e.preventDefault();
          }
        }
      });

      window.onload = function() {
        displayViolations();
        displayFileUploads();
        updateRetryInfo();
      };