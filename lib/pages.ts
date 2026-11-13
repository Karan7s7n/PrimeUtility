import type { Locale } from "./site";
import { site } from "./site";

export interface DocSection {
  heading: string;
  body: string[];
}

export interface Doc {
  title: string;
  updated: string;
  intro: string;
  sections: DocSection[];
}

const enAbout = {
  title: `About ${site.brand}`,
  intro:
    "We are building a small, fast home for the digital chores that come up every week: a PDF that will not send, a photo that is too heavy, JSON that will not parse, a product price that has to be right.",
  sections: [
    {
      heading: "What we believe",
      body: [
        "A simple task should not require an account, an installation or a five-step wizard. Open a page, get the job done, close it.",
        "Privacy should be the default, not a paid extra. Where a task can be done inside a browser, we do it there — no upload, no copy of your file on someone else's disk, no waiting on a queue.",
        "A tool should be honest about its limits: what it cannot do, where quality drops, and what it does not verify.",
      ],
    },
    {
      heading: "What is in this version",
      body: [
        "Ten tools across four groups — PDF, images, developer utilities and a business pricing calculator — in both Arabic and English, with a layout that starts from the phone.",
        "Every tool lives on its own page with instructions, examples and answers to the questions we get asked most, so you can judge the result before you trust it with real work.",
      ],
    },
    {
      heading: "How it grows from here",
      body: [
        "Accounts, saved history, batch processing and higher limits come next, then heavier server-side processing for scanned PDFs and OCR, then API access for teams.",
        "We would rather ship ten tools that behave properly than fifty that half-work. New tools are added when the usage numbers say people want them.",
      ],
    },
  ],
};

const arAbout = {
  title: `عن ${site.brand}`,
  intro:
    "نبني مكانًا صغيرًا وسريعًا للمهام الرقمية التي تتكرر كل أسبوع: ملف PDF يرفض الإرسال، صورة ثقيلة الحجم، JSON لا يُقرأ، أو سعر منتج يجب أن يكون مضبوطًا.",
  sections: [
    {
      heading: "ما نؤمن به",
      body: [
        "المهمة البسيطة لا تحتاج حسابًا ولا تثبيتًا ولا معالجًا من خمس خطوات. افتح الصفحة، أنجز المهمة، وأغلقها.",
        "الخصوصية يجب أن تكون الأساس لا ميزة مدفوعة. وكل مهمة يمكن تنفيذها داخل المتصفح ننفذها هناك: بلا رفع، وبلا نسخة من ملفك على قرص شخص آخر، وبلا انتظار في طابور.",
        "والأداة يجب أن تكون صريحة في حدودها: ما لا تستطيعه، وأين تنخفض الجودة، وما لا تتحقق منه.",
      ],
    },
    {
      heading: "ما يحتويه هذا الإصدار",
      body: [
        "عشر أدوات موزعة على أربع مجموعات — PDF والصور وأدوات المطورين وحاسبة تسعير للأعمال — بالعربية والإنجليزية، بتصميم يبدأ من الهاتف أولًا.",
        "لكل أداة صفحة مستقلة فيها خطوات الاستخدام وأمثلة وأجوبة عن أكثر الأسئلة تكرارًا، لتتمكن من الحكم على النتيجة قبل الاعتماد عليها في عمل حقيقي.",
      ],
    },
    {
      heading: "كيف تنمو المنصة بعد ذلك",
      body: [
        "المرحلة التالية: الحسابات وسجل العمليات والمعالجة بالدفعات وحدود استخدام أعلى، ثم المعالجة الثقيلة على الخادم للملفات الممسوحة ضوئيًا و OCR، ثم واجهة API لفرق العمل.",
        "نفضّل إطلاق عشر أدوات تعمل بشكل سليم على خمسين أداة تعمل نصف عمل، والأدوات الجديدة تُضاف عندما تُظهر الأرقام أن المستخدمين يريدونها.",
      ],
    },
  ],
};

