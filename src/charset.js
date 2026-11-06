// Fanqie chống sao chép bằng font riêng: ký tự U+E3E8 + i hiển thị thành chữ thật khác nhau tuỳ nơi.
// CHARSET_PAGE: văn bản trong trang truyện / trang chương. Dựng bằng cách đối chiếu glyph của font
//   awesome-font/c/dc027189e0ba4cd.woff2 với font CJK chuẩn rồi đối chiếu bảng charset.json của
//   ying-ck/fanqienovel-downloader (khớp 344/362 glyph, phần lệch chỉ là các cặp chữ gần giống như 日/曰, I/l).
// CHARSET_LIST: văn bản trong API thư viện (tên truyện, tác giả, giới thiệu). Bảng khác hẳn; suy ra từ
//   hơn 3000 cặp chữ (API so với trang truyện), không có xung đột. 13 vị trí chưa gặp mẫu để dấu □.
const CHARSET_START = 0xE3E8;
const CHARSET_PAGE = "D在主特家军然表场4要只v和□6别还g现儿岁□□此象月3出战工相o男直失世F都平文什VO将真T那当□会立些u是十张学气大爱两命全后东性通被1它乐接而感车山公了常以何可话先pi叫轻M士w着变尔快l个说少色里安花远7难师放t报认面道S□克地度I好机U民写把万同水新没书电吃像斯5为y白几日教看但第加候作上拉住有法r事应位利你声身国问马女他Y比父xAHNsX边美对所金活回意到z从j知又内因点Q三定8Rb正或夫向德听更□得告并本q过记L让打f人就者去原满体做经K走如孩cG给使物□最笑部□员等受k行一条果动光门头见往自解成处天能于名其发总母的死手入路进心来h时力多开已许d至由很界n小与Z想代么分生口再妈望次西风种带J□实情才这□E我神格长觉间年眼无不亲关结0友信下却重己老2音字m呢明之前高PB目太e9起稜她也W用方子英每理便四数期中C外样a海们任";
const CHARSET_LIST = "体y十现快便话却月物水的放知爱万□表风理O老也p常克平几最主她s将法情o光a我呢J员太每望受教w利军已U人如变得要少斯门电m男没AK国时中走么何口小向问轻Td神下间车fG度D又大面远就写j给通起实E□它去S到道数吃们加P是无把事西多界□发新外活解孩只作前□尔经□u心告父等Q民全这9果安□i母8r说任先和地C张战场g像c□你使□样总目x性处音头□应乐关能花l当名手4重字声力友然生代内里本回真入师象□0点R亲V种动英命ZhX做特边高有B为期自年马认出接至H正方感所明者□F住学还分意更其n但比觉以由死家让失士L2I金叫身报听W再原山海白很见5直位第工个开岁好用都于可同3次四□日信与女笑满并部什不从或机此□了记三e些bN夫会才儿眼两美被一公来立z长对己看k许因相色后往打结格过世气7子条在书之定v拉成进带着东上想天他妈1文而路那别德6Mt行候难";
