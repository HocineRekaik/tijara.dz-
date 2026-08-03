import React, { useEffect, useState } from 'react';
import './SellerProfile.css';
import Button from '../../components/Button/Button';
import { getUserProfile, saveUserProfile, getStoresBySeller, deleteStore } from '../../firebase/firebaseService';
import { getStoreMainImage } from '../../utils/storeImages';
import { useI18n } from '../../i18n/I18nContext';
import { Store, Plus, PencilLine, Eye, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

const getStatusMeta = (t) => ({
  pending: { label: t('seller.statusPending'), className: 'status-pending', icon: Clock },
  approved: { label: t('seller.statusApproved'), className: 'status-approved', icon: CheckCircle2 },
  rejected: { label: t('seller.statusRejected'), className: 'status-rejected', icon: XCircle },
});

const formatCreatedAt = (value, lang) => {
  if (!value) {
    return '';
  }
  const date = value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang, { year: 'numeric', month: 'long', day: 'numeric' });
};

const SellerProfile = ({ currentUser, userProfile, onNavigate }) => {
  const { t, lang } = useI18n();
  const STATUS_META = getStatusMeta(t);
  const [profileValues, setProfileValues] = useState({
    displayName: '',
    storeName: '',
    phone: '',
    city: '',
    bio: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const [myStores, setMyStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (currentUser && !userProfile) {
        const profileData = await getUserProfile(currentUser.uid);
        setProfileValues((prev) => ({ ...prev, ...profileData }));
      }

      if (userProfile) {
        setProfileValues((prev) => ({ ...prev, ...userProfile }));
      }
    };

    loadProfile();
  }, [currentUser, userProfile]);

  useEffect(() => {
    if (!currentUser) {
      setMyStores([]);
      setStoresLoading(false);
      return;
    }

    let cancelled = false;
    setStoresLoading(true);
    getStoresBySeller(currentUser.uid)
      .then((stores) => {
        if (!cancelled) {
          setMyStores(stores);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMyStores([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStoresLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfileValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!currentUser) {
      onNavigate('auth', { redirect: 'seller-profile' });
      return;
    }

    setLoading(true);
    setStatusMessage('');

    try {
      await saveUserProfile(currentUser.uid, {
        ...profileValues,
        email: currentUser.email,
        role: 'seller',
      });
      setStatusMessage(t('seller.savedSuccess'));
    } catch (error) {
      const message = error.message || t('seller.saveError');
      if (/permission|denied/i.test(message)) {
        setStatusMessage(t('addpage.permissionError'));
      } else {
        setStatusMessage(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (!window.confirm(t('seller.deleteConfirm'))) {
      return;
    }
    setDeletingId(storeId);
    try {
      await deleteStore(storeId);
      setMyStores((prev) => prev.filter((s) => s.id !== storeId));
      setStatusMessage(t('seller.deleteSuccess'));
    } catch (error) {
      setStatusMessage(error.message || t('seller.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="seller-profile-page">
        <div className="seller-profile-card">
          <h2>{t('seller.loginTitle')}</h2>
          <p>{t('seller.loginDesc')}</p>
          <div className="profile-actions">
            <Button variant="glow" onClick={() => onNavigate('auth', { redirect: 'seller-profile' })}>
              {t('seller.loginNow')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const approvedCount = myStores.filter((store) => store.status === 'approved').length;

  return (
    <div className="seller-profile-page">
      {/* My Stores */}
      <section className="seller-stores-section">
        <div className="seller-stores-header">
          <div>
            <p className="profile-eyebrow">{t('seller.eyebrowStores')}</p>
            <h2>
              {t('seller.myStoresTitle')}
              {myStores.length > 0 && <span className="seller-stores-count">({myStores.length})</span>}
            </h2>
            {approvedCount > 0 && (
              <p className="seller-stores-note">
                {t('seller.publishedNote', { count: approvedCount })}
              </p>
            )}
          </div>
          <Button variant="glow" onClick={() => onNavigate('add-page')} icon={<Plus size={16} />}>
            {t('seller.addNewPage')}
          </Button>
        </div>

        {storesLoading ? (
          <div className="seller-stores-empty">{t('seller.loadingStores')}</div>
        ) : myStores.length === 0 ? (
          <div className="seller-stores-empty">
            <span className="seller-stores-empty-icon">
              <Store size={28} />
            </span>
            <h3>{t('seller.noStoresTitle')}</h3>
            <p>{t('seller.noStoresDesc')}</p>
            <Button variant="primary" onClick={() => onNavigate('add-page')} icon={<Plus size={16} />}>
              {t('seller.createFirstPage')}
            </Button>
          </div>
        ) : (
          <div className="seller-stores-grid">
            {myStores.map((store) => {
              const status = STATUS_META[store.status] || STATUS_META.pending;
              const StatusIcon = status.icon;
              return (
                <div key={store.id} className={`seller-store-card ${status.className}`}>
                  <div className="seller-store-card__top">
                    <div className="seller-store-card__title-row">
                      {getStoreMainImage(store) ? (
                        <img src={getStoreMainImage(store)} alt={store.title} className="seller-store-card__thumb" />
                      ) : (
                        <span className="seller-store-card__thumb seller-store-card__thumb--placeholder">
                          <Store size={18} />
                        </span>
                      )}
                      <h3 className="seller-store-card__title">{store.title}</h3>
                    </div>
                    <span className={`store-status-badge ${status.className}`}>
                      <StatusIcon size={14} />
                      {status.label}
                    </span>
                  </div>
                  <p className="seller-store-card__meta">
                    {[store.category, store.wilaya, store.city].filter(Boolean).join(' • ')}
                  </p>
                  <p className="seller-store-card__date">
                    {formatCreatedAt(store.createdAt, lang) && t('seller.addedOn', { date: formatCreatedAt(store.createdAt, lang) })}
                  </p>
                  <div className="seller-store-card__actions">
                    <Button
                      variant="secondary"
                      className="btn-sm"
                      icon={<PencilLine size={15} />}
                      onClick={() => onNavigate('add-page', { storeId: store.id })}
                    >
                      {t('seller.edit')}
                    </Button>
                    {store.status === 'approved' && (
                      <Button
                        variant="secondary"
                        className="btn-sm"
                        icon={<Eye size={15} />}
                        onClick={() => onNavigate('store-details', { storeId: store.id })}
                      >
                        {t('common.showPage')}
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      className="btn-sm btn-danger"
                      icon={<Trash2 size={15} />}
                      onClick={() => handleDeleteStore(store.id)}
                      disabled={deletingId === store.id}
                    >
                      {deletingId === store.id ? t('seller.deleting') : t('seller.delete')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Profile */}
      <div className="seller-profile-card">
        <div className="seller-profile-header">
          <div>
            <p className="profile-eyebrow">{t('seller.profileEyebrow')}</p>
            <h2>{t('seller.accountInfo')}</h2>
          </div>
          <div className="profile-meta">
            <span>{currentUser.email}</span>
          </div>
        </div>

        <form className="seller-profile-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              {t('seller.displayNameField')}
              <input
                name="displayName"
                value={profileValues.displayName}
                onChange={handleChange}
                placeholder={t('seller.displayNamePlaceholder')}
              />
            </label>

            <label>
              {t('seller.storeNameField')}
              <input
                name="storeName"
                value={profileValues.storeName}
                onChange={handleChange}
                placeholder={t('seller.storeNamePlaceholder')}
              />
            </label>

            <label>
              {t('seller.phoneField')}
              <input
                name="phone"
                value={profileValues.phone}
                onChange={handleChange}
                placeholder="0555 12 34 56"
              />
            </label>

            <label>
              {t('addpage.cityField')}
              <input
                name="city"
                value={profileValues.city}
                onChange={handleChange}
                placeholder={t('seller.cityPlaceholder')}
              />
            </label>
          </div>

          <label className="form-fullwidth">
            {t('seller.bioField')}
            <textarea
              name="bio"
              value={profileValues.bio}
              onChange={handleChange}
              rows="4"
              placeholder={t('seller.bioPlaceholder')}
            />
          </label>

          <div className="form-grid">
            <label>
              Instagram
              <input
                name="instagram"
                value={profileValues.instagram}
                onChange={handleChange}
                placeholder="@yourbusiness"
              />
            </label>
            <label>
              Facebook
              <input
                name="facebook"
                value={profileValues.facebook}
                onChange={handleChange}
                placeholder="facebook.com/yourpage"
              />
            </label>
            <label>
              TikTok
              <input
                name="tiktok"
                value={profileValues.tiktok}
                onChange={handleChange}
                placeholder="@yourtiktok"
              />
            </label>
            <label>
              {t('addpage.websiteField')}
              <input
                name="website"
                value={profileValues.website}
                onChange={handleChange}
                placeholder="https://"
              />
            </label>
          </div>

          {statusMessage && <p className="profile-status">{statusMessage}</p>}

          <div className="profile-actions">
            <Button type="submit" variant="glow" disabled={loading}>
              {loading ? t('seller.saving') : t('seller.updateProfile')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerProfile;
