import test from 'node:test';
import assert from 'node:assert/strict';
import { rankStoresForQuery } from './aiRanking.js';

test('rankStoresForQuery prioritizes category, wilaya, rating, and review count', () => {
  const ranked = rankStoresForQuery([
    {
      id: 'a',
      title: 'متجر إلكترونيات',
      category: 'إلكترونيات',
      wilaya: 'الجزائر',
      description: 'متجر يبيع هواتف',
      rating: 4.7,
      reviewCount: 18,
      tags: ['هاتف'],
      products: [{ name: 'iPhone 15 Pro' }],
    },
    {
      id: 'b',
      title: 'متجر ملابس',
      category: 'ملابس',
      wilaya: 'الجزائر',
      description: 'ملابس رياضية',
      rating: 4.9,
      reviewCount: 30,
      tags: ['رياضة'],
      products: [{ name: 'حذاء رياضي' }],
    },
    {
      id: 'c',
      title: 'متجر إلكترونيات',
      category: 'إلكترونيات',
      wilaya: 'وهران',
      description: 'هواتف ذكية',
      rating: 4.8,
      reviewCount: 22,
      tags: ['هاتف'],
      products: [{ name: 'Samsung Galaxy' }],
    },
  ], {
    product: 'iPhone 15 Pro',
    category: 'إلكترونيات',
    wilaya: 'الجزائر',
    city: 'الجزائر العاصمة',
  });

  assert.equal(ranked[0].id, 'a');
  assert.equal(ranked[1].id, 'c');
  assert.equal(ranked[2].id, 'b');
});
