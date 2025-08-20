import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithRedirect, getCurrentUser } from 'aws-amplify/auth';
import { useAuth } from '../contexts/AuthContext';

interface GoogleSignInProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onSuccess, onError }) => {
  const { signIn: authSignIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

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
            // navigation.navigate('Dashboard');
            
            if (onSuccess) {
              onSuccess();
            }
          }
        }]
      );
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('not configured')) {
          errorMessage = 'Google Sign-In is not configured yet. Please contact support.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('scheme')) {
          errorMessage = 'App scheme configuration issue. Please restart the app.';
        }
      }
      
      Alert.alert('Sign In Error', errorMessage, [{ text: 'OK' }]);
      
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
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Ionicons name="logo-google" size={24} color="#FFFFFF" />
      )}
      <Text style={styles.googleButtonText}>
        {isLoading ? 'Signing in...' : 'Continue with Google'}
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
