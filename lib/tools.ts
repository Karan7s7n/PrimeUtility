import type { CategoryId, Locale } from "./site";

export interface ToolCopy {
  name: string;
  tagline: string;
  h1: string;
  description: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  howTo: string[];
  faq: { q: string; a: string }[];
  examples: string[];
}

export interface Tool {
  slug: string;
  category: CategoryId;
  icon: string;
  gradient: string;
  popular?: boolean;
  /** Everything runs in the browser in v1 — kept as data so server tools can be flagged later. */
  processing: "client" | "server";
  copy: Record<Locale, ToolCopy>;
}

export const tools: Tool[] = [
  {
    slug: "json-formatter",
    category: "developer",
    icon: "braces",
    gradient: "from-brand-600 to-accent-600",
    popular: true,
    processing: "client",
    copy: {
      en: {
        name: "JSON Formatter",
        tagline: "Format, validate and minify JSON instantly.",
        h1: "JSON Formatter & Validator",
        description:
          "Paste raw JSON and get it pretty-printed, minified or validated in one click. Errors come back with the exact line and column that broke.",
        seoTitle: "JSON Formatter, Validator & Minifier — Free Online",
        metaDescription:
          "Free online JSON formatter and validator. Pretty-print, minify, validate and download JSON with clear error messages. Runs in your browser, nothing is uploaded.",
        keywords: [
          "json formatter",
          "json validator",
          "json beautifier",
          "json minify",
          "format json online",
        ],
        howTo: [
          "Paste your JSON into the left box, or drop a .json file onto the page.",
          "Press Format to pretty-print it, Minify to strip every space, or Validate to check it only.",
          "If the JSON is invalid, the exact line and column of the problem is highlighted.",
          "Copy the result or download it as a .json file.",
        ],
        faq: [
          {
            q: "Is my JSON sent to a server?",
            a: "No. The formatter runs entirely in your browser using JavaScript, so your data never leaves your device — safe for API responses and config files with secrets.",
          },
          {
            q: "Why does valid JSON still show an error?",
            a: "The most common causes are trailing commas, single quotes instead of double quotes, unquoted keys and comments. All three are invalid in strict JSON and are reported with their position.",
          },
          {
            q: "How large a file can it handle?",
            a: "Anything up to roughly 20 MB works comfortably in a modern browser. Larger files depend on your device's memory more than on the tool.",
          },
        ],
        examples: [
          '{"id":1,"name":"Laptop","tags":["new","sale"]}',
          '{ "nested": { "ok": true, "list": [1, 2, 3] } }',
        ],
      },
      ar: {
        name: "منسّق JSON",
        tagline: "تنسيق وفحص وتصغير ملفات JSON فورًا.",
        h1: "منسّق ومدقّق JSON",
        description:
          "الصق JSON خام واحصل على تنسيق مرتب أو نسخة مصغّرة أو تحقق فوري بضغطة واحدة، مع رسالة خطأ تحدد السطر والعمود بالضبط.",
        seoTitle: "منسّق ومدقّق JSON أونلاين — مجانًا",
        metaDescription:
          "أداة مجانية لتنسيق JSON والتحقق منه وتصغيره. تنسيق مرتب، تصغير، كشف الأخطاء بموقعها، نسخ وتحميل. تعمل داخل المتصفح ولا ترفع بياناتك.",
        keywords: [
          "منسق json",
          "فحص json",
          "تنسيق json اونلاين",
          "تصغير json",
          "json validator عربي",
        ],
        howTo: [
          "الصق نص JSON في الصندوق، أو اسحب ملف ‎.json‎ وأفلته في الصفحة.",
          "اضغط «تنسيق» لترتيبه، أو «تصغير» لإزالة كل المسافات، أو «فحص» للتحقق فقط.",
          "إذا كان الملف غير صحيح، يُحدَّد السطر والعمود الذي به الخطأ بدقة.",
          "انسخ النتيجة أو حمّلها كملف ‎.json‎.",
        ],
        faq: [
          {
            q: "هل تُرسل بياناتي إلى خادم؟",
            a: "لا. الأداة تعمل بالكامل داخل متصفحك، فلا يخرج أي نص من جهازك — وهذا يجعلها آمنة لاستجابات الـAPI وملفات الإعدادات التي تحتوي مفاتيح.",
          },
          {
            q: "لماذا يظهر خطأ في ملف JSON يبدو صحيحًا؟",
            a: "أشهر الأسباب: فاصلة زائدة قبل القوس الأخير، علامات تنصيص مفردة، مفاتيح بدون تنصيص، أو تعليقات. كل هذه غير مسموح بها في JSON الصارم، والأداة تحدد موضعها.",
          },
          {
            q: "ما أقصى حجم ملف تدعمه؟",
            a: "حتى نحو 20 ميجابايت يعمل بسلاسة في المتصفحات الحديثة، وما فوق ذلك يعتمد على ذاكرة جهازك أكثر من الأداة نفسها.",
          },
        ],
        examples: [
          '{"id":1,"name":"حاسوب","tags":["جديد","تخفيض"]}',
          '{ "nested": { "ok": true, "list": [1, 2, 3] } }',
        ],
      },
    },
  },
  {
    slug: "jwt-decoder",
    category: "developer",
    icon: "key-round",
    gradient: "from-indigo-600 to-blue-600",
    popular: true,
    processing: "client",
    copy: {
      en: {
        name: "JWT Decoder",
        tagline: "Read the header and payload of any token.",
        h1: "JWT Decoder",
        description:
          "Paste a JSON Web Token to inspect its header and payload in readable JSON, with issued-at and expiry dates converted to real times.",
        seoTitle: "JWT Decoder — Read Header & Payload of a Token Online",
        metaDescription:
          "Decode a JWT online: read the header and payload, see exp and iat as readable dates. Runs locally in your browser — the token is never uploaded.",
        keywords: ["jwt decoder", "decode jwt", "jwt parser", "jwt exp iat check", "فك jwt"],
        howTo: [
          "Paste the token (with or without the Bearer prefix).",
          "Read the decoded header, payload and the raw signature.",
          "Check the expiry line: green means the token is still valid, red means it has expired.",
          "Copy any of the three parts with a single click.",
        ],
        faq: [
          {
            q: "Does this verify the signature?",
            a: "No — and be careful with any tool that claims to without your key. Decoding only means the token's contents are readable by anyone; verifying proves the issuer signed it. Always verify server-side with your secret or public key.",
          },
          {
            q: "Is it safe to paste a real token here?",
            a: "The decoding happens in your browser with no network request, so the token is not transmitted anywhere. Still, a production token is a password-like credential — treat it that way and prefer test tokens.",
          },
          {
            q: "What do exp and iat mean?",
            a: "iat is the moment the token was issued and exp is the moment it stops being accepted, both as Unix timestamps in seconds. The tool shows them as readable date and time, plus how long is left.",
          },
        ],
        examples: [
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature",
        ],
      },
      ar: {
        name: "فاكّ JWT",
        tagline: "اقرأ رأس وحمولة أي توكن.",
        h1: "فاكّ رموز JWT",
        description:
          "الصق توكن JWT لتقرأ رأسه وحمولته بصيغة JSON مرتبة، مع تحويل تاريخَي الإصدار والانتهاء إلى وقت مقروء.",
        seoTitle: "فاكّ JWT — قراءة رأس وحمولة التوكن أونلاين",
        metaDescription:
          "فك توكن JWT أونلاين: اقرأ الرأس والحمولة، واعرف exp و iat كتاريخ مقروء. تعمل محليًا في المتصفح ولا يُرفع التوكن إلى أي خادم.",
        keywords: ["فك jwt", "jwt decoder بالعربي", "قراءة توكن", "تاريخ انتهاء التوكن", "decode jwt"],
        howTo: [
          "الصق التوكن، مع كلمة Bearer أو بدونها.",
          "اقرأ الرأس والحمولة مفكوكين، وكذلك التوقيع الخام.",
          "راجع سطر الانتهاء: الأخضر يعني أنه ما زال صالحًا، والأحمر يعني أنه منتهٍ.",
          "انسخ أي جزء من الأجزاء الثلاثة بضغطة واحدة.",
        ],
        faq: [
          {
            q: "هل تتحقق الأداة من التوقيع؟",
            a: "لا، وهذه نقطة مهمة: فك التوكن يعني فقط أن محتواه قابل للقراءة من أي شخص. التحقق من التوقيع هو ما يثبت أن الجهة المُصدرة وقّعته، ويجب أن يتم على الخادم بمفتاحك السري أو العام.",
          },
          {
            q: "هل من الآمن لصق توكن حقيقي هنا؟",
            a: "الفك يحدث داخل متصفحك دون أي طلب شبكة، فلا يُرسل التوكن إلى أي مكان. ومع ذلك، التوكن في الإنتاج يشبه كلمة مرور، لذا يُفضّل استخدام توكن اختباري.",
          },
          {
            q: "ما معنى exp و iat؟",
            a: "‏iat هو لحظة إصدار التوكن، و exp هو اللحظة التي يتوقف فيها قبوله، وكلاهما بطابع زمني بالثواني. الأداة تعرضهما كتاريخ ووقت مقروءين مع الوقت المتبقي.",
          },
        ],
        examples: [
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature",
        ],
      },
    },
  },
  {
    slug: "regex-tester",
    category: "developer",
    icon: "regex",
    gradient: "from-violet-600 to-fuchsia-600",
    processing: "client",
    copy: {
      en: {
        name: "Regex Tester",
        tagline: "Test patterns, matches and groups live.",
        h1: "Regex Tester",
        description:
          "Write a regular expression and watch matching happen as you type. See every match, its numbered groups and its exact position in the text.",
        seoTitle: "Regex Tester Online — Test Regular Expressions Live",
        metaDescription:
          "Test regular expressions online with live highlighting, match positions, capture groups and flag support (g, i, m, s, u). Includes ready-made examples and clear error messages.",
        keywords: ["regex tester", "regular expression tester", "test regex online", "regex groups"],
        howTo: [
          "Type your pattern, then pick the flags you need (g, i, m, s, u).",
          "Paste the text you want to test against.",
          "Matches are highlighted in the text and listed below with their positions.",
          "Use a ready-made example to see how a pattern is built.",
        ],
        faq: [
          {
            q: "Which flavour of regex is this?",
            a: "JavaScript (ECMAScript) regular expressions, exactly the engine your browser and Node.js use. Python or PCRE syntax differs slightly in some constructs.",
          },
          {
            q: "Why do I get zero matches?",
            a: "Usually the global flag is off in a pattern written for a single match, an unescaped dot or a greedy quantifier is eating too much, or the text really does not match. Anchors (^ and $) with the multiline flag are another frequent cause.",
          },
          {
            q: "Can I see capture groups?",
            a: "Yes. Each match lists its numbered groups, and named groups appear under their name. Empty groups are shown as empty values rather than hidden.",
          },
        ],
        examples: [
          "Email: [\\w.+-]+@[\\w-]+\\.[\\w.]+",
          "URL: https?://[^\\s]+",
          "Date (YYYY-MM-DD): \\d{4}-\\d{2}-\\d{2}",
          "Hex colour: #[0-9a-fA-F]{3,6}",
        ],
      },
      ar: {
        name: "مختبر Regex",
        tagline: "اختبر الأنماط والمطابقات والمجموعات مباشرة.",
        h1: "مختبر التعبيرات النمطية (Regex)",
        description:
          "اكتب التعبير النمطي وشاهد المطابقة تحدث أثناء الكتابة، مع كل المطابقات ومجموعاتها وموضعها الدقيق في النص.",
        seoTitle: "مختبر Regex أونلاين — اختبار التعبيرات النمطية",
        metaDescription:
          "اختبر التعبيرات النمطية أونلاين مع تمييز مباشر للمطابقات، وعرض مواضعها ومجموعاتها، ودعم الأعلام g و i و m و s و u، مع أمثلة جاهزة ورسائل خطأ واضحة.",
        keywords: ["اختبار regex", "التعبيرات النمطية", "regex عربي", "test regex online"],
        howTo: [
          "اكتب النمط، ثم اختر الأعلام التي تحتاجها (g، i، m، s، u).",
          "الصق النص المراد اختباره.",
          "تُعلَّم المطابقات داخل النص وتُعرض في قائمة أسفله مع مواضعها.",
          "استخدم أحد الأمثلة الجاهزة لفهم طريقة بناء النمط.",
        ],
        faq: [
          {
            q: "ما نوع Regex المدعوم؟",
            a: "تعبيرات JavaScript (ECMAScript)، وهي نفس المحرك المستخدم في المتصفح وNode.js. صيغة Python أو PCRE تختلف قليلًا في بعض التراكيب.",
          },
          {
            q: "لماذا لا أجد أي مطابقة؟",
            a: "أكثر الأسباب: نسيان العلم g عند توقع نتائج متعددة، أو نقطة غير مُهرَّبة، أو استخدام مُكمِّم يجرف أكثر من المطلوب، أو أن النص فعلًا لا يطابق. كما أن استخدام ^ و $ مع العلم m يسبب لبسًا شائعًا.",
          },
          {
            q: "هل تظهر مجموعات الالتقاط؟",
            a: "نعم. كل مطابقة تعرض مجموعاتها المرقّمة، والمجموعات المُسمّاة تظهر باسمها. المجموعات الفارغة تظهر كقيم فارغة بدل إخفائها.",
          },
        ],
        examples: [
          "البريد الإلكتروني: [\\w.+-]+@[\\w-]+\\.[\\w.]+",
          "الرابط: https?://[^\\s]+",
          "التاريخ (YYYY-MM-DD): \\d{4}-\\d{2}-\\d{2}",
          "لون hex: #[0-9a-fA-F]{3,6}",
        ],
      },
    },
  },
  {
    slug: "qr-code-generator",
    category: "image",
    icon: "qr-code",
    gradient: "from-cyan-500 to-sky-600",
    popular: true,
    processing: "client",
    copy: {
      en: {
        name: "QR Code Generator",
        tagline: "Links, text, email, phone and Wi-Fi QR codes.",
        h1: "QR Code Generator",
        description:
          "Turn a link, text, email, phone number or Wi-Fi network into a QR code you can download as PNG or SVG at any size.",
        seoTitle: "QR Code Generator — Free PNG & SVG QR Codes",
        metaDescription:
          "Generate QR codes for links, text, email, phone calls and Wi-Fi networks. Download high-resolution PNG or scalable SVG instantly. Free, no sign-up, generated in your browser.",
        keywords: ["qr code generator", "qr code png", "wifi qr code", "generate qr code online", "مولد qr"],
        howTo: [
          "Pick what the code should contain: link, text, email, phone or Wi-Fi.",
          "Fill in the fields — the code refreshes as you type.",
          "Choose the size and the error-correction level (higher tolerance survives printing or scratches).",
          "Download the PNG for quick use or the SVG for print and design work.",
        ],
        faq: [
          {
            q: "Do these QR codes expire?",
            a: "No. The code is generated from your content directly in the browser, so it is a plain static QR code — no redirect service, no expiry, and nothing stored on our side.",
          },
          {
            q: "Which error-correction level should I choose?",
            a: "Level M is a good default for screens. Use Q or H when the code will be printed small, placed on a curved surface or likely to get dirty — it survives more damage but makes the pattern denser.",
          },
          {
            q: "Why does a Wi-Fi QR code ask for the network name exactly?",
            a: "Phones join the network with the exact SSID, and the hidden-network flag must be off for the code to work on most devices. The password is embedded in the code, so only share it with people you want on the network.",
          },
        ],
        examples: [
          "https://example.com",
          "WIFI:T:WPA;S:MyNetwork;P:my-password;;",
          "mailto:hello@example.com?subject=Hi",
        ],
      },
      ar: {
        name: "مولّد رموز QR",
        tagline: "روابط ونصوص وبريد وهاتف وشبكات واي فاي.",
        h1: "مولّد رموز QR",
        description:
          "حوّل رابطًا أو نصًا أو بريدًا أو رقم هاتف أو شبكة واي فاي إلى رمز QR قابل للتحميل بصيغة PNG أو SVG وبأي مقاس.",
        seoTitle: "مولّد QR — رموز QR مجانية بصيغة PNG و SVG",
        metaDescription:
          "أنشئ رموز QR للروابط والنصوص والبريد والهاتف وشبكات الواي فاي، وحمّلها بدقة عالية PNG أو SVG متجهي. مجاني بدون تسجيل ويُولَّد داخل متصفحك.",
        keywords: ["مولد qr", "رمز qr", "qr واي فاي", "انشاء qr اونلاين", "qr code png"],
        howTo: [
          "اختر نوع المحتوى: رابط، نص، بريد، هاتف، أو شبكة واي فاي.",
          "املأ الحقول، ويتحدّث الرمز فورًا أثناء الكتابة.",
          "حدّد المقاس ومستوى تصحيح الأخطاء (المستوى الأعلى يتحمل الخدوش والطباعة الصغيرة).",
          "حمّل PNG للاستخدام السريع، أو SVG للطباعة والتصميم.",
        ],
        faq: [
          {
            q: "هل تنتهي صلاحية هذه الرموز؟",
            a: "لا. الرمز يُولَّد من محتواك مباشرة داخل المتصفح، فهو رمز ساكن بسيط: بلا خدمة توجيه، وبلا تاريخ انتهاء، وبلا تخزين عندنا.",
          },
          {
            q: "أي مستوى لتصحيح الأخطاء أختار؟",
            a: "المستوى M مناسب لأغلب الاستخدامات على الشاشات. اختر Q أو H إذا كان الرمز سيُطبع صغيرًا أو على سطح منحنٍ أو معرضًا للتلطخ، فهو يتحمل تلفًا أكبر لكن يجعل النمط أكثر كثافة.",
          },
          {
            q: "لماذا يجب كتابة اسم الشبكة بدقة في رمز الواي فاي؟",
            a: "الهاتف يتصل بالشبكة عبر اسم SSID الحقيقي تمامًا، ويجب أن يكون خيار «شبكة مخفية» متوقفًا ليعمل الرمز على أغلب الأجهزة. وكلمة مرور الشبكة تُدمج في الرمز، لذا شاركه فقط مع من تثق به.",
          },
        ],
        examples: [
          "https://example.com",
          "WIFI:T:WPA;S:MyNetwork;P:my-password;;",
          "mailto:hello@example.com?subject=مرحبا",
        ],
      },
    },
  },
  {
    slug: "image-compressor",
    category: "image",
    icon: "shrink",
    gradient: "from-sky-500 to-blue-600",
    popular: true,
    processing: "client",
    copy: {
      en: {
        name: "Image Compressor",
        tagline: "Shrink JPG, PNG and WebP without losing quality.",
        h1: "Image Compressor",
        description:
          "Reduce the file size of your images with a quality slider, and see exactly how many kilobytes you saved before you download.",
        seoTitle: "Image Compressor — Compress JPG, PNG & WebP Online",
        metaDescription:
          "Compress JPG, PNG and WebP images online for free. Control quality and maximum width, compare before and after sizes, download instantly. Compression happens in your browser.",
        keywords: ["image compressor", "compress jpg", "compress png online", "reduce image size", "ضغط الصور"],
        howTo: [
          "Drop one or more images (JPG, PNG, WebP) onto the page.",
          "Set the quality level — 70–80% is usually invisible to the eye.",
          "Optionally set a maximum width to resize while compressing.",
          "Check the before/after size, then download each image or all of them.",
        ],
        faq: [
          {
            q: "Are my photos uploaded anywhere?",
            a: "No. Reading, resizing and re-encoding all happen in your browser using the canvas API, which is also why the tool is so fast and works offline once loaded.",
          },
          {
            q: "Why did PNG barely get smaller?",
            a: "PNG is a lossless format, so a quality slider cannot do much for it. For photos, re-encoding to JPEG or WebP gives a dramatic reduction — use the Image Converter for that.",
          },
          {
            q: "Does compressing remove metadata?",
            a: "Yes. Re-encoding through the canvas drops EXIF data such as camera model and GPS location. That is usually desirable for web images, and it also strips the rotation flag, so orientation is baked in correctly first.",
          },
        ],
        examples: ["A 4 MB phone photo at 75% quality usually lands around 300–600 KB."],
      },
      ar: {
        name: "ضاغط الصور",
        tagline: "قلّل حجم JPG و PNG و WebP دون خسارة ملحوظة.",
        h1: "ضاغط الصور",
        description:
          "قلّل حجم صورك بمنزلق جودة بسيط، وشاهد بالضبط كم كيلوبايت وفّرت قبل التحميل.",
        seoTitle: "ضاغط الصور — ضغط JPG و PNG و WebP أونلاين",
        metaDescription:
          "اضغط صور JPG و PNG و WebP مجانًا أونلاين. تحكّم في الجودة وأقصى عرض، وقارن الحجم قبل وبعد، وحمّل فورًا. الضغط يحدث داخل متصفحك دون رفع الملفات.",
        keywords: ["ضغط الصور", "تصغير حجم الصورة", "ضغط jpg", "ضغط png اونلاين", "image compressor"],
        howTo: [
          "أفلِت صورة أو أكثر (JPG أو PNG أو WebP) في الصفحة.",
          "اضبط مستوى الجودة، وعادةً 70–80% لا يظهر فرقها بالعين.",
          "يمكنك تحديد أقصى عرض لإعادة تحجيم الصورة أثناء الضغط.",
          "راجع الحجم قبل وبعد، ثم حمّل الصور واحدة واحدة أو كلها.",
        ],
        faq: [
          {
            q: "هل تُرفع صوري إلى أي مكان؟",
            a: "لا. القراءة وإعادة التحجيم والترميز تحدث كلها داخل متصفحك عبر canvas، ولهذا تكون الأداة سريعة وتعمل دون اتصال بعد تحميل الصفحة.",
          },
          {
            q: "لماذا لم يقل حجم ملف PNG كثيرًا؟",
            a: "صيغة PNG بلا فقدان بيانات، لذا لا يؤثر منزلق الجودة فيها كثيرًا. للصور الفوتوغرافية، التحويل إلى JPEG أو WebP يعطي انخفاضًا كبيرًا — استخدم أداة تحويل الصور.",
          },
          {
            q: "هل يزيل الضغط بيانات الصورة الوصفية؟",
            a: "نعم. إعادة الترميز عبر canvas تحذف بيانات EXIF مثل نوع الكاميرا وموقع التصوير، وهذا غالبًا مرغوب للمواقع، كما يحذف وسم اتجاه الصورة بعد تثبيت الاتجاه الصحيح.",
          },
        ],
        examples: ["صورة هاتف بحجم 4 ميجابايت عند جودة 75% تصبح عادة بين 300 و600 كيلوبايت."],
      },
    },
  },
  {
    slug: "image-converter",
    category: "image",
    icon: "repeat",
    gradient: "from-blue-600 to-indigo-600",
    processing: "client",
    copy: {
      en: {
        name: "Image Converter",
        tagline: "JPG ↔ PNG ↔ WebP in one click.",
        h1: "Image Converter (JPG, PNG, WebP)",
        description:
          "Convert images between JPG, PNG and WebP, with quality control and optional resizing. WebP output is often 30% smaller than JPEG at the same look.",
        seoTitle: "Image Converter — JPG to PNG, PNG to JPG, WebP Converter",
        metaDescription:
          "Convert images online between JPG, PNG and WebP for free. Choose quality and size, convert several files at once, download individually. No upload, runs in your browser.",
        keywords: ["image converter", "jpg to png", "png to jpg", "convert to webp", "webp to jpg", "تحويل الصور"],
        howTo: [
          "Select the images you want to convert (several at once is fine).",
          "Choose the output format: JPG, PNG or WebP.",
          "Set the quality for lossy formats and a maximum width if you need smaller files.",
          "Convert, then download each result.",
        ],
        faq: [
          {
            q: "Which format should I use for the web?",
            a: "WebP for almost everything: it is smaller than JPEG at the same visual quality and supports transparency. Keep PNG for screenshots, line art and images that need a transparent background.",
          },
          {
            q: "What happens to transparency when converting to JPG?",
            a: "JPEG has no transparency, so transparent areas are filled with white. If you need to keep a transparent background, convert to PNG or WebP.",
          },
          {
            q: "Does converting reduce quality?",
            a: "Only for lossy formats (JPG and WebP), and only as much as your quality setting allows. Converting JPG to PNG cannot bring back detail that JPEG already discarded — it just stores the current pixels losslessly.",
          },
        ],
        examples: ["A 2 MB PNG screenshot usually becomes a 150–400 KB WebP at 80% quality."],
      },
      ar: {
        name: "محوّل الصور",
        tagline: "JPG ↔ PNG ↔ WebP بضغطة واحدة.",
        h1: "محوّل الصور (JPG و PNG و WebP)",
        description:
          "حوّل الصور بين JPG و PNG و WebP مع التحكم في الجودة والحجم. صيغة WebP توفّر عادة 30% من الحجم مقارنة بـJPEG بنفس المظهر.",
        seoTitle: "محوّل الصور — JPG إلى PNG و PNG إلى JPG و WebP",
        metaDescription:
          "حوّل الصور أونلاين بين JPG و PNG و WebP مجانًا. تحكّم في الجودة والمقاس، وحوّل عدة ملفات مرة واحدة، وحمّل النتائج. بدون رفع، داخل متصفحك.",
        keywords: ["تحويل الصور", "jpg الى png", "png الى jpg", "تحويل الى webp", "محول الصور"],
        howTo: [
          "اختر الصور التي تريد تحويلها، ويمكن اختيار عدة صور مرة واحدة.",
          "حدّد الصيغة الناتجة: JPG أو PNG أو WebP.",
          "اضبط الجودة للصيغ المضغوطة، والمقاس الأقصى إذا احتجت ملفًا أصغر.",
          "نفّذ التحويل ثم حمّل كل نتيجة.",
        ],
        faq: [
          {
            q: "أي صيغة أفضل للمواقع؟",
            a: "WebP لأغلب الحالات: حجمها أقل من JPEG بنفس الجودة البصرية وتدعم الشفافية. أما PNG فتبقى الأفضل للقطات الشاشة والرسومات الخطية والصور التي تحتاج خلفية شفافة.",
          },
          {
            q: "ماذا يحدث للشفافية عند التحويل إلى JPG؟",
            a: "صيغة JPEG لا تدعم الشفافية، لذا تُملأ المناطق الشفافة باللون الأبيض. إذا احتجت الحفاظ على خلفية شفافة فحوّل إلى PNG أو WebP.",
          },
          {
            q: "هل يقلّل التحويل من جودة الصورة؟",
            a: "فقط في الصيغ المضغوطة (JPG و WebP) وبالقدر الذي تحدده أنت. أما التحويل من JPG إلى PNG فلا يعيد التفاصيل التي فقدها JPEG، بل يخزّن البكسلات الحالية دون فقدان إضافي.",
          },
        ],
        examples: ["لقطة شاشة PNG بحجم 2 ميجابايت تصبح عادة WebP بين 150 و400 كيلوبايت عند جودة 80%."],
      },
    },
  },
  {
    slug: "pdf-compressor",
    category: "pdf",
    icon: "file-down",
    gradient: "from-rose-500 to-orange-500",
    popular: true,
    processing: "client",
    copy: {
      en: {
        name: "PDF Compressor",
        tagline: "Make a PDF smaller, safely or aggressively.",
        h1: "Compress PDF Online",
        description:
          "Reduce PDF file size while keeping useful quality. Choose a safe mode that keeps text and links, or a strong mode that rebuilds pages as compressed images.",
        seoTitle: "Compress PDF Online — Reduce PDF File Size Free",
        metaDescription:
          "Compress PDF files online for free. Safe mode keeps text and links, strong mode rebuilds pages as images for maximum reduction. Compare sizes before you download. No upload, no watermark.",
        keywords: ["compress pdf", "pdf compressor", "reduce pdf size", "compress pdf online", "ضغط pdf"],
        howTo: [
          "Drop your PDF onto the page — everything stays in your browser.",
          "Pick a level: Safe re-saves the file with optimised structure, Strong re-renders each page as a compressed image.",
          "See the original and new size side by side.",
          "Download the compressed PDF and check it opens as expected.",
        ],
        faq: [
          {
            q: "How much smaller will my PDF get?",
            a: "It depends entirely on what is inside. PDFs built from scans usually shrink a lot in strong mode, while a PDF that is already well optimised may only drop a few percent in safe mode. The tool always shows both sizes before you keep the result.",
          },
          {
            q: "What is the difference between safe and strong?",
            a: "Safe keeps the original text, vectors and links, and only rebuilds the file structure with compression — searchable and selectable afterwards. Strong renders each page to an image and rebuilds the PDF, which shrinks scanned files dramatically but makes the text non-selectable.",
          },
          {
            q: "Is my document uploaded?",
            a: "No. The PDF is read and rewritten inside your browser. Nothing is transmitted, which is why this is safe for contracts, invoices and internal reports.",
          },
        ],
        examples: [
          "A 12 MB scanned PDF typically drops to 1–3 MB in strong mode.",
          "A text-only 900 KB report may drop to 750–850 KB in safe mode.",
        ],
      },
      ar: {
        name: "ضاغط PDF",
        tagline: "صغّر ملف PDF بأمان أو بقوة.",
        h1: "ضغط ملفات PDF أونلاين",
        description:
          "قلّل حجم ملف PDF مع الحفاظ على جودة مفيدة. اختر الوضع الآمن الذي يحفظ النص والروابط، أو الوضع القوي الذي يعيد بناء الصفحات كصور مضغوطة.",
        seoTitle: "ضغط PDF أونلاين — تصغير حجم ملف PDF مجانًا",
        metaDescription:
          "اضغط ملفات PDF مجانًا أونلاين. الوضع الآمن يحفظ النص والروابط، والوضع القوي يعيد بناء الصفحات كصور لأقصى تقليل. قارن الحجم قبل التحميل، بدون رفع وبدون علامة مائية.",
        keywords: ["ضغط pdf", "تصغير حجم pdf", "ضغط ملف pdf اونلاين", "reduce pdf size"],
        howTo: [
          "أفلِت ملف PDF في الصفحة، وكل شيء يبقى داخل متصفحك.",
          "اختر المستوى: «آمن» يعيد حفظ الملف ببنية محسّنة، و«قوي» يعيد رسم كل صفحة كصورة مضغوطة.",
          "قارن الحجم الأصلي بالحجم الجديد.",
          "حمّل الملف المضغوط وتأكد من فتحه بشكل صحيح.",
        ],
        faq: [
          {
            q: "كم سيقل حجم ملفي؟",
            a: "يعتمد كليًا على محتوى الملف. الملفات الممسوحة ضوئيًا تنخفض كثيرًا في الوضع القوي، أما الملف المحسّن أصلًا فقد ينخفض بنسبة قليلة في الوضع الآمن. الأداة تعرض الحجمين قبل أن تقرر الاحتفاظ بالنتيجة.",
          },
          {
            q: "ما الفرق بين الوضع الآمن والقوي؟",
            a: "الآمن يحافظ على النص والأشكال والروابط ويعيد بناء بنية الملف فقط، فيبقى النص قابلًا للبحث والتحديد. القوي يرسم كل صفحة كصورة ويعيد بناء الملف، وهذا يقلّل حجم الملفات الممسوحة بشكل كبير لكن النص يصبح غير قابل للتحديد.",
          },
          {
            q: "هل يُرفع ملفي إلى الخادم؟",
            a: "لا. يُقرأ الملف ويُعاد كتابته داخل متصفحك، ولا يُرسل أي شيء — ولهذا فهي مناسبة للعقود والفواتير والتقارير الداخلية.",
          },
        ],
        examples: [
          "ملف ممسوح 12 ميجابايت ينخفض عادة إلى 1–3 ميجابايت في الوضع القوي.",
          "تقرير نصي 900 كيلوبايت قد ينخفض إلى 750–850 كيلوبايت في الوضع الآمن.",
        ],
      },
    },
  },
  {
    slug: "merge-pdf",
    category: "pdf",
    icon: "layers",
    gradient: "from-orange-500 to-amber-500",
    popular: true,
    processing: "client",
    copy: {
      en: {
        name: "Merge PDF",
        tagline: "Combine several PDFs into one, in any order.",
        h1: "Merge PDF Files",
        description:
          "Combine multiple PDF files into a single document, rearrange them in the order you want, and download the result — with your files never leaving your device.",
        seoTitle: "Merge PDF — Combine PDF Files Online Free",
        metaDescription:
          "Merge PDF files online for free: add several PDFs, reorder them, remove the ones you do not need and download one combined document. No upload, no watermark, works on mobile.",
        keywords: ["merge pdf", "combine pdf", "join pdf files", "دمج pdf", "ضم ملفات pdf"],
        howTo: [
          "Add two or more PDF files.",
          "Reorder them with the arrows so the pages end up in the right sequence.",
          "Remove any file you added by mistake.",
          "Press Merge and download the single combined PDF.",
        ],
        faq: [
          {
            q: "Is there a limit on the number of files?",
            a: "No fixed limit from the tool — the practical ceiling is your device's memory. Merging a handful of documents up to around 100 MB in total is comfortable on a normal laptop.",
          },
          {
            q: "Does merging keep links and form fields?",
            a: "Page content, text and images are preserved. Interactive form fields are flattened, and internal links pointing to another document may not survive; bookmarks are not carried over.",
          },
          {
            q: "Can I merge password-protected PDFs?",
            a: "Not if the file requires a password to open. Remove the password first in your PDF reader, then merge here.",
          },
        ],
        examples: ["Combine an invoice, a signed contract and an appendix into one file to send."],
      },
      ar: {
        name: "دمج PDF",
        tagline: "اجمع عدة ملفات PDF في ملف واحد بأي ترتيب.",
        h1: "دمج ملفات PDF",
        description:
          "اجمع عدة ملفات PDF في مستند واحد، وأعد ترتيبها كما تريد، وحمّل النتيجة — دون أن يخرج أي ملف من جهازك.",
        seoTitle: "دمج PDF — ضم ملفات PDF أونلاين مجانًا",
        metaDescription:
          "دمج ملفات PDF أونلاين مجانًا: أضف عدة ملفات، وأعد ترتيبها، واحذف ما لا تحتاجه، ثم حمّل مستندًا واحدًا. بدون رفع وبدون علامة مائية ويعمل على الهاتف.",
        keywords: ["دمج pdf", "ضم ملفات pdf", "تجميع pdf", "merge pdf online"],
        howTo: [
          "أضف ملفين PDF أو أكثر.",
          "أعد ترتيبها بالأسهم حتى تصبح الصفحات بالتسلسل الصحيح.",
          "احذف أي ملف أضفته بالخطأ.",
          "اضغط «دمج» ثم حمّل الملف الواحد الناتج.",
        ],
        faq: [
          {
            q: "هل هناك حد لعدد الملفات؟",
            a: "لا حد ثابت من الأداة، والحد العملي هو ذاكرة جهازك. دمج بضعة مستندات بإجمالي يصل إلى نحو 100 ميجابايت يعمل بسلاسة على حاسوب عادي.",
          },
          {
            q: "هل يحافظ الدمج على الروابط وحقول النماذج؟",
            a: "محتوى الصفحات والنص والصور تُحفظ كما هي. أما حقول النماذج التفاعلية فتُسطَّح، والروابط الداخلية التي تشير إلى مستند آخر قد لا تعمل، ولا تُنقل العلامات المرجعية (Bookmarks).",
          },
          {
            q: "هل يمكن دمج ملفات محمية بكلمة مرور؟",
            a: "لا، إذا كان الملف يطلب كلمة مرور للفتح. أزل الحماية أولًا من برنامج قراءة PDF ثم ادمج الملف هنا.",
          },
        ],
        examples: ["اجمع فاتورة وعقدًا موقّعًا وملحقًا في ملف واحد لإرساله."],
      },
    },
  },
  {
    slug: "pdf-to-word",
    category: "pdf",
    icon: "file-text",
    gradient: "from-red-500 to-rose-600",
    processing: "client",
    copy: {
      en: {
        name: "PDF to Word",
        tagline: "Turn a PDF into an editable Word document.",
        h1: "PDF to Word Converter",
        description:
          "Extract the text of a PDF into an editable .docx file, page by page, so you can fix, translate or reuse the content in Word, Google Docs or Pages.",
        seoTitle: "PDF to Word — Convert PDF to DOCX Online Free",
        metaDescription:
          "Convert PDF to Word (DOCX) online for free. Text is extracted page by page into an editable document you can open in Word, Google Docs or Pages. Runs in your browser, no upload.",
        keywords: ["pdf to word", "pdf to docx", "convert pdf to word", "تحويل pdf الى word"],
        howTo: [
          "Drop the PDF you want to convert.",
          "Choose whether each PDF page should start a new page in the Word document.",
          "Press Convert — the text is extracted page by page.",
          "Download the .docx and open it in Word or Google Docs to edit.",
        ],
        faq: [
          {
            q: "Will the layout look exactly like the PDF?",
            a: "No, and no browser-based converter can promise that. Text, paragraphs and page breaks are reproduced; complex multi-column layouts, tables and floating images are simplified. For a pixel-perfect copy of the design, keep the PDF.",
          },
          {
            q: "What about scanned PDFs?",
            a: "A scanned PDF contains no text layer, only a picture of the page, so there is nothing to extract. Those files need OCR, which is a server-side feature planned for a later version — this tool tells you when it detects that case.",
          },
          {
            q: "Is there a page limit?",
            a: "Convert as many pages as you like; very large documents simply take longer and use more memory in your browser. Files up to about 50 MB are usually fine.",
          },
        ],
        examples: ["Convert a report, then edit or translate the text instead of retyping it."],
      },
      ar: {
        name: "PDF إلى Word",
        tagline: "حوّل ملف PDF إلى مستند Word قابل للتعديل.",
        h1: "تحويل PDF إلى Word",
        description:
          "استخرج نص ملف PDF إلى مستند ‎.docx‎ قابل للتعديل صفحة بصفحة، لتعدّل النص أو تترجمه أو تعيد استخدامه في Word أو Google Docs.",
        seoTitle: "تحويل PDF إلى Word — DOCX أونلاين مجانًا",
        metaDescription:
          "حوّل PDF إلى Word (DOCX) مجانًا أونلاين. يُستخرج النص صفحة بصفحة إلى مستند قابل للتعديل تفتحه في Word أو Google Docs. يعمل داخل متصفحك دون رفع الملف.",
        keywords: ["تحويل pdf الى word", "pdf to docx", "تحويل pdf الى وورد", "استخراج نص pdf"],
        howTo: [
          "أفلِت ملف PDF الذي تريد تحويله.",
          "اختر إن كانت كل صفحة PDF تبدأ صفحة جديدة في مستند Word.",
          "اضغط «تحويل» ليُستخرج النص صفحة بصفحة.",
          "حمّل ملف ‎.docx‎ وافتحه في Word أو Google Docs للتعديل.",
        ],
        faq: [
          {
            q: "هل سيبدو التنسيق مطابقًا لملف PDF تمامًا؟",
            a: "لا، ولا يمكن لأي أداة تعمل في المتصفح أن تَعِد بذلك. النص والفقرات وفواصل الصفحات تُنقل، أما التنسيقات المعقدة متعددة الأعمدة والجداول والصور العائمة فتُبسَّط. للحصول على نسخة مطابقة للتصميم، احتفظ بملف PDF نفسه.",
          },
          {
            q: "وماذا عن الملفات الممسوحة ضوئيًا؟",
            a: "الملف الممسوح يحتوي صورة للصفحة وليس نصًا، فلا يوجد نص لاستخراجه. هذه الملفات تحتاج OCR، وهي ميزة على الخادم مخططة لإصدار لاحق — والأداة تنبّهك عندما تكتشف هذه الحالة.",
          },
          {
            q: "هل هناك حد لعدد الصفحات؟",
            a: "حوّل ما تحتاجه من الصفحات؛ المستندات الكبيرة جدًا تستغرق وقتًا أطول وتستهلك ذاكرة المتصفح أكثر. الملفات حتى نحو 50 ميجابايت تعمل عادة بسلاسة.",
          },
        ],
        examples: ["حوّل تقريرًا ثم عدّل نصه أو ترجمه بدل إعادة كتابته."],
      },
    },
  },
  {
    slug: "smart-pricing-calculator",
    category: "business",
    icon: "calculator",
    gradient: "from-emerald-500 to-teal-600",
    popular: true,
    processing: "client",
    copy: {
      en: {
        name: "Smart Pricing Calculator",
        tagline: "Real cost, selling price, margin and break-even.",
        h1: "Smart Pricing Calculator",
        description:
          "Add up purchase price, shipping, customs, packaging, fees and taxes to see your real cost per unit, then get a recommended selling price, your profit, margin, markup and break-even point.",
        seoTitle: "Smart Pricing Calculator — Cost, Margin & Break-Even",
        metaDescription:
          "Free pricing calculator for sellers: add purchase price, shipping, customs, packaging, platform commission and tax, then get real cost per unit, suggested selling price, profit, margin, markup and break-even point.",
        keywords: [
          "pricing calculator",
          "profit margin calculator",
          "markup calculator",
          "break even calculator",
          "حاسبة التسعير",
          "هامش الربح",
        ],
        howTo: [
          "Enter what you pay per unit: purchase price, shipping, customs, packaging and any other cost.",
          "Add the variable percentages: platform commission, payment fees and tax on the sale price.",
          "Set the profit you want — either a margin on the selling price or a markup on the cost.",
          "Read the real cost, suggested price, profit, margin, markup and break-even units.",
        ],
        faq: [
          {
            q: "What is the difference between margin and markup?",
            a: "Margin is profit as a share of the selling price; markup is profit as a share of the cost. A 25% margin equals a 33% markup. Sellers usually target margin, while shops often quote markup, so the calculator shows both.",
          },
          {
            q: "How is the real cost calculated?",
            a: "Cost per unit is the sum of purchase price, shipping, customs, packaging, other fixed costs and any cost-side commission, divided by the number of units in the batch.",
          },
          {
            q: "What is the break-even point?",
            a: "It is the number of units you must sell to cover your one-off costs, such as a store subscription, an ad budget or a sourcing fee. Every unit sold after that adds profit.",
          },
        ],
        examples: [
          "Buy at 40, ship at 6, commission 15%, target margin 25% → suggested price and profit appear instantly.",
          "Set fixed monthly costs to see how many units just cover them.",
        ],
      },
      ar: {
        name: "حاسبة التسعير الذكية",
        tagline: "التكلفة الحقيقية وسعر البيع والهامش ونقطة التعادل.",
        h1: "حاسبة التسعير الذكية",
        description:
          "اجمع سعر الشراء والشحن والجمارك والتغليف والعمولة والضرائب لتعرف تكلفتك الحقيقية للوحدة، ثم احصل على سعر البيع المقترح والربح وهامش الربح ومعدل الزيادة ونقطة التعادل.",
        seoTitle: "حاسبة التسعير الذكية — التكلفة والهامش ونقطة التعادل",
        metaDescription:
          "حاسبة تسعير مجانية للتجار: أدخل سعر الشراء والشحن والجمارك والتغليف وعمولة المنصة والضريبة، لتحصل على التكلفة الحقيقية وسعر البيع المقترح والربح وهامش الربح ونقطة التعادل.",
        keywords: [
          "حاسبة التسعير",
          "حساب هامش الربح",
          "حاسبة markup",
          "نقطة التعادل",
          "تسعير المنتجات",
        ],
        howTo: [
          "أدخل ما تدفعه لكل وحدة: سعر الشراء والشحن والجمارك والتغليف وأي مصاريف أخرى.",
          "أضف النسب المتغيرة: عمولة المنصة ورسوم الدفع والضريبة على سعر البيع.",
          "حدّد الربح المطلوب، إما هامشًا من سعر البيع أو زيادة على التكلفة.",
          "اقرأ التكلفة الحقيقية والسعر المقترح والربح والهامش ونقطة التعادل.",
        ],
        faq: [
          {
            q: "ما الفرق بين هامش الربح والزيادة (Markup)؟",
            a: "هامش الربح هو الربح كنسبة من سعر البيع، أما الزيادة فهي الربح كنسبة من التكلفة. هامش 25% يعادل زيادة 33%. التجار يهتمون عادة بالهامش، بينما المتاجر تستخدم الزيادة، لذا تعرض الحاسبة الرقمين.",
          },
          {
            q: "كيف تُحسب التكلفة الحقيقية؟",
            a: "تكلفة الوحدة هي مجموع سعر الشراء والشحن والجمارك والتغليف والمصاريف الثابتة الأخرى وأي عمولة على جانب التكلفة، مقسومة على عدد الوحدات في الدفعة.",
          },
          {
            q: "ما هي نقطة التعادل؟",
            a: "هي عدد الوحدات التي يجب بيعها لتغطية مصاريفك الثابتة مثل اشتراك المتجر أو ميزانية الإعلان أو رسوم الاستيراد. كل وحدة تُباع بعد ذلك تضيف ربحًا صافيًا.",
          },
        ],
        examples: [
          "شراء بـ40 وشحن بـ6 وعمولة 15% وهامش مطلوب 25% ← يظهر السعر المقترح والربح فورًا.",
          "أدخل مصاريفك الشهرية الثابتة لتعرف كم وحدة تغطيها فقط.",
        ],
      },
    },
  },
];

export const toolSlugs = tools.map((t) => t.slug);

export const getTool = (slug: string) => tools.find((t) => t.slug === slug);

export const toolsByCategory = (category: CategoryId) => tools.filter((t) => t.category === category);

export const popularTools = tools.filter((t) => t.popular);

export const relatedTools = (slug: string, count = 3) => {
  const tool = getTool(slug);
  if (!tool) return tools.slice(0, count);
  const sameCategory = tools.filter((t) => t.category === tool.category && t.slug !== slug);
  const others = tools.filter((t) => t.category !== tool.category && t.slug !== slug);
  return [...sameCategory, ...others].slice(0, count);
};