const enPricing = {
  title: "Plans and pricing",
  intro:
    "Every tool is free and runs in your browser, with or without an account. A free account is live today: it keeps your history, raises the daily allowance from 5 to 40 runs and works on every device. The paid plans below are the next stage.",
  notChargedNote:
    "Free accounts are available now — no card, no payment. The Pro and Business plans cannot be purchased yet: billing arrives with the next release.",
  plans: [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      tagline: "For everyday, occasional use.",
      features: [
        "All 10 tools",
        "5 runs a day as a guest",
        "40 runs a day with a free account",
        "Your own history, on every device",
        "Arabic and English",
        "No card required",
      ],
      cta: "Start using the tools",
      available: true,
    },
    {
      name: "Pro",
      price: "$7",
      period: "per month (planned)",
      tagline: "For people who use these tools weekly.",
      features: [
        "Everything in Free",
        "2,000 runs a day",
        "Batch processing",
        "Larger file handling",
        "Server-side OCR and heavy PDF work",
        "Priority processing",
      ],
      cta: "Coming soon",
      available: false,
    },
    {
      name: "Business",
      price: "$24",
      period: "per month (planned)",
      tagline: "For teams, stores and API access.",
      features: [
        "Everything in Pro",
        "10,000 runs a day",
        "Team seats",
        "API keys and usage dashboard",
        "Bulk processing and exports",
        "Email support",
      ],
      cta: "Coming soon",
      available: false,
    },
  ],
  faqTitle: "Billing questions",
  faq: [
    {
      q: "Are today's tools really free?",
      a: "Yes. Every tool is free and works without an account, because the processing happens on your own device rather than on our servers. A free account only adds history and a higher daily allowance — it is not needed to use the tools.",
    },
    {
      q: "What am I paying for on a paid plan?",
      a: "Server capacity and volume, not features you could do yourself: heavy processing, OCR on scanned documents, batch jobs, larger daily allowances and API access all cost real compute per use.",
    },
    {
      q: "Will prices change?",
      a: "The figures above are placeholders for planning. Final prices are set before launch of the paid plans and existing users are told in advance.",
    },
  ],
};

const arPricing = {
  title: "الخطط والأسعار",
  intro:
    "كل الأدوات مجانية وتعمل داخل متصفحك، بحساب أو بدونه. والحساب المجاني متاح الآن: يحفظ سجلك، ويرفع الرصيد اليومي من 5 إلى 40 عملية، ويعمل على كل الأجهزة. والخطط المدفوعة أدناه هي المرحلة القادمة.",
  notChargedNote:
    "الحسابات المجانية متاحة الآن — بدون بطاقة وبدون دفع. أما خطتا برو والأعمال فلا يمكن شراؤهما بعد: نظام الدفع يأتي مع الإصدار القادم.",
  plans: [
    {
      name: "المجانية",
      price: "0$",
      period: "دائمًا",
      tagline: "للاستخدام اليومي المتقطع.",
      features: [
        "الأدوات العشر كلها",
        "5 عمليات يوميًا كزائر",
        "40 عملية يوميًا بحساب مجاني",
        "سجل خاص بك على كل الأجهزة",
        "بالعربية والإنجليزية",
        "بدون بطاقة بنكية",
      ],
      cta: "ابدأ استخدام الأدوات",
      available: true,
    },
    {
      name: "برو",
      price: "7$",
      period: "شهريًا (مقترح)",
      tagline: "لمن يستخدم هذه الأدوات أسبوعيًا.",
      features: [
        "كل مزايا الخطة المجانية",
        "2000 عملية يوميًا",
        "معالجة بالدفعات",
        "ملفات أكبر",
        "OCR ومعالجة PDF الثقيلة على الخادم",
        "أولوية في المعالجة",
      ],
      cta: "قريبًا",
      available: false,
    },
    {
      name: "الأعمال",
      price: "24$",
      period: "شهريًا (مقترح)",
      tagline: "للفرق والمتاجر والوصول عبر API.",
      features: [
        "كل مزايا خطة برو",
        "10000 عملية يوميًا",
        "مقاعد لفريق العمل",
        "مفاتيح API ولوحة استخدام",
        "معالجة بالجملة والتصدير",
        "دعم بالبريد الإلكتروني",
      ],
      cta: "قريبًا",
      available: false,
    },
  ],
  faqTitle: "أسئلة عن الفواتير",
  faq: [
    {
      q: "هل أدوات اليوم مجانية فعلًا؟",
      a: "نعم. كل أداة مجانية وتعمل بدون حساب، لأن المعالجة تحدث على جهازك لا على خوادمنا. والحساب المجاني يضيف السجل ورصيدًا يوميًا أعلى فقط، وليس شرطًا لاستخدام الأدوات.",
    },
    {
      q: "ما الذي أدفع مقابله في الخطة المدفوعة؟",
      a: "قدرة المعالجة والحجم، لا ميزات يمكنك تنفيذها بنفسك: المعالجة الثقيلة، و OCR للملفات الممسوحة، ومهام الدفعات، ورفع الرصيد اليومي، والوصول عبر API — كلها تستهلك موارد حقيقية لكل استخدام.",
    },
    {
      q: "هل تتغير الأسعار؟",
      a: "الأرقام أعلاه مبدئية للتخطيط. تُحدد الأسعار النهائية قبل إطلاق الخطط المدفوعة، ويُبلَّغ المستخدمون الحاليون مسبقًا.",
    },
  ],
};

