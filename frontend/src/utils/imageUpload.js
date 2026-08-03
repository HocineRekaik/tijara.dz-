import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseStorageConfigured } from '../firebase/firebaseConfig';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
        'تعذر رفع الصورة. تحقق من إعدادات الخادم (VITE_API_URL) ثم أعد المحاولة.'
    );
  }
  return payload.url;
};

export const uploadImageFile = async (file) => {
  if (isFirebaseStorageConfigured()) {
    try {
      return await uploadToFirebaseStorage(file);
    } catch (error) {
      console.error('Firebase Storage upload failed, falling back to backend:', error);
    }
  }
  return uploadViaBackend(file);
};
