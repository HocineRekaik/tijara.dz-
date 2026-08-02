import React from 'react';
import CategoryPage from './CategoryPage';

const ElectronicsCategory = ({ onViewStore, onNavigate }) => (
  <CategoryPage
    categoryName="الإلكترونيات"
    onViewStore={onViewStore}
    onNavigate={onNavigate}
  />
);

export default ElectronicsCategory;
