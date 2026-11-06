load('config.js');

function execute(url) {
    let id = bookIdFrom(url);
    if (!id) return Response.error("Link truyện không hợp lệ: " + url);

    // API mục lục công khai, trả cả danh sách chương theo từng quyển.
    let response = apiFetch("/api/reader/directory/detail?bookId=" + id);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let json = response.json();
    let volumes = json.data && json.data.chapterListWithVolume;
    if (!volumes) return Response.error("Không tải được mục lục");

    let chapters = [];
    for (let v = 0; v < volumes.length; v++) {
        let list = volumes[v] || [];
        for (let i = 0; i < list.length; i++) {
            let c = list[i];
            chapters.push({
                name: decode(c.title),
                url: "/reader/" + c.itemId,
                host: BASE_URL
            });
        }
    }
    return Response.success(chapters);
}
