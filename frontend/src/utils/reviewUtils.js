export const calculateReviewStats = (reviews = []) => {
  const visibleReviews = reviews.filter((review) => !review.deleted);

  if (!visibleReviews.length) {
    return {
      averageRating: 0,
      reviewCount: 0,
      ratingBreakdown: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    };
  }

  const total = visibleReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  const averageRating = Number((total / visibleReviews.length).toFixed(1));
  const ratingBreakdown = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  visibleReviews.forEach((review) => {
    const roundedRating = Math.max(1, Math.min(5, Math.round(Number(review.rating || 0))));
    ratingBreakdown[roundedRating] += 1;
  });

  return {
    averageRating,
    reviewCount: visibleReviews.length,
    ratingBreakdown,
  };
};
