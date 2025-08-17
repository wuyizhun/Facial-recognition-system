function toggleAll(source) {
  var checkboxes = document.getElementsByTagName('input');
  for (var i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].type == 'checkbox') {
      checkboxes[i].checked = source.checked;
    }
  }
}




$(document).ready(function () {

  $('#photo').change(function () {
    var file = this.files[0]; // 獲取上傳的檔案
    var reader = new FileReader();

    if (file.size > 5 * 1024 * 1024) { // 5MB的上限
      $('#photoError').text('檔案大小不可超過5MB');
      $('#previewPhoto').hide();
      return;
    } else {
      $('#photoError').text('');
    }

    reader.onload = function (e) {
      $('#previewPhoto').attr('src', e.target.result); // 將上傳的相片預覽顯示在 img 元素中
      $('#previewPhoto').show(); // 顯示預覽相片
    }

    reader.readAsDataURL(file);
  });

});
// 表單提交
$('#addForm').submit(function (e) {
  e.preventDefault();
  var name = $('#name').val();
  var identity = $('#identity').val();
  var phone = $('#phone').val();
  var email = $('#email').val();
  var photo = $('#photo')[0].files[0];
  var errors = []; // 用於存儲所有錯誤訊息




  $.ajax({
    type: "POST",
    url: checkDuplicateUrl,
    data: {
      'phone': phone,
      'email': email
    },
    headers: {
      'X-CSRFToken': csrfToken
    },
    success: function (response) {
      // 表單驗證的代碼...
      const containsOnlyChinese = /^[\u4e00-\u9fa5\s]*$/;
      const containsOnlyEnglish = /^[a-zA-Z\s]*$/;
      if (!/^[a-zA-Z\u4e00-\u9fa5\s]*$/.test(name)) {
        $('#nameError').text('姓名不可以包含數字或特殊符號！');
        errors.push('姓名不可以包含數字或特殊符號！');
      } else if (!(containsOnlyChinese.test(name) || containsOnlyEnglish.test(name))) {
        $('#nameError').text('姓名不能同時包含英文和中文！');
        errors.push('姓名不能同時包含英文和中文！');
      } else {
        $('#nameError').text('');
      }


      if (response.duplicate_phone) {
        $('#phoneError').text('該資料已重複，請輸入其他號碼！');
        errors.push('該資料已重複，請輸入其他號碼！');
      } else if (!/^09\d{8}$/.test(phone) && !/^0\d{1,2}-\d{6,8}$/.test(phone)) { // 手機號碼和市話區碼驗證
        $('#phoneError').text('聯絡方式格式不正確，請輸入有效的號碼！');
        errors.push('聯絡方式格式不正確，請輸入有效的號碼！');
      } else {
        $('#phoneError').text('');
      }
      if (response.duplicate_email) {
        $('#emailError').text('該資料已重複，請輸入其他電子郵件！');
        errors.push('該資料已重複，請輸入其他電子郵件！');
      } else if (!/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
        $('#emailError').text('電子郵件格式不正確,請輸入有效的電子郵件！');
        errors.push('電子郵件格式不正確,請輸入有效的電子郵件！');
      } else {
        $('#emailError').text('');
      }


      // 檢查相片是否已選擇以及檔案格式是否正確
      if (!photo) {
        $('#photoError').text('請選擇相片');
        errors.push('請選擇相片');
      } else {
        var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
        if (!allowedExtensions.exec(photo.name)) {
          $('#photoError').text('文件格式必須為JPG、JPEG、PNG或GIF');
          errors.push('文件格式必須為JPG、JPEG、PNG或GIF');
        } else {
          var imageCheckFormData = new FormData();
          imageCheckFormData.append('photo', photo);
          $.ajax({
            type: "POST",
            url: checkImageUrl,
            data: imageCheckFormData,
            contentType: false,
            processData: false,
            headers: {
              'X-CSRFToken': csrfToken
            },
            success: function (response) {
              if (response.error) {
                $('#photoError').text(response.error);
                errors.push(response.error);
              } else {
                if (errors.length === 0) {
                  var formData = new FormData();
                  formData.append('name', name);
                  formData.append('identity', identity);
                  formData.append('phone', phone);
                  formData.append('email', email);
                  formData.append('photo', photo);
                  formData.append('csrfmiddlewaretoken', csrfToken);
                  submitForm(formData);
                }
              }
            },
            error: function (xhr, errmsg, err) {
              $('#photoface-error').text('請上傳人臉相片！');
           
              // 當模態視窗關閉時，清除錯誤訊息
              $('#exampleModal').on('hidden.bs.modal', function () {
                $('#photoface-error').text('');
              });

            }
          });
        }
      }
    },

  });



  function submitForm(formData) {
    $.ajax({
      type: "POST",
      url: addDataUrl,
      data: formData,
      processData: false,
      contentType: false,
      headers: {
        'X-CSRFToken': csrfToken
      },
      success: function (response) {
        $('#exampleModal').modal('hide');

        // 更新總資料筆數
        var currentTotalCount = parseInt($('#totalDataCount').text());
        $('#totalDataCount').text(currentTotalCount + 1);

        // 重新加載資料以更新頁數
        loadData(currentPage, $('#itemsPerPage').val());
      },
      error: function (xhr, errmsg, err) {
        alert('資料新增失敗：' + errmsg);
      }
    });
  }



});





