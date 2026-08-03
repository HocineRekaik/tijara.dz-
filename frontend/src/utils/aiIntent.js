const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, '')
    .trim();

const CATEGORY_KEYWORDS = [
  {
    name: 'المنتجات الرياضية',
    keywords: ['رياضي', 'رياضة', 'كرة', 'حذاء', 'أحذية', 'لياقة', 'جري', 'sport', 'sports', 'ball', 'shoes', 'fitness'],
  },
  {
    name: 'الهواتف',
    keywords: ['هاتف', 'هواتف', 'جوال', 'جوالات', 'موبايل', 'موبايلات', 'iphone', 'ايفون', 'samsung', 'galaxy', 'xiaomi', 'شاومي', 'nokia', 'نوكيا', 'huawei', 'هواوي', 'oppo', 'realme', 'infinix', 'phone', 'mobile'],
  },
  {
    name: 'الإلكترونيات',
    keywords: ['إلكتروني', 'الكتروني', 'كمبيوتر', 'حاسوب', 'لابتوب', 'شاشة', 'تلفاز', 'تلفزيون', 'طابعة', 'كاميرا', 'مكبر', 'electronic', 'electronics', 'computer', 'laptop', 'tv', 'screen', 'camera', 'printer'],
  },
  {
    name: 'الإكسسوارات',
    keywords: ['سماعات', 'سماعة', 'شاحن', 'إكسسوار', 'اكسسوار', 'نظارات', 'ساعة', 'ساعات', 'حقيبة', 'خاتم', 'سلسلة', 'أسوارة', 'headphone', 'earphone', 'charger', 'accessory', 'accessories', 'watch', 'bag', 'ring'],
  },
  {
    name: 'الملابس',
    keywords: ['ملابس', 'قميص', 'فستان', 'جاكيت', 'بنطلون', 'جينز', 'بدلة', 'بيجاما', 'شورت', 'clothes', 'shirt', 'dress', 'jacket', 'jeans', 'tshirt', 't-shirt'],
  },
];

export const inferCategory = (product = '') => {
  const normalized = normalizeText(product);
  if (!normalized) return '';
  for (const group of CATEGORY_KEYWORDS) {
    if (group.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))) {
      return group.name;
    }
  }
  return '';
};

const TRIGGER_WORDS = ['أريد', 'أبحث', 'ابحث', 'أحتاج', 'أرغب', 'اشتري', 'أشتري', 'شراء', 'buy', 'want', 'looking for'];

const buildTriggerRegex = () => {
  const triggers = TRIGGER_WORDS.map(normalizeText).join('|');
  return new RegExp(
    `(?:${triggers})\\s+(?:عن\\s+)?(?:to\\s+)?(?:an\\s+|a\\s+|some\\s+|ك\\s+|متجر\\s+)?([\\p{L}\\p{N}\\s-]+?)(?=\\s+في|\\s+ب\\s|\\s+بمدينة|\\s+بالمدينة|\\s+in\\s+|\\s+for\\s+|\\s+متجر|$)`,
    'u'
  );
};

const TRIGGER_REGEX = buildTriggerRegex();

export const extractIntentFromQuery = (query = '') => {
  const text = normalizeText(query);

  const productMatch = text.match(TRIGGER_REGEX) || [];
  const categoryMatch = text.match(/(?:تصنيف|مجال|فئة|نوع|category|category for)\s+([\p{L}\p{N}\s-]+)/u);
  const wilayaMatch = text.match(/(?:في\s+|ب\s+|بمدينة|بالمدينة|in\s+|at\s+)([\p{L}\p{N}\s-]+?)(?=\s+(?:مدينة|المدينة|city)|$)/u);
  const cityMatch = text.match(/(?:مدينة|المدينة|city\s+of\s+|in\s+)([\p{L}\p{N}\s-]+)/u);

  const rawProduct = productMatch[1]?.trim() || '';
  const STOP_WORDS = new Set(
    [
      'to', 'for', 'the', 'an', 'a', 'some', 'me', 'i', 'want', 'buy', 'please', 'also',
      'شراء', 'بيع', 'لبيع', 'أشتري', 'اشتري', 'أريد', 'أرغب', 'أحتاج', 'أبحث', 'ابحث',
      'بحث', 'عن', 'متجر', 'متاجر', 'متجرا', 'أردت', 'اشتريت', 'نشتري', 'يبيع',
    ].map(normalizeText)
  );
  const product = rawProduct
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word))
    .slice(0, 2)
    .join(' ');

  const category = categoryMatch?.[1]?.trim() || inferCategory(product) || 'عام';
  const wilaya = wilayaMatch?.[1]?.trim() || '';
  const city = cityMatch?.[1]?.trim() || '';
  const preferences = text.includes('مرتفع') || text.includes('جيدة') || text.includes('ممتاز')
    ? 'تقييم مرتفع'
    : '';

  return {
    product: product || 'منتج',
    category: category || 'عام',
    wilaya: wilaya || '',
    city: city || '',
    preferences,
  };
};

export const buildFallbackText = (intent) =>
  `سأبحث عن ${intent.product || 'المنتجات'} في ${intent.wilaya || 'الجزائر'} و سأركز على المتاجر الإلكترونية المعتمدة.`;
