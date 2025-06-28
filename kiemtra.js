       const encouragements = [
            "Đừng nản, bạn đang làm rất tốt! 💪",
            "Thử lại nhé, bạn sẽ làm được! 🌟",
            "Mỗi lần sai là một lần học! 📘",
            "Bạn đang tiến bộ đấy! 🚀",
            "Giữ vững tinh thần nhé! 💖"
        ];

        let rawQuestions = [],
            current = 0,
            userAnswers = [],
            quizStarted = false;
        let timerInterval = null,
            totalSeconds = 0,
            scale = 10,
            timeLimitSeconds = null;

        const confetti = new ConfettiGenerator({
            target: 'confetti'
        });

        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            if (quizStarted) recordViolation("Nhấn chuột phải");
        });
        document.addEventListener('dragstart', function(e) {
            e.preventDefault();
        });

        document.addEventListener('keydown', function(e) {
            if (
                (e.ctrlKey && (e.key === 'c' || e.key === 'u' || e.key === 's')) ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                e.key === 'F12'
            ) {
                e.preventDefault();
                if (quizStarted) recordViolation(`Nhấn phím tắt ${e.key}`);
            }
        });



        window.onload = function() {
            // Xóa tất cả dữ liệu cũ khi tải trang
            document.getElementById("upload").value = "";
            rawQuestions = [];
            userAnswers = [];
            current = 0;
            scale = 10;
            timeLimitSeconds = null;
            violationCount = 0;
            localStorage.clear(); // Xóa toàn bộ localStorage
            sessionStorage.clear(); // Xóa toàn bộ sessionStorage
            document.getElementById("startQuiz").style.display = "none";
            document.getElementById("quizContainer").style.display = "none";
            document.getElementById("progressBar").classList.remove("show");
            document.getElementById("progressBar").textContent = "0 / 0 câu đã làm";
            document.getElementById("timer").textContent = '';
            stopTimer();
            document.getElementById("upload").style.display = "block";
            document.getElementById("clearFileBtn").style.display = "none";
            document.getElementById("extraButtons").style.display = "flex";
            document.getElementById("usageGuide").classList.add("show");

            // Sự kiện tải file mới
            document.getElementById("upload").addEventListener("change", function(event) {
                const reader = new FileReader();
                reader.onload = function() {
                    mammoth.convertToHtml({
                        arrayBuffer: reader.result
                    }).then(function(result) {
                        const html = result.value;
                        parseQuestions(html);
                        if (rawQuestions.length > 0) {
                            localStorage.setItem("quizQuestions", JSON.stringify(rawQuestions));
                            localStorage.setItem("currentFileName", event.target.files[0].name);
                            let retryData = JSON.parse(localStorage.getItem("retryData")) || {};
                            if (!retryData[event.target.files[0].name]) {
                                retryData[event.target.files[0].name] = {
                                    attempts: 0,
                                    scores: []
                                };
                                localStorage.setItem("retryData", JSON.stringify(retryData));
                            }
                            document.getElementById("upload").style.display = "none";
                            document.getElementById("clearFileBtn").style.display = "inline-block";
                            document.getElementById("startQuiz").style.display = "block";
                            document.getElementById("usageGuide").classList.remove("show");
                            document.getElementById("overlay").style.display = "none";
                            document.getElementById("scalePopup").style.display = "block";
                            document.querySelector(".container").classList.remove("blur");
                            const fileUploads = JSON.parse(sessionStorage.getItem('fileUploads')) || [];
                            fileUploads.push({
                                file: event.target.files[0].name,
                                time: new Date().toLocaleString('vi-VN')
                            });
                            sessionStorage.setItem('fileUploads', JSON.stringify(fileUploads));
                        } else {
                            showPopup("⚠️ Không tìm thấy câu hỏi hợp lệ.");
                        }
                    }).catch(() => {
                        showPopup("❌ Lỗi đọc file.");
                    });
                };
                if (event.target.files.length > 0) reader.readAsArrayBuffer(event.target.files[0]);
            });
        };

        document.getElementById("upload").addEventListener("change", function(event) {
            const reader = new FileReader();
            reader.onload = function() {
                mammoth.convertToHtml({
                    arrayBuffer: reader.result
                }).then(function(result) {
                    const html = result.value;
                    parseQuestions(html);
                    if (rawQuestions.length > 0) {
                        localStorage.setItem("quizQuestions", JSON.stringify(rawQuestions));
                        localStorage.setItem("currentFileName", event.target.files[0].name);
                        let retryData = JSON.parse(localStorage.getItem("retryData")) || {};
                        if (!retryData[event.target.files[0].name]) {
                            retryData[event.target.files[0].name] = {
                                attempts: 0,
                                scores: []
                            };
                            localStorage.setItem("retryData", JSON.stringify(retryData));
                        }
                        document.getElementById("upload").style.display = "none";
                        document.getElementById("clearFileBtn").style.display = "inline-block";
                        document.getElementById("startQuiz").style.display = "block";
                        document.getElementById("usageGuide").classList.remove("show");
                        document.getElementById("overlay").style.display = "none";
                        document.getElementById("scalePopup").style.display = "block";
                        document.querySelector(".container").classList.remove("blur");
                        const fileUploads = JSON.parse(sessionStorage.getItem('fileUploads')) || [];
                        fileUploads.push({
                            file: event.target.files[0].name,
                            time: new Date().toLocaleString('vi-VN')
                        });
                        sessionStorage.setItem('fileUploads', JSON.stringify(fileUploads));
                    } else {
                        showPopup("⚠️ Không tìm thấy câu hỏi hợp lệ.");
                    }
                }).catch(() => {
                    showPopup("❌ Lỗi đọc file.");
                });
            };
            if (event.target.files.length > 0) reader.readAsArrayBuffer(event.target.files[0]);
        });

        function parseQuestions(html) {
            const container = document.createElement("div");
            container.innerHTML = html;
            const paras = container.querySelectorAll("p");
            rawQuestions = [];
            let currentQ = null;

            function isRedOrBold(p) {
                let hasRed = false;
                let hasBold = false;
                p.querySelectorAll("*").forEach(el => {
                    const style = el.getAttribute("style") || "";
                    const colorRed = /color:\s*(red|#ff0000)/i.test(style);
                    const tagBold = el.tagName === "B" || el.tagName === "STRONG";
                    if (colorRed) hasRed = true;
                    if (tagBold) hasBold = true;
                });
                return hasRed || hasBold;
            }

            paras.forEach(p => {
                const text = p.innerText.trim();
                if (/^\d+[\.\)]\s/.test(text)) {
                    if (currentQ) rawQuestions.push(currentQ);
                    currentQ = {
                        question: text,
                        options: [],
                        correctIndex: null
                    };
                } else if (/^[a-dA-D][\.\)]\s/.test(text) && currentQ) {
                    const label = text.substring(0, 2);
                    const content = text.substring(2).trim();
                    const full = label + " " + content;
                    const isCorrect = isRedOrBold(p);
                    currentQ.options.push({
                        text: full,
                        isCorrect
                    });
                }
            });

            if (currentQ) rawQuestions.push(currentQ);
        }

        function saveScale() {
            const scaleInput = document.getElementById("scaleInput");
            const value = parseInt(scaleInput.value);
            if (value >= 1 && value <= 10) {
                scale = value;
                document.getElementById("scalePopup").style.display = "none";
                document.getElementById("overlay").style.display = "none";
                document.getElementById("timePopup").style.display = "block";
                document.querySelector(".container").classList.remove("blur");
            } else {
                showPopup("Thang điểm phải từ 1 đến 10.");
            }
        }

        function selectTimeMode(mode) {
            if (mode === "free") {
                timeLimitSeconds = null;
                document.getElementById("timer-container").style.display = "none";
                document.getElementById("timer-text").style.display = "none";
                showFullscreenCountdown();
            } else if (mode === "limited") {
                const timeInput = document.getElementById("timeInput");
                const minutes = parseInt(timeInput.value);
                if (minutes >= 1) {
                    timeLimitSeconds = minutes * 60;
                    document.getElementById("timer-container").style.display = "block";
                    document.getElementById("timer-text").style.display = "block";
                    showFullscreenCountdown();
                } else {
                    showPopup("Số phút phải lớn hơn hoặc bằng 1.");
                }
            }
            document.getElementById("timePopup").style.display = "none";
            document.getElementById("overlay").style.display = "none";
            document.querySelector(".container").classList.remove("blur");
        }

        function showFullscreenCountdown() {
            const countdown = document.createElement("div");
            countdown.id = "fullscreenCountdown";
            Object.assign(countdown.style, {
                position: "fixed",
                top: "0",
                left: "0",
                width: "100vw",
                height: "100vh",
                background: `url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80') no-repeat center center fixed`,
                backgroundSize: "cover",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8rem",
                fontWeight: "bold",
                color: "#f0f4f8",
                zIndex: "100000",
                textShadow: "0 0 30px rgba(0, 0, 0, 0.6)"
            });
            document.body.appendChild(countdown);

            let count = 4;
            countdown.textContent = count;
            const interval = setInterval(() => {
                count--;
                if (count > 0) {
                    countdown.textContent = count;
                } else {
                    clearInterval(interval);
                    countdown.remove();
                    startQuiz();
                }
            }, 1000);
        }

        function startQuiz() {
            quizStarted = true;
            shuffleArray(rawQuestions);
            rawQuestions.forEach(q => {
                shuffleArray(q.options);
                q.correctIndex = q.options.findIndex(opt => opt.isCorrect);
            });
            document.getElementById("startQuiz").style.display = "none";
            document.getElementById("quizContainer").style.display = "block";
            document.getElementById("countdown").style.display = "none";
            document.getElementById("progressBar").classList.add("show");
            userAnswers = [];
            current = 0;
            totalSeconds = 0;
            startTimer();
            showQuestion();
            document.getElementById("extraButtons").style.display = "none";
        }

        function showQuestion() {
            const q = rawQuestions[current];
            const questionText = document.getElementById("questionText");
            const optContainer = document.getElementById("optionsContainer");

            questionText.innerHTML = `<h3 class="text-xl font-semibold" style="-webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;">${q.question}</h3>`;
            optContainer.innerHTML = "";
            q.options.forEach((opt, idx) => {
                optContainer.innerHTML += `<label style="-webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;"><input type="radio" name="option" value="${idx}" class="mr-2"> ${opt.text}</label>`;
            });

            const radioButtons = document.querySelectorAll('input[name="option"]');
            radioButtons.forEach(radio => {
                radio.addEventListener('change', () => {
                    nextQuestion();
                });
            });

            updateProgress();
        }

        function nextQuestion() {
            const selected = document.querySelector('input[name="option"]:checked');
            if (!selected) return showPopup("Bạn phải chọn một đáp án.");
            userAnswers.push(parseInt(selected.value));
            current++;
            if (current < rawQuestions.length) {
                showQuestion();
            } else {
                stopTimer();
                showResult();
            }
        }

        function updateProgress() {
            document.getElementById("progressBar").textContent = `${current} / ${rawQuestions.length} câu đã làm`;
        }

        function showResult() {
            quizStarted = false;
            let correct = 0;
            const wrongAnswers = [];
            const correctAnswers = [];

            rawQuestions.forEach((q, i) => {
                if (userAnswers[i] === q.correctIndex) {
                    correct++;
                    correctAnswers.push({
                        question: q.question,
                        selected: q.options[userAnswers[i]].text,
                        correct: q.options[q.correctIndex].text
                    });
                } else {
                    wrongAnswers.push({
                        question: q.question,
                        selected: q.options[userAnswers[i]] ?.text || "Không chọn",
                        correct: q.options[q.correctIndex] ?.text || "Không xác định"
                    });
                }
            });

            const score = ((correct / rawQuestions.length) * scale).toFixed(2);
            localStorage.setItem("quizScore", score);
            localStorage.setItem("quizCorrect", correct);
            localStorage.setItem("quizTotal", rawQuestions.length);
            localStorage.setItem("quizTime", formatTime(totalSeconds));
            localStorage.setItem("quizWrongAnswers", JSON.stringify(wrongAnswers));
            localStorage.setItem("quizCorrectAnswers", JSON.stringify(correctAnswers));
            localStorage.setItem("quizScale", scale);

            // Không xóa rawQuestions, chỉ reset trạng thái
            userAnswers = [];
            current = 0;
            totalSeconds = 0;
            violationCount = 0;
            sessionStorage.removeItem('violations');

            document.getElementById("extraButtons").style.display = "flex";
            window.location.href = "ketqua.html";
        }

        function restartQuiz() {
            document.getElementById("result").innerHTML = "";
            document.getElementById("quizContainer").style.display = "block";

            // Khôi phục rawQuestions từ localStorage
            const savedQuestions = localStorage.getItem("quizQuestions");
            if (savedQuestions) {
                rawQuestions = JSON.parse(savedQuestions);
            }

            // Xáo trộn lại câu hỏi và đáp án nếu có dữ liệu
            if (rawQuestions.length > 0) {
                shuffleArray(rawQuestions);
                rawQuestions.forEach(q => {
                    shuffleArray(q.options);
                    q.correctIndex = q.options.findIndex(opt => opt.isCorrect);
                });
            } else {
                showPopup("Không tìm thấy dữ liệu câu hỏi để làm lại. Vui lòng tải file mới.");
                return;
            }

            // Reset các trạng thái
            userAnswers = [];
            current = 0;
            totalSeconds = 0;
            violationCount = 0;
            sessionStorage.removeItem('violations');
            quizStarted = true;
            startTimer();
            showQuestion();
            document.getElementById("extraButtons").style.display = "none";
        }

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function startTimer() {
            const timerProgress = document.getElementById("timer-progress");
            const timerText = document.getElementById("timer-text");
            const initialTimeLimit = timeLimitSeconds;

            timerInterval = setInterval(() => {
                if (timeLimitSeconds !== null) {
                    timeLimitSeconds--;
                    totalSeconds++;
                    document.getElementById("timer").textContent = `⏱️ Thời gian còn lại: ${formatTime(timeLimitSeconds)}`;
                    const percentage = (timeLimitSeconds / initialTimeLimit) * 100;
                    timerProgress.style.width = `${percentage}%`;

                    if (timeLimitSeconds <= 60) {
                        document.getElementById("timer").classList.add("critical");
                        document.getElementById("timer").classList.remove("warning");
                        timerProgress.classList.add("danger");
                        timerProgress.classList.remove("warning");
                        if (timeLimitSeconds === 0) {
                            stopTimer();
                            showResult();
                        }
                    } else if (timeLimitSeconds <= 300) {
                        document.getElementById("timer").classList.add("warning");
                        document.getElementById("timer").classList.remove("critical");
                        timerProgress.classList.add("warning");
                        timerProgress.classList.remove("danger");
                    }
                } else {
                    totalSeconds++;
                    document.getElementById("timer").textContent = `⏱️ Thời gian: ${formatTime(totalSeconds)}`;
                }
            }, 1000);
        }

        function stopTimer() {
            clearInterval(timerInterval);
            document.getElementById("timer").textContent = '';
            document.getElementById("timer").classList.remove("warning", "critical");
            document.getElementById("timer-container").style.display = "none";
            document.getElementById("timer-text").style.display = "none";
        }

        function formatTime(s) {
            const m = Math.floor(s / 60).toString().padStart(2, '0');
            const sec = (s % 60).toString().padStart(2, '0');
            return `${m}:${sec}`;
        }

        let violations = JSON.parse(sessionStorage.getItem('violations')) || [];
        let violationCount = violations.length;

        function showViolationWarning(message, backgroundColor, duration, callback) {
            const warning = document.createElement("div");
            warning.className = "violation-warning";
            warning.style.backgroundColor = backgroundColor;
            warning.textContent = message;
            document.body.appendChild(warning);
            setTimeout(() => {
                warning.remove();
                if (callback) callback();
            }, duration);
        }

        function recordViolation(action) {
            if (!quizStarted) return;
            const now = new Date().toLocaleString('vi-VN');
            violationCount++;
            let message;

            if (violationCount === 1) {
                message = `Vi phạm lần 1: ${action}. Ôi trời, định "chơi chiêu" hả? 😏 Làm bài tử tế đi nha!`;
                showViolationWarning(message, '#34d399', 3000);
            } else if (violationCount === 2) {
                message = `Vi phạm lần 2: ${action}. Lại nữa hả? 😒 Coi chừng lần sau nha!`;
                showViolationWarning(message, '#ef4444', 3000);
            } else if (violationCount >= 3) {
                message = `Vi phạm lần 3: ${action}. Thôi đủ rồi nha! 😤 Bài thi tự động nộp, mời bạn ra ngoài!`;
                localStorage.setItem('quizViolation', action);
                violations.push({
                    message: `Vi phạm: ${action}`,
                    time: now
                });
                sessionStorage.setItem('violations', JSON.stringify(violations));
                showViolationWarning(message, '#ef4444', 3000, () => {
                    submitQuiz();
                });
                return;
            }

            violations.push({
                message: `Vi phạm: ${action}`,
                time: now
            });
            sessionStorage.setItem('violations', JSON.stringify(violations));
        }

        document.addEventListener("visibilitychange", () => {
            if (quizStarted && document.hidden) {
                recordViolation("Chuyển tab hoặc ẩn trình duyệt");
            }
        });

        window.addEventListener("resize", () => {
            if (quizStarted && window.outerWidth < 800) {
                recordViolation("Thu nhỏ trình duyệt");
            }
        });

        const violation = localStorage.getItem("quizViolation");
        if (violation) {
            const message = document.createElement("div");
            message.className = "text-center text-red-600 text-xl font-semibold mb-4";
            message.innerHTML = `🚫 Bài làm kết thúc do <strong>${violation}</strong>`;
            document.querySelector(".container").prepend(message);
            localStorage.removeItem("quizViolation");
        }

        function showPopup(message, confirm = false, onOkCallback = closePopup) {
            const overlay = document.getElementById("overlay");
            const popup = document.getElementById("popup");
            const messageDiv = document.getElementById("popupMessage");
            const buttons = document.getElementById("popupButtons");

            messageDiv.textContent = message;
            overlay.style.display = "none";
            popup.style.display = "block";
            document.querySelector(".container").classList.remove("blur");
            buttons.innerHTML = "";

            if (confirm) {
                const yesBtn = document.createElement("button");
                yesBtn.textContent = "Có";
                yesBtn.onclick = () => {
                    closePopup();
                    restartQuiz();
                };
                const noBtn = document.createElement("button");
                noBtn.textContent = "Không";
                noBtn.onclick = closePopup;
                buttons.appendChild(yesBtn);
                buttons.appendChild(noBtn);
            } else {
                const okBtn = document.createElement("button");
                okBtn.textContent = "OK";
                okBtn.onclick = () => {
                    closePopup();
                    onOkCallback();
                };
                buttons.appendChild(okBtn);
            }
        }

        function closePopup() {
            document.getElementById("popup").style.display = "none";
            document.getElementById("overlay").style.display = "none";
            document.getElementById("scalePopup").style.display = "none";
            document.getElementById("timePopup").style.display = "none";
            document.querySelector(".container").classList.remove("blur");
        }

        function prevQuestion() {
            if (current === 0) {
                showPopup("Bạn đang ở câu đầu tiên.");
                return;
            }
            current--;
            userAnswers.pop();
            showQuestion();
        }

        function clearFile() {
            document.getElementById("upload").value = "";
            rawQuestions = [];
            userAnswers = [];
            current = 0;
            scale = 10;
            timeLimitSeconds = null;
            violationCount = 0;
            const fileName = localStorage.getItem("currentFileName");
            if (fileName) {
                let retryData = JSON.parse(localStorage.getItem("retryData")) || {};
                delete retryData[fileName];
                localStorage.setItem("retryData", JSON.stringify(retryData));
            }
            localStorage.removeItem("quizQuestions");
            localStorage.removeItem("currentFileName");
            sessionStorage.removeItem("violations");
            sessionStorage.removeItem("fileUploads");
            document.getElementById("startQuiz").style.display = "none";
            document.getElementById("quizContainer").style.display = "none";
            document.getElementById("progressBar").classList.remove("show");
            document.getElementById("progressBar").textContent = "0 / 0 câu đã làm";
            document.getElementById("timer").textContent = '';
            stopTimer();
            document.getElementById("upload").style.display = "block";
            document.getElementById("clearFileBtn").style.display = "none";
            document.getElementById("extraButtons").style.display = "flex";
            document.getElementById("usageGuide").classList.add("show");
        }

        function submitQuiz() {
            const selected = document.querySelector('input[name="option"]:checked');
            if (userAnswers.length < rawQuestions.length) {
                if (selected) userAnswers.push(parseInt(selected.value));
                for (let i = userAnswers.length; i < rawQuestions.length; i++) {
                    userAnswers.push(null);
                }
            }

            stopTimer();
            showResult();
        }

        function showTimeSelection() {
            document.getElementById("timePopup").style.display = "block";
            document.getElementById("overlay").style.display = "none";
            document.querySelector(".container").classList.remove("blur");
        }

        function toggleConfirmButton() {
            const timeInput = document.getElementById("timeInput");
            const confirmBtn = document.getElementById("confirmTimeBtn");
            if (timeInput.value.trim() !== "" && !isNaN(timeInput.value)) {
                confirmBtn.classList.remove("hidden");
            } else {
                confirmBtn.classList.add("hidden");
            }
        }

        document.addEventListener("DOMContentLoaded", () => {
            const isRestart = localStorage.getItem("restartQuiz") === "true";
            if (isRestart) {
                const savedQuestions = JSON.parse(localStorage.getItem("quizQuestions"));
                if (savedQuestions && savedQuestions.length > 0) {
                    document.getElementById("overlay").style.display = "none";
                    document.getElementById("scalePopup").style.display = "block";
                    document.querySelector(".container").classList.remove("blur");
                } else {
                    alert("Không tìm thấy dữ liệu bài làm trước.");
                }
                localStorage.removeItem("restartQuiz");
            }
        });
        // Xử lý sự kiện chuột rời khỏi vùng làm bài
        let mouseLeaveTimeout = null;

        document.addEventListener('mousemove', function(e) {
            if (quizStarted) {
                const container = document.querySelector('.container');
                const rect = container.getBoundingClientRect();

                // Kiểm tra nếu chuột nằm ngoài vùng .container trong tài liệu hiện tại
                if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
                    if (!mouseLeaveTimeout) {
                        mouseLeaveTimeout = setTimeout(() => {
                            recordViolation("Chuột rời khỏi vùng làm bài");
                            mouseLeaveTimeout = null;
                        }, 500); // Thay bằng 500ms để phản hồi nhanh hơn
                    }
                } else {
                    if (mouseLeaveTimeout) {
                        clearTimeout(mouseLeaveTimeout);
                        mouseLeaveTimeout = null;
                    }
                }
            }
        });

        // Loại bỏ các sự kiện không cần thiết liên quan đến tab hoặc resize
        document.removeEventListener('visibilitychange', function() {});
        window.removeEventListener('resize', function() {});
        window.removeEventListener('blur', function() {});

        // Tự động xóa file và dữ liệu cũ khi tải trang




        window.onload = function() {
            // Kiểm tra và xóa dữ liệu chỉ khi không có file
            const fileName = localStorage.getItem("currentFileName");
            if (!fileName || !localStorage.getItem("quizQuestions")) {
                document.getElementById("upload").value = "";
                rawQuestions = [];
                userAnswers = [];
                current = 0;
                scale = 10;
                timeLimitSeconds = null;
                violationCount = 0;
                let retryData = JSON.parse(localStorage.getItem("retryData")) || {};
                if (fileName) delete retryData[fileName];
                localStorage.removeItem("quizQuestions");
                localStorage.removeItem("currentFileName");
                sessionStorage.removeItem("violations");
                sessionStorage.removeItem("fileUploads");
                document.getElementById("startQuiz").style.display = "none";
                document.getElementById("quizContainer").style.display = "none";
                document.getElementById("progressBar").classList.remove("show");
                document.getElementById("progressBar").textContent = "0 / 0 câu đã làm";
                document.getElementById("timer").textContent = '';
                stopTimer();
                document.getElementById("upload").style.display = "block";
                document.getElementById("clearFileBtn").style.display = "none";
                document.getElementById("extraButtons").style.display = "flex";
                document.getElementById("usageGuide").classList.add("show");
            }

            // Logic khởi tạo sau khi xóa hoặc giữ dữ liệu
            const savedQuestions = localStorage.getItem("quizQuestions");
            if (savedQuestions) {
                rawQuestions = JSON.parse(savedQuestions);
                if (rawQuestions.length > 0) {
                    document.getElementById("upload").style.display = "none";
                    document.getElementById("clearFileBtn").style.display = "inline-block";
                    document.getElementById("usageGuide").classList.remove("show");
                    document.getElementById("startQuiz").style.display = "block";
                } else {
                    document.getElementById("usageGuide").classList.add("show");
                }
            } else {
                document.getElementById("usageGuide").classList.add("show");
            }

            // Sự kiện tải file (không thay đổi)
            document.getElementById("upload").addEventListener("change", function(event) {
                const reader = new FileReader();
                reader.onload = function() {
                    mammoth.convertToHtml({
                        arrayBuffer: reader.result
                    }).then(function(result) {
                        const html = result.value;
                        parseQuestions(html);
                        if (rawQuestions.length > 0) {
                            localStorage.setItem("quizQuestions", JSON.stringify(rawQuestions));
                            localStorage.setItem("currentFileName", event.target.files[0].name);
                            let retryData = JSON.parse(localStorage.getItem("retryData")) || {};
                            if (!retryData[event.target.files[0].name]) {
                                retryData[event.target.files[0].name] = {
                                    attempts: 0,
                                    scores: []
                                };
                                localStorage.setItem("retryData", JSON.stringify(retryData));
                            }
                            document.getElementById("upload").style.display = "none";
                            document.getElementById("clearFileBtn").style.display = "inline-block";
                            document.getElementById("startQuiz").style.display = "block";
                            document.getElementById("usageGuide").classList.remove("show");
                            document.getElementById("overlay").style.display = "none";
                            document.getElementById("scalePopup").style.display = "block";
                            document.querySelector(".container").classList.remove("blur");
                            const fileUploads = JSON.parse(sessionStorage.getItem('fileUploads')) || [];
                            fileUploads.push({
                                file: event.target.files[0].name,
                                time: new Date().toLocaleString('vi-VN')
                            });
                            sessionStorage.setItem('fileUploads', JSON.stringify(fileUploads));
                        } else {
                            showPopup("⚠️ Không tìm thấy câu hỏi hợp lệ.");
                        }
                    }).catch(() => {
                        showPopup("❌ Lỗi đọc file.");
                    });
                };
                if (event.target.files.length > 0) reader.readAsArrayBuffer(event.target.files[0]);
            });
        };

        window.addEventListener('beforeunload', function(e) {
            if (quizStarted) {
                document.getElementById("upload").value = "";
                rawQuestions = [];
                userAnswers = [];
                current = 0;
                scale = 10;
                timeLimitSeconds = null;
                violationCount = 0;
                localStorage.clear();
                sessionStorage.clear();
            }
        });