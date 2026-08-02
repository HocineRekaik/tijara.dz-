import React from 'react';
import CategoryPage from './CategoryPage';

const AccessoriesCategory = ({ onViewStore, onNavigate }) => (
  <CategoryPage
    categoryName="الإكسسوارات"
    onViewStore={onViewStore}
    onNavigate={onNavigate}
  />
);

export default AccessoriesCategory;
