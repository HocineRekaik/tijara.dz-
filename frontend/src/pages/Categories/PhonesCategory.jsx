import React from 'react';
import CategoryPage from './CategoryPage';

const PhonesCategory = ({ onViewStore, onNavigate }) => (
  <CategoryPage
    categoryName="الهواتف"
    onViewStore={onViewStore}
    onNavigate={onNavigate}
  />
);

export default PhonesCategory;
