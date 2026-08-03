import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseStorageConfigured } from '../firebase/firebaseConfig';

const API_BASE = import.meta.env.VITE_API_URL || '';

const STORAGE_TIMEOUT_MS = 10000;
const BACKEND_TIMEOUT_MS = 45000;

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة من الجهاز.'));
    reader.readAsDataURL(file);
  });

const parseJsonResponse = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`انتهت مهلة الرفع عبر ${label}.`)), ms)
    ),
  ]);

const downscaleImage = async (file, maxSize, quality = 0.85) => {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('تعذر قراءة الصورة.'));
    img.src = dataUrl;
  });

  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  if (scale === 1) {
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) {
    return file;
  }
  const baseName = String(file.name || 'image').replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
};

const toFirestoreDataUrl = async (file) => {
  const small = await downscaleImage(file, 700, 0.65);
  if (small !== file) {
    return readFileAsDataUrl(small);
  }
  const dataUrl = await readFileAsDataUrl(file);
  return dataUrl.length <= 400 * 1024 ? dataUrl : null;
};

const uploadToFirebaseStorage = async (file) => {
  const safeName = String(file.name || 'image')
    .replace(/[^\w.-]+/g, '_')
    .slice(-60);
  const extension = safeName.includes('.') ? safeName.slice(safeName.lastIndexOf('.')) : '';
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};

const uploadViaBackend = async (file) => {
  const dataUrl = await readFileAsDataUrl(file);

  let response;
  try {
    response = await fetch(`${API_BASE}/api/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    });
  } catch {
    throw new Error('تعذر الاتصال بخادم رفع الصور. تأكد من تشغيل الخادم ثم أعد المحاولة.');
  }

  const payload = await parseJsonResponse(response);
  if (!response.ok || !payload?.success || !payload?.url) {
    throw new Error(
      payload?.error ||
        `تعذر رفع الصورة عبر الخادم (استجابة ${response.status}). تأكد من إعداد VITE_API_URL ثم أعد المحاولة.`
    );
  }
  return payload.url;
};

let storageFailureUntil = 0;

export const uploadImageFile = async (file) => {
  const prepared = await downscaleImage(file, 1600).catch(() => file);

  const errors = [];

  try {
    return await withTimeout(uploadViaBackend(prepared), BACKEND_TIMEOUT_MS, 'الخادم');
  } catch (error) {
    errors.push(error);
    console.error('Backend upload failed:', error);
  }

  if (isFirebaseStorageConfigured() && Date.now() >= storageFailureUntil) {
    try {
      return await withTimeout(
        uploadToFirebaseStorage(prepared),
        STORAGE_TIMEOUT_MS,
        'Firebase Storage'
      );
    } catch (error) {
      storageFailureUntil = Date.now() + 5 * 60 * 1000;
      errors.push(error);
      console.error('Firebase Storage upload failed:', error);
    }
  }

  const firestoreUrl = await toFirestoreDataUrl(prepared);
  if (firestoreUrl) {
    storageFailureUntil = Infinity;
    return firestoreUrl;
  }

  throw new Error(
    errors[0]?.message ||
      'تعذر رفع الصورة. تأكد من تفعيل Firebase Storage (Build > Storage) أو إعداد VITE_API_URL ثم أعد المحاولة.'
  );
};
