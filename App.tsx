
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import '@aws-amplify/react-native';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';

import { Amplify } from 'aws-amplify';
import awsconfig from './src/aws-exports.js';

Amplify.configure(awsconfig);

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </AuthProvider>
  );
}
