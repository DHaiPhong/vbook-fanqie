load('config.js');

function execute(url) {
    let itemId = itemIdFrom(url);
    if (!itemId) return Response.error("Link chương không hợp lệ: " + url);

    let state = readChapter(itemId);
    if (!state) return Response.error("Không đọc được trang chương " + itemId);
    let chapter = state.reader && state.reader.chapterData;
    if (!chapter || !chapter.content) return Response.error("Chương không có nội dung");

    let paragraphs = [];
    let re = /<p>([\s\S]*?)<\/p>/g;
    let m;
    while ((m = re.exec(chapter.content)) !== null) {
        if (/<img/i.test(m[1])) continue;
        let line = unescapeHtml(decode(m[1].replace(/<[^>]+>/g, ""))).trim();
        if (line) paragraphs.push(line);
    }
    let html = "";
    let chars = 0;
    for (let i = 0; i < paragraphs.length; i++) {
        html += "<p>" + escapeHtml(paragraphs[i]) + "</p>";
        chars += paragraphs[i].length;
    }

    // Trang chỉ trả bản xem trước (~200 ký tự) cho khách ở các chương sau.
    let words = parseInt(chapter.chapterWordNumber) || 0;
    if (words > 0 && chars < words * 0.6) {
        return Response.error("Fanqie chỉ cho khách đọc vài chương đầu của mỗi truyện (chương này mới có " + chars + "/" + words + " chữ). Hãy đăng nhập fanqienovel.com trên trình duyệt, lấy cookie rồi dán vào mục \"Cookie đăng nhập\" trong cài đặt extension.");
    }
    return Response.success(html, "");
}

function readChapter(itemId) {
    let response = htmlFetch("/reader/" + itemId);
    if (!response.ok) return null;
    let state = parseState(response.text());
    if (state && isPreview(state) && usePastedCookies()) {
        response = htmlFetch("/reader/" + itemId);
        if (response.ok) state = parseState(response.text()) || state;
    }
    return state;
}

function isPreview(state) {
    let c = state.reader && state.reader.chapterData;
    return !!c && String(c.content || "").length < 400 && parseInt(c.chapterWordNumber) > 600;
}
