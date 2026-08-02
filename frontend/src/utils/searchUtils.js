const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();

const KEYWORD_EXPANSIONS = {
  حذاء: ['أحذية', 'نعال', 'ملابس'],
  أحذية: ['حذاء', 'نعال', 'ملابس'],
  نعال: ['حذاء', 'أحذية'],
  فستان: ['فساتين', 'ملابس', 'أزياء'],
  فساتين: ['فستان', 'ملابس', 'أزياء'],
  قفطان: ['ملابس', 'أزياء'],
  ملابس: ['أزياء', 'فستان', 'فساتين', 'قميص', 'جاكيت'],
  قميص: ['ملابس'],
  جاكيت: ['ملابس'],
  هاتف: ['جوال', 'موبايل', 'هواتف', 'ذكي'],
  جوال: ['هاتف', 'موبايل', 'هواتف'],
  موبايل: ['هاتف', 'جوال', 'هواتف'],
  آيفون: ['هاتف', 'موبايل'],
  سامسونغ: ['هاتف', 'جوال'],
  شاومي: ['هاتف'],
  لابتوب: ['كمبيوتر', 'حاسوب', 'إلكترونيات'],
  كمبيوتر: ['لابتوب', 'حاسوب', 'إلكترونيات'],
  حاسوب: ['لابتوب', 'كمبيوتر', 'إلكترونيات'],
  سماعات: ['سماعة', 'إلكترونيات'],
  إلكترونيات: ['لابتوب', 'كمبيوتر', 'شاشة', 'طابعة', 'كاميرا'],
  ساعة: ['ساعات', 'إكسسوارات'],
  ساعات: ['ساعة', 'إكسسوارات'],
  حقيبة: ['إكسسوارات'],
  إكسسوارات: ['ساعة', 'حقيبة', 'نظارة'],
  نظارة: ['إكسسوارات'],
  مجوهرات: ['إكسسوارات', 'عقد', 'أقراط'],
  رياضة: ['رياضي', 'لياقة', 'جيم', 'جري', 'كرة'],
  كرة: ['رياضي', 'رياضة'],
  جري: ['رياضة', 'أحذية'],
  لياقة: ['رياضة', 'جيم'],
};

const getExpansion = (word) => {
  const direct = KEYWORD_EXPANSIONS[word];
  if (direct) return direct;
  const normalized = KEYWORD_EXPANSIONS[normalize(word)];
  if (normalized) return normalized;
  const byNormalizedKey = Object.keys(KEYWORD_EXPANSIONS).find((key) => normalize(key) === normalize(word));
  return byNormalizedKey ? KEYWORD_EXPANSIONS[byNormalizedKey] : [];
};

const getStoreSearchableText = (store) =>
  normalize(
    `${store.title} ${store.description || ''} ${store.category || ''} ${store.subcategory || ''} ${store.wilaya || ''} ${store.city || ''} ${(store.tags || []).join(' ')}`
  );

export const expandSearchTerms = (query) => {
  const words = normalize(query).split(' ').filter(Boolean);
  const terms = new Set(words);
  words.forEach((word) => {
    getExpansion(word).forEach((term) => terms.add(normalize(term)));
  });
  return Array.from(terms);
};

export const matchesStore = (store, query) => {
  if (!query || !query.trim()) {
    return true;
  }
  const words = normalize(query).split(' ').filter(Boolean);
  const text = getStoreSearchableText(store);
  return words.every((word) => {
    const variants = [word, ...getExpansion(word).map(normalize)];
    return variants.some((variant) => text.includes(variant));
  });
};

export const getSuggestionPool = (categoriesList, stores) => {
  const pool = [];
  const seen = new Set();
  const push = (label, type) => {
    const trimmed = String(label || '').trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      pool.push({ label: trimmed, type });
    }
  };

  categoriesList.forEach((cat) => {
    push(cat.name, 'تصنيف');
    (cat.subcategories || []).forEach((sub) => push(sub, 'فئة فرعية'));
  });

  stores.forEach((store) => {
    if (store.category) {
      push(store.category, 'تصنيف');
    }
    if (store.subcategory) {
      push(store.subcategory, 'فئة فرعية');
    }
    (store.tags || []).forEach((tag) => push(tag, 'كلمة مفتاحية'));
  });

  return pool;
};

export const filterSuggestions = (pool, query, limit = 8) => {
  if (!query || !query.trim()) {
    return pool.slice(0, limit);
  }
  const terms = expandSearchTerms(query);
  return pool.filter((item) => terms.some((term) => normalize(item.label).includes(term))).slice(0, limit);
};