$('#exampleModal').on('show.bs.modal', function () {
  $('#name').val('');
  $('#identity').val('');
  $('#phone').val('');
  $('#email').val('');
  $('#nameError').text('');
  $('#phoneError').text('');
  $('#emailError').text('');
  $('#photo').val('');
  $('#previewPhoto').attr('src', '#').hide(); // 清除预览图像并隐藏
  $('#photoError').text('');

});



$('#deletebutton').click(function () {
  var checkedBoxes = $('tbody input[type="checkbox"]:checked');
  if (checkedBoxes.length === 0) {
    $('#nochooseModal').modal('show');
    return;
  }

  $('#deleteModal').modal('show');

  $('#confirmDeletebutton').click(function () {
    var ids = [];
    checkedBoxes.each(function () {
      var row = $(this).closest('tr');
      var id = row.find('td:eq(1)').text();
      ids.push(id);
    });

    $.ajax({
      type: "POST",
      url: deleteDataUrl,
      data: { 'ids': ids, 'csrfmiddlewaretoken': csrfToken },
      success: function (response) {
        if (response.success) {
          checkedBoxes.closest('tr').remove();
          $('#deleteModal').modal('hide');

          // 更新資料總數
          var totalDataCount = parseInt($('#totalDataCount').text());
          var newTotalDataCount = totalDataCount - ids.length;
          $('#totalDataCount').text(newTotalDataCount);
        } else {
          alert('刪除失敗：' + response.error);
        }
      },
      error: function (xhr, errmsg, err) {
        alert('刪除失敗：' + errmsg);
      }
    });
  });
});


$(document).ready(function () {
  $('#editPhoto').change(function () {
    var file = this.files[0]; // 獲取上傳的檔案
    var reader = new FileReader();

    if (file.size > 5 * 1024 * 1024) { // 5MB的上限
      $('#editPhotoPreviewError').text('檔案大小不可超過5MB');
      $('#editPhotoPreview').hide();
      return;
    } else {
      $('editPhotoPreviewError').text('');
    }



    reader.onload = function (e) {
      $('#editPhotoPreview').attr('src', e.target.result); // 將上傳的相片預覽顯示在 img 元素中
      $('#editPhotoPreview').show(); // 顯示預覽相片
    }

    reader.readAsDataURL(file);
  });

});

$(document).on('click', '#editbutton', function () {
  // 獲取要修改的行的資料
  var row = $(this).closest('tr');
  var id = row.find('td:eq(1)').text();
  var name = row.find('td:eq(3)').text();
  var identity = row.find('td:eq(4)').text();
  var phone = row.find('td:eq(5)').text();
  var email = row.find('td:eq(6)').text();
  var photoUrl = row.find('td:eq(2) img').attr('src');
  // 获取照片预览元素
  // 填充修改表單中的相應欄位
  $('#editId').val(id);
  $('#editName').val(name);
  $('#editIdentity').val(identity);
  $('#editPhone').val(phone);
  $('#editEmail').val(email);

  // 將圖片預覽顯示在修改表單中
  $('#editPhotoPreview').attr('src', photoUrl).show();

  // 在修改表單中添加一個隱藏的 input 元素，用於保存要修改的資料的 ID
  $('#editForm').append('<input type="hidden" name="id" id="editId" value="' + id + '">');


});


