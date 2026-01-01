import { ThermosLength, ThermosShape } from "./types";

export const ARABIC_LABELS = {
  appTitle: "مصمم باس بلاست الذكي", // BasPlast Smart Designer
  appSubtitle: "مولد تصاميم الترامس", // Thermos Design Generator
  navGenerate: "تصميم جديد",
  navHistory: "السجل",
  
  // Form
  promptLabel: "وصف التصميم",
  promptPlaceholder: "مثال: ترمس عصري بلون ذهبي مع نقوش إسلامية...",
  enhanceBtn: "تحسين الوصف بالذكاء الاصطناعي ✨",
  attributesSection: "خصائص المنتج",
  lengthLabel: "الحجم / الطول",
  shapeLabel: "الشكل الهيكل",
  colorLabel: "اللون الأساسي",
  uploadLabel: "صورة مرجعية (اختياري)",
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
  }
};

export const MOCK_COLORS = [
  { name: "أبيض", hex: "#FFFFFF" },
  { name: "أسود", hex: "#000000" },
  { name: "فضي", hex: "#C0C0C0" },
  { name: "ذهبي", hex: "#D4AF37" },
  { name: "أزرق باس بلاست", hex: "#0369a1" },
  { name: "أحمر داكن", hex: "#8B0000" },
  { name: "بيج", hex: "#F5F5DC" },
  { name: "رمادي معدني", hex: "#708090" },
];