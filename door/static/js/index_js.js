$(document).on('submit', '#form', function (e) {
    e.preventDefault();
    
    // 檢查帳號是否為空
    if($('#user').val() == ''){
        showAlertModal('帳號不得為空白!');
        $('#user').focus();
        return false;
    }

    // 檢查密碼是否為空
    if($('#password').val() == ''){
        showAlertModal('密碼不得為空白!');
        $('#password').focus();
        return false;
    }

    $.ajax({
        type: 'POST',
        url: '/login/',
        data: {
            user: $('#user').val(),
            password: $('#password').val(),
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            action: 'post'
        },
        success: function (json) {
            console.log("伺服器回應:", json);
            // 檢查是否包含 user_id 並且狀態為 '1'
            if (json.status == '1') {
                if (json.user_id) {
                    // 創建一個 URL 物件
                    let baseUrl = new URL('http://127.0.0.1:8000/main/');
                    baseUrl.pathname += `${json.user_id}/`;
                    console.log("重定向到URL:", baseUrl.href); // 打印重定向的URL

                    document.getElementById("form").reset();
                    showAlertModal('登入成功', baseUrl.href);  // 傳入重定向 URL
                } else {
                    console.log('伺服器回應中缺少 user_id');
                    showAlertModal('伺服器回應中缺少 user_id');
                }
            } else if (json.status == '0') {
                showAlertModal('輸入錯誤，請確認帳號和密碼!');
            }
        },
        error: function (xhr, errmsg, err) {
            console.log("請求錯誤:", xhr.status + ": " + xhr.responseText);
            showAlertModal('發生錯誤: ' + errmsg);
        }
    });
});

// 自定義函數：顯示 Bootstrap Modal 彈窗
function showAlertModal(message, redirectUrl = null) {
    $('#alertModalBody').text(message);  // 設定彈窗內訊息
    $('#alertModal').modal('show');      // 顯示 Modal

    // 綁定「確認」按鈕的點擊事件，當有重定向 URL 時，按下確認後才重定向
    $('#indexconfirm').off('click').on('click', function() {
        if (redirectUrl) {
            window.location.href = redirectUrl;  // 執行重定向
        } else {
            $('#alertModal').modal('hide');  // 否則關閉 Modal
        }
    });
}

