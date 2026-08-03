import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebaseConfig';
import {
  sanitizeText,
  isValidRating,
  normalizeUrl,
  normalizeInstagram,
  normalizeFacebook,
  normalizeTikTok,
  validateStoreData,
  validateAdminStoreData,
} from '../utils/storeValidation';

const usersCollection = db ? collection(db, 'users') : null;
const storesCollection = db ? collection(db, 'stores') : null;
const reviewsCollection = db ? collection(db, 'reviews') : null;
const reportsCollection = db ? collection(db, 'reviewReports') : null;

const buildSafeStoreRequest = (requestData) => ({
  title: sanitizeText(requestData.title),
  category: sanitizeText(requestData.category),
  subcategory: sanitizeText(requestData.subcategory),
  wilaya: sanitizeText(requestData.wilaya),
  city: sanitizeText(requestData.city),
  phone: sanitizeText(requestData.phone),
  email: sanitizeText(requestData.email),
  website: normalizeUrl(requestData.website),
  instagram: normalizeInstagram(requestData.instagram),
  facebook: normalizeFacebook(requestData.facebook),
  tiktok: normalizeTikTok(requestData.tiktok),
  whatsapp: sanitizeText(requestData.whatsapp),
  description: sanitizeText(requestData.description),
  profileImageUrl: sanitizeText(requestData.profileImageUrl),
  logo: sanitizeText(requestData.logo),
  galleryImages: Array.isArray(requestData.galleryImages)
    ? requestData.galleryImages.map((url) => sanitizeText(url)).filter(Boolean)
    : [],
  gallery: Array.isArray(requestData.gallery)
    ? requestData.gallery.map((url) => sanitizeText(url)).filter(Boolean)
    : [],
  sellerId: sanitizeText(requestData.sellerId),
  sellerEmail: sanitizeText(requestData.sellerEmail),
  tags: Array.isArray(requestData.tags) ? requestData.tags.map((tag) => sanitizeText(tag)).filter(Boolean) : [],
});

const validateReviewData = (review) => {
  if (!review.storeId || sanitizeText(review.storeId).length === 0) {
    throw new Error('معرف المتجر الإلكتروني غير صالح.');
  }
  if (!review.userId || sanitizeText(review.userId).length === 0) {
    throw new Error('معرف المستخدم غير صالح.');
  }
  if (!review.comment || sanitizeText(review.comment).length < 5) {
    throw new Error('التعليق يجب أن يكون طويلاً بما يكفي.');
  }
  if (!isValidRating(Number(review.rating))) {
    throw new Error('التقييم يجب أن يكون بين 1 و 5.');
  }
};

const validateReportData = (report) => {
  if (!report.reviewId || sanitizeText(report.reviewId).length === 0) {
    throw new Error('معرف التعليق غير صالح.');
  }
  if (!report.reporterId || sanitizeText(report.reporterId).length === 0) {
    throw new Error('معرف المبلغ غير صالح.');
  }
  if (!report.reason || sanitizeText(report.reason).length < 5) {
    throw new Error('يرجى إدخال سبب بلاغ صالح.');
  }
};

const ensureFirebase = () => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured yet. Please add your Firebase environment variables.');
  }
};

export const registerWithEmailAndPassword = (email, password) => {
  ensureFirebase();
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithEmailAndPassword = (email, password) => {
  ensureFirebase();
  return signInWithEmailAndPassword(auth, email, password);
};

export const loginAsAdmin = async (email, password) => {
  ensureFirebase();

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const adminRef = doc(db, 'admins', userCredential.user.uid);
  const adminSnap = await getDoc(adminRef);

  if (!adminSnap.exists()) {
    await signOut(auth);
    throw new Error(
      `غير مصرح: هذا الحساب ليس مسؤولاً. معرف المستخدم (UID): ${userCredential.user.uid}. تأكد من وجود مستند في مجموعة "admins" بعنوان يساوي هذا المعرف بالضبط.`
    );
  }

  return { id: adminSnap.id, ...adminSnap.data(), authUser: userCredential.user };
};

export const isAdminUser = async (uid) => {
  if (!isFirebaseConfigured() || !uid) {
    return false;
  }

  try {
    const adminRef = doc(db, 'admins', uid);
    const adminSnap = await getDoc(adminRef);
    return adminSnap.exists();
  } catch {
    return false;
  }
};

export const logoutUser = () => {
  if (!isFirebaseConfigured()) {
    return Promise.resolve();
  }
  return signOut(auth);
};

export const onAuthStateChangedListener = (callback) => {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const sendPasswordReset = (email) => {
  ensureFirebase();
  return sendPasswordResetEmail(auth, email);
};

export const saveUserProfile = async (uid, profileData) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const userDocRef = doc(usersCollection, uid);
  const existingProfile = await getDoc(userDocRef);
  const profilePayload = {
    uid,
    ...profileData,
    email: sanitizeText(profileData.email || ''),
    website: normalizeUrl(profileData.website),
    role: existingProfile.exists() ? existingProfile.data().role : 'seller',
    updatedAt: serverTimestamp(),
  };

  if (!existingProfile.exists()) {
    profilePayload.createdAt = serverTimestamp();
  }

  await setDoc(userDocRef, profilePayload, { merge: true });
  const savedProfile = await getDoc(userDocRef);
  return savedProfile.exists() ? { id: savedProfile.id, ...savedProfile.data() } : null;
};

export const getUserProfile = async (uid) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const docRef = doc(usersCollection, uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

const createSlug = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ء-ي\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const saveStoreRequest = async (requestData) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const safeRequest = buildSafeStoreRequest(requestData);

  validateStoreData(safeRequest);

  const storePayload = { ...safeRequest };
  Object.keys(storePayload).forEach((key) => {
    if (storePayload[key] === '') {
      delete storePayload[key];
    }
  });

  return addDoc(storesCollection, {
    ...storePayload,
    slug: createSlug(safeRequest.title),
    createdAt: serverTimestamp(),
    status: 'pending',
  });
};

export const createStoreDirectly = async (requestData) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const safeRequest = buildSafeStoreRequest(requestData);

  validateAdminStoreData(safeRequest);

  const storePayload = { ...safeRequest };
  Object.keys(storePayload).forEach((key) => {
    if (storePayload[key] === '') {
      delete storePayload[key];
    }
  });

  return addDoc(storesCollection, {
    ...storePayload,
    slug: createSlug(safeRequest.title),
    createdAt: serverTimestamp(),
    status: 'approved',
    approvedAt: serverTimestamp(),
  });
};

