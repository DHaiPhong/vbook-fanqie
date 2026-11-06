load('config.js');

// Danh sách cho tab home/genre/tag; input là chuỗi lọc, vd "sort=1&cat=747".
function execute(input, page) {
    return listBooks(input || "", page);
}
