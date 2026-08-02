export const sanitizeText = (value) => String(value || '').trim();
export const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(String(value || '').trim());
export const isValidUrl = (value) => {
  const trimmed = String(value || '').trim();
  return trimmed === '' || /^(https?:\/\/)/.test(trimmed);
};
export const normalizeUrl = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '';
  }
  return /^(https?:\/\/)/i.test(trimmed) ? trimmed : `https://${trimmed}`;
};
export const isValidPhone = (value) => {
  const trimmed = String(value || '').trim();
  return trimmed === '' || /^[0-9+\s()-]{6,25}$/.test(trimmed);
};
export const isValidRating = (value) => Number.isInteger(value) && value >= 1 && value <= 5;

export const CONTACT_FIELDS = ['phone', 'email', 'whatsapp', 'website', 'instagram', 'facebook', 'tiktok'];

export const hasContactMethod = (store) =>
  CONTACT_FIELDS.some((field) => sanitizeText(store[field]).length > 0);

export const validateStoreData = (store) => {
  if (!store.title || sanitizeText(store.title).length === 0) {
    throw new Error('يرجى إدخال اسم المتجر الإلكتروني.');
  }
  if (!store.category || sanitizeText(store.category).length === 0) {
    throw new Error('يرجى اختيار تصنيف.');
  }
  if (!store.wilaya || sanitizeText(store.wilaya).length === 0) {
    throw new Error('يرجى اختيار الولاية.');
  }
  if (!store.city || sanitizeText(store.city).length === 0) {
    throw new Error('يرجى إدخال المدينة.');
  }
  if (!store.description || sanitizeText(store.description).length === 0) {
    throw new Error('يرجى إدخال وصف قصير.');
  }
  if (!hasContactMethod(store)) {
    throw new Error(
      'يرجى إدخال وسيلة تواصل واحدة على الأقل (هاتف، بريد إلكتروني، واتساب، موقع، أو شبكة اجتماعية).'
    );
  }
};

export const validateAdminStoreData = (store) => {
  if (!store.title || sanitizeText(store.title).length === 0) {
    throw new Error('يرجى إدخال اسم المتجر الإلكتروني.');
  }
  if (!store.category || sanitizeText(store.category).length === 0) {
    throw new Error('يرجى اختيار تصنيف.');
  }
  if (!store.wilaya || sanitizeText(store.wilaya).length === 0) {
    throw new Error('يرجى اختيار الولاية.');
  }
  if (!store.city || sanitizeText(store.city).length === 0) {
    throw new Error('يرجى إدخال المدينة.');
  }
  if (!store.description || sanitizeText(store.description).length === 0) {
    throw new Error('يرجى إدخال وصف قصير.');
  }
};
