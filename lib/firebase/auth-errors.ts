import { FirebaseError } from 'firebase/app';

/**
 * Maps Firebase Auth error codes to copy for non-technical users.
 * Falls back to a generic message when the code is unknown.
 */
export function firebaseAuthErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    if (error instanceof Error && error.message) {
      return genericFromMessage(error.message);
    }
    return 'Something went wrong. Please try again.';
  }

  const code = error.code;
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'No account matches that email and password. Create an account first, or check your details and try again.';
    case 'auth/invalid-email':
      return 'That email address doesn’t look valid. Check for typos and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support if you need help.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try logging in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters (and a mix of letters and numbers is best).';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes, then try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled. Try again when you’re ready.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method. Try Google or email/password, whichever you used before.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method isn’t enabled for the app. Contact support.';
    case 'auth/requires-recent-login':
      return 'For your security, sign out and sign in again, then try this action.';
    default:
      return genericFromMessage(error.message);
  }
}

function genericFromMessage(message: string): string {
  if (/invalid-credential|user-not-found|wrong-password/i.test(message)) {
    return 'No account matches that email and password. Create an account first, or check your details and try again.';
  }
  return 'Something went wrong. Please try again.';
}
