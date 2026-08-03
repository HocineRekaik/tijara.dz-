import React, { useEffect, useMemo, useState } from 'react';
import './StoreDetails.css';
import Button from '../../components/Button/Button';
import { getStoreById, getStoreBySlug, getReviewsForStore, submitReview, reportReview } from '../../firebase/firebaseService';
import { calculateReviewStats } from '../../utils/reviewUtils';
import { getStoreMainImage, getStoreGalleryImages } from '../../utils/storeImages';
import { useI18n } from '../../i18n/I18nContext';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  Camera,
  ThumbsUp,
  Music,
  Package,
  MapPinned,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Star,
} from 'lucide-react';

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const updatePageMetadata = (title, description) => {
  document.title = title;
  const metaDescription = document.querySelector('meta[name="description"]') || document.createElement('meta');
  metaDescription.name = 'description';
  metaDescription.content = description;
  document.head.appendChild(metaDescription);

  const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
  ogTitle.setAttribute('property', 'og:title');
  ogTitle.content = title;
  document.head.appendChild(ogTitle);

  const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
  ogDescription.setAttribute('property', 'og:description');
  ogDescription.content = description;
  document.head.appendChild(ogDescription);
};

const StoreDetails = ({ storeId, storeSlug, onNavigate, currentUser }) => {
  const { t, lang } = useI18n();
  const [store, setStore] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(Boolean(storeId || storeSlug));
  const [reviewForm, setReviewForm] = useState({ rating: '5', comment: '' });
  const [ratingHover, setRatingHover] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [reportingReviewId, setReportingReviewId] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const storeImages = useMemo(() => {
    if (!store) {
      return [];
    }
    const seen = new Set();
    const images = [];
    const main = getStoreMainImage(store);
    if (main) {
      seen.add(main);
      images.push(main);
    }
    getStoreGalleryImages(store).forEach((url) => {
      if (!seen.has(url)) {
        seen.add(url);
        images.push(url);
      }
    });
    return images;
  }, [store]);

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLightboxIndex(null);
      } else if (event.key === 'ArrowLeft') {
        setLightboxIndex((index) => (index + 1) % storeImages.length);
      } else if (event.key === 'ArrowRight') {
        setLightboxIndex((index) => (index - 1 + storeImages.length) % storeImages.length);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, storeImages.length]);

  useEffect(() => {
    if (!storeId && !storeSlug) {
      return;
    }

    let isMounted = true;

    const loadStore = async () => {
      setLoading(true);
      setActionMessage('');

      const storePromise = (async () => {
        let storeData = storeId ? await getStoreById(storeId) : await getStoreBySlug(storeSlug);
        if (!storeData && storeSlug) {
          storeData = await getStoreById(storeSlug);
        }
        return storeData;
      })();

      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(t('storedetails.timeoutError'))),
          20000,
        );
      });

      try {
        const storeData = await Promise.race([storePromise, timeoutPromise]);
        if (!storeData) {
          throw new Error(t('storedetails.notFoundError'));
        }

        if (isMounted) {
          setStore(storeData);
          setLoading(false);
          updatePageMetadata(
            t('storedetails.metaTitle', { title: storeData.title }),
            storeData.description || t('storedetails.metaDescription', { title: storeData.title }),
          );
        }

        try {
          const reviewData = await getReviewsForStore(storeData.id);
          if (isMounted) {
            setReviews(reviewData);
          }
        } catch {
          if (isMounted) {
            setReviews([]);
          }
        }
      } catch (error) {
        if (isMounted) {
          setActionMessage(error.message || t('storedetails.loadError'));
          setLoading(false);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    loadStore();

    return () => {
      isMounted = false;
    };
  }, [storeId, storeSlug, t]);

  const reviewStats = useMemo(() => calculateReviewStats(reviews), [reviews]);

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < full; i += 1) stars.push('★');
    if (hasHalf) stars.push('½');
    return stars.join('');
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setActionMessage('');

    if (!currentUser) {
      setActionMessage(t('storedetails.loginToReview'));
      return;
    }

    if (!reviewForm.comment.trim()) {
      setActionMessage(t('storedetails.commentRequired'));
      return;
    }

    setSubmitting(true);

    try {
      await submitReview({
        storeId: store?.id || storeId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || t('storedetails.anonymous'),
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
        deleted: false,
      });

      const nextReviews = await getReviewsForStore(store?.id || storeId);
      setReviews(nextReviews);
      setReviewForm({ rating: '5', comment: '' });
      setActionMessage(t('storedetails.reviewSaved'));
    } catch (error) {
      setActionMessage(error.message || t('storedetails.reviewSaveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportReview = async (reviewId) => {
    if (!currentUser) {
      setActionMessage(t('storedetails.loginToReport'));
      return;
    }

    setReportingReviewId(reviewId);

    try {
      await reportReview(reviewId, t('storedetails.reportReason'), currentUser.uid);
      setActionMessage(t('storedetails.reportSent'));
    } catch (error) {
      setActionMessage(error.message || t('storedetails.reportError'));
    } finally {
      setReportingReviewId(null);
    }
  };

  if (!loading && !store) {
    return (
      <div className="store-details" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <h2>{actionMessage ? t('storedetails.loadFailedTitle') : t('storedetails.notFoundTitle')}</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
          {actionMessage || t('storedetails.notFoundDesc')}
        </p>
        <Button variant="primary" onClick={() => onNavigate('dashboard')}>
          {t('storedetails.backHome')}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="store-details" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <h2>{t('storedetails.loading')}</h2>
      </div>
    );
  }

  return (
    <div className="store-details">
      <div className="sd__breadcrumb">
        <button className="breadcrumb-link" onClick={() => onNavigate('dashboard')}>
          {t('nav.home')}
        </button>
        <span className="breadcrumb-sep">/</span>
        <button className="breadcrumb-link" onClick={() => onNavigate('all-stores')}>
          {t('storedetails.allStores')}
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{store.title}</span>
      </div>

      <div className="sd__cover">
        <div className="sd__cover-overlay"></div>
        <div className="sd__cover-content">
          <div
            className="sd__logo-area"
            role="button"
            tabIndex={0}
            aria-label={t('storedetails.zoomMainAria')}
            onClick={() => {
              if (storeImages.length > 0) {
                setLightboxIndex(0);
              }
            }}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && storeImages.length > 0) {
                event.preventDefault();
                setLightboxIndex(0);
              }
            }}
          >
            {getStoreMainImage(store) ? (
              <>
                <img src={getStoreMainImage(store)} alt={store.title} className="sd__logo-img" />
                <span className="sd__logo-zoom">
                  <ZoomIn size={22} />
                </span>
              </>
            ) : (
              <span className="sd__logo-emoji">
                <Store size={48} />
              </span>
            )}
          </div>
          <div className="sd__cover-info">
            <div className="sd__title-row">
              <h1 className="sd__title">{store.title}</h1>
              {store.badge && <span className="sd__badge">{store.badge}</span>}
            </div>
            <div className="sd__cover-meta">
              <span className="sd__cover-category">{store.category}</span>
              <span className="sd__cover-wilaya">
                <MapPin size={15} />
                {store.wilaya}
              </span>
              <span className="sd__cover-rating">
                <span className="sd__stars">{renderStars(reviewStats.averageRating)}</span>
                <span>{reviewStats.averageRating.toFixed(1)}</span>
                <span className="sd__review-count">{t('storedetails.reviewCount', { count: reviewStats.reviewCount })}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="sd__body">
        <div className="sd__main">
          <section className="sd__section">
            <h2 className="sd__section-title">{t('storedetails.aboutTitle')}</h2>
            <p className="sd__about-text">{store.description || store.about}</p>
            {store.tags && store.tags.length > 0 && (
              <div className="sd__tags">
                {store.tags.map((tag, index) => (
                  <span key={`${tag}-${index}`} className="sd__tag">#{tag}</span>
                ))}
              </div>
            )}
          </section>

          {storeImages.length > 1 && (
            <section className="sd__section">
              <h2 className="sd__section-title">{t('storedetails.galleryTitle')}</h2>
              <div className="sd__gallery">
                {storeImages.map((url, index) => (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    className="sd__gallery-item"
                    aria-label={t('storedetails.galleryAria', { index: index + 1 })}
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img src={url} alt={`${store.title} ${index + 1}`} loading="lazy" className="sd__gallery-img" />
                    <span className="sd__gallery-zoom">
                      <ZoomIn size={20} />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="sd__section">
            <h2 className="sd__section-title">{t('storedetails.reviewsTitle')}</h2>
            {actionMessage && <p className="sd__action-message">{actionMessage}</p>}

            <form className="sd__review-form" onSubmit={handleReviewSubmit}>
              <div className="sd__rating-picker">
                <span className="sd__rating-picker-label">{t('storedetails.ratingLabel')}</span>
                <div className="sd__stars-input">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (ratingHover || Number(reviewForm.rating)) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        className={`sd__star-btn ${active ? 'active' : ''}`}
                        aria-label={t('storedetails.starsAria', { count: star })}
                        title={t('storedetails.starsAria', { count: star })}
                        onMouseEnter={() => setRatingHover(star)}
                        onMouseLeave={() => setRatingHover(null)}
                        onFocus={() => setRatingHover(star)}
                        onBlur={() => setRatingHover(null)}
                        onClick={() => setReviewForm((prev) => ({ ...prev, rating: String(star) }))}
                      >
                        <Star size={28} fill={active ? 'currentColor' : 'none'} strokeWidth={1.5} />
                      </button>
                    );
                  })}
                </div>
                <span className="sd__rating-picker-value">{reviewForm.rating} / 5</span>
              </div>

              <label className="sd__review-field">
                <span>{t('storedetails.yourReview')}</span>
                <textarea
                  rows="4"
                  value={reviewForm.comment}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                  placeholder={t('storedetails.reviewPlaceholder')}
                />
              </label>

              <Button type="submit" variant="glow" disabled={submitting}>
                {submitting ? t('storedetails.saving') : t('storedetails.submitReview')}
              </Button>
            </form>

            <div className="sd__review-list">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <article key={review.id} className="sd__review-card">
                    <div className="sd__review-head">
                      <div>
                        <strong>{review.userName || t('storedetails.anonymous')}</strong>
                        <p>{review.comment}</p>
                      </div>
                      <span className="sd__review-stars">{renderStars(review.rating)}</span>
                    </div>
                    <div className="sd__review-meta">
                      <span>{review.createdAt?.toDate ? review.createdAt.toDate().toLocaleString(lang === 'ar' ? 'ar-DZ' : lang) : t('storedetails.recent')}</span>
                      {currentUser && (
                        <button
                          type="button"
                          className="sd__report-btn"
                          onClick={() => handleReportReview(review.id)}
                          disabled={reportingReviewId === review.id}
                        >
                          {reportingReviewId === review.id ? t('storedetails.sending') : t('storedetails.report')}
                        </button>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <p className="sd__empty-state">{t('storedetails.noReviews')}</p>
              )}
            </div>
          </section>

          {store.products && store.products.length > 0 && (
            <section className="sd__section">
              <h2 className="sd__section-title">{t('storedetails.productsTitle')}</h2>
              <div className="sd__products-grid">
                {store.products.map((product, index) => (
                  <div key={`${product.name}-${index}`} className="sd__product-card">
                    <div className="sd__product-placeholder">
                      <Package size={28} />
                    </div>
                    <div className="sd__product-info">
                      <span className="sd__product-name">{product.name}</span>
                      <span className="sd__product-price">{product.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="sd__sidebar">
          <div className="sd__sidebar-card">
            <h3 className="sd__sidebar-title">{t('storedetails.contactTitle')}</h3>

            <div className="sd__contact-item">
              <span className="sd__contact-icon">
                <MapPin size={17} />
              </span>
              <div>
                <span className="sd__contact-label">{t('storedetails.address')}</span>
                <span className="sd__contact-value">{store.location || `${store.wilaya || ''} - ${store.city || ''}`}</span>
              </div>
            </div>

            {store.phone && (
              <div className="sd__contact-item">
                <span className="sd__contact-icon">
                  <Phone size={17} />
                </span>
                <div>
                  <span className="sd__contact-label">{t('storedetails.phone')}</span>
                  <span className="sd__contact-value">{store.phone}</span>
                </div>
              </div>
            )}

            {store.email && (
              <div className="sd__contact-item">
                <span className="sd__contact-icon">
                  <Mail size={17} />
                </span>
                <div>
                  <span className="sd__contact-label">{t('storedetails.email')}</span>
                  <span className="sd__contact-value">{store.email}</span>
                </div>
              </div>
            )}

            {store.whatsapp && (
              <div className="sd__contact-item">
                <span className="sd__contact-icon">
                  <MessageCircle size={17} />
                </span>
                <div>
                  <span className="sd__contact-label">{t('storedetails.whatsapp')}</span>
                  <span className="sd__contact-value">{store.whatsapp}</span>
                </div>
              </div>
            )}

            {store.website && (
              <a href={store.website} target="_blank" rel="noopener noreferrer" className="sd__social-link sd__social-link--website">
                <span className="sd__contact-icon">
                  <Globe size={18} />
                </span>
                <div className="sd__social-content">
                  <span className="sd__contact-label">{t('storedetails.website')}</span>
                  <span className="sd__social-value">{t('storedetails.visitWebsite') || 'زيارة الموقع'}</span>
                </div>
              </a>
            )}

            {store.instagram && (
              <a href={store.instagram} target="_blank" rel="noopener noreferrer" className="sd__social-link sd__social-link--instagram">
                <span className="sd__contact-icon">
                  <InstagramIcon size={18} />
                </span>
                <div className="sd__social-content">
                  <span className="sd__contact-label">{t('storedetails.instagram')}</span>
                  <span className="sd__social-value">Instagram</span>
                </div>
              </a>
            )}

            {store.facebook && (
              <a href={store.facebook} target="_blank" rel="noopener noreferrer" className="sd__social-link sd__social-link--facebook">
                <span className="sd__contact-icon">
                  <FacebookIcon size={18} />
                </span>
                <div className="sd__social-content">
                  <span className="sd__contact-label">{t('storedetails.facebook')}</span>
                  <span className="sd__social-value">Facebook</span>
                </div>
              </a>
            )}

            {store.tiktok && (
              <a href={store.tiktok} target="_blank" rel="noopener noreferrer" className="sd__social-link sd__social-link--tiktok">
                <span className="sd__contact-icon">
                  <Music size={18} />
                </span>
                <div className="sd__social-content">
                  <span className="sd__contact-label">{t('storedetails.tiktok')}</span>
                  <span className="sd__social-value">TikTok</span>
                </div>
              </a>
            )}
          </div>

          <div className="sd__sidebar-card sd__map-placeholder">
            <div className="sd__map-inner">
              <span className="sd__map-icon">
                <MapPinned size={24} />
              </span>
              <span className="sd__map-text">{t('storedetails.mapSoon')}</span>
            </div>
          </div>

          <Button variant="secondary" onClick={() => onNavigate('all-stores')} className="sd__back-btn">
            {t('storedetails.backToList')}
          </Button>
        </aside>
      </div>

      {lightboxIndex !== null && storeImages[lightboxIndex] && (
        <div
          className="sd-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t('storedetails.lightboxAria')}
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="sd-lightbox__close"
            aria-label={t('storedetails.closePreview')}
            onClick={() => setLightboxIndex(null)}
          >
            <X size={24} />
          </button>

          {storeImages.length > 1 && (
            <>
              <button
                type="button"
                className="sd-lightbox__nav sd-lightbox__nav--next"
                aria-label={t('storedetails.nextImage')}
                onClick={(event) => {
                  event.stopPropagation();
                  setLightboxIndex((lightboxIndex + 1) % storeImages.length);
                }}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                className="sd-lightbox__nav sd-lightbox__nav--prev"
                aria-label={t('storedetails.prevImage')}
                onClick={(event) => {
                  event.stopPropagation();
                  setLightboxIndex((lightboxIndex - 1 + storeImages.length) % storeImages.length);
                }}
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <img
            src={storeImages[lightboxIndex]}
            alt={t('storedetails.imageAlt', { title: store.title, index: lightboxIndex + 1 })}
            className="sd-lightbox__img"
            onClick={(event) => event.stopPropagation()}
          />

          {storeImages.length > 1 && (
            <span className="sd-lightbox__counter">
              {lightboxIndex + 1} / {storeImages.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StoreDetails;