$('#editForm').submit(function (e) {
  e.preventDefault();
  // 獲取修改後的資料
  var id = $('#editId').val();
  var name = $('#editName').val();
  var identity = $('#editIdentity').val();
  var phone = $('#editPhone').val();
  var email = $('#editEmail').val();
  var photo = $('#editPhoto')[0].files[0];
  var errors = [];
  
  // 檢查重複的資料
  $.ajax({
    type: "POST",
    url: checkDuplicateUrl, // 修改為後端接口的路徑
    data: {
      'id': id,
      'phone': phone,
      'email': email
    },
    headers: {
      'X-CSRFToken': csrfToken // 将页面中获取到的 CSRF 令牌添加到请求头中
    },

    success: function (response) {
      // 表單驗證
      const containsOnlyChinese = /^[\u4e00-\u9fa5\s]*$/;
      const containsOnlyEnglish = /^[a-zA-Z\s]*$/;

      if (!/^[a-zA-Z\u4e00-\u9fa5\s]*$/.test(name)) {
        $('#editNameError').text('姓名不可以包含數字或特殊符號！');
        errors.push('姓名不可以包含數字或特殊符號！');
      } else if (!(containsOnlyChinese.test(name) || containsOnlyEnglish.test(name))) {
        $('#editNameError').text('姓名不能同時包含英文和中文！');
        errors.push('姓名不能同時包含英文和中文！');
      } else {
        $('#editNameError').text('');
      }

      if (response.duplicate_phone && response.duplicate_phone_id !== id) {
        $('#editPhoneError').text('該資料已重複，請輸入其他號碼！');
        errors.push('該資料已重複，請輸入其他號碼！');
      } else if (!/^09\d{8}$/.test(phone) && !/^0\d{1,2}-\d{6,8}$/.test(phone)) { 
        $('#editPhoneError').text('聯絡方式格式不正確，請輸入有效的號碼！');
        errors.push('聯絡方式格式不正確，請輸入有效的號碼！');
      } else {
        $('#editPhoneError').text('');
      }

      if (response.duplicate_email && response.duplicate_email_id !== id) {
        $('#editEmailError').text('該資料已重複，請輸入其他電子郵件！');
        errors.push('該資料已重複，請輸入其他電子郵件！');
      } else if (!/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
        $('#editEmailError').text('電子郵件格式不正確,請輸入有效的電子郵件！');
        errors.push('電子郵件格式不正確,請輸入有效的電子郵件！');
      } else {
        $('#editEmailError').text('');
      }

      // 檢查圖片格式
      var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
      if (photo && !allowedExtensions.exec(photo.name)) {
        $('#editPhotoPreviewError').text('文件格式必須為JPG、JPEG、PNG或GIF');
        errors.push('文件格式必須為JPG、JPEG、PNG或GIF');
      } else {
        $('#editPhotoPreviewError').text('');
      }

      // 如果存在错误，停止表单提交
      if (errors.length > 0) {
        return;
      }

      // 如果没有错误，开始检查图片内容（如需要）
      if (photo) {
        var imageCheckFormData = new FormData();
        imageCheckFormData.append('photo', photo);

        $.ajax({
          type: "POST",
          url: checkImageUrl,
          data: imageCheckFormData,
          contentType: false,
          processData: false,
          headers: {
            'X-CSRFToken': csrfToken
          },
          success: function (response) {
            if (response.error) {
              $('#editPhotoPreviewError').text(response.error);
              errors.push(response.error);
            }

            // 如果没有图片错误，提交表单
            if (errors.length === 0) {
              submitForm();
            }
          },
          error: function (xhr, errmsg, err) {
            $('#editphotoface-error').text('請上傳人臉相片！');
            $('#editmodal').on('hidden.bs.modal', function () {
              $('#editphotoface-error').text('');
            });
          }
        });
      } else {
        // 如果没有图片，直接提交表单
        submitForm();
      }

      // 提交表单函数
      function submitForm() {
        var formData = new FormData();
        formData.append('id', id);
        formData.append('name', name);
        formData.append('identity', identity);
        formData.append('phone', phone);
        formData.append('email', email);
        formData.append('photo', photo);
        formData.append('csrfmiddlewaretoken', csrfToken);

        $.ajax({
          type: "POST",
          url: editDataUrl,
          data: formData,
          processData: false,
          contentType: false,
          success: function (response) {
            // 更新資料表中的該列資料
            var row = $('tbody').find('tr:has(td:contains(' + id + '))').first();
            row.find('td:eq(3)').text(name);
            row.find('td:eq(4)').text(identity);
            row.find('td:eq(5)').text(phone);
            row.find('td:eq(6)').text(email);

            if (response.modified_at) {
              row.find('td:eq(8)').text(response.modified_at); 
            }

            var photoUrl = response.photo_url;
            if (photoUrl) {
              var photoHtml = '<img src="' + photoUrl + '" alt="Photo" style="width: 60px;height:60px;">';
              row.find('td:eq(2)').html(photoHtml);
            }

            $('#editPhoto').val('');
            $('#editmodal').modal('hide');
          },
          error: function (xhr, errmsg, err) {
            alert('資料更新失敗：' + errmsg);
          }
        });
      }

    },
    error: function (xhr, errmsg, err) {
      alert('检查重复数据失败：' + errmsg);
    }
  });
});




