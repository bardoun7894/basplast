import { ThermosLength, ThermosShape } from "./types";

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
  modelLabel: "نموذج الذكاء الاصطناعي",
  models: {
    'gpt-image/gpt-4.1-image': "GPT-4o Image (تعديل الصور)",
    'flux-kontext-pro': "Flux Kontext (تعديل احترافي)",
    'flux-2/flex-image-to-image': "Flux Flex (صورة إلى صورة)",
    'ideogram/v3-remix': "Ideogram Remix (ريميكس فني)",
    'midjourney/mj-api': "Midjourney (جديد)"
  }
};

export const MOCK_COLORS = [
  { name: "ذهبي", hex: "#D4AF37" },
  { name: "فضي", hex: "#C0C0C0" },
  { name: "أبيض", hex: "#FFFFFF" },
  { name: "ذهبي روز", hex: "#B76E79" },
];