export const updateStoreDirectly = async (storeId, requestData) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const safeRequest = buildSafeStoreRequest(requestData);

  validateAdminStoreData(safeRequest);

  const docRef = doc(storesCollection, storeId);
  await updateDoc(docRef, {
    ...safeRequest,
    slug: createSlug(safeRequest.title),
    status: requestData.status ? sanitizeText(requestData.status) : 'approved',
    updatedAt: serverTimestamp(),
  });
};

export const getStoreBySellerId = async (sellerId) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const sellerQuery = query(
    storesCollection,
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(sellerQuery);
  if (snapshot.empty) {
    return null;
  }

  const storeDoc = snapshot.docs[0];
  return { id: storeDoc.id, ...storeDoc.data() };
};

export const getStoresBySeller = async (sellerId) => {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const sellerQuery = query(
    storesCollection,
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(sellerQuery);
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
};

export const updateStoreRequest = async (storeId, requestData) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const safeRequest = buildSafeStoreRequest(requestData);

  validateStoreData(safeRequest);

  const docRef = doc(storesCollection, storeId);
  await updateDoc(docRef, {
    ...safeRequest,
    slug: createSlug(safeRequest.title),
    status: requestData.status ? sanitizeText(requestData.status) : 'pending',
    updatedAt: serverTimestamp(),
  });
};

export const getStores = async () => {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const approvedStoresQuery = query(
    storesCollection,
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(approvedStoresQuery);
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
};

export const getStoreById = async (storeId) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const docRef = doc(db, 'stores', storeId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const getStoreBySlug = async (slug) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const slugQuery = query(storesCollection, where('slug', '==', slug), where('status', '==', 'approved'));
  const snapshot = await getDocs(slugQuery);
  if (snapshot.empty) {
    return null;
  }

  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
};

export const getStoresByCategory = async (categoryName) => {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const categoryQuery = query(
    storesCollection,
    where('category', '==', categoryName),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(categoryQuery);
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
};

export const updateStoreRecord = async (storeId, updates) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const docRef = doc(db, 'stores', storeId);
  await updateDoc(docRef, updates);
};

export const getAllStoresForAdmin = async () => {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const snapshot = await getDocs(query(storesCollection, orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })).filter((store) => store.status !== 'deleted');
};

export const approveStore = async (storeId) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  await updateStoreRecord(storeId, {
    status: 'approved',
    updatedAt: serverTimestamp(),
  });
};

export const rejectStore = async (storeId) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  await updateStoreRecord(storeId, {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
};

export const deleteStore = async (storeId) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const docRef = doc(db, 'stores', storeId);
  await updateDoc(docRef, { deletedAt: serverTimestamp(), status: 'deleted' });
};

export const submitReview = async (reviewData) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  validateReviewData(reviewData);

  const existingReviewQuery = query(
    reviewsCollection,
    where('storeId', '==', reviewData.storeId),
    where('userId', '==', reviewData.userId)
  );
  const snapshot = await getDocs(existingReviewQuery);

  if (!snapshot.empty) {
    const existingReview = snapshot.docs[0];
    await updateDoc(existingReview.ref, {
      comment: sanitizeText(reviewData.comment),
      rating: Number(reviewData.rating),
      updatedAt: serverTimestamp(),
    });
    return { id: existingReview.id, ...reviewData };
  }

  return addDoc(reviewsCollection, {
    storeId: sanitizeText(reviewData.storeId),
    userId: sanitizeText(reviewData.userId),
    userName: sanitizeText(reviewData.userName || 'مستخدم'),
    rating: Number(reviewData.rating),
    comment: sanitizeText(reviewData.comment),
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getReviewsForStore = async (storeId) => {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const reviewsQuery = query(
    reviewsCollection,
    where('storeId', '==', storeId),
    where('deleted', '==', false),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(reviewsQuery);
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
};

export const reportReview = async (reviewId, reason, reporterId) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const reportData = {
    reviewId: sanitizeText(reviewId),
    reason: sanitizeText(reason),
    reporterId: sanitizeText(reporterId),
    createdAt: serverTimestamp(),
    status: 'open',
  };

  validateReportData(reportData);
  return addDoc(reportsCollection, reportData);
};

export const getReportedReviews = async () => {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const snapshot = await getDocs(query(reportsCollection, orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
};

export const deleteReview = async (reviewId) => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const docRef = doc(reviewsCollection, reviewId);
  await updateDoc(docRef, { deleted: true, updatedAt: serverTimestamp() });
};

const subscribersCollection = db ? collection(db, 'subscribers') : null;

export const subscribeToNewsletter = async (email) => {
  const cleanEmail = sanitizeText(email);
  if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    throw new Error('يرجى إدخال بريد إلكتروني صالح.');
  }

  if (isFirebaseConfigured() && subscribersCollection) {
    await addDoc(subscribersCollection, {
      email: cleanEmail,
      createdAt: serverTimestamp(),
    });
  }

  return true;
};