$('#editmodal').on('show.bs.modal', function () {

  $('#editNameError').text('');
  $('#editPhoneError').text('');
  $('#editEmailError').text('');
  $('#editPhoto').val('');


});



var currentPage = 1;
var itemsPerPage = 5; // 默認值
var currentSearch = {
  name: '',
  identity: '',
  phone: ''
};

$(document).ready(function () {
  // 初始加载数据
  loadData(currentPage, itemsPerPage);

  // 分页按钮事件处理
  $('#pagination').on('click', 'a.page-link', function (e) {
    e.preventDefault();
    var page = $(this).data('page');
    currentPage = page;
    if (currentSearch.name || currentSearch.identity || currentSearch.phone) {
      fetchData(currentSearch.name, currentSearch.identity, currentSearch.phone, page);
    } else {
      loadData(page, itemsPerPage);
    }
  });

  // 每页显示数据笔数下拉框变化事件处理
  $('#itemsPerPage').change(function () {
    itemsPerPage = $(this).val();
    console.log('Items per page changed, itemsPerPage:', itemsPerPage); // Log for debugging
    if (currentSearch.name || currentSearch.identity || currentSearch.phone) {
      fetchData(currentSearch.name, currentSearch.identity, currentSearch.phone, 1);
    } else {
      loadData(1, itemsPerPage);
    }
  });

  // 搜索按钮事件处理
  $('#searchbutton').click(function () {
    currentSearch.name = $('#nameSearch').val();
    currentSearch.identity = $('#identitySearch').val();
    currentSearch.phone = $('#phoneSearch').val();
    var page = 1; // 初始页码设为1
    console.log('Search button clicked, search criteria:', currentSearch); // Log for debugging
    fetchData(currentSearch.name, currentSearch.identity, currentSearch.phone, page);
  });
});

function loadData(page, perPage) {
  $.ajax({
    type: "GET",
    url: getDataUrl,
    data: { page: page, per_page: perPage },
    success: function (response) {
      fillTable(response.data);
      displayPagination(response.total_pages, page);
      $('#totalDataCount').text(response.total_data_count);
    },
    error: function (xhr, errmsg, err) {
      alert('獲取資料失敗：' + errmsg);
    }
  });
}

function fillTable(data) {
  $('tbody').empty();
  data.forEach(function (item) {
    var photoHtml = item.photo_url ? '<img src="' + item.photo_url + '" alt="Photo" style="width: 60px;height:60px;">' : '';
    var editButtonHtml = '<button type="button" id="editbutton" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#editmodal" data-id="' + item.id + '"><img id="icon" src="' + editImageUrl + '"  style="vertical-align: middle;"><span style="vertical-align: middle;">修改</span></button>';
    var openDoorButtonHtml = '<button type="button" class="btn btn-secondary openbutton" data-id="' + item.id + '"><img id="icon" src="' + doorImageUrl + '" style="vertical-align: middle;"><span style="vertical-align: middle;">開門</span></button>';
    $('tbody').append('<tr><td><input type="checkbox"></td><td>' + item.id + '</td><td>' + photoHtml + '</td><td>' + item.name + '</td><td>' + item.identity + '</td><td>' + item.phone + '</td><td>' + item.email + '</td><td>' + item.created_at + '</td><td>' + item.updated_at + '</td><td>' + editButtonHtml + ' ' + openDoorButtonHtml + '</td></tr>');
  });

  // 监听开门按钮的点击事件
  $(document).on('click', '.openbutton', function () {
    var id = $(this).data('id');
    $.ajax({
      type: 'POST',
      url: opendoorurl,
      data: {
        'id': id,
      },
      headers: {
        'X-CSRFToken': csrfToken // 使用您已有的 CSRF token 變數
      },
      success: function (response) {
        if (response.success) {
          alert('開門成功，已記錄事件。');
          // 這裡可以添加其他處理邏輯，比如更新事件紀錄顯示
        } else {
          alert('開門失敗：' + response.error);
        }
      },
      error: function (xhr, status, error) {
        alert('開門請求失敗：' + error);
      }
    });
  });
}



