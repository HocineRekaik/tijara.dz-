import { config } from 'dotenv';

config();

const PUBLIC_STORE_FIELDS = [
  'id',
  'slug',
  'title',
  'category',
  'subcategory',
  'description',
  'wilaya',
  'city',
  'profileImageUrl',
  'galleryImages',
  'gallery',
  'logo',
  'image',
  'tags',
  'website',
  'instagram',
  'facebook',
  'tiktok',
  'whatsapp',
  'phone',
  'email',
  'createdAt',
  'status',
];

const CACHE_TTL_MS = 45000;
let storesCache = { time: 0, data: null };
let reviewsCache = { time: 0, data: null };

export const isFirestoreConfigured = () =>
  Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_API_KEY);

const firestoreEndpoint = () => {
  if (!isFirestoreConfigured()) {
    throw new Error('FIREBASE_PROJECT_ID / FIREBASE_API_KEY are not configured on the server.');
  }
  return `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery?key=${process.env.FIREBASE_API_KEY}`;
};

const decodeValue = (value) => {
  if (value == null) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return Number(value.doubleValue);
  if (value.booleanValue !== undefined) return Boolean(value.booleanValue);
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.mapValue !== undefined) return decodeFields(value.mapValue.fields || {});
  if (value.arrayValue !== undefined) return (value.arrayValue.values || []).map(decodeValue);
  return null;
};

const decodeFields = (fields) => {
  const out = {};
  for (const key of Object.keys(fields || {})) {
    out[key] = decodeValue(fields[key]);
  }
  return out;
};

const sanitizeStore = (raw) => {
  const out = { id: raw.id };
  for (const field of PUBLIC_STORE_FIELDS) {
    if (raw[field] !== undefined && raw[field] !== null) out[field] = raw[field];
  }
  return out;
};

const runStoresQuery = async ({ status = 'approved', limit } = {}) => {
  const where = {
    fieldFilter: {
      field: { fieldPath: 'status' },
      op: 'EQUAL',
      value: { stringValue: status },
    },
  };
  const body = { structuredQuery: { from: [{ collectionId: 'stores' }], where } };
  if (limit) body.structuredQuery.limit = limit;
  const response = await fetch(firestoreEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Firestore read failed.');
  }
  return (Array.isArray(payload) ? payload : [])
    .filter((entry) => entry?.document)
    .map((entry) => {
      const id = entry.document.name.split('/').pop();
      return { id, ...decodeFields(entry.document.fields || {}) };
    });
};

const getApprovedStores = async ({ fresh = false } = {}) => {
  const now = Date.now();
  if (!fresh && storesCache.data && now - storesCache.time < CACHE_TTL_MS) {
    return storesCache.data;
  }
  const stores = await runStoresQuery({ status: 'approved' });
  storesCache = { time: now, data: stores };
  return stores;
};

const getApprovedReviews = async ({ fresh = false } = {}) => {
  const now = Date.now();
  if (!fresh && reviewsCache.data && now - reviewsCache.time < CACHE_TTL_MS) {
    return reviewsCache.data;
  }
  const body = { structuredQuery: { from: [{ collectionId: 'reviews' }] } };
  const response = await fetch(firestoreEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Firestore read failed.');
  }
  const reviews = (Array.isArray(payload) ? payload : [])
    .filter((entry) => entry?.document)
    .map((entry) => {
      const id = entry.document.name.split('/').pop();
      return { id, ...decodeFields(entry.document.fields || {}) };
    })
    .filter((review) => review.deleted !== true);
  reviewsCache = { time: now, data: reviews };
  return reviews;
};

const withRatings = (stores, reviews) => {
  const byStore = {};
  for (const review of reviews) {
    const key = review.storeId;
    if (!key) continue;
    if (!byStore[key]) byStore[key] = [];
    const rating = Number(review.rating || 0);
    if (rating > 0) byStore[key].push(rating);
  }
  return stores.map((store) => {
    const ratings = byStore[store.id] || [];
    const rating = ratings.length > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 0;
    return { ...sanitizeStore(store), rating, reviewCount: ratings.length };
  });
};

const tokenize = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

