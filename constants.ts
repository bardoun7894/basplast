import { ThermosLength, ThermosShape, HeadHandleDecoration } from "./types";

export const ARABIC_LABELS = {
  appTitle: "مصمم باس أتيليه الذكي",
  appSubtitle: "مولد تصاميم الترامس",
  navGenerate: "تصميم المنتج",
  navAdStudio: "استوديو الإعلانات",
  navHistory: "السجل",

  // Form
  promptLabel: "وصف التصميم",
  promptPlaceholder: "مثال: ترمس عصري بلون ذهبي مع نقوش إسلامية...",
  enhanceBtn: "تحسين الوصف بالذكاء الاصطناعي ✨",
  attributesSection: "خصائص المنتج",
  lengthLabel: "الحجم / الطول",
  shapeLabel: "الشكل الهيكل",
  colorLabel: "اللون الأساسي",
  uploadLabel: "صورة مرجعية (مطلوبة)",  // Changed to required
  uploadBtn: "رفع صورة",
  generateBtn: "توليد التصاميم",
  generating: "جاري العمل...",

  // Results
  resultsTitle: "النتائج المقترحة",
  download: "تحميل",
  copy: "نسخ الرابط",
  useAsReference: "استخدم كنموذج",

  // History
  historyTitle: "سجل التصاميم السابقة",
  noHistory: "لا يوجد سجل تصاميم حتى الآن",
  dateLabel: "التاريخ",
  viewDetails: "عرض التفاصيل",

  // Attributes
  shapes: {
    [ThermosShape.Classic]: "كلاسيكي",
    [ThermosShape.Slim]: "نحيف / عصري",
    [ThermosShape.Wide]: "فوهة واسعة",
    [ThermosShape.Patterned]: "منقوش / هندسي",
    [ThermosShape.Ergonomic]: "مقبض مريح"
  },
  lengths: {
    [ThermosLength.Short]: "صغير (٠.٥ لتر)",
    [ThermosLength.Medium]: "وسط (١.٠ لتر)",
    [ThermosLength.Long]: "كبير (١.٥ لتر+)"
  },
  decorationLabel: "شكل المنتج الجديد",
  decorations: {
    [HeadHandleDecoration.None]: "بدون",
    [HeadHandleDecoration.Waves]: "تموجات",
    [HeadHandleDecoration.Crown]: "تاج",
    [HeadHandleDecoration.Zigzag]: "خطوط متعرجة",
    [HeadHandleDecoration.Sculpted]: "حواف منحوتة",
    [HeadHandleDecoration.Grooves]: "أخاديد"
  },
  modelLabel: "نموذج الذكاء الاصطناعي",
  models: {
    'seedream/4.5-edit': "Seedream Edit ⭐ (تعديل دقيق - يحافظ على الشكل)",
    'flux-2/flex-image-to-image': "Flux Flex (تعديل متوسط - تغيير جزئي)",
    'flux-kontext-pro': "Flux Kontext Pro (تعديل شامل - إعادة تصميم)",
    'flux-kontext-max': "Flux Kontext Max (أعلى جودة 4K - أغلى)",
    'nano-banana-pro': "Nano Banana Pro 🍌 (إبداعي - نقوش عربية وإسلامية)"
  }
};

export const MOCK_COLORS = [
  { name: "ذهبي", hex: "#D4AF37" },
  { name: "فضي", hex: "#C0C0C0" },
  { name: "أبيض", hex: "#FFFFFF" },
  { name: "ذهبي روز", hex: "#B76E79" },
];