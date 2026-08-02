import React, { useEffect, useMemo, useState } from 'react';
import './CategoryPage.css';
import StoreCard from '../../components/StoreCard/StoreCard';
import CategoryIcon from '../../components/CategoryIcon/CategoryIcon';
import { getStoresByCategory } from '../../firebase/firebaseService';
import { wilayas, categories } from '../../data/mockData';
import { useI18n } from '../../i18n/I18nContext';
import { Search, Star, Clock, SearchX } from 'lucide-react';

const updateMetadata = (title, description) => {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
  meta.name = 'description';
  meta.content = description;
  document.head.appendChild(meta);
};

const CategoryPage = ({ categoryName, onViewStore, onNavigate }) => {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentCategory = categories.find((c) => c.name === categoryName);
  const categoryDisplayName = currentCategory ? t('category.' + currentCategory.id) : categoryName;

  useEffect(() => {
    updateMetadata(
      t('categories.metaTitle', { category: categoryName }),
      t('categories.metaDescription', { category: categoryName }),
    );
  }, [categoryName, t]);

  useEffect(() => {
    const loadCategoryStores = async () => {
      setLoading(true);
      try {
        const data = await getStoresByCategory(categoryName);
        setStores(data);
      } catch (error) {
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryStores();
  }, [categoryName]);

  const filtered = useMemo(() => {
    let list = [...stores];
    const query = search.trim().toLowerCase();

    if (query) {
      const terms = query.split(' ').filter(Boolean);
      list = list.filter((store) => {
        const content = `${store.title} ${store.description || ''} ${store.category || ''} ${store.wilaya || ''} ${(store.tags || []).join(' ')}`.toLowerCase();
        return terms.every((term) => content.includes(term));
      });
    }

    if (wilayaFilter) {
      list = list.filter((s) => s.wilaya === wilayaFilter);
    }

    if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      list.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    }

    return list;
  }, [stores, search, wilayaFilter, sortBy]);

  return (
    <div className="category-page">
      {/* Breadcrumb */}
      <div className="category-page__breadcrumb">
        <button className="breadcrumb-link" onClick={() => onNavigate('dashboard')}>
          {t('nav.home')}
        </button>
        <span className="breadcrumb-sep">/</span>
        <button className="breadcrumb-link" onClick={() => onNavigate('all-stores')}>
          {t('storedetails.allStores')}
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{categoryDisplayName}</span>
      </div>

      {/* Category Hero Banner */}
      <div
        className="category-page__hero"
        style={
          categories.find((c) => c.name === categoryName)?.image
            ? { backgroundImage: `linear-gradient(90deg, rgba(15, 118, 110, 0.92) 0%, rgba(15, 118, 110, 0.55) 100%), url('${categories.find((c) => c.name === categoryName).image}')` }
            : undefined
        }
      >
        <span className="category-page__hero-icon">
          <CategoryIcon category={categoryName} size={30} />
        </span>
        <div>
          <h1 className="category-page__hero-title">{categoryDisplayName}</h1>
          <p className="category-page__hero-subtitle">
            {t('categories.heroSubtitle', { category: categoryName, count: stores.length })}
          </p>
        </div>
      </div>

      {/* Mini Filter Bar */}
      <div className="category-page__filters">
        <div className="cat-filter-search-wrapper">
          <span className="cat-filter-icon">
            <Search size={17} />
          </span>
          <input
            type="text"
            className="cat-filter-input"
            placeholder={t('categories.searchPlaceholder', { category: categoryName })}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="cat-filter-select"
          value={wilayaFilter}
          onChange={(e) => setWilayaFilter(e.target.value)}
        >
          <option value="">{t('allstores.allWilayas')}</option>
          {wilayas.map((w) => (
            <option key={w.id} value={w.name}>{w.name}</option>
          ))}
        </select>

        <div className="cat-sort-group">
          <button
            className={`sort-chip ${sortBy === 'rating' ? 'active' : ''}`}
            onClick={() => setSortBy('rating')}
          >
            <Star size={15} />
            {t('allstores.sortRating')}
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

      {/* Results */}
      <p className="category-page__count">{t('categories.count', { count: filtered.length })}</p>

      {filtered.length > 0 ? (
        <div className="category-page__grid">
          {filtered.map((store) => (
            <StoreCard key={store.id} store={store} onViewStore={() => onViewStore(store.id)} />
          ))}
        </div>
      ) : (
        <div className="category-page__empty">
          <span className="empty-icon">
            <SearchX size={32} />
          </span>
          <h3>{t('categories.emptyTitle')}</h3>
          <p>{t('categories.emptyDesc')}</p>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
