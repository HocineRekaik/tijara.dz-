const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, '')
    .trim();

const buildTokens = (value = '') =>
  normalizeText(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

export const rankStoresForQuery = (stores = [], intent = {}) => {
  const product = normalizeText(intent.product || '');
  const category = normalizeText(intent.category || '');
  const wilaya = normalizeText(intent.wilaya || '');
  const city = normalizeText(intent.city || '');
  const preferences = normalizeText(intent.preferences || '');
  const productTokens = buildTokens(product);
  const isGenericCategory = category === 'عام' || category === '';

  return stores
    .map((store) => {
      const storeText = [
        store.title,
        store.description,
        store.category,
        store.subcategory,
        store.wilaya,
        store.city,
        store.about,
        ...(store.tags || []),
        ...(store.products || []).map((item) => item.name),
      ].join(' ');

      const normalizedStoreText = normalizeText(storeText);
      const storeTokens = new Set(buildTokens(storeText));

      let score = 0;
      if (!isGenericCategory) {
        if (
          normalizeText(store.category).includes(category) ||
          normalizeText(store.subcategory).includes(category)
        ) {
          score += 6;
        } else if (normalizedStoreText.includes(category)) {
          score += 3;
        }
      }

      const matchedTokens = productTokens.filter((token) => storeTokens.has(token));
      if (productTokens.length > 0 && matchedTokens.length > 0) {
        score += (matchedTokens.length / productTokens.length) * 6;
      }

      if (wilaya && normalizeText(store.wilaya).includes(wilaya)) {
        score += 3;
      }
      if (city && normalizeText(store.city).includes(city)) {
        score += 2;
      }
      if (preferences && normalizedStoreText.includes(preferences)) {
        score += 1;
      }

      const rating = Number(store.rating || 0);
      const reviewCount = Number(store.reviewCount || 0);

      return {
        store,
        score: score + rating * 0.4 + reviewCount * 0.04,
      };
    })
    .sort((left, right) => right.score - left.score || right.store.rating - left.store.rating || right.store.reviewCount - left.store.reviewCount)
    .map(({ store }) => store);
};
