import React, { useEffect, useMemo, useState } from 'react';
import './Dashboard.css';
import Footer from '../../components/Footer/Footer';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import CategoryIcon from '../../components/CategoryIcon/CategoryIcon';
import { categories } from '../../data/mockData';
import { getStoreMainImage } from '../../utils/storeImages';
import { matchesStore, getSuggestionPool, filterSuggestions } from '../../utils/searchUtils';
import { getStores } from '../../firebase/firebaseService';
import { useI18n } from '../../i18n/I18nContext';
import { Search, ShoppingBag, Store, ShoppingCart, Zap, Star, Plus, TrendingUp, X, LayoutGrid, ChevronLeft } from 'lucide-react';

const Dashboard = ({ onViewStore, onNavigate }) => {
  const { t } = useI18n();
  const [userType, setUserType] = useState('buyer');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchScope, setSearchScope] = useState('stores');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const suggestionPool = useMemo(() => getSuggestionPool(categories, stores), [stores]);

  const suggestions = useMemo(
    () => (suggestionsOpen ? filterSuggestions(suggestionPool, searchQuery) : []),
    [suggestionPool, searchQuery, suggestionsOpen]
  );

  useEffect(() => {
    let cancelled = false;
    getStores()
      .then((data) => {
        if (!cancelled) {
          setStores(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onNavigate('all-stores', {
      searchQuery: searchQuery.trim(),
      category: selectedCategory,
    });
  };

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName === selectedCategory ? null : categoryName);
  };

  const visibleStores = useMemo(() => {
    return stores.filter((item) => {
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      if (!matchesCategory) return false;
      return matchesStore(item, searchQuery);
    });
  }, [stores, selectedCategory, searchQuery]);

  const handleSuggestionSelect = (label) => {
    setSearchQuery(label);
    setSuggestionsOpen(false);
  };

  const filteredFeatured = visibleStores.slice(0, 4);
  const filteredLatest = visibleStores;

  const categoryCounts = useMemo(() => {
    const map = {};
    stores.forEach((store) => {
      map[store.category] = (map[store.category] || 0) + 1;
    });
    return map;
  }, [stores]);

  const renderEmptyState = (isSearch) => (
    <div className="no-results">
      <p>{isSearch ? t('dashboard.emptySearch') : t('dashboard.emptyNoData')}</p>
    </div>
  );

  const renderLoadingState = () => (
    <div className="no-results">
      <p>{t('dashboard.loading')}</p>
    </div>
  );

  const storeToCard = (store, featured) => (
    <Card
      key={store.id}
      title={store.title}
      description={store.description}
      category={store.category}
      location={[store.wilaya, store.city].filter(Boolean).join(' - ')}
      phone={store.phone}
      rating={store.rating}
      tags={store.tags || []}
      image={getStoreMainImage(store)}
      isFeatured={featured}
      onClick={() => onViewStore(store.id)}
    />
  );

  return (
    <div className="tijara-dashboard-page">

      <section className="hero-section" id="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">{t('dashboard.heroTitle')}</h1>
          <p className="hero-subtitle">
            {userType === 'buyer' ? t('dashboard.heroSubBuyer') : t('dashboard.heroSubSeller')}
          </p>

          <div className="hero-user-tabs" role="tablist" aria-label={t('dashboard.userTypeAria')}>
            <button
              type="button"
              role="tab"
              aria-selected={userType === 'buyer'}
              className={`hero-user-tab ${userType === 'buyer' ? 'active' : ''}`}
              onClick={() => setUserType('buyer')}
            >
              <ShoppingBag size={17} />
              {t('dashboard.tabBuyer')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={userType === 'seller'}
              className={`hero-user-tab ${userType === 'seller' ? 'active' : ''}`}
              onClick={() => setUserType('seller')}
            >
              <Store size={17} />
              {t('dashboard.tabSeller')}
            </button>
          </div>

          <div className="hero-search-type">
            <button
              type="button"
              className={`search-type-pill ${searchScope === 'stores' ? 'active' : ''}`}
              onClick={() => setSearchScope('stores')}
            >
              {t('dashboard.pillStores')}
            </button>
            <button
              type="button"
              className={`search-type-pill ${searchScope === 'products' ? 'active' : ''}`}
              onClick={() => setSearchScope('products')}
            >
              {t('dashboard.pillProducts')}
            </button>
          </div>

          <form className="hero-search-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder={
                  searchScope === 'products'
                    ? t('dashboard.placeholderProducts')
                    : t('dashboard.placeholderStores')
                }
                className="hero-search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
              />
              <span className="search-icon">
                <Search size={20} />
              </span>
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  aria-label={t('common.clearSearch')}
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestionsOpen(false);
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {suggestionsOpen && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    className="search-suggestion-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSuggestionSelect(suggestion.label);
                    }}
                  >
                    <span className="search-suggestion-icon">
                      <TrendingUp size={15} />
                    </span>
                    <span className="search-suggestion-label">{suggestion.label}</span>
                    <span className="search-suggestion-type">{suggestion.type}</span>
                  </button>
                ))}
              </div>
            )}
            <Button type="submit" variant="primary" className="hero-search-btn" icon={<Search size={18} />}>
              {t('common.search')}
            </Button>
          </form>

          <div className="hero-meta-cards">
            <div className="hero-meta-card">
              <span className="meta-icon-box">
                <ShoppingCart size={22} />
              </span>
              <div>
                <h4>{stores.length > 0 ? t('dashboard.metaPagesCount', { count: stores.length }) : t('dashboard.metaStartFirstPage')}</h4>
                <p>{t('dashboard.metaBrowseDesc')}</p>
              </div>
            </div>
            <div className="hero-meta-card">
              <span className="meta-icon-box">
                <Zap size={22} />
              </span>
              <div>
                <h4>{t('dashboard.metaQuickSearch')}</h4>
                <p>{t('dashboard.metaFindSeconds')}</p>
              </div>
            </div>
            <div className="hero-meta-card">
              <span className="meta-icon-box">
                <Star size={22} />
              </span>
              <div>
                <h4>{t('dashboard.metaSpecialOffers')}</h4>
                <p>{t('dashboard.metaOffersDaily')}</p>
              </div>
            </div>
          </div>

          <div className="hero-actions-row">
            <Button variant="secondary" onClick={() => onNavigate('categories')}>
              {t('common.browseCategories')}
            </Button>
            {userType === 'seller' && (
              <Button variant="glow" onClick={() => onNavigate('add-page')} className="cta-add-store" icon={<Plus size={17} />}>
                {t('dashboard.addPageFree')}
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="dashboard-layout">
        <div className="dashboard-toolbar">
          <div className="mobile-search-bar">
            <form className="mobile-search-form" onSubmit={handleSearchSubmit}>
              <span className="mobile-search-icon">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="mobile-search-input"
                placeholder={t('dashboard.mobilePlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="mobile-search-clear"
                  aria-label={t('common.clearSearch')}
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestionsOpen(false);
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </form>
            {suggestionsOpen && suggestions.length > 0 && (
              <div className="search-suggestions mobile-search-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    className="search-suggestion-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSuggestionSelect(suggestion.label);
                    }}
                  >
                    <span className="search-suggestion-icon">
                      <TrendingUp size={15} />
                    </span>
                    <span className="search-suggestion-label">{suggestion.label}</span>
                    <span className="search-suggestion-type">{suggestion.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <aside className="categories-sidebar" aria-label={t('dashboard.categoriesAria')}>
          <div className="sidebar-heading">
            <h2 className="sidebar-title">{t('dashboard.sidebarTitle')}</h2>
            <p className="sidebar-subtitle">{t('dashboard.sidebarSubtitle')}</p>
          </div>

          <div className="sidebar-cat-list">
            <button
              type="button"
              className={`sidebar-cat-item ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              <span className="sidebar-cat-icon">
                <LayoutGrid size={17} />
              </span>
              <span className="sidebar-cat-name">{t('dashboard.allCategories')}</span>
              <span className="sidebar-cat-count">{stores.length}</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`sidebar-cat-item ${selectedCategory === cat.name ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.name)}
              >
                <span className="sidebar-cat-icon">
                  <CategoryIcon category={cat.name} size={17} />
                </span>
                <span className="sidebar-cat-name">{t('category.' + cat.id)}</span>
                <span className="sidebar-cat-count">{categoryCounts[cat.name] || 0}</span>
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            className="sidebar-view-all"
            onClick={() => onNavigate('categories')}
            icon={<ChevronLeft size={16} />}
          >
            {t('common.viewAllCategories')}
          </Button>
        </aside>

        <main className="dashboard-main">
          <section className="stores-section featured-stores-bg" id="featured">
            <div className="section-header">
              <div className="title-row">
                <span className="section-badge">{t('dashboard.featuredBadge')}</span>
                <h2 className="section-title">{t('dashboard.featuredTitle')}</h2>
              </div>
              <p className="section-subtitle">{t('dashboard.featuredSubtitle')}</p>
            </div>

            {loading ? (
              renderLoadingState()
            ) : filteredFeatured.length > 0 ? (
              <div className="stores-grid">
                {filteredFeatured.map((store) => storeToCard(store, true))}
              </div>
            ) : (
              renderEmptyState(Boolean(searchQuery.trim()))
            )}
          </section>

          <section className="stores-section" id="latest">
            <div className="section-header">
              <h2 className="section-title">{t('dashboard.latestTitle')}</h2>
              <p className="section-subtitle">{t('dashboard.latestSubtitle')}</p>
            </div>

            {loading ? (
              renderLoadingState()
            ) : filteredLatest.length > 0 ? (
              <div className="stores-grid">
                {filteredLatest.map((store) => storeToCard(store, false))}
              </div>
            ) : (
              renderEmptyState(Boolean(searchQuery.trim()))
            )}
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
