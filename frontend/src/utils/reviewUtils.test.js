import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateReviewStats } from './reviewUtils.js';

test('calculateReviewStats returns average and breakdown for visible reviews', () => {
  const stats = calculateReviewStats([
    { rating: 5, deleted: false },
    { rating: 4, deleted: false },
    { rating: 4, deleted: true },
    { rating: 3, deleted: false },
  ]);

  assert.equal(stats.reviewCount, 3);
  assert.equal(stats.averageRating, 4.0);
  assert.deepEqual(stats.ratingBreakdown, {
    1: 0,
    2: 0,
    3: 1,
    4: 1,
    5: 1,
  });
});

test('calculateReviewStats returns zero values when no reviews are available', () => {
  const stats = calculateReviewStats([]);

  assert.equal(stats.reviewCount, 0);
  assert.equal(stats.averageRating, 0);
  assert.deepEqual(stats.ratingBreakdown, {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
});
