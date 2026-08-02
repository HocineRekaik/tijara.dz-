import React, { useEffect, useMemo, useState } from 'react';
import './AllStores.css';
import StoreCard from '../../components/StoreCard/StoreCard';
import Button from '../../components/Button/Button';
import { categories, wilayas } from '../../data/mockData';
import { getStores } from '../../firebase/firebaseService';
import { matchesStore, expandSearchTerms } from '../../utils/searchUtils';
import { useI18n } from '../../i18n/I18nContext';
import { Search, ScanSearch, Star, MessagesSquare, Clock, X, SearchX } from 'lucide-react';

const getRelevantScore = (store, query) => {
  const terms = expandSearchTerms(query);
  const text = `${store.title} ${store.description || ''} ${store.category || ''} ${store.subcategory || ''} ${store.wilaya || ''} ${store.city || ''} ${store.tags?.join(' ') || ''}`.toLowerCase();
  return terms.reduce((score, term) => (term ? score + (text.includes(term) ? 2 : 0) : score), 0);
};

const updateMetadata = (title, description) => {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
  meta.name = 'description';
  meta.content = description;
  document.head.appendChild(meta);
};

const AllStores = ({ onViewStore, onNavigate, initialSearch = '', initialCategory = '' }) => {
  const { t } = useI18n();
  const [search, setSearch] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [wilayaFilter, setWilayaFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortBy, setSortBy] = useState('relevant');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearch(initialSearch || '');
  }, [initialSearch]);

  useEffect(() => {
    setCategoryFilter(initialCategory || '');
  }, [initialCategory]);

  useEffect(() => {
    updateMetadata(t('allstores.metaTitle'), t('allstores.metaDescription'));
  }, [t]);

  useEffect(() => {
    const loadStores = async () => {
      setLoading(true);
      try {
        const data = await getStores();
        setStores(data);
      } catch (error) {
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, []);

  const cityOptions = useMemo(() => {
    const cities = new Set(stores.map((store) => store.city).filter(Boolean));
    return Array.from(cities).sort();
  }, [stores]);

  const filtered = useMemo(() => {
    let list = [...stores];
    const query = search.trim();

    // Search across name, description, tags, category, subcategory, wilaya, city
    if (query) {
      list = list.filter((store) => matchesStore(store, query));
    }

    if (categoryFilter) {
      list = list.filter((s) => s.category === categoryFilter);
    }

    if (wilayaFilter) {
      list = list.filter((s) => s.wilaya === wilayaFilter);
    }

    if (cityFilter) {
      list = list.filter((s) => s.city === cityFilter);
    }

    if (ratingFilter) {
      const minimum = Number(ratingFilter);
      list = list.filter((s) => (s.rating || 0) >= minimum);
    }

    if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'reviews') {
      list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    } else {
      list.sort((a, b) => getRelevantScore(b, query) - getRelevantScore(a, query));
    }

    return list;
  }, [search, categoryFilter, wilayaFilter, cityFilter, ratingFilter, sortBy, stores]);

  return (
    <div className="all-stores-page">
      {/* Breadcrumb */}
      <div className="all-stores__breadcrumb">
        <button className="breadcrumb-link" onClick={() => onNavigate('dashboard')}>
          {t('nav.home')}
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{t('allstores.breadcrumbCurrent')}</span>
      </div>

      {/* Page Header */}
      <div className="all-stores__header">
        <h1 className="all-stores__title">{t('allstores.title')}</h1>
        <p className="all-stores__subtitle">
          {t('allstores.subtitle')}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="all-stores__filters">
        {/* Search */}
        <div className="filter-search-wrapper">
          <span className="filter-search-icon">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="filter-search-input"
            placeholder={t('allstores.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category dropdown */}
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">{t('dashboard.allCategories')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {t('category.' + cat.id)}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={wilayaFilter}
          onChange={(e) => setWilayaFilter(e.target.value)}
        >
          <option value="">{t('allstores.allWilayas')}</option>
          {wilayas.map((w) => (
            <option key={w.id} value={w.name}>
              {w.name}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="">{t('allstores.allCities')}</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
        >
          <option value="">{t('allstores.allRatings')}</option>
          <option value="4">{t('allstores.rating4')}</option>
          <option value="3">{t('allstores.rating3')}</option>
          <option value="2">{t('allstores.rating2')}</option>
        </select>

        <div className="filter-sort-group">
          <button
            className={`sort-chip ${sortBy === 'relevant' ? 'active' : ''}`}
            onClick={() => setSortBy('relevant')}
          >
            <ScanSearch size={15} />
            {t('allstores.sortRelevant')}
          </button>
          <button
            className={`sort-chip ${sortBy === 'rating' ? 'active' : ''}`}
            onClick={() => setSortBy('rating')}
          >
            <Star size={15} />
            {t('allstores.sortRating')}
          </button>
          <button
            className={`sort-chip ${sortBy === 'reviews' ? 'active' : ''}`}
            onClick={() => setSortBy('reviews')}
          >
            <MessagesSquare size={15} />
            {t('allstores.sortReviews')}
          </button>
          <button
            className={`sort-chip ${sortBy === 'newest' ? 'active' : ''}`}
            onClick={() => setSortBy('newest')}
          >
            <Clock size={15} />
            {t('allstores.sortNewest')}
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="all-stores__results-info">
        <span>{loading ? t('allstores.loading') : t('allstores.resultsCount', { count: filtered.length })}</span>
        {(categoryFilter || wilayaFilter || search) && (
          <button
            className="clear-filters-btn"
            onClick={() => {
              setSearch('');
              setCategoryFilter('');
              setWilayaFilter('');
            }}
          >
            <X size={14} />
            {t('allstores.clearFilters')}
          </button>
        )}
      </div>

      {/* Store Grid */}
      {!loading && filtered.length > 0 ? (
        <div className="all-stores__grid">
          {filtered.map((store) => (
            <StoreCard key={store.id} store={store} onViewStore={() => onViewStore(store)} />
          ))}
        </div>
      ) : !loading ? (
        <div className="all-stores__empty">
          <span className="empty-icon">
            <SearchX size={32} />
          </span>
          <h3>{t('allstores.emptyTitle')}</h3>
          <p>{t('allstores.emptyDesc')}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setSearch('');
              setCategoryFilter('');
              setWilayaFilter('');
            }}
          >
            {t('allstores.viewAll')}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default AllStores;
