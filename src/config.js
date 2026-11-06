load('charset.js');

// Fanqie (番茄小说): trang SSR, dữ liệu nằm trong window.__INITIAL_STATE__; thư viện/danh mục có JSON API công khai.
let BASE_URL = "https://fanqienovel.com";
try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (error) {
}

// Khách chỉ đọc đủ vài chương đầu của mỗi truyện; chương sau cần phiên đăng nhập. Dán chuỗi cookie
// (name=value; name2=value2) lấy từ trình duyệt đã đăng nhập vào cài đặt COOKIE để nạp vào kho cookie vBook.
let LOGIN_COOKIE = "";
try {
    if (COOKIE) {
        LOGIN_COOKIE = String(COOKIE).trim();
    }
} catch (error) {
}

// Máy chủ proxy bên thứ ba trả nội dung chương theo id (GET /content?item_id=), dùng cho chương khách không đọc được.
// Để trống để chỉ đọc qua trang chính thức. Chỉ id chương được gửi đi.
let PROXY_URL = "https://gofq.52dns.cc";
try {
    if (typeof PROXY !== "undefined") {
        PROXY_URL = String(PROXY).trim().replace(/\/+$/, "");
    }
} catch (error) {
}

const PAGE_SIZE = 18;

function normalizeUrl(url) {
    return url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
}

function getParam(url, name) {
    let m = new RegExp("[?&]" + name + "=([^&#]*)").exec(url);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
}

// Id truyện từ /page/<id>, id chương từ /reader/<id>; cũng nhận chuỗi số trần.
function bookIdFrom(url) {
    let m = /\/(?:page|book)\/(\d+)/.exec(url) || /^\s*(\d{10,})\s*$/.exec(url);
    return m ? m[1] : "";
}

function itemIdFrom(url) {
    let m = /\/reader\/(\d+)/.exec(url);
    return m ? m[1] : "";
}

// Thay ký tự vùng riêng (PUA) do font chống sao chép của trang tạo ra bằng chữ thật.
// fromList: true cho văn bản lấy từ API thư viện (bảng mã khác với trang truyện/chương).
function decode(text, fromList) {
    text = String(text || "");
    let table = fromList ? CHARSET_LIST : CHARSET_PAGE;
    let out = "";
    for (let i = 0; i < text.length; i++) {
        let code = text.charCodeAt(i);
        let k = code - CHARSET_START;
        if (k >= 0 && k < table.length) {
            out += table.charAt(k);
        } else {
            out += text.charAt(i);
        }
    }
    return out;
}

function escapeHtml(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function unescapeHtml(text) {
    return String(text)
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");
}

// Nạp các cặp name=value trong COOKIE vào kho cookie của vBook; trả true nếu có thay đổi.
function usePastedCookies() {
    let text = LOGIN_COOKIE.replace(/^\s*cookie\s*:/i, "").trim();
    if (!text) return false;
    let current = "";
    try {
        current = String(localCookie.getCookie() || "");
    } catch (error) {
    }
    let changed = false;
    let parts = text.split(";");
    for (let i = 0; i < parts.length; i++) {
        let pair = parts[i].trim();
        let eq = pair.indexOf("=");
        if (eq <= 0) continue;
        if (current.indexOf(pair) !== -1) continue;
        try {
            localCookie.setCookie(pair + "; path=/");
            changed = true;
        } catch (error) {
        }
    }
    return changed;
}

function htmlFetch(path) {
    return fetch(path.indexOf("http") === 0 ? path : BASE_URL + path, {
        headers: { "Accept": "text/html,application/xhtml+xml", "Accept-Language": "zh-CN,zh;q=0.9" }
    });
}

function apiFetch(path) {
    return fetch(BASE_URL + path, { headers: { "Accept": "application/json" } });
}

// Lấy đối tượng window.__INITIAL_STATE__ từ HTML; trong chuỗi JSON dấu xuống dòng luôn được escape nên "};\n" đầu tiên là chỗ kết thúc.
function parseState(html) {
    let marker = "window.__INITIAL_STATE__=";
    let start = html.indexOf(marker);
    if (start === -1) return null;
    start += marker.length;
    let end = html.indexOf("};\n", start);
    if (end === -1) return null;
    try {
        return JSON.parse(html.substring(start, end + 1).replace(/:undefined/g, ":null"));
    } catch (error) {
        return null;
    }
}

function bookLink(id) {
    return "/page/" + id;
}

function coverUrl(url) {
    return String(url || "").replace(/^http:/, "https:");
}

// query: chuỗi lọc, vd "sort=1&cat=747&status=0". Trả { error } hoặc { items, hasMore }.
function fetchBooks(query, page) {
    page = parseInt(page) || 1;
    query = "?" + query;
    let sort = getParam(query, "sort") || "0";
    let cat = getParam(query, "cat") || "-1";
    let status = getParam(query, "status") || "-1";
    let path = "/api/author/library/book_list/v0/?page_count=" + PAGE_SIZE + "&page_index=" + (page - 1)
        + "&gender=-1&category_id=" + encodeURIComponent(cat) + "&creation_status=" + encodeURIComponent(status)
        + "&word_count=-1&book_type=-1&sort=" + encodeURIComponent(sort);

    let response = apiFetch(path);
    if (!response.ok) return { error: "HTTP " + response.status };
    let json = response.json();
    if (json.code !== 0) return { error: json.message || "Lỗi API" };
    let data = json.data || {};
    let books = data.book_list || [];

    let items = [];
    for (let i = 0; i < books.length; i++) {
        items.push(bookItem(books[i]));
    }
    return { items: items, hasMore: !!data.has_more && books.length > 0 };
}

function listBooks(query, page) {
    page = parseInt(page) || 1;
    let result = fetchBooks(query, page);
    if (result.error) return Response.error(result.error);
    return Response.success(result.items, result.hasMore ? String(page + 1) : "");
}

function bookItem(b) {
    let info = [];
    if (b.author) info.push(decode(b.author, true));
    if (b.word_count && /^\d+$/.test(b.word_count)) info.push(Math.round(b.word_count / 1000) / 10 + " vạn chữ");
    return {
        name: decode(b.book_name, true),
        cover: coverUrl(b.thumb_url),
        link: bookLink(b.book_id),
        description: info.join(" · "),
        tag: b.creation_status === 0 ? "完结" : "",
        host: BASE_URL
    };
}
