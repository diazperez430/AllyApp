import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signIn, signUp, confirmSignUp, signOut, getCurrentUser, resetPassword, confirmResetPassword, fetchAuthSession } from '../utils/optionalAuth';
import { Hub } from 'aws-amplify/utils';

interface CognitoTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  tokens: CognitoTokens | null;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string, email: string) => Promise<void>;
  signOut: () => Promise<void>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  forgotPassword: (username: string) => Promise<void>;
  confirmForgotPassword: (username: string, code: string, newPassword: string) => Promise<void>;
  refreshTokens: () => Promise<void>;
  getValidTokens: () => Promise<CognitoTokens | null>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [tokens, setTokens] = useState<CognitoTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract tokens from Cognito session
  const extractTokensFromSession = (session: any): CognitoTokens | null => {
    try {
      const idToken = session.tokens?.idToken?.toString();
      const accessToken = session.tokens?.accessToken?.toString();
      const refreshToken = session.tokens?.refreshToken?.toString();
      
      if (!idToken || !accessToken) {
        console.warn('Missing required tokens from session');
        return null;
      }

      // Calculate expiration time (ID token expiration)
      const expiresAt = session.tokens?.idToken?.payload?.exp * 1000 || Date.now() + 3600000; // Default 1 hour

      return {
        idToken,
        accessToken,
        refreshToken: refreshToken || '',
        expiresAt
      };
    } catch (error) {
      console.error('Error extracting tokens:', error);
      return null;
    }
  };

  // Check if tokens are valid (not expired)
  const areTokensValid = (tokens: CognitoTokens): boolean => {
    return tokens.expiresAt > Date.now();
  };

  // Fetch and update tokens
  const updateTokens = async () => {
    try {
      const session = await fetchAuthSession();
      const extractedTokens = extractTokensFromSession(session);
      
      if (extractedTokens) {
        setTokens(extractedTokens);
        console.log('Tokens updated successfully');
        return extractedTokens;
      } else {
        setTokens(null);
        return null;
      }
    } catch (error) {
      console.error('Error updating tokens:', error);
      setTokens(null);
      return null;
    }
  };

  useEffect(() => {
    checkAuthState();
    
    // Listen for auth events
    const unsubscribe = Hub.listen('auth', async ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          setIsAuthenticated(true);
          setUser(payload.data);
          // Update tokens after successful sign in
          await updateTokens();
          break;
        case 'signedOut':
          setIsAuthenticated(false);
          setUser(null);
          setTokens(null);
          break;
        case 'tokenRefresh':
          // Handle token refresh
          await updateTokens();
          break;
      }
    });

    return unsubscribe;
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      setIsAuthenticated(true);
      setUser(currentUser);
      // Fetch tokens for existing session
      await updateTokens();
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      setTokens(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (username: string, password: string) => {
    try {
      const user = await signIn({ username, password });
      setIsAuthenticated(true);
      setUser(user);
      
      // Fetch tokens after successful sign in
      await updateTokens();
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const handleSignUp = async (username: string, password: string, email: string) => {
    try {
      await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const handleConfirmSignUp = async (username: string, code: string) => {
    try {
      await confirmSignUp({ username, confirmationCode: code });
    } catch (error) {
      console.error('Confirm sign up error:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUser(null);
      setTokens(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const handleForgotPassword = async (username: string) => {
    try {
      await resetPassword({ username });
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const handleConfirmForgotPassword = async (username: string, code: string, newPassword: string) => {
    try {
      await confirmResetPassword({ username, confirmationCode: code, newPassword });
    } catch (error) {
      console.error('Confirm forgot password error:', error);
      throw error;
    }
  };

  // Refresh tokens manually
  const refreshTokens = async () => {
    try {
      await updateTokens();
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      throw error;
    }
  };

  // Get valid tokens (refresh if needed)
  const getValidTokens = async (): Promise<CognitoTokens | null> => {
    if (!tokens) {
      return null;
    }

    // Check if tokens are still valid
    if (areTokensValid(tokens)) {
      return tokens;
    }

    // Tokens expired, try to refresh
    console.log('Tokens expired, attempting to refresh...');
    try {
      await updateTokens();
      return tokens;
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      // If refresh fails, user needs to sign in again
      setIsAuthenticated(false);
      setUser(null);
      setTokens(null);
      return null;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    tokens,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    confirmSignUp: handleConfirmSignUp,
    forgotPassword: handleForgotPassword,
    confirmForgotPassword: handleConfirmForgotPassword,
    refreshTokens,
    getValidTokens,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
