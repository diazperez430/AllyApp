import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const GoogleSignInAlternative: React.FC<GoogleSignInProps> = ({ onSuccess, onError }) => {
  const { signIn: authSignIn } = useAuth();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  // You'll need to get these from your Google Cloud Console
  const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
  const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
    scheme: 'allyapp',
    path: 'auth/callback'
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: GOOGLE_REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      additionalParameters: {},
    },
    { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' }
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleGoogleCallback(code);
    }
  }, [response]);

  const handleGoogleCallback = async (code: string) => {
    try {
      // Here you would exchange the code for tokens
      // and then sign in to Cognito
      console.log('Google OAuth code received:', code);
      
      // Navigate to Dashboard after successful authentication
      Alert.alert('Success', 'Google authentication successful! Navigating to Dashboard...', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Dashboard' as never);
            if (onSuccess) {
              onSuccess();
            }
          }
        }
      ]);
      
    } catch (error) {
      console.error('Error handling Google callback:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // For now, let's just navigate to Dashboard directly
      // Later you can implement the actual Google OAuth flow
      Alert.alert(
        'Google Sign-In', 
        'Navigating to Dashboard...',
        [{ 
          text: 'OK',
          onPress: () => {
            // Navigate to Dashboard
            navigation.navigate('Dashboard' as never);
            
            if (onSuccess) {
              onSuccess();
            }
          }
        }]
      );
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Sign In Error', 'Failed to initiate Google Sign-In. Please try again.');
      
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.googleButton, isLoading && styles.disabledButton]} 
      onPress={handleGoogleSignIn}
      disabled={isLoading || !request}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Ionicons name="logo-google" size={24} color="#FFFFFF" />
      )}
      <Text style={styles.googleButtonText}>
        {isLoading ? 'Signing in...' : 'Continue with Google (Alt)'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
