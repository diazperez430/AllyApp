// Safe optional wrapper around aws-amplify/auth
// Falls back to no-op stubs if the module is not available

/* eslint-disable @typescript-eslint/no-explicit-any */
let auth: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  auth = require('aws-amplify/auth');
} catch {
  const notAvailable = async () => {
    throw new Error('Amplify Auth not available');
  };
  auth = {
    signIn: notAvailable,
    signUp: notAvailable,
    confirmSignUp: notAvailable,
    resendSignUpCode: notAvailable,
    signOut: notAvailable,
    getCurrentUser: notAvailable,
    resetPassword: notAvailable,
    confirmResetPassword: notAvailable,
    fetchAuthSession: async () => ({ tokens: undefined }),
    signInWithRedirect: notAvailable,
    fetchUserAttributes: notAvailable,
  };
}

export const {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  signOut,
  getCurrentUser,
  resetPassword,
  confirmResetPassword,
  fetchAuthSession,
  signInWithRedirect,
  fetchUserAttributes,
} = auth;