const contactCopy = {
  en: {
    title: "Contact",
    intro: "Found a bug, need a tool that does not exist yet, or want to report a problem with a file? Write to us.",
    form: {
      name: "Your name",
      email: "Your email",
      message: "Your message",
      send: "Send message",
      hint: "This opens your own email app with the message ready to send — nothing is submitted to a server from this page.",
      required: "Please fill in every field.",
    },
    direct: "Prefer email?",
  },
  ar: {
    title: "اتصل بنا",
    intro: "وجدت خللًا، أو تحتاج أداة غير موجودة، أو تريد الإبلاغ عن مشكلة في ملف؟ راسلنا.",
    form: {
      name: "اسمك",
      email: "بريدك الإلكتروني",
      message: "رسالتك",
      send: "إرسال الرسالة",
      hint: "سيفتح هذا تطبيق البريد على جهازك والرسالة جاهزة للإرسال — لا يُرسَل شيء إلى أي خادم من هذه الصفحة.",
      required: "يرجى تعبئة كل الحقول.",
    },
    direct: "تفضّل البريد الإلكتروني؟",
  },
};

const privacyEn: Doc = {
  title: "Privacy Policy",
  updated: "Version 1.0",
  intro:
    "This policy explains, in plain language, what happens to your data when you use this website. The short version: files you process in the tools are handled by your own browser, not by our servers.",
  sections: [
    {
      heading: "Files you process",
      body: [
        "Every tool in this version runs inside your browser. When you compress an image, merge a PDF, convert a document or generate a QR code, the file is read from your device, processed by JavaScript in the page, and saved back to your device. It is never uploaded.",
        "Because nothing is uploaded, we hold no copy of your file, cannot look at it, and cannot restore it if you lose it. Closing the tab discards everything.",
      ],
    },
    {
      heading: "What we do collect",
      body: [
        "Standard server logs from our hosting provider (IP address, requested page, browser type and time) needed to serve the site and block abuse.",
        "Aggregated, anonymous usage statistics — which tools are opened and how often — so we know what to improve. These counters do not contain file contents or file names.",
      ],
    },
    {
      heading: "Cookies and local storage",
      body: [
        "We use browser local storage for one thing only: remembering whether you chose the light or dark theme and which language you prefer. No advertising cookies are set in this version.",
        "If advertising or analytics change this in a later version, this page will be updated and the change announced before it takes effect.",
      ],
    },
    {
      heading: "Third parties",
      body: [
        "The site is served through a hosting provider and may load web fonts from a public font CDN. Those providers see the request, as they would for any website using them.",
        "We do not sell, rent or share personal data, because we do not build profiles of you.",
      ],
    },
    {
      heading: "Future server-side features",
      body: [
        "Later versions will add features that genuinely need a server, such as OCR on scanned PDFs. When those arrive, files that are sent for processing will be encrypted in transit, stored temporarily, deleted automatically, and never used for anything else — and the affected tool pages will say so clearly.",
      ],
    },
    {
      heading: "Your rights and contact",
      body: [
        `If you have a question about data, or want us to delete anything that identifies you, write to ${site.contactEmail}. We answer within a reasonable time and we do not require an account to do it.`,
      ],
    },
  ],
};

