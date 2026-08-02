import React, { useEffect, useState } from 'react';
import './AddPage.css';
import Button from '../../components/Button/Button';
import { categories, wilayas } from '../../data/mockData';
import { getStoreById, saveStoreRequest, updateStoreRequest } from '../../firebase/firebaseService';
import { CONTACT_FIELDS } from '../../utils/storeValidation';
import { getStoreMainImage, getStoreGalleryImages } from '../../utils/storeImages';
import useImageUploads from '../../hooks/useImageUploads';
import { MainImageField, GalleryImageField } from '../../components/ImageUploader/ImageUploader';
import { useI18n } from '../../i18n/I18nContext';

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
        if (store.sellerId !== currentUser.uid) {
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!currentUser) {
      onNavigate('auth', { redirect: 'add-page' });
      return;
    }

    const hasContactMethod = CONTACT_FIELDS.some(
      (field) => String(formValues[field] || '').trim() !== ''
    );
    if (!hasContactMethod) {
      setSubmitError(t('addpage.contactRequired'));
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
                />
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
                <select name="wilaya" value={formValues.wilaya} onChange={handleChange} required>
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
                  required
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
                  placeholder="@yourbusiness"
                />
              </label>

              <label>
                Facebook
                <input
                  name="facebook"
                  value={formValues.facebook}
                  onChange={handleChange}
                  placeholder="facebook.com/yourpage"
                />
              </label>

              <label>
                TikTok
                <input
                  name="tiktok"
                  value={formValues.tiktok}
                  onChange={handleChange}
                  placeholder="@yourtiktok"
                />
              </label>
            </div>

            <label className="form-fullwidth">
              {t('addpage.descriptionField')}
              <textarea
                name="description"
                value={formValues.description}
                onChange={handleChange}
                rows="5"
                placeholder={t('addpage.descriptionPlaceholder')}
                required
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
