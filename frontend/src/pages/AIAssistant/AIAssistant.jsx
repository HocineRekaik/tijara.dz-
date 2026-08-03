import React, { useState } from 'react';
import './AIAssistant.css';
import Button from '../../components/Button/Button';
import StoreCard from '../../components/StoreCard/StoreCard';
import { getStores, getReviewsForStore } from '../../firebase/firebaseService';
import { rankStoresForQuery } from '../../utils/aiRanking';
import { useI18n } from '../../i18n/I18nContext';
import { Bot, UserRound, Send } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const suggestedQuestions = [
  'ai.suggested1',
  'ai.suggested2',
  'ai.suggested3',
];

const AIAssistant = ({ onNavigate }) => {
  const { t } = useI18n();
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      text: t('ai.greeting'),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const submitMessage = async (question) => {
    const messageText = question || input.trim();
    if (!messageText || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setErrorMessage('');

    try {
      let aiResponse;
      try {
        aiResponse = await fetch(`${API_BASE}/api/ai-agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: messageText }),
        });
      } catch {
        throw new Error(t('ai.connectError'));
      }

      const aiText = await aiResponse.text();
      let aiPayload = null;
      try {
        aiPayload = JSON.parse(aiText);
      } catch {
        aiPayload = null;
      }

      if (!aiResponse.ok || !aiPayload?.success) {
        throw new Error(aiPayload?.error || t('ai.connectError'));
      }

      const stores = await getStores();
      const storesWithReviews = await Promise.all(
        stores.map(async (store) => {
          const reviews = await getReviewsForStore(store.id);
          const reviewCount = reviews.length;
          const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
          const rating = reviewCount > 0 ? Number((total / reviewCount).toFixed(1)) : 0;
          return { ...store, rating, reviewCount };
        })
      );

      const rankedStores = rankStoresForQuery(storesWithReviews, aiPayload.extracted || {}).slice(0, 6);
      const botText = rankedStores.length > 0
        ? `${aiPayload.responseText || t('ai.foundStores')}\n\n${t('ai.resultsRankingNote')}`
        : t('ai.noResults');

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: botText,
        },
      ]);
      setResults(rankedStores);
    } catch (error) {
      const fallbackText = t('ai.fallback');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: fallbackText,
        },
      ]);
      setResults([]);
      setErrorMessage(error.message || fallbackText);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitMessage();
  };

  const handleSuggestion = (question) => {
    submitMessage(question);
  };

  return (
    <div className="ai-page">
      <div className="ai-page__breadcrumb">
        <button className="breadcrumb-link" onClick={() => onNavigate('dashboard')}>
          {t('nav.home')}
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Tijara AI</span>
      </div>

      <div className="ai-page__hero">
        <div>
          <p className="ai-page__eyebrow">Tijara AI</p>
          <h1 className="ai-page__title">{t('ai.title')}</h1>
          <p className="ai-page__subtitle">
            {t('ai.subtitle')}
          </p>
        </div>
        <Button variant="glow" onClick={() => onNavigate('add-page')}>
          {t('ai.addPageNow')}
        </Button>
      </div>

      <div className="ai-chat-shell">
        <div className="ai-chat-panel">
          <div className="ai-chat__messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-message ai-message--${message.role}`}
              >
                <div className="ai-message__avatar">
                  {message.role === 'bot' ? <Bot size={20} /> : <UserRound size={20} />}
                </div>
                <div className="ai-message__bubble">
                  <p>{message.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="ai-message ai-message--bot ai-message--loading">
                <div className="ai-message__avatar"><Bot size={20} /></div>
                <div className="ai-message__bubble">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
          </div>

          {errorMessage && <p className="ai-error">{errorMessage}</p>}

          <div className="ai-suggestions-grid">
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                className="ai-suggestion-pill"
                onClick={() => handleSuggestion(t(question))}
                type="button"
              >
                {t(question)}
              </button>
            ))}
          </div>

          <form className="ai-input-row" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="ai-input"
              placeholder={t('ai.inputPlaceholder')}
              aria-label={t('ai.inputPlaceholder')}
            />
            <Button type="submit" variant="primary" disabled={loading || !input.trim()} icon={<Send size={16} />}>
              {t('ai.send')}
            </Button>
          </form>
        </div>

        <aside className="ai-page__sidebar">
          <div className="ai-sidebar-card">
            <h3>{t('ai.howTitle')}</h3>
            <ul>
              <li>{t('ai.how1')}</li>
              <li>{t('ai.how2')}</li>
              <li>{t('ai.how3')}</li>
            </ul>
          </div>
          <div className="ai-sidebar-card ai-sidebar-card--tip">
            <h3>{t('ai.tipTitle')}</h3>
            <p>{t('ai.tipDesc')}</p>
          </div>
        </aside>
      </div>

      {results.length > 0 && (
        <section className="ai-results-section">
          <div className="ai-results-header">
            <h2>{t('ai.resultsTitle')}</h2>
            <p>{t('ai.resultsDesc')}</p>
          </div>
          <div className="ai-results-grid">
            {results.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                onViewStore={() => onNavigate('store-details', { storeSlug: store.slug || store.id, storeId: store.id })}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default AIAssistant;
