import React from 'react';
import { Smartphone, Shirt, Headphones, Laptop, Dumbbell, Store } from 'lucide-react';

const categoryIcons = {
  'الهواتف': Smartphone,
  'الملابس': Shirt,
  'الإكسسوارات': Headphones,
  'الإلكترونيات': Laptop,
  'المنتجات الرياضية': Dumbbell,
};

const CategoryIcon = ({ category, size = 20, strokeWidth = 2, className = '' }) => {
  const Icon = categoryIcons[category] || Store;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
};

export default CategoryIcon;
