load('config.js');

function execute(url) {
    let itemId = itemIdFrom(url);
    if (!itemId) return Response.error("Link chương không hợp lệ: " + url);

    // 1. Trang chính thức: đủ nội dung cho vài chương đầu của mỗi truyện.
    let state = readChapter(itemId);
    let chapter = state && state.reader && state.reader.chapterData;
    if (chapter && chapter.content && !isPreview(state)) {
        let html = toHtml(parseParagraphs(chapter.content, false));
        if (html) return Response.success(html, "");
    }

    // 2. Các chương sau cần đăng nhập: lấy qua máy chủ proxy bên thứ ba (cài đặt PROXY), chỉ gửi id chương.
    if (PROXY_URL) {
        let result = proxyChapter(itemId);
        if (result.error) return Response.error(result.error);
        return Response.success(result.html, "");
    }

    if (!chapter) return Response.error("Không đọc được trang chương " + itemId);
    return Response.error("Fanqie chỉ cho khách đọc vài chương đầu của mỗi truyện. Hãy điền \"Máy chủ nội dung\" hoặc cookie đăng nhập trong cài đặt extension.");
}

// Tách các thẻ <p> thành danh sách dòng chữ; bỏ đoạn chứa ảnh. fromList: văn bản có thể dùng bảng mã của API.
function parseParagraphs(content, fromList) {
    let paragraphs = [];
    let re = /<p[^>]*>([\s\S]*?)<\/p>/g;
    let m;
    while ((m = re.exec(content)) !== null) {
        if (/<img/i.test(m[1])) continue;
        let line = unescapeHtml(decode(m[1].replace(/<[^>]+>/g, ""), fromList)).trim();
        if (line) paragraphs.push(line);
    }
    if (paragraphs.length === 0) {
        let raw = unescapeHtml(decode(String(content).replace(/<[^>]+>/g, ""), fromList)).trim();
        if (raw) paragraphs = raw.split(/\r?\n+/);
    }
    return paragraphs;
}

function toHtml(paragraphs) {
    let html = "";
    for (let i = 0; i < paragraphs.length; i++) {
        let line = paragraphs[i].trim();
        if (line) html += "<p>" + escapeHtml(line) + "</p>";
    }
    return html;
}

function proxyChapter(itemId) {
    let response = fetch(PROXY_URL + "/content?item_id=" + itemId, { timeout: 20000 });
    if (response && response.status >= 500 && response.status < 600) {
        response = fetch(PROXY_URL + "/content?item_id=" + itemId, { timeout: 20000 });
    }
    if (!response || !response.ok) {
        return { error: "Máy chủ nội dung lỗi (HTTP " + (response ? response.status : "?") + "). Thử lại sau hoặc đổi địa chỉ trong cài đặt." };
    }
    let json;
    try {
        json = response.json();
    } catch (error) {
        return { error: "Máy chủ nội dung trả dữ liệu không hợp lệ" };
    }
    let content = json && json.code === 0 && json.data ? (json.data.content || json.data.text || "") : "";
    if (!content) return { error: "Máy chủ nội dung không có chương này" };
    let html = toHtml(parseParagraphs(content, true));
    if (!html) return { error: "Nội dung chương trống" };
    return { html: html };
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

// Trang chỉ trả bản xem trước (~200 ký tự) cho khách ở các chương sau.
function isPreview(state) {
    let c = state.reader && state.reader.chapterData;
    return !!c && String(c.content || "").length < 400 && parseInt(c.chapterWordNumber) > 600;
}
