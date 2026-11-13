import type { Locale } from "./site";

export interface PostSection {
  heading?: string;
  paragraphs: string[];
  list?: string[];
}

export interface Post {
  slug: string;
  toolSlug: string;
  date: string;
  minutes: number;
  copy: Record<
    Locale,
    {
      title: string;
      excerpt: string;
      metaDescription: string;
      sections: PostSection[];
    }
  >;
}

export const posts: Post[] = [
  {
    slug: "compress-pdf-without-losing-quality",
    toolSlug: "pdf-compressor",
    date: "2026-01-12",
    minutes: 5,
    copy: {
      en: {
        title: "How to compress a PDF without ruining it",
        excerpt:
          "Why some PDFs shrink by 90% and others barely move, and how to choose between keeping the text and keeping the file small.",
        metaDescription:
          "A practical guide to compressing PDF files: what makes a PDF heavy, the difference between safe and aggressive compression, and how to check the result.",
        sections: [
          {
            paragraphs: [
              "PDF is not one format, it is a container. The same .pdf extension can hold crisp vector text, a full-colour scan of forty pages, or a mix of both. That is why one file shrinks to a tenth of its size while another refuses to budge: whatever is inside decides how much can be removed.",
            ],
          },
          {
            heading: "What actually makes a PDF heavy",
            paragraphs: [
              "Almost always images. A page of text with real fonts weighs a few kilobytes. The same page scanned at 300 dpi weighs between one and three megabytes, because it is really a photograph of paper.",
              "Other weight comes from embedded fonts that are not subsetted, duplicate objects left behind by editing software, and high-resolution images placed at a size far smaller than their pixel count needs.",
            ],
            list: [
              "Scanned pages: usually 80–95% of the total size.",
              "Photos placed at print resolution for screen use: a common 3–5× waste.",
              "Non-subsetted fonts and leftover edit history: a few percent each.",
            ],
          },
          {
            heading: "Two kinds of compression, two different jobs",
            paragraphs: [
              "Safe compression rebuilds the file structure, removes redundant objects and re-encodes streams. Text stays text: searchable, selectable and sharp at any zoom. The saving is usually modest — often 5 to 25% — but nothing about the document changes visually.",
              "Strong compression renders each page to an image and builds a new PDF from those images. This is what removes the heavy scan data, and reductions of 70–90% are normal for scanned documents. The trade-off is real: the text is no longer selectable or searchable, and fine print softens if you push the quality too low.",
            ],
          },
          {
            heading: "Choosing a level",
            paragraphs: [
              "If you need to email the file and keep it readable on any device, safe mode at full quality is enough most of the time. If you are uploading a scanned archive, filling a form field that limits size, or building a website, strong mode is the right tool.",
              "For the strong mode, start around 150 dpi and 70% JPEG quality. Going below that rarely helps the person reading it and can make small text illegible when printed.",
            ],
          },
          {
            heading: "Always check before you delete the original",
            paragraphs: [
              "Open the compressed file, zoom to 100% on a dense page, and search for a word you know is in there. If the word is found, text survived; if not, you used strong mode. Then keep the original until you are sure.",
              "A last note on privacy: compressing in your own browser means the document never travels. For contracts, invoices, medical letters and internal reports, that is not a small detail.",
            ],
          },
        ],
      },
      ar: {
        title: "كيف تضغط ملف PDF دون أن تُفسده",
        excerpt:
          "لماذا ينخفض حجم بعض الملفات بنسبة 90% وبعضها لا يتغير، وكيف تختار بين الحفاظ على النص والحفاظ على الحجم؟",
        metaDescription:
          "دليل عملي لضغط ملفات PDF: ما الذي يجعل الملف ثقيلًا، والفرق بين الضغط الآمن والقوي، وكيف تتأكد من النتيجة قبل حذف الأصل.",
        sections: [
          {
            paragraphs: [
              "ملف PDF ليس صيغة واحدة، بل حاوية. الامتداد نفسه ‎.pdf‎ قد يحتوي نصًا متجهيًا واضحًا، أو صورة ممسوحة ضوئيًا بأربعين صفحة بالألوان، أو خليطًا من الاثنين. ولهذا ينخفض حجم ملف إلى العُشر بينما يرفض آخر أن يتغير: المحتوى الداخلي هو ما يحدد كم يمكن إزالته.",
            ],
          },
          {
            heading: "ما الذي يجعل ملف PDF ثقيلًا فعليًا",
            paragraphs: [
              "الصور غالبًا. صفحة نصية بخطوط حقيقية تزن بضعة كيلوبايتات، أما الصفحة نفسها إن كانت صورة ممسوحة بدقة 300 نقطة في البوصة فتزن بين ميجابايت وثلاثة، لأنها في الحقيقة صورة فوتوغرافية للورق.",
              "والحجم الآخر يأتي من خطوط مدمجة غير مقتطعة، وكائنات مكرّرة خلّفها برنامج التحرير، وصور عالية الدقة موضوعة في مساحة أصغر بكثير من حاجتها.",
            ],
            list: [
              "الصفحات الممسوحة: تشكّل عادة 80–95% من الحجم الكلي.",
              "صور موضوعة بدقة الطباعة لاستخدام على الشاشة: هدر شائع يتراوح بين ثلاثة وخمسة أضعاف.",
              "خطوط غير مقتطعة وسجل تحرير متبقٍّ: نسبة قليلة لكل منهما.",
            ],
          },
          {
            heading: "نوعان من الضغط لمهمتين مختلفتين",
            paragraphs: [
              "الضغط الآمن يعيد بناء بنية الملف ويحذف الكائنات المكرّرة ويعيد ترميز البيانات. يبقى النص نصًا: قابلًا للبحث والتحديد وواضحًا عند أي تكبير. والتوفير عادة متواضع — بين 5% و25% غالبًا — لكن لا يتغير شكل المستند إطلاقًا.",
              "الضغط القوي يرسم كل صفحة كصورة ويبني ملف PDF جديدًا من هذه الصور، وهذا ما يزيل ثقل الصور الممسوحة، فتصبح نسب الانخفاض بين 70% و90% طبيعية للمستندات الممسوحة. لكن المقابل حقيقي: النص يصبح غير قابل للتحديد أو البحث، والنص الصغير يتشوّش إذا خفضت الجودة كثيرًا.",
            ],
          },
          {
            heading: "كيف تختار المستوى",
            paragraphs: [
              "إذا كان الهدف إرسال الملف بالبريد وبقاءه مقروءًا على أي جهاز، فالوضع الآمن بأعلى جودة يكفي في أغلب الحالات. أما إذا كنت ترفع أرشيفًا ممسوحًا ضوئيًا، أو تصطدم بحد أقصى لحجم الملف في نموذج تقديم، أو تجهّز ملفًا للموقع، فالوضع القوي هو الصحيح.",
              "في الوضع القوي، ابدأ حول 150 نقطة في البوصة وجودة 70% لصيغة JPEG. النزول عن ذلك قلّما يفيد القارئ، وقد يجعل النص الصغير غير مقروء عند الطباعة.",
            ],
          },
          {
            heading: "تحقق دائمًا قبل حذف الأصل",
            paragraphs: [
              "افتح الملف المضغوط، واكبر صفحة مزدحمة إلى 100%، وابحث عن كلمة تعرف أنها موجودة. إن وُجدت، فالنص سليم؛ وإن لم تُوجد، فأنت في الوضع القوي. واحتفظ بالأصل حتى تتأكد.",
              "وملاحظة أخيرة عن الخصوصية: الضغط داخل متصفحك يعني أن المستند لا ينتقل من جهازك أصلًا. وهذا ليس تفصيلًا صغيرًا في العقود والفواتير والتقارير الداخلية.",
            ],
          },
        ],
      },
    },
  },
  {
    slug: "json-formatter-guide",
    toolSlug: "json-formatter",
    date: "2026-01-20",
    minutes: 4,
    copy: {
      en: {
        title: "Reading broken JSON: the five errors behind most parse failures",
        excerpt:
          "Trailing commas, unquoted keys, comments, single quotes and control characters account for nearly every \"unexpected token\" you will ever see.",
        metaDescription:
          "Why JSON fails to parse: the five most common syntax errors, how to spot them from the parser message, and how to fix them quickly with an online formatter.",
        sections: [
          {
            paragraphs: [
              "JSON looks forgiving until it is not. The grammar is tiny, which is exactly why a single stray character makes an entire payload unusable, and why the error message usually points at the line after the real problem.",
            ],
          },
          {
            heading: "The five usual suspects",
            paragraphs: [
              "Almost every parse failure comes down to one of these, in roughly this order of frequency:",
            ],
            list: [
              "A trailing comma before a closing } or ] — legal in JavaScript objects, illegal in JSON.",
              "Keys without double quotes, or values using single quotes — JSON has no unquoted keys and no single-quoted strings.",
              "Comments (// or /* */) — JSON has no comment syntax at all.",
              "Missing comma between two properties, which makes the parser report the next key as unexpected.",
              "Invisible characters: a raw tab or newline inside a string, a byte-order mark at the start, or smart quotes pasted from a document.",
            ],
          },
          {
            heading: "Reading the message correctly",
            paragraphs: [
              "A good validator tells you the position, but the reported position is usually where the parser gave up, not where you made the mistake. If the error is on line 12 and the JSON looks fine there, look at line 11 — nine times out of ten the missing comma or trailing comma is one line up.",
            ],
          },
          {
            heading: "How to fix it fast",
            paragraphs: [
              "Format first, do not validate first. Pretty-printing turns a single unreadable line into a structure you can scan, and the missing comma becomes obvious rather than a character hunt.",
              "Then work in two passes: fix everything the formatter reports, re-format, and repeat until it passes. Once it does, minify if the payload is going over the wire — the difference on a large response body is usually 20–40% of bytes.",
            ],
          },
          {
            heading: "One habit worth keeping",
            paragraphs: [
              "Never paste a production API response containing real tokens, keys or customer data into a random website. Use a tool that processes the text in your own browser, so the payload is never transmitted anywhere.",
            ],
          },
        ],
      },
      ar: {
        title: "قراءة JSON المكسور: خمسة أخطاء تقف خلف معظم حالات الفشل",
        excerpt:
          "الفاصلة الزائدة والمفاتيح بدون تنصيص والتعليقات وعلامات التنصيص المفردة والمحارف الخفية هي سبب كل رسالة «unexpected token» تريدها تقريبًا.",
        metaDescription:
          "لماذا يفشل تحليل JSON: الأخطاء الخمسة الأكثر شيوعًا، وكيف تعرفها من رسالة المحلل، وكيف تصلحها سريعًا بأداة تنسيق أونلاين.",
        sections: [
          {
            paragraphs: [
              "يبدو JSON متسامحًا حتى لا يكون كذلك. فقواعده صغيرة جدًا، ولهذا يصبح حرف واحد في غير موضعه سببًا في تعطّل البيانات كلها، وسببًا في أن تشير رسالة الخطأ عادةً إلى السطر التالي للمشكلة الحقيقية.",
            ],
          },
          {
            heading: "المشتبه بهم الخمسة",
            paragraphs: ["تكاد كل حالات الفشل تعود إلى واحد مما يلي، وبهذا الترتيب تقريبًا من حيث الشيوع:"],
            list: [
              "فاصلة زائدة قبل القوس ‎}‎ أو ‎]‎ — مسموحة في كائنات JavaScript وممنوعة في JSON.",
              "مفاتيح بدون تنصيص مزدوج أو قيم بعلامات تنصيص مفردة — JSON لا يعرف المفاتيح غير المُنصَّصة ولا النصوص المفردة.",
              "التعليقات ‎//‎ أو ‎/* */‎ — JSON لا يحتوي أي صيغة تعليق.",
              "فاصلة ناقصة بين خاصيتين، فيبلّغ المحلل عن المفتاح التالي كخطأ غير متوقع.",
              "محارف غير مرئية: مسافة جدولة أو سطر جديد داخل نص، أو علامة ترتيب البايت في بداية الملف، أو علامات تنصيص ذكية منسوخة من مستند.",
            ],
          },
          {
            heading: "كيف تقرأ الرسالة بشكل صحيح",
            paragraphs: [
              "الأداة الجيدة تخبرك بالموضع، لكن الموضع المُبلَّغ عنه هو عادةً مكان توقف المحلل لا مكان خطئك. فإذا كان الخطأ في السطر 12 والنص سليم هناك، فانظر إلى السطر 11 — في تسع حالات من عشر تكون الفاصلة الناقصة أو الزائدة في السطر السابق.",
            ],
          },
          {
            heading: "كيف تصلحه بسرعة",
            paragraphs: [
              "ابدأ بالتنسيق لا بالفحص. التنسيق الجميل يحوّل سطرًا واحدًا غير مقروء إلى بنية يمكن مسحها بالعين، فتظهر الفاصلة الناقصة بوضوح بدل أن تبحث عنها حرفًا حرفًا.",
              "ثم اعمل على مرحلتين: أصلح كل ما تُبلغ عنه الأداة، ثم أعد التنسيق، وكرّر حتى ينجح الفحص. وبعد ذلك استخدم التصغير إذا كان النص سيُرسل عبر الشبكة — الفرق في استجابة كبيرة يصل عادة إلى 20–40% من الحجم.",
            ],
          },
          {
            heading: "عادة واحدة تستحق الحفاظ عليها",
            paragraphs: [
              "لا تلصق أبدًا استجابة API حقيقية تحتوي توكنات أو مفاتيح أو بيانات عملاء في موقع عشوائي. استخدم أداة تعالج النص داخل متصفحك، فلا يُرسل المحتوى إلى أي مكان.",
            ],
          },
        ],
      },
    },
  },
  {
    slug: "image-format-guide",
    toolSlug: "image-converter",
    date: "2026-02-02",
    minutes: 5,
    copy: {
      en: {
        title: "JPEG, PNG or WebP? A quick way to decide",
        excerpt:
          "Three formats, three jobs. Pick the wrong one and your page loads slowly or your logo looks dirty — the rule of thumb takes ten seconds to learn.",
        metaDescription:
          "Which image format to use: JPEG for photos, PNG for transparency and sharp edges, WebP for almost everything on the web. Plus how quality settings affect size.",
        sections: [
          {
            paragraphs: [
              "The choice is not about which format is \"best\" — it is about what the image contains. Two questions settle it: does it have transparency, and is it a photograph or a drawing?",
            ],
          },
          {
            heading: "The ten-second rule",
            paragraphs: ["Ask in this order:"],
            list: [
              "Does it need a transparent background? → PNG or WebP. JPEG cannot do it.",
              "Is it a photo, with smooth gradients and no hard edges? → JPEG or WebP at 75–85% quality.",
              "Is it a screenshot, logo, icon or chart with flat colours and text? → PNG, or WebP for the web.",
              "Going on a website and you can convert freely? → WebP, always, unless an old client requires otherwise.",
            ],
          },
          {
            heading: "Why WebP is usually the answer online",
            paragraphs: [
              "WebP encodes the same visible quality as JPEG in roughly 25–35% fewer bytes, and supports transparency like PNG. Every current browser accepts it. For a site with a hundred photos, that difference is the single easiest speed win available.",
              "Keep a JPEG copy of anything you also send by email, send to a print shop or hand to a client who uses older software.",
            ],
          },
          {
            heading: "What the quality slider really does",
            paragraphs: [
              "In JPEG and WebP, quality is not a percentage of fidelity, it is a setting on a lossy quantiser. Between 50 and 85 the file size drops fast and the visible damage is small. Below 50 you start to see blocky patches around edges and text. Above 90 the file grows quickly for a change almost nobody can see.",
              "If you need both a small file and a sharp image, resizing matters more than quality: a 1200-pixel-wide photo at 80% will beat a 4000-pixel-wide photo at 50% on every screen.",
            ],
          },
          {
            heading: "Transparency: the one real trap",
            paragraphs: [
              "Converting a PNG with a transparent background to JPEG silently fills those areas with white. If you are converting a batch and some files have transparency, export to WebP or PNG instead — or check the converted images before publishing them.",
            ],
          },
        ],
      },
      ar: {
        title: "JPEG أم PNG أم WebP؟ طريقة سريعة للاختيار",
        excerpt:
          "ثلاث صيغ لثلاث مهام. اختيار خاطئ يعني صفحة بطيئة أو شعارًا بجودة رديئة — والقاعدة تتعلمها في عشر ثوان.",
        metaDescription:
          "أي صيغة صورة تستخدم: JPEG للصور الفوتوغرافية، PNG للشفافية والحواف الحادة، WebP لأغلب استخدامات الويب. وكيف تؤثر إعدادات الجودة على الحجم.",
        sections: [
          {
            paragraphs: [
              "الاختيار ليس بين «أفضل» صيغة، بل متعلق بما تحتويه الصورة. وسؤالان يحلّان المسألة: هل تحتاج شفافية؟ وهل هي صورة فوتوغرافية أم رسم؟",
            ],
          },
          {
            heading: "قاعدة العشر ثوان",
            paragraphs: ["اسأل بهذا الترتيب:"],
            list: [
              "هل تحتاج خلفية شفافة؟ ← PNG أو WebP، لأن JPEG لا يدعمها.",
              "هل هي صورة فوتوغرافية بتدرجات ناعمة وبلا حواف حادة؟ ← JPEG أو WebP بجودة 75–85%.",
              "هل هي لقطة شاشة أو شعار أو أيقونة أو رسم بياني بألوان مسطّحة ونص؟ ← PNG، أو WebP للويب.",
              "هل ستُستخدم في موقع ويمكنك التحويل بحرية؟ ← WebP دائمًا، إلا إذا تطلب عميل قديم غير ذلك.",
            ],
          },
          {
            heading: "لماذا WebP هي الجواب في الويب عادة",
            paragraphs: [
              "ترمّز WebP نفس الجودة المرئية لـJPEG بحجم أقل بنحو 25–35%، وتدعم الشفافية مثل PNG، وكل المتصفحات الحالية تقرأها. وفي موقع فيه مئة صورة، هذا الفرق هو أسهل مكسب في السرعة تحصل عليه.",
              "احتفظ بنسخة JPEG لأي صورة ترسلها بالبريد أو إلى مطبعة أو لعميل يستخدم برامج قديمة.",
            ],
          },
          {
            heading: "ماذا يفعل منزلق الجودة فعلًا",
            paragraphs: [
              "في JPEG وWebP الجودة ليست نسبة دقة، بل إعداد في مُكمِّم ضغط بفقدان. وبين 50 و85 ينخفض الحجم بسرعة والتلف المرئي صغير. وأقل من 50 تبدأ المربعات تظهر حول الحواف والنصوص. وأعلى من 90 يكبر الملف بسرعة مقابل فرق لا يراه أحد تقريبًا.",
              "وإذا احتجت حجمًا صغيرًا وصورة حادة معًا، فإن إعادة التحجيم أهم من الجودة: صورة بعرض 1200 بكسل بجودة 80% ستتفوق على صورة بعرض 4000 بكسل بجودة 50% على كل شاشة.",
            ],
          },
          {
            heading: "الشفافية: الفخ الحقيقي الوحيد",
            paragraphs: [
              "تحويل ملف PNG بخلفية شفافة إلى JPEG يملأ هذه المناطق بالأبيض بصمت. فإذا كنت تحوّل مجموعة ملفات وبعضها بشفافية، فصدّر إلى WebP أو PNG، أو راجع الصور المحوّلة قبل نشرها.",
            ],
          },
        ],
      },
    },
  },
  {
    slug: "product-pricing-guide",
    toolSlug: "smart-pricing-calculator",
    date: "2026-02-14",
    minutes: 6,
    copy: {
      en: {
        title: "Pricing a product so you actually make money",
        excerpt:
          "Most small sellers price from the purchase cost alone and lose money on every sale. Here is the full list of costs, and the two percentages that matter.",
        metaDescription:
          "How to price a product: include shipping, customs, packaging, platform commission and tax, then choose between margin and markup and find your break-even point.",
        sections: [
          {
            paragraphs: [
              "The most common pricing mistake is simple: you buy something for 40, sell it for 60, and count 20 as profit. By the time shipping, packaging, commission and tax are paid, that 20 has quietly become a loss — and every extra sale makes it worse.",
            ],
          },
          {
            heading: "Everything that belongs in the cost",
            paragraphs: [
              "Your real cost per unit is not the purchase price. It is the purchase price plus every unavoidable cost attached to getting one unit to the customer:",
            ],
            list: [
              "Shipping in, and shipping out if you pay it.",
              "Customs, import duties and clearance fees, divided across the units in the shipment.",
              "Packaging, labels, tape and insert cards.",
              "Payment processing fees, usually 2–3% plus a fixed amount.",
              "Marketplace commission, often 10–20% of the sale price.",
              "Returns: add the return rate times the cost of a returned item.",
            ],
          },
          {
            heading: "Margin or markup — know which one you are using",
            paragraphs: [
              "Margin is profit divided by the selling price; markup is profit divided by the cost. They produce very different numbers for the same sale: a 25% margin equals a 33% markup. When someone says \"I price at cost plus 40%\", they mean markup — and their real margin is under 29%.",
              "Decide which one your business targets and stay consistent, because the two drift apart quickly as costs rise.",
            ],
          },
          {
            heading: "Prices that end in 9 are not the point",
            paragraphs: [
              "Charm pricing shifts conversion a little, but it cannot rescue a price that does not cover your costs. Get the floor right first: the lowest price at which the product is still worth selling. Then decide how far above that floor the market will accept.",
            ],
          },
          {
            heading: "Break-even: the number that keeps you calm",
            paragraphs: [
              "Fixed costs — a store subscription, an ad budget, a sourcing trip — do not move with volume. Your break-even is those fixed costs divided by the profit per unit. If a monthly subscription costs 120 and each sale earns 8, you need 15 sales a month before the shop itself is free and the sixteenth is profit.",
              "Run those numbers before you buy inventory. It is much cheaper to discover the price is wrong in a calculator than in a warehouse.",
            ],
          },
        ],
      },
      ar: {
        title: "كيف تسعّر منتجًا لتربح فعلًا",
        excerpt:
          "أغلب صغار التجار يسعّرون على أساس سعر الشراء وحده فيخسرون في كل بيعة. هذه قائمة التكاليف الكاملة، والنسبتان المهمتان.",
        metaDescription:
          "كيف تسعّر منتجك: احسب الشحن والجمارك والتغليف وعمولة المنصة والضريبة، وافرق بين هامش الربح والزيادة، واعرف نقطة التعادل.",
        sections: [
          {
            paragraphs: [
              "أشهر خطأ في التسعير بسيط: تشتري بـ40 وتبيع بـ60 وتحسب 20 ربحًا. وعندما تُدفع تكاليف الشحن والتغليف والعمولة والضريبة، يتحول ذلك العشرون بهدوء إلى خسارة — وكل بيعة إضافية تزيد الخسارة.",
            ],
          },
          {
            heading: "كل ما يجب أن يدخل في التكلفة",
            paragraphs: [
              "تكلفتك الحقيقية للوحدة ليست سعر الشراء، بل سعر الشراء مع كل تكلفة لا يمكن تجنبها لإيصال وحدة واحدة إلى العميل:",
            ],
            list: [
              "الشحن الوارد، والصادر إن كنت تتحمله.",
              "الجمارك ورسوم الاستيراد والتخليص، موزعة على وحدات الشحنة.",
              "التغليف والملصقات والشرائط والبطاقات الداخلية.",
              "رسوم معالجة الدفع، وعادة 2–3% زائد مبلغ ثابت.",
              "عمولة المنصة، وغالبًا بين 10% و20% من سعر البيع.",
              "المرتجعات: أضف نسبة الإرجاع مضروبة في تكلفة القطعة المُرجَعة.",
            ],
          },
          {
            heading: "هامش الربح أم الزيادة — اعرف أيّهما تستخدم",
            paragraphs: [
              "هامش الربح هو الربح مقسومًا على سعر البيع، والزيادة هي الربح مقسومًا على التكلفة، وهما يعطيان رقمين مختلفين جدًا لنفس البيعة: هامش 25% يعادل زيادة 33%. وعندما يقول أحدهم «أُسعّر بتكلفة زائد 40%»، فهو يعني زيادة، وهامشه الحقيقي أقل من 29%.",
              "حدّد أيّهما تعتمده في عملك والتزم به، لأن الفرق بينهما يتسع سريعًا مع ارتفاع التكاليف.",
            ],
          },
          {
            heading: "السعر المنتهي بالرقم 9 ليس المهم هنا",
            paragraphs: [
              "الأسعار النفسية تحرّك نسبة التحويل قليلًا، لكنها لا تنقذ سعرًا لا يغطي تكاليفك. اضبط الحد الأدنى أولًا: أقل سعر يبقى عنده بيع المنتج منطقيًا، ثم قرر كم يستطيع السوق أن يتحمل فوق ذلك الحد.",
            ],
          },
          {
            heading: "نقطة التعادل: الرقم الذي يمنحك الطمأنينة",
            paragraphs: [
              "المصاريف الثابتة — اشتراك متجر أو ميزانية إعلان أو رحلة توريد — لا تتغير مع حجم البيع. ونقطة التعادل هي هذه المصاريف مقسومة على الربح من الوحدة. فإذا كان الاشتراك الشهري 120 والربح من البيعة 8، فأنت تحتاج 15 بيعة في الشهر قبل أن يصبح المتجر مجانيًا، والبيعة السادسة عشرة ربح.",
              "احسب هذه الأرقام قبل شراء المخزون، فالخطأ في الآلة الحاسبة أرخص بكثير من الخطأ في المستودع.",
            ],
          },
        ],
      },
    },
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);
