import React from 'react';
import CategoryPage from './CategoryPage';

const SportsCategory = ({ onViewStore, onNavigate }) => (
  <CategoryPage
    categoryName="المنتجات الرياضية"
    onViewStore={onViewStore}
    onNavigate={onNavigate}
  />
);

export default SportsCategory;