function displayPagination(totalPages, currentPage) {
  if (totalPages === 0) {
    $('#pagination').html('');
    return;
  }
  var paginationHtml = '<nav aria-label="Page navigation example"><ul class="pagination">';
  var pagesPerRow = 1;
  var row = Math.ceil(currentPage / pagesPerRow);
  var startPage = (row - 1) * pagesPerRow + 1;
  var endPage = Math.min(startPage + pagesPerRow - 1, totalPages);

  // 添加“最前頁”按钮
  paginationHtml += '<li class="page-item' + (currentPage === 1 ? ' disabled' : '') + '">';
  paginationHtml += '<a class="page-link" href="#" data-page="1" title="最前頁">&laquo;&laquo;</a></li>';

  // 添加“上一欄”按钮
  var prevRowFirstPage = Math.max(1, startPage - pagesPerRow);
  paginationHtml += '<li class="page-item' + (row === 1 ? ' disabled' : '') + '">';

  // 添加中間部分的頁碼和省略符號
  if (startPage > 1) {
    paginationHtml += '<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>';
    if (startPage > 2) {
      paginationHtml += '<li class="page-item">';
      paginationHtml += '<a class="page-link" href="#" data-page="' + prevRowFirstPage + '" title="上一欄">...</a>';
      paginationHtml += '</li>';
    }
  }

  for (var i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      paginationHtml += '<li class="page-item active"><span class="page-link">' + i + '</span></li>';
    } else {
      paginationHtml += '<li class="page-item"><a class="page-link" href="#" data-page="' + i + '">' + i + '</a></li>';
    }
  }

  // 添加中間部分的省略符號和最終頁碼
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHtml += '<li class="page-item">';
      paginationHtml += '<a class="page-link" href="#" data-page="' + (endPage + 1) + '" title="下一欄">...</a>';
      paginationHtml += '</li>';
    }
    paginationHtml += '<li class="page-item"><a class="page-link" href="#" data-page="' + totalPages + '">' + totalPages + '</a></li>';
  }

  // 添加“下一欄”按钮
  var nextPage = Math.min(totalPages, currentPage + 1);
  paginationHtml += '<li class="page-item' + (currentPage === totalPages || endPage === totalPages ? ' disabled' : '') + '">';

  // 添加“最終頁”按钮
  paginationHtml += '<li class="page-item' + (currentPage === totalPages ? ' disabled' : '') + '">';
  paginationHtml += '<a class="page-link" href="#" data-page="' + totalPages + '" title="最終頁">&raquo;&raquo;</a></li>';

  paginationHtml += '</ul></nav>';
  $('#pagination').html(paginationHtml);
}

function fetchData(name, identity, phone, page) {
  $.ajax({
    type: "GET",
    url: searchUrl,
    data: {
      name: name,
      identity: identity,
      phone: phone,
      page: page,
      per_page: itemsPerPage
    },
    success: function (response) {
      if (response.results.length > 0) {
        fillTable(response.results);
        $('#totalDataCount').text(response.total_data_count);
        displayPagination(response.total_pages, page);
        $('#noDataMessage').hide(); // 隱藏"無資料!"訊息
      } else {
        $('tbody').empty(); // 清空表格
        $('#noDataMessage').show(); // 顯示"無資料!"訊息
        $('#totalDataCount').text(0);
        displayPagination(0, page); // 处理没有分页的情况
      }
    },
    error: function (xhr, errmsg, err) {
      alert('搜索失败：' + errmsg);
    }
  });
}













