var currentPage = 1;
var totalRecords = 0;
var recordsPerPage = 8; // 一頁顯示幾筆資料
var pagesPerRow = 0; // 每一排顯示的頁數

$(document).ready(function () {
    // 获取最早和最晚日期并设置为 flatpickr 的 minDate 和 maxDate
    $.ajax({
        type: "GET",
        url: earliestAndLatestDateUrl,  // 替換成获取最早和最晚日期的接口URL
        success: function (response) {
            var minDate = response.min_date;
            var maxDate = response.max_date;
            flatpickr("#startDate", {
                dateFormat: "Y-m-d",
                locale: "zh",
                minDate: minDate,  // 设置最早日期
                maxDate: maxDate   // 设置最晚日期
            });
            flatpickr("#endDate", {
                dateFormat: "Y-m-d",
                locale: "zh",
                minDate: minDate,  // 设置最早日期
                maxDate: maxDate   // 设置最晚日期
            });
        },
        error: function (xhr, errmsg, err) {
            console.error('获取最早和最晚日期失败：', errmsg);
            // 设置默认的 minDate 和 maxDate
            flatpickr("#startDate", {
                dateFormat: "Y-m-d",
                locale: "zh"
            });
            flatpickr("#endDate", {
                dateFormat: "Y-m-d",
                locale: "zh"
            });
        }
    });

    $("#dateButton").click(function () {
        var startDate = $('#startDate').val();
        var endDate = $('#endDate').val();

        // 如果只有選擇開始日期而沒有選擇結束日期，則結束日期自動設為開始日期
        if (startDate && !endDate) {
            $('#endDate').val(startDate);
            endDate = startDate;
        }

        // 如果只有選擇結束日期而沒有選擇開始日期，則開始日期自動設為結束日期
        if (!startDate && endDate) {
            $('#startDate').val(endDate);
            startDate = endDate;
        }

        if (startDate && endDate && startDate > endDate) {
            // 顯示模態框
            $('#dateErrorModal').modal('show');
            return;
        }

        loadEventRecords(1); // 點擊篩選按鈕時，重新加載第1頁
    });

    loadEventRecords(currentPage);
});




function loadEventRecords(page) {
    var startDate = $('#startDate').val();
    var endDate = $('#endDate').val();
    var recordsPerPage = $('#recordsPerPage').val();

    $.ajax({
        type: "GET",
        url: eventRecordsUrl + "?page=" + page + "&start_date=" + startDate + "&end_date=" + endDate + "&records_per_page=" + recordsPerPage,
        success: function (response) {
            // 更新總記錄數
            totalRecords = response.total_records;
            $('#totalRecordsCount').text('共 ' + totalRecords + ' 筆資料');
            
            if (response.records.length > 0) {
                // 有資料的情況下，更新表格和分頁
                displayEventRecords(response.records);
                updatePaginationControls(page, response.records.length);
                $('#noDataMessage').hide(); // 隱藏“查無資料!”訊息
            } else {
                // 無資料的情況下，顯示“查無資料!”訊息
                $('#eventRecordsBody').empty(); // 清空表格內容
                $('#noDataMessage').show(); // 顯示“查無資料!”訊息
                updatePaginationControls(0, 0); // 清空分頁
            }
        },
        error: function (xhr, errmsg, err) {
            console.error('获取事件记录失败：', errmsg);
        }
    });
}

// 當選擇每頁顯示條數時，重新加載數據
$('#recordsPerPage').change(function() {
    loadEventRecords(1);  // 選擇條數變化時，重新加載第一頁數據
});



// 顯示事件記錄的函數
function displayEventRecords(eventRecords) {
    var eventHtml = '';
    for (var i = 0; i < eventRecords.length; i++) {
        var record = eventRecords[i];
        eventHtml += '<tr>' +
            '<td class="logtd">' + record.timestamp + '</td>' +
            '<td class="logtd">' + record.data_id + '</td>' +
            '<td class="logtd">' + record.name + '</td>' +
            '<td class="logtd">' + record.identity + '</td>' +
            '<td class="logtd">' + record.action + '</td>' +
            '</tr>';
    }
    $('#eventRecordsBody').html(eventHtml);
}



function updatePaginationControls(page, recordsLength) {
    var totalPages = Math.ceil(totalRecords / $('#recordsPerPage').val());  // 根据选择的每页条数计算总页数

    // 如果没有数据，不显示分页控件
    if (totalPages === 0) {
        $('#pagination-controls').html('');
        return;
    }

    var paginationHtml = '';
    var pagesPerColumn = 2;  // 每一列显示的页数

    // 计算当前所在列
    var currentColumn = Math.ceil(page / pagesPerColumn);
    var startPage = (currentColumn - 1) * pagesPerColumn + 1;
    var endPage = Math.min(startPage + pagesPerColumn - 1, totalPages);

    // 添加“最前页”按钮
    paginationHtml += '<ul class="pagination justify-content-end">';
    paginationHtml += '<li class="page-item' + (page === 1 ? ' disabled' : '') + '">';
    paginationHtml += '<a class="page-link" href="#" aria-label="First" data-page="1" title="最前页">';
    paginationHtml += '<span aria-hidden="true">&laquo;&laquo;</span></a></li>';

    // 添加第一页页码
    if (currentColumn > 1) {
        paginationHtml += '<li class="page-item">';
        paginationHtml += '<a class="page-link" href="#" data-page="1" title="第一页">1</a></li>';
    }

    // 添加“上一列”按钮
    if (currentColumn > 1) {
        paginationHtml += '<li class="page-item">';
        paginationHtml += '<a class="page-link" href="#" aria-label="Previous Column" data-page="' + (startPage - 1) + '" title="上一列">';
        paginationHtml += '<span aria-hidden="true">...</span></a></li>';
    }

    // 添加页码按钮
    for (var i = startPage; i <= endPage; i++) {
        paginationHtml += '<li class="page-item' + (i === page ? ' active' : '') + '">';
        if (i === page) {
            paginationHtml += '<span class="page-link">' + i + '</span>';
        } else {
            paginationHtml += '<a class="page-link" href="#" data-page="' + i + '">' + i + '</a>';
        }
        paginationHtml += '</li>';
    }

    // 添加“...”并显示总页数的最后一页
    if (endPage < totalPages) {
        paginationHtml += '<li class="page-item">';
        paginationHtml += '<a class="page-link" href="#" aria-label="Next Column" data-page="' + (endPage + 1) + '" title="下一列">';
        paginationHtml += '<span aria-hidden="true">...</span></a></li>';
    }

    // 添加最后页页码
    if (currentColumn < Math.ceil(totalPages / pagesPerColumn)) {
        paginationHtml += '<li class="page-item">';
        paginationHtml += '<a class="page-link" href="#" data-page="' + totalPages + '" title="最后页">' + totalPages + '</a></li>';
    }

    // 添加“最后页”按钮
    paginationHtml += '<li class="page-item' + (page === totalPages ? ' disabled' : '') + '">';
    paginationHtml += '<a class="page-link" href="#" aria-label="Last" data-page="' + totalPages + '" title="最后页">';
    paginationHtml += '<span aria-hidden="true">&raquo;&raquo;</span></a></li>';

    paginationHtml += '</ul>';

    $('#pagination-controls').html(paginationHtml);

    $('#pagination-controls a').click(function (event) {
        event.preventDefault();
        var newPage = $(this).data('page');
        if (newPage && newPage !== currentPage && newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            loadEventRecords(currentPage);
        }
    });
}

