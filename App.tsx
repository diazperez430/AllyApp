
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';

// Optional Amplify import/config
let Amplify: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Amplify = require('aws-amplify').Amplify;
} catch {}

// Make Amplify config optional to avoid crashes when backend is removed
let awsConfig: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maybe = require('./src/aws-exports.js');
  awsConfig = maybe?.default ?? maybe;
} catch (e) {
  console.warn('Amplify config not found; running without backend');
}
if (Amplify && awsConfig) {
  Amplify.configure(awsConfig);
}

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
