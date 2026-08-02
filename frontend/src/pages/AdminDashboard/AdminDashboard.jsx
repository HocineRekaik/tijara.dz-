import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './AdminDashboard.css';
import Button from '../../components/Button/Button';
import { categories, wilayas } from '../../data/mockData';
import { getStoreMainImage, getStoreGalleryImages } from '../../utils/storeImages';
import useImageUploads from '../../hooks/useImageUploads';
import { MainImageField, GalleryImageField } from '../../components/ImageUploader/ImageUploader';
import {
  getAllStoresForAdmin,
  approveStore,
  rejectStore,
  deleteStore,
  createStoreDirectly,
  updateStoreDirectly,
  getReportedReviews,
  deleteReview,
  isAdminUser,
} from '../../firebase/firebaseService';
import { useI18n } from '../../i18n/I18nContext';

const emptyForm = {
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
};

const AdminDashboard = ({ onNavigate, currentUser, onLogout }) => {
  const { t, lang } = useI18n();
  const [stores, setStores] = useState([]);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [adminVerified, setAdminVerified] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const uploads = useImageUploads({});

  const isAdmin = adminVerified === true;

  const filteredStores = useMemo(() => {
    if (filter === 'all') return stores;
    return stores.filter((store) => store.status === filter);
  }, [filter, stores]);

  const stats = useMemo(() => {
    const pending = stores.filter((store) => store.status === 'pending').length;
    const approved = stores.filter((store) => store.status === 'approved').length;
    const rejected = stores.filter((store) => store.status === 'rejected').length;
    return { total: stores.length, pending, approved, rejected };
  }, [stores]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setActionMessage('');
    try {
      const [storesData, reportsData] = await Promise.all([
        getAllStoresForAdmin(),
        getReportedReviews(),
      ]);

      setStores(storesData);
      setReports(reportsData);
      setSelectedStore((prev) => prev || storesData[0] || null);
    } catch (error) {
      setActionMessage(error.message || t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    if (!currentUser) {
      setAdminVerified(false);
      return undefined;
    }

    setAdminVerified(null);
    isAdminUser(currentUser.uid)
      .then((isAdminUserResult) => {
        if (!cancelled) {
          setAdminVerified(isAdminUserResult);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAdminVerified(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && isAdmin) {
      loadData();
    }
  }, [currentUser, isAdmin, loadData]);

  const startCreate = () => {
    setEditingStore(null);
    setFormValues(emptyForm);
    setFormError('');
    uploads.reset('', []);
    setFormOpen(true);
  };

  const startEdit = (store) => {
    setEditingStore(store);
    setFormValues((prev) => {
      const next = {};
      Object.keys(emptyForm).forEach((key) => {
        next[key] = store[key] ?? prev[key];
      });
      return next;
    });
    uploads.reset(getStoreMainImage(store), getStoreGalleryImages(store));
    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingStore(null);
    setFormValues(emptyForm);
    uploads.reset('', []);
    setFormError('');
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const wasEditing = Boolean(editingStore);
    setSubmitting(true);
    setFormError('');
    try {
      const { mainUrl, galleryUrls } = await uploads.uploadPending();
      const payload = {
        ...formValues,
        profileImageUrl: mainUrl,
        galleryImages: galleryUrls,
      };

      if (wasEditing) {
        await updateStoreDirectly(editingStore.id, payload);
      } else {
        await createStoreDirectly(payload);
      }

      closeForm();
      await loadData();
      setActionMessage(wasEditing ? t('admin.updated') : t('admin.added'));
    } catch (error) {
      setFormError(error.message || t('admin.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    }
  };

  if (!currentUser) {
    return (
      <div className="admin-dashboard" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>{t('admin.loginRequired')}</h2>
        <p>{t('admin.loginRequiredDesc')}</p>
        <div className="admin-dashboard__guard-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="glow" onClick={() => onNavigate('admin-login')}>
            {t('admin.adminLogin')}
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('auth', { redirect: 'admin-dashboard' })}>
            {t('admin.sellerLogin')}
          </Button>
        </div>
      </div>
    );
  }

  if (adminVerified === null) {
    return (
      <div className="admin-dashboard" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>{t('admin.verifying')}</h2>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-dashboard" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>{t('admin.unauthorized')}</h2>
        <p>{t('admin.unauthorizedDesc')}</p>
        <div className="admin-dashboard__guard-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="glow" onClick={() => onNavigate('admin-login')}>
            {t('admin.adminLogin')}
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('dashboard')}>
            {t('admin.backToSite')}
          </Button>
        </div>
      </div>
    );
  }

  const handleAction = async (storeId, action) => {
    setActionMessage('');
    try {
      if (action === 'approve') {
        await approveStore(storeId);
      } else if (action === 'reject') {
        await rejectStore(storeId);
      } else if (action === 'delete') {
        await deleteStore(storeId);
      }

      await loadData();
      setActionMessage(action === 'delete' ? t('admin.deleted') : action === 'approve' ? t('admin.approved') : t('admin.rejected'));
    } catch (error) {
      setActionMessage(error.message || t('admin.actionError'));
    }
  };

  const handleReviewDelete = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      await loadData();
      setActionMessage(t('admin.reviewDeleted'));
    } catch (error) {
      setActionMessage(error.message || t('admin.reviewDeleteError'));
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__sidebar">
        <div>
          <p className="sidebar-eyebrow">{t('admin.sidebarEyebrow')}</p>
          <h2>{t('admin.sidebarTitle')}</h2>
          <p className="sidebar-copy">{t('admin.sidebarCopy')}</p>
        </div>

        <div className="sidebar-actions">
          <Button variant="glow" onClick={startCreate}>
            {t('admin.addPage')}
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('dashboard')}>
            {t('admin.backToSite')}
          </Button>
          <Button variant="secondary" onClick={handleLogout}>
            {t('nav.logout')}
          </Button>
        </div>
      </div>

      <div className="admin-dashboard__main">
        {formOpen && (
          <form className="admin-store-form" onSubmit={handleFormSubmit}>
            <div className="admin-store-form__header">
              <h3>{editingStore ? t('admin.formTitleEdit') : t('admin.formTitleAdd')}</h3>
              <p>
                {editingStore ? t('admin.formDescEdit') : t('admin.formDescAdd')}
                {editingStore && <span className={`status-badge ${editingStore.status || 'pending'}`}>{editingStore.status || 'pending'}</span>}
              </p>
            </div>

            <div className="admin-store-form__grid">
              <label className="admin-field">
                <span>{t('admin.titleField')}</span>
                <input name="title" value={formValues.title} onChange={handleFormChange} placeholder={t('admin.titlePlaceholder')} required />
              </label>

              <label className="admin-field">
                <span>{t('addpage.categoryField')}</span>
                <select name="category" value={formValues.category} onChange={handleFormChange} required>
                  <option value="">{t('addpage.chooseCategory')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {t('category.' + category.id)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-field">
                <span>{t('addpage.subcategoryField')}</span>
                <input name="subcategory" value={formValues.subcategory} onChange={handleFormChange} placeholder={t('admin.subcategoryPlaceholder')} list="admin-subcategory-suggestions" />
                <datalist id="admin-subcategory-suggestions">
                  {(categories.find((c) => c.name === formValues.category)?.subcategories || []).map((sub) => (
                    <option key={sub} value={sub} />
                  ))}
                </datalist>
              </label>

              <label className="admin-field">
                <span>{t('addpage.wilayaField')}</span>
                <select name="wilaya" value={formValues.wilaya} onChange={handleFormChange} required>
                  <option value="">{t('addpage.chooseWilaya')}</option>
                  {wilayas.map((wilaya) => (
                    <option key={wilaya.id} value={wilaya.name}>
                      {wilaya.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-field">
                <span>{t('addpage.cityField')}</span>
                <input name="city" value={formValues.city} onChange={handleFormChange} placeholder={t('admin.cityPlaceholder')} required />
              </label>

              <div className="admin-field admin-field--full">
                <MainImageField upload={uploads} />
              </div>

              <label className="admin-field admin-field--full">
                <span>{t('admin.descriptionField')}</span>
                <textarea name="description" value={formValues.description} onChange={handleFormChange} placeholder={t('admin.descriptionPlaceholder')} rows="3" required />
              </label>

              <label className="admin-field">
                <span>{t('storedetails.phone')}</span>
                <input name="phone" value={formValues.phone} onChange={handleFormChange} placeholder="0550 00 00 00" />
              </label>

              <label className="admin-field">
                <span>{t('storedetails.email')}</span>
                <input name="email" value={formValues.email} onChange={handleFormChange} placeholder="example@mail.com" />
              </label>

              <label className="admin-field">
                <span>WhatsApp</span>
                <input name="whatsapp" value={formValues.whatsapp} onChange={handleFormChange} placeholder="0550 00 00 00" />
              </label>

              <label className="admin-field">
                <span>{t('admin.websiteField')}</span>
                <input name="website" value={formValues.website} onChange={handleFormChange} placeholder="https://..." />
              </label>

              <label className="admin-field">
                <span>Instagram</span>
                <input name="instagram" value={formValues.instagram} onChange={handleFormChange} placeholder={t('admin.instagramPlaceholder')} />
              </label>

              <label className="admin-field">
                <span>Facebook</span>
                <input name="facebook" value={formValues.facebook} onChange={handleFormChange} placeholder={t('admin.facebookPlaceholder')} />
              </label>

              <label className="admin-field">
                <span>TikTok</span>
                <input name="tiktok" value={formValues.tiktok} onChange={handleFormChange} placeholder={t('admin.instagramPlaceholder')} />
              </label>

              <div className="admin-field admin-field--full">
                <GalleryImageField upload={uploads} />
              </div>
            </div>

            {formError && <p className="form-error">{formError}</p>}

            <div className="admin-store-form__actions">
              <Button type="submit" variant="glow" disabled={submitting || uploads.uploading}>
                {submitting
                  ? uploads.uploading
                    ? t('addpage.uploadingImages')
                    : t('admin.saving')
                  : editingStore ? t('admin.saveChanges') : t('admin.addPageBtn')}
              </Button>
              <Button type="button" variant="secondary" onClick={closeForm} disabled={submitting}>
                {t('admin.cancel')}
              </Button>
            </div>
          </form>
        )}

        <div className="admin-dashboard__overview">
          <div className="overview-card">
            <span>{t('admin.totalStores')}</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="overview-card">
            <span>{t('admin.pending')}</span>
            <strong>{stats.pending}</strong>
          </div>
          <div className="overview-card">
            <span>{t('admin.approvedCount')}</span>
            <strong>{stats.approved}</strong>
          </div>
          <div className="overview-card">
            <span>{t('admin.rejectedCount')}</span>
            <strong>{stats.rejected}</strong>
          </div>
        </div>

        <div className="admin-dashboard__toolbar">
          <div className="filter-group">
            <button className={`filter-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              {t('common.all')}
            </button>
            <button className={`filter-pill ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
              Pending
            </button>
            <button className={`filter-pill ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>
              Approved
            </button>
            <button className={`filter-pill ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>
              Rejected
            </button>
          </div>
          {actionMessage && <p className="action-message">{actionMessage}</p>}
        </div>

        {loading ? (
          <div className="admin-empty">{t('admin.loadingStores')}</div>
        ) : (
          <div className="admin-dashboard__content">
            <div className="admin-dashboard__list">
              {filteredStores.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  className={`store-row ${selectedStore?.id === store.id ? 'selected' : ''}`}
                  onClick={() => setSelectedStore(store)}
                >
                  <div>
                    <h3>{store.title || t('admin.untitled')}</h3>
                    <p>{t('category.' + store.category) || t('admin.noCategory')} • {store.wilaya || t('admin.noWilaya')}</p>
                    <p className="store-row__date">
                      {store.createdAt?.toDate
                        ? store.createdAt.toDate().toLocaleString(lang === 'ar' ? 'ar-DZ' : lang)
                        : '—'}
                    </p>
                  </div>
                  <span className={`status-badge ${store.status || 'pending'}`}>{store.status || 'pending'}</span>
                </button>
              ))}
            </div>

            <div className="admin-dashboard__details">
              {selectedStore ? (
                <>
                  <div className="details-header">
                    <div>
                      <p className="details-eyebrow">{t('admin.detailsEyebrow')}</p>
                      <h3>{selectedStore.title}</h3>
                    </div>
                    <span className={`status-badge ${selectedStore.status || 'pending'}`}>{selectedStore.status || 'pending'}</span>
                  </div>

                  <div className="details-grid">
                    {selectedStore.category && <div><span>{t('addpage.categoryField')}</span><strong>{t('category.' + selectedStore.category)}</strong></div>}
                    {selectedStore.subcategory && <div><span>{t('addpage.subcategoryField')}</span><strong>{selectedStore.subcategory}</strong></div>}
                    {selectedStore.wilaya && <div><span>{t('addpage.wilayaField')}</span><strong>{selectedStore.wilaya}</strong></div>}
                    {selectedStore.city && <div><span>{t('addpage.cityField')}</span><strong>{selectedStore.city}</strong></div>}
                    {selectedStore.email && <div><span>{t('admin.detailsEmail')}</span><strong>{selectedStore.email}</strong></div>}
                    {selectedStore.phone && <div><span>{t('admin.detailsPhone')}</span><strong>{selectedStore.phone}</strong></div>}
                    {selectedStore.sellerEmail && <div><span>{t('admin.detailsSellerEmail')}</span><strong>{selectedStore.sellerEmail}</strong></div>}
                    {selectedStore.sellerId && <div><span>{t('admin.detailsSellerId')}</span><strong>{selectedStore.sellerId}</strong></div>}
                  </div>

                  <div className="details-block">
                    <span>{t('admin.detailsDescription')}</span>
                    <p>{selectedStore.description}</p>
                  </div>

                  {[selectedStore.instagram, selectedStore.facebook, selectedStore.tiktok, selectedStore.website, selectedStore.whatsapp].some(Boolean) && (
                    <div className="details-block">
                      <span>{t('admin.detailsLinks')}</span>
                      <ul>
                        {selectedStore.instagram && <li>Instagram: {selectedStore.instagram}</li>}
                        {selectedStore.facebook && <li>Facebook: {selectedStore.facebook}</li>}
                        {selectedStore.tiktok && <li>TikTok: {selectedStore.tiktok}</li>}
                        {selectedStore.website && <li>Website: {selectedStore.website}</li>}
                        {selectedStore.whatsapp && <li>WhatsApp: {selectedStore.whatsapp}</li>}
                      </ul>
                    </div>
                  )}

                  {getStoreMainImage(selectedStore) && (
                    <div className="details-block">
                      <span>{t('admin.detailsMainImage')}</span>
                      <img className="details-logo" src={getStoreMainImage(selectedStore)} alt={selectedStore.title} />
                    </div>
                  )}

                  {getStoreGalleryImages(selectedStore).length > 0 && (
                    <div className="details-block">
                      <span>{t('admin.detailsGallery')}</span>
                      <div className="details-gallery">
                        {getStoreGalleryImages(selectedStore).map((url, index) => (
                          <img key={`${url}-${index}`} src={url} alt={`${selectedStore.title} ${index + 1}`} />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="details-block">
                    <span>{t('admin.detailsSubmittedAt')}</span>
                    <p>{selectedStore.createdAt?.toDate ? selectedStore.createdAt.toDate().toLocaleString(lang === 'ar' ? 'ar-DZ' : lang) : '—'}</p>
                  </div>

                  <div className="details-block">
                    <span>{t('admin.reportedReviews')}</span>
                    {reports.length > 0 ? (
                      <div className="report-list">
                        {reports.map((report) => (
                          <div key={report.id} className="report-card">
                            <p><strong>{t('admin.reportReason')}</strong> {report.reason}</p>
                            <p>{t('admin.reportReviewId')} {report.reviewId}</p>
                            <p>{t('admin.reportReporter')} {report.reporterId || '—'}</p>
                            <Button variant="secondary" onClick={() => handleReviewDelete(report.reviewId)}>
                              {t('admin.deleteReview')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>{t('admin.noReports')}</p>
                    )}
                  </div>

                  <div className="details-actions">
                    {selectedStore.status !== 'approved' && (
                      <Button variant="glow" onClick={() => handleAction(selectedStore.id, 'approve')}>
                        {t('admin.approve')}
                      </Button>
                    )}
                    {selectedStore.status !== 'rejected' && (
                      <Button variant="secondary" onClick={() => handleAction(selectedStore.id, 'reject')}>
                        {t('admin.reject')}
                      </Button>
                    )}
                    <Button variant="secondary" onClick={() => startEdit(selectedStore)}>
                      {t('seller.edit')}
                    </Button>
                    <Button variant="secondary" onClick={() => handleAction(selectedStore.id, 'delete')}>
                      {t('admin.delete')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="admin-empty">{t('admin.selectStore')}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
