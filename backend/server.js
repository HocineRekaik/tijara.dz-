import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { executeFirestoreTool, firestoreToolDefinitions, isFirestoreConfigured } from './firestoreTools.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
app.use(express.json({ limit: '30mb' }));

const products = [
  { id: 1, name: 'Premium Coffee Beans', category: 'Beverages', price: 18.99, stock: 45 },
  { id: 2, name: 'Stainless Steel Kettle', category: 'Kitchenware', price: 49.99, stock: 12 },
  { id: 3, name: 'Organic Matcha Powder', category: 'Beverages', price: 29.99, stock: 25 },
  { id: 4, name: 'Ceramic Coffee Mug', category: 'Kitchenware', price: 14.99, stock: 80 },
];

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const extractIntentFromQuery = (query = '') => {
  const text = normalizeText(query);

  const productMatch = text.match(/(?:أريد|أبحث|ابحث|أحتاج|أرغب|اشتري|أشتري|شراء|buy|want|looking for)\s+(?:عن\s+)?(?:to\s+)?(?:an\s+|a\s+|some\s+|ك\s+|متجر\s+)?([\p{L}\p{N}\s-]+?)(?=\s+في|\s+ب\s|\s+بمدينة|\s+بالمدينة|\s+in\s+|\s+for\s+|\s+متجر|$)/u) || [];
  const categoryMatch = text.match(/(?:تصنيف|مجال|فئة|نوع|category|category for)\s+([\p{L}\p{N}\s-]+)/u);
  const wilayaMatch = text.match(/(?:في\s+|ب\s+|بمدينة|بالمدينة|in\s+|at\s+)([\p{L}\p{N}\s-]+?)(?=\s+(?:مدينة|المدينة|city)|$)/u);
  const cityMatch = text.match(/(?:مدينة|المدينة|city\s+of\s+|in\s+)([\p{L}\p{N}\s-]+)/u);

  // Clean the captured product: strip common English fillers, keep 1-2 tokens.
  const rawProduct = productMatch[1]?.trim() || '';
  let product = rawProduct
    .replace(/\b(?:to|for|the|an|a|some|me|i|want|buy|please|also)\b/g, ' ')
    .trim();
  if (product.includes(' ')) {
    product = product.split(/\s+/).slice(0, 2).join(' ');
  }

  const category = categoryMatch?.[1]?.trim() || '';
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

const buildFallbackIntent = (query) => {
  const intent = extractIntentFromQuery(query);
  return {
    responseText: `سأبحث عن ${intent.product || 'المنتجات'} في ${intent.wilaya || 'الجزائر'} و سأركز على المتاجر الإلكترونية المعتمدة.`,
    extracted: intent,
  };
};

const askOpenAI = async (query) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: "You are Tijara AI for Algerian e-commerce stores. Extract the user's product request into Arabic JSON fields: product, category, wilaya, city, preferences. Also provide a natural Arabic responseText for the user. Never invent e-commerce stores or data.",
        },
        {
          role: 'user',
          content: query,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error('AI service unavailable');
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI service returned no content');
  }

  return JSON.parse(content);
};

const askGemini = async (message) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in the backend .env file');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: message }] }],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Gemini API error (${response.status})`);
  }

  const text =
    payload?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '';
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }
  return text;
};

const SYSTEM_PROMPT = [
  'You are Tijara AI, a helpful assistant that finds Algerian e-commerce stores (pages) on Tijara.dz.',
  'Use ONLY the registered tools to look up real, approved stores. Never invent stores, ratings, or information.',
  'Tools only return approved stores. Search in French, Arabic, or English as the user does.',
  'Before answering a user request, decide which tool to call. Call at most 2 tools total.',
  'When you have the tool results:',
  '- Summarize and answer naturally in the user’s language (French/Arabic/English).',
  '- Be honest: if no results are found, say none currently matches.',
  '- Provide the matching “id” and short reason for each proposed store.',
  '- Never invent store details, ratings, or products.',
].join(' ');

const runGeminiAgent = async (query) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in the backend .env file');
  }
  if (!isFirestoreConfigured()) {
    throw new Error('Firestore is not configured on the server');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: query }],
    },
  ];

  const tools = [{ functionDeclarations: firestoreToolDefinitions }];
  let collectedStores = [];

  for (let turn = 0; turn < 3; turn += 1) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          role: 'system',
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents,
        tools,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message || `Gemini API error (${response.status})`);
    }

    const candidate = payload?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const functionCalls = parts.filter((part) => part.functionCall);

    if (functionCalls.length === 0) {
      const text = parts.map((part) => part.text || '').join('').trim();
      return { text, stores: collectedStores };
    }

    const functionResponses = [];
    for (const { functionCall } of functionCalls) {
      const { name, args } = functionCall;
      try {
        const result = await executeFirestoreTool(name, args || {});
        const stores = result.stores || (result.store ? [result.store] : []);
        collectedStores = mergeStores(collectedStores, stores);
        functionResponses.push({ name, content: { result } });
      } catch (error) {
        functionResponses.push({ name, content: { error: error.message || 'Tool execution failed' } });
      }
    }

    contents.push({
      role: 'model',
      parts: functionCalls.map(({ functionCall }) => ({
        functionCall: { name: functionCall.name, args: functionCall.args },
      })),
    });
    contents.push({
      role: 'user',
      parts: functionResponses.map(({ name, content }) => ({
        functionResponse: { name, response: content },
      })),
    });
  }

  throw new Error('Gemini agent ran too many tool turns');
};

