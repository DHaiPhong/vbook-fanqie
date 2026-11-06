load('config.js');

// API tìm kiếm của trang cần chữ ký (a_bogus) nên script không gọi được. Thay bằng:
//  1. dán link /page/<id> hoặc id truyện -> mở thẳng truyện đó;
//  2. gõ tên/tác giả -> quét vài trang đầu của thư viện (phổ biến + mới cập nhật) và lọc theo từ khoá.
const SCAN_PAGES = 8;

function execute(query, page) {
    query = String(query || "").trim();
    if (!query) return Response.success([], "");

    let id = bookIdFrom(query);
    if (id) {
        let response = htmlFetch(bookLink(id));
        if (!response.ok) return Response.error("HTTP " + response.status);
        let state = parseState(response.text());
        let p = state && state.page;
        if (!p || !p.bookName) return Response.error("Không tìm thấy truyện " + id);
        return Response.success([{
            name: decode(p.bookName),
            cover: coverUrl(p.thumbUrl),
            link: bookLink(id),
            description: decode(p.author || p.authorName || ""),
            host: BASE_URL
        }], "");
    }

    if (parseInt(page) > 1) return Response.success([], "");

    let needle = query.toLowerCase();
    let seen = {};
    let items = [];
    let sorts = ["0", "1"];
    for (let s = 0; s < sorts.length; s++) {
        for (let n = 1; n <= SCAN_PAGES; n++) {
            let result = fetchBooks("sort=" + sorts[s], n);
            if (result.error) break;
            for (let i = 0; i < result.items.length; i++) {
                let b = result.items[i];
                if (seen[b.link]) continue;
                seen[b.link] = true;
                if ((b.name + " " + b.description).toLowerCase().indexOf(needle) !== -1) items.push(b);
            }
            if (!result.hasMore) break;
        }
    }
    return Response.success(items, "");
}
