const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
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

  return stores
    .map((store) => {
      const storeText = [
        store.title,
        store.description,
        store.category,
        store.wilaya,
        store.city,
        store.subcategory,
        ...(store.tags || []),
        ...(store.products || []).map((item) => item.name),
      ].join(' ');

      const normalizedStoreText = normalizeText(storeText);
      const score = [
        category && normalizedStoreText.includes(category) ? 4 : 0,
        category && normalizeText(store.category).includes(category) ? 2 : 0,
        product && normalizedStoreText.includes(product) ? 4 : 0,
        wilaya && normalizeText(store.wilaya).includes(wilaya) ? 3 : 0,
        city && normalizeText(store.city).includes(city) ? 2 : 0,
        preferences && normalizedStoreText.includes(preferences) ? 1 : 0,
      ].reduce((sum, value) => sum + value, 0);

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
