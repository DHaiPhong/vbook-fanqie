// Fanqie chống sao chép bằng font riêng: ký tự U+E3E8 + i hiển thị thành chữ thật khác nhau tuỳ nơi.
// CHARSET_PAGE: văn bản trong trang truyện / trang chương. Dựng bằng cách đối chiếu glyph của font
//   awesome-font/c/dc027189e0ba4cd.woff2 với font CJK chuẩn rồi đối chiếu bảng charset.json của
//   ying-ck/fanqienovel-downloader (khớp 344/362 glyph, phần lệch chỉ là các cặp chữ gần giống như 日/曰, I/l).
// CHARSET_LIST: văn bản trong API thư viện (tên truyện, tác giả, giới thiệu). Bảng khác hẳn; suy ra từ
//   hơn 3000 cặp chữ (API so với trang truyện), không có xung đột. 13 vị trí chưa gặp mẫu để dấu □.
const CHARSET_START = 0xE3E8;
const CHARSET_PAGE = "D在主特家军然表场4要只v和□6别还g现儿岁□□此象月3出战工相o男直失世F都平文什VO将真T那当□会立些u是十张学气大爱两命全后东性通被1它乐接而感车山公了常以何可话先pi叫轻M士w着变尔快l个说少色里安花远7难师放t报认面道S□克地度I好机U民写把万同水新没书电吃像斯5为y白几日教看但第加候作上拉住有法r事应位利你声身国问马女他Y比父xAHNsX边美对所金活回意到z从j知又内因点Q三定8Rb正或夫向德听更□得告并本q过记L让打f人就者去原满体做经K走如孩cG给使物□最笑部□员等受k行一条果动光门头见往自解成处天能于名其发总母的死手入路进心来h时力多开已许d至由很界n小与Z想代么分生口再妈望次西风种带J□实情才这□E我神格长觉间年眼无不亲关结0友信下却重己老2音字m呢明之前高PB目太e9起稜她也W用方子英每理便四数期中C外样a海们任";
const CHARSET_LIST = "体y十现快便话却月物水的放知爱万□表风理O老也p常克平几最主她s将法情o光a我呢J员太每望受教w利军已U人如变得要少斯门电m男没AK国时中走么何口小向问轻Td神下间车fG度D又大面远就写j给通起实E□它去S到道数吃们加P是无把事西多界□发新外活解孩只作前□尔经□u心告父等Q民全这9果安□i母8r说任先和地C张战场g像c□你使□样总目x性处音头□应乐关能花l当名手4重字声力友然生代内里本回真入师象□0点R亲V种动英命ZhX做特边高有B为期自年马认出接至H正方感所明者□F住学还分意更其n但比觉以由死家让失士L2I金叫身报听W再原山海白很见5直位第工个开岁好用都于可同3次四□日信与女笑满并部什不从或机此□了记三e些bN夫会才儿眼两美被一公来立z长对己看k许因相色后往打结格过世气7子条在书之定v拉成进带着东上想天他妈1文而路那别德6Mt行候难";

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

const BASE_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

function htmlFetch(path) {
    return fetch(path.indexOf("http") === 0 ? path : BASE_URL + path, {
        headers: { "User-Agent": BASE_UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "zh-CN,zh;q=0.9" }
    });
}

function apiFetch(path) {
    return fetch(BASE_URL + path, { headers: { "User-Agent": BASE_UA, "Accept": "application/json" } });
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
    let json = null;
    try {
        json = response.json();
    } catch (error) {
    }
    // Fanqie trả 200 rỗng khi chặn tạm một địa chỉ vì gửi quá nhiều yêu cầu.
    if (!json) return { error: "Fanqie trả phản hồi rỗng (có thể đang chặn tạm vì quá nhiều yêu cầu). Thử lại sau vài phút." };
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
