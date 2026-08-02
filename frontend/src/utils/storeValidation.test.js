import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateStoreData, hasContactMethod, normalizeUrl } from './storeValidation.js';

const requiredOnly = {
  title: 'متجر الهواتف',
  category: 'الإلكترونيات',
  wilaya: 'الجزائر',
  city: 'باب الزوار',
  description: 'متجر هواتف.',
  phone: '0555123456',
};

test('submits with only required fields', () => {
  assert.doesNotThrow(() => validateStoreData(requiredOnly));
  assert.equal(hasContactMethod(requiredOnly), true);
});

test('submits with required fields + instagram only', () => {
  const payload = { ...requiredOnly, phone: '', email: '', website: '', whatsapp: '', instagram: '@store.dz' };
  assert.doesNotThrow(() => validateStoreData(payload));
});

test('submits with required fields + multiple social links', () => {
  const payload = {
    ...requiredOnly,
    phone: '',
    instagram: '@store.dz',
    facebook: 'facebook.com/store.dz',
    tiktok: '@store.dz',
    whatsapp: '0555123456',
    website: 'store.dz',
    email: 'contact@store.dz',
  };
  assert.doesNotThrow(() => validateStoreData(payload));
});

test('accepts a very short description and short names', () => {
  const payload = { ...requiredOnly, title: 'متجر', description: 'بائع أجهزة.', city: 'وهران' };
  assert.doesNotThrow(() => validateStoreData(payload));
});

test('accepts free-form values for optional fields', () => {
  const payload = {
    ...requiredOnly,
    phone: '0661234567',
    email: 'anything@example.com',
    website: 'store.dz',
    instagram: 'handle with spaces and symbols *%$#',
    facebook: 'x'.repeat(200),
  };
  assert.doesNotThrow(() => validateStoreData(payload));
});

test('fails when no contact method is provided', () => {
  const payload = {
    ...requiredOnly,
    phone: '',
    email: '',
    whatsapp: '',
    website: '',
    instagram: '',
    facebook: '',
    tiktok: '',
  };
  assert.equal(hasContactMethod(payload), false);
  assert.throws(() => validateStoreData(payload));
});

test('fails when a required field is missing', () => {
  assert.throws(() => validateStoreData({ ...requiredOnly, city: '' }));
  assert.throws(() => validateStoreData({ ...requiredOnly, description: '' }));
  assert.throws(() => validateStoreData({ ...requiredOnly, wilaya: '' }));
});

test('normalizes website URLs', () => {
  assert.equal(normalizeUrl('store.dz'), 'https://store.dz');
  assert.equal(normalizeUrl('www.store.dz'), 'https://www.store.dz');
  assert.equal(normalizeUrl('https://store.dz'), 'https://store.dz');
  assert.equal(normalizeUrl(''), '');
});
