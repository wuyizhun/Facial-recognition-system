document.addEventListener("DOMContentLoaded", function () {
    var visitorForm = document.querySelector("#visitorForm");
    var controlsTabButton = document.getElementById("controls-tab");
    var formTabButton = document.getElementById("form-tab");
    var notificationArea = document.getElementById("notificationArea");
    var visitorSubmitted = false;
    var visitorName = "";

    // 初始設定表單標籤為 active
    document.querySelector("#form").classList.add("show", "active");

    // 解析網址並取得 user_id
    let currentURL = new URL(window.location.href);
    let pathname = currentURL.pathname;
    let urlParts = pathname.split('/').filter(part => part !== '');  // 過濾掉空字串
    let user_id = urlParts[urlParts.length - 1];

    document.getElementById("managerId").textContent = user_id;

    function createNotification(buttonName) {
        var notification = document.createElement("div");
        notification.classList.add("notification");

        var dateTime = new Date();
        var formattedDateTime = dateTime.toLocaleString();

        notification.innerHTML = `
            <p>日期時間：${formattedDateTime}</p>
            <p>管理者ID：${user_id}</p>
            <p>按下按鈕：${buttonName}</p>
            <p>訪客名稱：${visitorName}</p>
        `;

        notificationArea.appendChild(notification);
        addNotificationSeparator();
        scrollToBottom();
        blinkNotification(notification);
    }

    function addNotificationSeparator() {
        var separator = document.createElement("hr");
        notificationArea.appendChild(separator);
    }

    function blinkNotification(notification) {
        var interval = setInterval(function () {
            notification.style.backgroundColor = notification.style.backgroundColor === "" ? "#FFFF37" : "";
        }, 300);

        setTimeout(function () {
            clearInterval(interval);
            notification.style.backgroundColor = "";
        }, 600);
    }

    function handleButtonPress(button, action) {
        button.addEventListener("click", function () {
            // 發送 AJAX 請求到後端來控制 MQTT
            fetch(`/opendoor/${user_id}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: new URLSearchParams({
                    action: action,
                    name: visitorName // 例如，傳送 '開門' 或 '關門' 動作
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // 顯示通知
                        createNotification(action + " 成功");
                    } else {
                        alert("操作失敗：" + data.error);
                    }
                })
                .catch(error => {
                    console.error("操作失敗:", error);
                    alert("操作失敗，請重試");
                });

            // 按鈕的視覺效果
            button.classList.add("pressed");
            setTimeout(function () {
                button.classList.remove("pressed");
            }, 300);
        });
    }

    handleButtonPress(document.getElementById("expandButton"), "開門");
    handleButtonPress(document.getElementById("collapseButton"), "關門");

    function scrollToBottom() {
        notificationArea.scrollTop = notificationArea.scrollHeight;
    }

    // 表單提交事件，含名稱驗證
    visitorForm.addEventListener("submit", function (event) {
        event.preventDefault();

        // 訪客名稱驗證邏輯
        const nameInput = document.getElementById('visitorName');
        const nameValue = nameInput.value.trim();
        const nameError = document.getElementById('nameError');
        
        // 正則表達式：僅允許中文或英文，不允許數字和特殊符號
        const nameRegex = /^[\u4e00-\u9fa5a-zA-Z]+$/;

        // 檢查訪客名稱是否符合規則
        if (!nameRegex.test(nameValue)) {
            nameInput.classList.add('is-invalid');  // 加入 Bootstrap 的錯誤樣式
            nameError.style.display = 'block';      // 顯示錯誤訊息
            return;                                 // 中止提交
        } else {
            nameInput.classList.remove('is-invalid');
            nameError.style.display = 'none';       // 隱藏錯誤訊息
        }

        var formData = new FormData(visitorForm);

        fetch(`/submit_visitor/${user_id}/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    visitorSubmitted = true;
                    visitorName = formData.get("name");
            
                    // 設置模態框標題和內容
                    document.getElementById('alertModalLabel').textContent = '成功';
                    document.getElementById('alertModalBody').textContent = '訪客資料已成功提交';
            
                    // 隱藏取消按鈕
                    document.querySelector('.modal-footer .btn-secondary').style.display = 'none';
            
                    // 顯示模態框
                    var successModal = new bootstrap.Modal(document.getElementById('alertModal'));
                    successModal.show();
            
                    // 綁定確認按鈕的點擊事件來關閉模態框
                    document.getElementById('indexConfirm').addEventListener('click', function () {
                        successModal.hide(); // 使用 Bootstrap 的 hide 方法來關閉模態框
                    });
            
                    // 切換至 controls 標籤頁
                    var controlsTab = new bootstrap.Tab(controlsTabButton);
                    controlsTab.show();
            
                    document.querySelector("#form").classList.remove("show", "active");
                    document.querySelector("#controls").classList.add("show", "active");
                } else {
                    // 提交失敗，使用模態框顯示錯誤訊息
                    document.getElementById('alertModalLabel').textContent = '錯誤';
                    document.getElementById('alertModalBody').textContent = '提交失敗，請重試';
            
                    // 隱藏取消按鈕
                    document.querySelector('.modal-footer .btn-secondary').style.display = 'none';
            
                    var errorModal = new bootstrap.Modal(document.getElementById('alertModal'));
                    errorModal.show();
            
                    // 綁定確認按鈕的點擊事件來關閉模態框
                    document.getElementById('indexConfirm').addEventListener('click', function () {
                        errorModal.hide(); // 使用 Bootstrap 的 hide 方法來關閉模態框
                    });
                }
            })
            .catch(error => {
                console.error("提交失敗:", error);
                alert("提交失敗，請重試");
            });
            
            
    });

    controlsTabButton.addEventListener("click", function (event) {
        if (!visitorSubmitted) {
            event.preventDefault();
            
            // 顯示模態框
            var alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
            alertModal.show();
    
            // 處理模態框的確認按鈕點擊事件
            document.getElementById("indexConfirm").addEventListener("click", function () {
                // 切換到開關門標籤
                document.querySelector("#form").classList.remove("show", "active");
                document.querySelector("#controls").classList.add("show", "active");
                
                // 隱藏模態框
                alertModal.hide();
            });
        }
    });

    formTabButton.addEventListener("click", function (event) {
        document.querySelector("#controls").classList.remove("show", "active");
        document.querySelector("#form").classList.add("show", "active");
    });
});





