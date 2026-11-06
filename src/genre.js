load('config.js');

// Chỉ liệt kê nhóm "主分类" (thể loại chính); các nhóm khác (chủ đề, nhân vật, tình tiết) không lọc được qua category_id của thư viện.
function execute() {
    let response = apiFetch("/api/author/book/category_list/v0/?gender=-1&type=1");
    if (!response.ok) return Response.error("HTTP " + response.status);
    let json = response.json();
    if (json.code !== 0) return Response.error("Không tải được danh mục");

    let list = json.data || [];
    let genres = [];
    for (let i = 0; i < list.length; i++) {
        if (list[i].label !== "主分类") continue;
        genres.push({
            title: decode(list[i].name),
            input: "cat=" + list[i].category_id + "&sort=0",
            script: "list.js"
        });
    }
    return Response.success(genres);
}
