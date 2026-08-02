const AUTH_ERROR_KEYS = [
  'auth/invalid-credential',
  'auth/user-not-found',
  'auth/wrong-password',
  'auth/invalid-email',
  'auth/email-already-in-use',
  'auth/weak-password',
  'auth/network-request-failed',
  'auth/too-many-requests',
  'auth/operation-not-allowed',
  'auth/user-disabled',
  'auth/unauthorized-domain',
  'auth/missing-password',
];

export const getAuthErrorMessage = (error, t) => {
  const code = error?.code;
  const translate = typeof t === 'function' ? t : (key) => key;
  if (code && AUTH_ERROR_KEYS.includes(code)) {
    return translate(`autherr.${code.replaceAll('/', '-')}`);
  }
  return error?.message || translate('autherr.generic');
};
