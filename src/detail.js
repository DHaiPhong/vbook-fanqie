load('config.js');

function execute(url) {
    let id = bookIdFrom(url);
    if (!id) {
        // Link chương: đọc trang chương để biết truyện nào.
        let itemId = itemIdFrom(url);
        if (itemId) {
            let rs = htmlFetch("/reader/" + itemId);
            let st = rs.ok ? parseState(rs.text()) : null;
            if (st && st.reader && st.reader.chapterData) id = st.reader.chapterData.bookId;
        }
    }
    if (!id) return Response.error("Link truyện không hợp lệ: " + url);

    let response = htmlFetch(bookLink(id));
    if (!response.ok) return Response.error("HTTP " + response.status);
    let state = parseState(response.text());
    let p = state && state.page;
    if (!p || !p.bookName) return Response.error("Không đọc được trang truyện " + id);

    let description = escapeHtml(decode(p.abstract || p.description || "")).replace(/\r?\n/g, "<br>");

    let tags = [];
    try {
        let cats = JSON.parse(p.categoryV2 || "[]");
        for (let i = 0; i < cats.length; i++) {
            if (!cats[i].MainCategory) continue;
            tags.push({ title: cats[i].Name, input: "cat=" + cats[i].ObjectId + "&sort=0", script: "list.js" });
        }
    } catch (error) {
    }

    let completed = String(p.creationStatus) === "0";
    let info = [];
    info.push("Tác giả: " + decode(p.author || p.authorName || ""));
    if (p.chapterTotal) info.push("Số chương: " + p.chapterTotal);
    if (p.wordNumber) info.push("Số chữ: " + p.wordNumber);
    info.push("Trạng thái: " + (completed ? "Hoàn thành" : "Đang ra"));

    return Response.success({
        name: decode(p.bookName),
        author: decode(p.author || p.authorName || ""),
        cover: coverUrl(p.thumbUrl),
        description: description,
        detail: info.join("<br>"),
        url: BASE_URL + bookLink(id),
        type: "novel",
        format: "novel",
        ongoing: !completed,
        host: BASE_URL,
        genres: tags
    });
}
