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

export const uploadImageFile = async (file) => {
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
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || 'تعذر رفع الصورة، حاول مرة أخرى.');
  }
  return payload.url;
};