export const executeFirestoreTool = async (name, args = {}) => {
  const reviews = await getApprovedReviews();
  const approved = await getApprovedStores();
  const rated = withRatings(approved, reviews);

  if (name === 'search_by_keyword') {
    const keyword = String(args.keyword || '').trim();
    const tokens = tokenize(keyword);
    if (!tokens.length) return { stores: [], count: 0 };
    const matched = rated
      .map((store) => {
        const haystack = tokenize([store.title, store.description, store.category, store.subcategory, store.wilaya, store.city, ...(store.tags || [])].join(' '));
        const score = tokens.reduce((sum, token) => (haystack.includes(token) ? sum + 1 : sum), 0);
        return { store, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || b.store.rating - a.store.rating)
      .map((entry) => entry.store)
      .slice(0, Math.max(1, Math.min(Number(args.limit) || 6, 10)));
    return { stores: matched, count: matched.length };
  }

  if (name === 'search_by_category') {
    const needle = tokenize(String(args.category || '').trim()).join(' ');
    const matched = rated
      .filter((store) => {
        const categoryText = tokenize(store.category).join(' ');
        const subcategoryText = tokenize(store.subcategory).join(' ');
        return categoryText.includes(needle) || subcategoryText.includes(needle);
      })
      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
      .slice(0, Math.max(1, Math.min(Number(args.limit) || 8, 12)));
    return { stores: matched, count: matched.length };
  }

  if (name === 'search_by_location') {
    const wilayaNeedle = tokenize(String(args.wilaya || '').trim()).join(' ');
    const cityNeedle = tokenize(String(args.city || '').trim()).join(' ');
    const matches = rated.filter((store) => {
      const storeWilaya = tokenize(store.wilaya || '').join(' ');
      const storeCity = tokenize(store.city || '').join(' ');
      if (wilayaNeedle && cityNeedle) return storeWilaya.includes(wilayaNeedle) && storeCity.includes(cityNeedle);
      if (wilayaNeedle) return storeWilaya.includes(wilayaNeedle);
      if (cityNeedle) return storeCity.includes(cityNeedle);
      return false;
    }).slice(0, Math.max(1, Math.min(Number(args.limit) || 8, 12)));
    return { stores: matches, count: matches.length };
  }

  if (name === 'top_rated_stores') {
    const limit = Math.max(1, Math.min(Number(args.limit) || 5, 10));
    const sorted = [...rated].sort(
      (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount || String(a.title).localeCompare(String(b.title))
    ).slice(0, limit);
    return { stores: sorted, count: sorted.length };
  }

  if (name === 'store_details') {
    const byId = String(args.storeId || '').trim();
    const bySlug = String(args.slug || '').trim();
    const match = rated.find((store) => (byId && store.id === byId) || (bySlug && store.slug === bySlug))
      || (bySlug ? rated.find((store) => store.id === bySlug) : null);
    if (!match) return { store: null, found: false };
    return { store: match, found: true };
  }

  throw new Error(`Unknown tool: ${name}`);
};

export const firestoreToolDefinitions = [
  {
    name: 'search_by_keyword',
    description: 'Search approved online stores by a product name or any keyword (e.g. "iphone", "clothes", "electronics").',
    parameters: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Product or keyword to search for.' },
        limit: { type: 'integer', description: 'Maximum number of results (default 6).' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'search_by_category',
    description: 'Search approved online stores by category (e.g. إلكترونيات, ملابس, الإلكترونيات).',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Category name to search.' },
        limit: { type: 'integer', description: 'Maximum number of results (default 8).' },
      },
      required: ['category'],
    },
  },
  {
    name: 'search_by_location',
    description: 'Search approved online stores by Algerian wilaya and/or city (e.g. "Oran", "Alger", "Sétif").',
    parameters: {
      type: 'object',
      properties: {
        wilaya: { type: 'string', description: 'Wilaya name (e.g. وهران, Oran).' },
        city: { type: 'string', description: 'City name (optional).' },
        limit: { type: 'integer', description: 'Maximum number of results (default 8).' },
      },
    },
  },
  {
    name: 'top_rated_stores',
    description: 'Get the highest-rated approved online stores based on user reviews.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Maximum number of results (default 5).' },
      },
    },
  },
  {
    name: 'store_details',
    description: 'Get full details of a single approved online store by its id or slug.',
    parameters: {
      type: 'object',
      properties: {
        storeId: { type: 'string', description: 'Firestore document id of the store.' },
        slug: { type: 'string', description: 'Slug or id of the store.' },
      },
    },
  },
];