const privacyAr: Doc = {
  title: "سياسة الخصوصية",
  updated: "الإصدار 1.0",
  intro:
    "توضح هذه السياسة بلغة واضحة ما يحدث لبياناتك عند استخدام الموقع. الخلاصة: الملفات التي تعالجها الأدوات يتعامل معها متصفحك أنت، لا خوادمنا.",
  sections: [
    {
      heading: "الملفات التي تعالجها",
      body: [
        "كل أداة في هذا الإصدار تعمل داخل متصفحك. عند ضغط صورة أو دمج ملف PDF أو تحويل مستند أو إنشاء رمز QR، يُقرأ الملف من جهازك، وتعالجه الصفحة محليًا، ثم يُحفظ مرة أخرى على جهازك. لا يُرفع الملف إلى أي مكان.",
        "وبما أنه لا يُرفع شيء، فلا نحتفظ بأي نسخة من ملفك، ولا يمكننا الاطلاع عليه أو استعادته إن فُقد. إغلاق التبويب يمحو كل شيء.",
      ],
    },
    {
      heading: "ما نجمعه فعلًا",
      body: [
        "سجلات خادم عادية من مزود الاستضافة (عنوان IP، الصفحة المطلوبة، نوع المتصفح، والوقت) وهي ضرورية لتقديم الموقع ومنع إساءة الاستخدام.",
        "إحصاءات استخدام مجمّعة ومجهولة الهوية — أي الأدوات تُفتح وكم مرة — لمعرفة ما يجب تحسينه. هذه العدادات لا تحتوي محتوى الملفات ولا أسماءها.",
      ],
    },
    {
      heading: "الكوكيز والتخزين المحلي",
      body: [
        "نستخدم التخزين المحلي في المتصفح لغرض واحد: تذكّر اختيارك للوضع الفاتح أو الداكن ولغتك المفضلة. لا نضع أي كوكيز إعلانية في هذا الإصدار.",
        "وإذا غيّرت الإعلانات أو التحليلات ذلك في إصدار لاحق، فسيُحدَّث هذا النص ويُعلن التغيير قبل تطبيقه.",
      ],
    },
    {
      heading: "الأطراف الأخرى",
      body: [
        "يُقدَّم الموقع عبر مزود استضافة، وقد يُحمّل خطوط الويب من شبكة خطوط عامة. هؤلاء يرون الطلب كما يرونه من أي موقع آخر يستخدم خدماتهم.",
        "لا نبيع البيانات الشخصية ولا نؤجرها ولا نشاركها، لأننا لا نبني ملفات تعريف عنك أصلًا.",
      ],
    },
    {
      heading: "الميزات المستقبلية على الخادم",
      body: [
        "ستضيف الإصدارات القادمة ميزات تحتاج خادمًا بالفعل مثل OCR للملفات الممسوحة ضوئيًا. وعندها ستكون الملفات المرسلة مشفّرة أثناء النقل، ومحفوظة مؤقتًا، ومحذوفة تلقائيًا، ولا تُستخدم لأي غرض آخر — وستوضح صفحات الأدوات المعنية ذلك بشكل صريح.",
      ],
    },
    {
      heading: "حقوقك والتواصل",
      body: [
        `لأي سؤال عن البيانات، أو لطلب حذف ما يمكن أن يعرّفك، راسلنا على ${site.contactEmail}. نجيب في وقت معقول، ولا نطلب إنشاء حساب لفعل ذلك.`,
      ],
    },
  ],
};

const termsEn: Doc = {
  title: "Terms of Use",
  updated: "Version 1.0",
  intro:
    "These terms cover your use of this website and its tools. By using the site you accept them. If you do not accept them, please do not use the site.",
  sections: [
    {
      heading: "The service",
      body: [
        "The tools are provided as an online utility, free of charge in this version, with no guarantee of availability at any particular moment.",
        "Processing happens in your browser, so results depend on your device, browser version and the file itself. Always check an important result before relying on it.",
      ],
    },
    {
      heading: "Your responsibilities",
      body: [
        "Only process files you have the right to process. Do not use the site for illegal content, for malware, or to infringe anyone's rights.",
        "Do not attempt to overload, scrape abusively or interfere with the site, and do not present the tools as your own product.",
      ],
    },
    {
      heading: "No warranty",
      body: [
        "The tools are provided \"as is\", without warranties of any kind, including fitness for a particular purpose. For example, a compressed PDF may differ slightly from the original, and a converted document may lose complex formatting.",
        "Always keep your original file. We cannot recover it for you.",
      ],
    },
    {
      heading: "Limitation of liability",
      body: [
        "To the extent permitted by law, we are not liable for indirect or consequential loss, lost data or lost profit arising from use of the site, including cases where a tool produces an unexpected result or is unavailable.",
      ],
    },
    {
      heading: "Changes",
      body: [
        "Features, limits and these terms may change as the platform grows. Material changes will be reflected on this page with an updated version number.",
      ],
    },
  ],
};

