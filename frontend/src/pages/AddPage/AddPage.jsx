import React, { useEffect, useState } from 'react';
import './AddPage.css';
import Button from '../../components/Button/Button';
import { categories, wilayas } from '../../data/mockData';
import { getStoreById, saveStoreRequest, updateStoreRequest } from '../../firebase/firebaseService';
import { getStoreMainImage, getStoreGalleryImages } from '../../utils/storeImages';
import useImageUploads from '../../hooks/useImageUploads';
import { MainImageField, GalleryImageField } from '../../components/ImageUploader/ImageUploader';
import { useI18n } from '../../i18n/I18nContext';

import { extractUsernameFromUrl, fetchAuthorizedSocialMetadata } from '../../utils/socialImportUtils';

const AddPage = ({ currentUser, onNavigate, editingStoreId }) => {
  const { t } = useI18n();
  const [formValues, setFormValues] = useState({
    title: '',
    category: '',
    subcategory: '',
    wilaya: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    whatsapp: '',
    description: '',
  });
  const [userEditedFields, setUserEditedFields] = useState({
    title: false,
    description: false,
    phone: false,
  });
  const [autoNotice, setAutoNotice] = useState('');
  const [titleError, setTitleError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingStore, setExistingStore] = useState(null);
  const [loadingStore, setLoadingStore] = useState(Boolean(editingStoreId));
  const uploads = useImageUploads({});
  const resetUploads = uploads.reset;

  useEffect(() => {
    if (!currentUser || !editingStoreId) {
      setExistingStore(null);
      return undefined;
    }

    let cancelled = false;
    setLoadingStore(true);
    getStoreById(editingStoreId)
      .then((store) => {
        if (cancelled || !store) {
          return;
        }
        if (store.sellerId && store.sellerId !== currentUser.uid) {
          setSubmitError(t('addpage.notOwnerError'));
          return;
        }
        setExistingStore(store);
        resetUploads(getStoreMainImage(store), getStoreGalleryImages(store));
        setFormValues((prev) => {
          const next = {};
          Object.keys(prev).forEach((key) => {
            next[key] = store[key] ?? prev[key];
          });
          return next;
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoadingStore(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser, editingStoreId, resetUploads]);

  const looksLikeUrl = (str) => /https?:\/\/|www\.|instagram\.com|facebook\.com|tiktok\.com/i.test(str);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (['title', 'description', 'phone'].includes(name)) {
      setUserEditedFields((prev) => ({ ...prev, [name]: true }));
    }
    // Warn if user accidentally pastes a URL into the title field
    if (name === 'title') {
      if (looksLikeUrl(value)) {
        setTitleError(t('addpage.titleUrlError') || 'يبدو أن هذا رابط وليس اسماً — يرجى كتابة اسم الصفحة فقط (مثال: Eternel Store)');
      } else {
        setTitleError('');
      }
    }
  };

  const handleSocialBlur = async (platform, value) => {
    if (!value || !value.trim()) return;

    const { suggestedTitle } = extractUsernameFromUrl(platform, value);
    const updates = {};
    const importedItems = [];

    // 1. Suggest title from username if title is not manually edited and empty.
    // Never suggest a raw URL as the title — only clean handles/names.
    if (!userEditedFields.title && !formValues.title.trim() && suggestedTitle && !looksLikeUrl(suggestedTitle)) {
      updates.title = suggestedTitle;
      importedItems.push(t('addpage.autoTitle') || 'اسم الصفحة');
    }

    // 2. Fetch authorized API metadata (bio, phone number, profile image)
    try {
      const meta = await fetchAuthorizedSocialMetadata(platform, value);

      if (meta.title && !userEditedFields.title && !formValues.title.trim() && !updates.title) {
        updates.title = meta.title;
        if (!importedItems.includes('اسم الصفحة')) {
          importedItems.push(t('addpage.autoTitle') || 'اسم الصفحة');
        }
      }

      if (meta.bio && !userEditedFields.description && !formValues.description.trim()) {
        updates.description = meta.bio;
        importedItems.push(t('addpage.autoBio') || 'الوصف');
      }

      if (meta.phone && !userEditedFields.phone && !formValues.phone.trim()) {
        updates.phone = meta.phone;
        importedItems.push(t('addpage.autoPhone') || 'رقم الهاتف');
      }

      if (meta.profileImage && !uploads.mainUrl && !uploads.mainPreview) {
        uploads.setSuggestedMainUrl(meta.profileImage);
        importedItems.push(t('addpage.autoImage') || 'الصورة الرئيسية');
      }
    } catch {
      // Non-blocking fallback
    }

    if (Object.keys(updates).length > 0) {
      setFormValues((prev) => ({ ...prev, ...updates }));
    }

    if (importedItems.length > 0) {
      setAutoNotice(
        `💡 تم اقتراح (${importedItems.join('، ')}) تلقائياً من رابط ${platform} — يمكنك تعديل جميع البيانات بحرية قبل الإرسال.`
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    // Block submission if the title looks like a URL
    if (looksLikeUrl(formValues.title)) {
      setTitleError(t('addpage.titleUrlError') || 'يبدو أن هذا رابط وليس اسماً — يرجى كتابة اسم الصفحة فقط (مثال: Eternel Store)');
      return;
    }

    if (!currentUser) {
      onNavigate('auth', { redirect: 'add-page' });
      return;
    }

    setSubmitting(true);

    try {
      const { mainUrl, galleryUrls } = await uploads.uploadPending();
      const payload = {
        ...formValues,
        profileImageUrl: mainUrl,
        galleryImages: galleryUrls,
        sellerId: currentUser.uid,
        sellerEmail: currentUser.email,
      };
      if (existingStore) {
        await updateStoreRequest(existingStore.id, {
          ...payload,
          status: existingStore.status === 'approved' ? 'approved' : 'pending',
        });
      } else {
        await saveStoreRequest(payload);
      }
      setSubmitted(true);
    } catch (error) {
      const message = error.message || t('addpage.submitError');
      if (/permission|denied/i.test(message)) {
        setSubmitError(t('addpage.permissionError'));
      } else {
        setSubmitError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="add-page">
      <div className="add-page__breadcrumb">
        <button className="breadcrumb-link" onClick={() => onNavigate('dashboard')}>
          {t('nav.home')}
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{existingStore ? t('addpage.breadcrumbEdit') : t('addpage.breadcrumbAdd')}</span>
      </div>

      <div className="add-page__hero">
        <div>
          <p className="add-page__eyebrow">{t('addpage.eyebrow')}</p>
          <h1 className="add-page__title">
            {existingStore ? t('addpage.titleEdit') : t('addpage.titleAdd')}
          </h1>
          <p className="add-page__subtitle">
            {existingStore ? t('addpage.subtitleEdit') : t('addpage.subtitleAdd')}
          </p>
        </div>
        <Button variant="primary" onClick={() => onNavigate('dashboard')}>
          {t('common.backHome')}
        </Button>
      </div>

      <div className="add-page__content">
        {submitted ? (
          <div className="add-page__success-card">
            <h2>{existingStore ? t('addpage.successTitleEdit') : t('addpage.successTitleAdd')}</h2>
            <p>
              {existingStore ? t('addpage.successDescEdit') : t('addpage.successDescAdd')}
            </p>
            <div className="form-actions">
              <Button variant="primary" onClick={() => onNavigate('add-page')}>
                {t('addpage.addAnother')}
              </Button>
              <Button variant="glow" onClick={() => onNavigate('seller-profile')}>
                {t('addpage.viewMyPage')}
              </Button>
            </div>
          </div>
        ) : (
          <form className="add-page__form" onSubmit={handleSubmit}>
            {!currentUser && (
              <div className="form-alert">
                {t('addpage.loginAlert')}
              </div>
            )}

            <div className="form-grid">
              <label>
                {t('addpage.titleField')}
                <input
                  name="title"
                  value={formValues.title}
                  onChange={handleChange}
                  placeholder={t('addpage.titlePlaceholder')}
                  required
                  style={titleError ? { borderColor: '#e74c3c' } : {}}
                />
                {titleError && (
                  <span style={{ color: '#e74c3c', fontSize: '0.82rem', marginTop: '4px', display: 'block' }}>
                    ⚠️ {titleError}
                  </span>
                )}
              </label>

              <label>
                {t('addpage.categoryField')}
                <select name="category" value={formValues.category} onChange={handleChange} required>
                  <option value="">{t('addpage.chooseCategory')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {t('category.' + category.id)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t('addpage.subcategoryField')}
                <input
                  name="subcategory"
                  value={formValues.subcategory}
                  onChange={handleChange}
                  placeholder={t('addpage.subcategoryPlaceholder')}
                  list="subcategory-suggestions"
                />
                <datalist id="subcategory-suggestions">
                  {(categories.find((c) => c.name === formValues.category)?.subcategories || []).map((sub) => (
                    <option key={sub} value={sub} />
                  ))}
                </datalist>
              </label>

              <label>
                {t('addpage.wilayaField')}
                <select name="wilaya" value={formValues.wilaya} onChange={handleChange}>
                  <option value="">{t('addpage.chooseWilaya')}</option>
                  {wilayas.map((wilaya) => (
                    <option key={wilaya.id} value={wilaya.name}>
                      {wilaya.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t('addpage.cityField')}
                <input
                  name="city"
                  value={formValues.city}
                  onChange={handleChange}
                  placeholder={t('addpage.cityPlaceholder')}
                />
              </label>

              <label>
                {t('addpage.phoneField')}
                <input
                  name="phone"
                  value={formValues.phone}
                  onChange={handleChange}
                  placeholder={t('addpage.phonePlaceholder')}
                />
              </label>

              <label>
                {t('addpage.emailField')}
                <input
                  type="email"
                  name="email"
                  value={formValues.email}
                  onChange={handleChange}
                  placeholder={t('addpage.emailPlaceholder')}
                />
              </label>

              <label>
                WhatsApp
                <input
                  name="whatsapp"
                  value={formValues.whatsapp}
                  onChange={handleChange}
                  placeholder={t('addpage.phonePlaceholder')}
                />
              </label>

              <label>
                {t('addpage.websiteField')}
                <input
                  name="website"
                  value={formValues.website}
                  onChange={handleChange}
                  placeholder="https://"
                />
              </label>

              <label>
                Instagram
                <input
                  name="instagram"
                  value={formValues.instagram}
                  onChange={handleChange}
                  onBlur={(e) => handleSocialBlur('instagram', e.target.value)}
                  placeholder="@yourbusiness"
                />
              </label>

              <label>
                Facebook
                <input
                  name="facebook"
                  value={formValues.facebook}
                  onChange={handleChange}
                  onBlur={(e) => handleSocialBlur('facebook', e.target.value)}
                  placeholder="facebook.com/yourpage"
                />
              </label>

              <label>
                TikTok
                <input
                  name="tiktok"
                  value={formValues.tiktok}
                  onChange={handleChange}
                  onBlur={(e) => handleSocialBlur('tiktok', e.target.value)}
                  placeholder="@yourtiktok"
                />
              </label>
            </div>

            {autoNotice && (
              <div className="form-info-notice" style={{ background: 'rgba(15, 118, 110, 0.08)', border: '1px solid rgba(15, 118, 110, 0.25)', color: 'var(--accent-color)', padding: '0.85rem 1.1rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {autoNotice}
              </div>
            )}


            <label className="form-fullwidth">
              {t('addpage.descriptionField')}
              <textarea
                name="description"
                value={formValues.description}
                onChange={handleChange}
                rows="5"
                placeholder={t('addpage.descriptionPlaceholder')}
              />
            </label>

            <div className="form-fullwidth">
              <MainImageField upload={uploads} />
            </div>

            <div className="form-fullwidth">
              <GalleryImageField upload={uploads} />
            </div>

            {submitError && <p className="form-error">{submitError}</p>}

            <div className="form-actions">
              <Button type="submit" variant="glow" disabled={submitting || !currentUser || loadingStore || uploads.uploading}>
                {submitting
                  ? uploads.uploading
                    ? t('addpage.uploadingImages')
                    : t('addpage.submitting')
                  : existingStore
                    ? t('addpage.updateButton')
                    : t('addpage.submitButton')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddPage;
