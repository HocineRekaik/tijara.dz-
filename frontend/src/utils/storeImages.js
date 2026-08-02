export const getStoreMainImage = (store = {}) =>
  store.profileImageUrl || store.logo || store.image || '';

export const getStoreGalleryImages = (store = {}) => {
  const gallery = store.galleryImages?.length ? store.galleryImages : store.gallery || [];
  return Array.isArray(gallery) ? gallery.filter(Boolean) : [];
};