const termsAr: Doc = {
  title: "شروط الاستخدام",
  updated: "الإصدار 1.0",
  intro:
    "تنظّم هذه الشروط استخدامك لهذا الموقع وأدواته. استخدامك للموقع يعني قبولك لها، وإن لم تقبلها فيرجى عدم استخدام الموقع.",
  sections: [
    {
      heading: "الخدمة",
      body: [
        "الأدوات مُقدَّمة كخدمة استخدام أونلاين، مجانية في هذا الإصدار، دون ضمان لتوفرها في لحظة معينة.",
        "المعالجة تتم داخل متصفحك، لذا تعتمد النتائج على جهازك وإصدار متصفحك والملف نفسه. تحقق دائمًا من أي نتيجة مهمة قبل الاعتماد عليها.",
      ],
    },
    {
      heading: "مسؤولياتك",
      body: [
        "لا تعالج إلا الملفات التي تملك حق معالجتها، ولا تستخدم الموقع في محتوى غير قانوني أو برمجيات ضارة أو انتهاك حقوق الآخرين.",
        "لا تحاول إرباك الموقع أو سحبه بشكل مسيء أو التأثير على عمله، ولا تقدّم الأدوات كمنتج تابع لك.",
      ],
    },
    {
      heading: "بدون ضمانات",
      body: [
        "الأدوات مُقدَّمة «كما هي» دون أي ضمانات، بما في ذلك ملاءمتها لغرض معين. فمثلًا قد يختلف ملف PDF المضغوط قليلًا عن الأصل، وقد يفقد المستند المحوَّل بعض التنسيقات المعقدة.",
        "احتفظ دائمًا بملفك الأصلي، فنحن لا نستطيع استعادته لك.",
      ],
    },
    {
      heading: "حدود المسؤولية",
      body: [
        "بالقدر الذي يسمح به القانون، لا نتحمل المسؤولية عن أي خسارة غير مباشرة أو تبعية، أو فقدان بيانات أو أرباح، ناتجة عن استخدام الموقع، بما في ذلك عندما تعطي أداة نتيجة غير متوقعة أو تكون غير متاحة.",
      ],
    },
    {
      heading: "التغييرات",
      body: [
        "قد تتغير الميزات والحدود وهذه الشروط مع نمو المنصة، وستنعكس التغييرات الجوهرية على هذه الصفحة مع تحديث رقم الإصدار.",
      ],
    },
  ],
};

const cookiesEn: Doc = {
  title: "Cookie Policy",
  updated: "Version 1.0",
  intro: "What this site stores in your browser, and why.",
  sections: [
    {
      heading: "What we store",
      body: [
        "One local storage entry for your theme choice (light or dark) and one for your language preference. Both are functional: without them the site would forget your choice on every page.",
        "No advertising, tracking or profiling cookies are set in this version.",
      ],
    },
    {
      heading: "What local storage is not",
      body: [
        "Local storage is not a tracking mechanism. It stays in your browser, is not readable by other websites, and is not sent to our servers with each request.",
      ],
    },
    {
      heading: "How to remove it",
      body: [
        "Clearing site data in your browser settings removes everything we store. Nothing breaks — the site will simply fall back to your system theme and the default language.",
      ],
    },
  ],
};

const cookiesAr: Doc = {
  title: "سياسة الكوكيز",
  updated: "الإصدار 1.0",
  intro: "ما يخزّنه هذا الموقع في متصفحك، ولماذا.",
  sections: [
    {
      heading: "ما نخزّنه",
      body: [
        "قيمة واحدة في التخزين المحلي لاختيار الوضع (فاتح أو داكن) وقيمة أخرى لتفضيل اللغة. وكلاهما وظيفي: بدونها سينسى الموقع اختيارك في كل صفحة.",
        "لا نضع أي كوكيز إعلانية أو تتبعية أو لبناء ملفات تعريف في هذا الإصدار.",
      ],
    },
    {
      heading: "وما ليس التخزين المحلي",
      body: [
        "التخزين المحلي ليس وسيلة تتبع: يبقى داخل متصفحك، ولا تستطيع مواقع أخرى قراءته، ولا يُرسل إلى خوادمنا مع كل طلب.",
      ],
    },
    {
      heading: "كيف تحذفه",
      body: [
        "مسح بيانات الموقع من إعدادات المتصفح يحذف كل ما نخزّنه. ولن يتعطل شيء — سيعود الموقع ببساطة إلى وضع نظامك واللغة الافتراضية.",
      ],
    },
  ],
};

export const aboutCopy: Record<Locale, typeof enAbout> = { en: enAbout, ar: arAbout };
export const pricingCopy: Record<Locale, typeof enPricing> = { en: enPricing, ar: arPricing };
export const contactText: Record<Locale, typeof contactCopy.en> = { en: contactCopy.en, ar: contactCopy.ar };
export const legalDocs: Record<Locale, { privacy: Doc; terms: Doc; cookies: Doc }> = {
  en: { privacy: privacyEn, terms: termsEn, cookies: cookiesEn },
  ar: { privacy: privacyAr, terms: termsAr, cookies: cookiesAr },
};
