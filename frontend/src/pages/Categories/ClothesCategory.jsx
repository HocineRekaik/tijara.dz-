import React from 'react';
import CategoryPage from './CategoryPage';

const ClothesCategory = ({ onViewStore, onNavigate }) => (
  <CategoryPage
    categoryName="الملابس"
    onViewStore={onViewStore}
    onNavigate={onNavigate}
  />
);

export default ClothesCategory;
