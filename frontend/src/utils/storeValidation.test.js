import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateStoreData,
  hasContactMethod,
  normalizeUrl,
  normalizeInstagram,
  normalizeFacebook,
  normalizeTikTok,
} from './storeValidation.js';

const normalizeFields = (payload) => ({
  ...payload,
  website: normalizeUrl(payload.website),
  instagram: normalizeInstagram(payload.instagram),
  facebook: normalizeFacebook(payload.facebook),
  tiktok: normalizeTikTok(payload.tiktok),
});

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
  assert.doesNotThrow(() => validateStoreData(normalizeFields(payload)));
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
  assert.doesNotThrow(() => validateStoreData(normalizeFields(payload)));
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
  assert.doesNotThrow(() => validateStoreData(normalizeFields(payload)));
});

test('submits with no contact method provided', () => {
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
  assert.doesNotThrow(() => validateStoreData(payload));
});

test('submits with only title and category (all optional fields empty)', () => {
  const payload = { title: 'متجر الهواتف', category: 'الإلكترونيات' };
  assert.doesNotThrow(() => validateStoreData(payload));
});

test('fails when a required field is missing', () => {
  assert.throws(() => validateStoreData({ ...requiredOnly, title: '' }));
  assert.throws(() => validateStoreData({ ...requiredOnly, category: '' }));
});

test('does not fail when optional fields are empty', () => {
  assert.doesNotThrow(() => validateStoreData({ ...requiredOnly, city: '' }));
  assert.doesNotThrow(() => validateStoreData({ ...requiredOnly, description: '' }));
  assert.doesNotThrow(() => validateStoreData({ ...requiredOnly, wilaya: '' }));
});

test('normalizes website URLs', () => {
  assert.equal(normalizeUrl('store.dz'), 'https://store.dz');
  assert.equal(normalizeUrl('www.store.dz'), 'https://www.store.dz');
  assert.equal(normalizeUrl('https://store.dz'), 'https://store.dz');
  assert.equal(normalizeUrl(''), '');
});
