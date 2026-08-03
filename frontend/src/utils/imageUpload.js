const API_BASE = import.meta.env.VITE_API_URL || '';

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة من الجهاز.'));
    reader.readAsDataURL(file);
  });

export const uploadImageFile = async (file) => {
  const dataUrl = await readFileAsDataUrl(file);
  const response = await fetch(`${API_BASE}/api/upload-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || 'تعذر رفع الصورة، حاول مرة أخرى.');
  }
  return payload.url;
};