const mergeStores = (current, incoming) => {
  const seen = new Set(current.map((store) => store.id));
  const merged = [...current];
  for (const store of incoming) {
    if (store && !seen.has(store.id)) {
      seen.add(store.id);
      merged.push(store);
    }
  }
  return merged;
};

app.post('/api/gemini-test', async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'A message is required.' });
    }
    const responseText = await askGemini(String(message).trim());
    return res.json({ success: true, responseText });
  } catch (error) {
    const isMissingKey = String(error.message).includes('GEMINI_API_KEY');
    return res.status(isMissingKey ? 503 : 500).json({ error: error.message || 'Gemini connection failed.' });
  }
});

app.get('/api/message', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to the Tijara.dz API! Connected successfully to the Node.js server.',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    status: 'success',
    data: products,
  });
});

const IMAGE_EXTENSION_BY_TYPE = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
};

const uploadToImgbb = async (base64Data) => {
  const apiKey = process.env.IMGBB_API_KEY;
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: new URLSearchParams({ image: base64Data }),
  });
  const payload = await response.json();
  if (!response.ok || !payload?.data?.url) {
    throw new Error(payload?.error?.message || 'فشل الرفع إلى imgbb');
  }
  return payload.data.url;
};

const uploadToCloudinary = async (dataUrl) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: new URLSearchParams({ file: dataUrl, upload_preset: uploadPreset }),
  });
  const payload = await response.json();
  if (!response.ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message || 'فشل الرفع إلى Cloudinary');
  }
  return payload.secure_url;
};

const uploadToCatbox = async (base64Data, filename) => {
  const buffer = Buffer.from(base64Data, 'base64');
  const formData = new FormData();
  formData.append('reqtype', 'fileupload');
  formData.append(
    'fileToUpload',
    new Blob([buffer], { type: 'application/octet-stream' }),
    filename
  );
  const response = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: formData,
  });
  const text = await response.text();
  const trimmed = text.trim();
  if (!/^https?:\/\/.+/.test(trimmed)) {
    throw new Error(trimmed || 'فشل الرفع إلى catbox.moe');
  }
  return trimmed;
};

app.post('/api/upload-image', async (req, res) => {
  try {
    const { image } = req.body || {};
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'بيانات الصورة مطلوبة.' });
    }

    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'صيغة الصورة غير صالحة. أرسل رابط بيانات base64.' });
    }

    const contentType = match[1];
    const base64Data = match[2];

    if (base64Data.length > 25 * 1024 * 1024) {
      return res.status(400).json({ error: 'الصورة كبيرة جداً (الحد الأقصى 20MB).' });
    }

    let url;
    if (process.env.IMGBB_API_KEY) {
      url = await uploadToImgbb(base64Data);
    } else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET) {
      url = await uploadToCloudinary(`data:${contentType};base64,${base64Data}`);
    } else {
      const extension = IMAGE_EXTENSION_BY_TYPE[contentType] || 'png';
      url = await uploadToCatbox(base64Data, `tijara-${Date.now()}.${extension}`);
    }

    return res.json({ success: true, url });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'فشل رفع الصورة' });
  }
});

app.post('/api/ai-agent', async (req, res) => {
  try {
    const { query } = req.body || {};
    if (!query || !String(query).trim()) {
      return res.status(400).json({ error: 'A query is required.' });
    }

    let payload = null;
    try {
      payload = await askOpenAI(query);
    } catch (error) {
      payload = null;
    }

    const fallback = buildFallbackIntent(query);
    const response = payload || fallback;

    return res.json({
      success: true,
      responseText: response.responseText || fallback.responseText,
      extracted: {
        product: response.extracted?.product || fallback.extracted.product,
        category: response.extracted?.category || fallback.extracted.category,
        wilaya: response.extracted?.wilaya || fallback.extracted.wilaya,
        city: response.extracted?.city || fallback.extracted.city,
        preferences: response.extracted?.preferences || fallback.extracted.preferences,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected AI failure' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed by CORS' });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
