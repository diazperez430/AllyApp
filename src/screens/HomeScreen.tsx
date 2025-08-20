import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  Image,
  Animated,
  Pressable,
  TextInput,
  Alert,
  AppState,
} from "react-native";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useNavigation } from "@react-navigation/native";
import { signIn, resendSignUpCode, fetchAuthSession, getCurrentUser, signInWithRedirect, fetchUserAttributes } from "aws-amplify/auth";
import { Ionicons } from "@expo/vector-icons";
import oauthHandler from "../utils/oauthHandler";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Auth"
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const isTablet = screenWidth >= 768;
const isSmallDevice = screenWidth < 375;

// Responsive scaling functions
const scale = (size: number): number => {
  const baseWidth = 375;
  const scaleFactor = screenWidth / baseWidth;
  return Math.round(size * scaleFactor);
};

const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Check if user is already signed in
  React.useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        console.log('Usuário já logado:', user);
        // If user is already signed in, navigate to main app
        navigation.navigate("Main");
      } catch (error) {
        console.log('Nenhum usuário logado:', error);
      }
    };
    
    checkCurrentUser();
    
    // Initialize OAuth handler
    oauthHandler.initialize();
    
    // Listen for app state changes to check auth status when returning from OAuth
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App became active, check if user signed in via OAuth
        checkAuthStatusAfterOAuth();
      }
    });
    
    return () => {
      subscription?.remove();
    };
  }, [navigation]);
  
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const loginButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const allyScaleAnim = useRef(new Animated.Value(1)).current;

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginButtonHovered, setIsLoginButtonHovered] = useState(false);
  const [isCreateAccountButtonHovered, setIsCreateAccountButtonHovered] =
    useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const checkAuthStatusAfterOAuth = async () => {
    try {
      const isAuthenticated = await oauthHandler.checkAuthStatus();
      if (isAuthenticated) {
        const userInfo = await oauthHandler.getUserInfo();
        console.log('User authenticated via OAuth:', userInfo);
        
        Alert.alert(
          'Welcome!', 
          'Successfully signed in with Google!',
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('Main')
            }
          ]
        );
      }
    } catch (error) {
      console.log('No OAuth authentication detected');
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.18,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handleButtonPressIn = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1.12,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handleLoginButtonPressIn = () => {
    Animated.spring(loginButtonScaleAnim, {
      toValue: 1.12,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handleLoginButtonPressOut = () => {
    Animated.spring(loginButtonScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handleAllyPressIn = () => {
    Animated.spring(allyScaleAnim, {
      toValue: 1.18,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handleAllyPressOut = () => {
    Animated.spring(allyScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleSigningIn) return;
    
    setIsGoogleSigningIn(true);
    
    try {
      // For React Native, we need to use the web-based OAuth flow
      // This will open the browser for Google authentication
      await signInWithRedirect({ provider: 'Google' });
      
      console.log('Google Sign-In initiated successfully');
      
      // Note: In React Native, the redirect will happen in the browser
      // When the user returns to the app, we need to check their auth status
      // This is typically handled in the app's deep linking configuration
      
      // For now, we'll show a message that the sign-in was initiated
      Alert.alert(
        'Google Sign-In', 
        'Please complete the sign-in process in your browser. You will be redirected back to the app.',
        [
          {
            text: 'OK',
            onPress: () => {
              // You can add additional logic here if needed
              console.log('User acknowledged Google sign-in process');
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      
      // Handle specific error cases
      if (error.code === 'UserCancelledException') {
        Alert.alert('Sign-In Cancelled', 'Google Sign-In was cancelled.');
      } else if (error.code === 'FederatedSignInException') {
        Alert.alert('Sign-In Error', 'Failed to sign in with Google. Please try again.');
      } else {
        Alert.alert('Sign-In Error', `Google Sign-In failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleLogin = async () => {
    const username = email.trim().toLowerCase();
  
    if (!username || !password) {
      alert('Please enter both email and password');
      return;
    }


    try {
      const out = await signIn({ username, password });
      console.log('signIn output:', JSON.stringify(out, null, 2));

      if (out.isSignedIn) {
        try {
          const session = await fetchAuthSession();
          console.log('Session:', session);
          const user = await getCurrentUser();
          console.log('User:', user);
        } catch (e) {
          console.log('fetchAuthSession error:', e);
        }
        alert('Login successful!');
        navigation.navigate('Main');
        return;
      }
      
  
  
      const step = out.nextStep?.signInStep;
      switch (step) {
        case 'CONFIRM_SIGN_UP':
          alert('Please confirm your account before logging in.');
          // opcional: navegar pra ConfirmCode
          // navigation.navigate('ConfirmCode', { username });
          break;
        case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
        case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
          alert('MFA required. Enter the verification code.');
          break;
        case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
          alert('You must set a new password.');
          break;
        default:
          alert(`Login needs extra step: ${step || 'unknown'}`);
      }
         } catch (err: any) {
       // Mostra tudo que der pra diagnosticar "unknown"
       console.log('Login error raw:', err);
       console.log('Login error keys:', Object.keys(err || {}));
       try { console.log('Login error JSON:', JSON.stringify(err, null, 2)); } catch {}
       const underlying = (err as any)?.underlyingError;
       if (underlying) {
         console.log('Underlying error:', underlying);
         try { console.log('Underlying JSON:', JSON.stringify(underlying, null, 2)); } catch {}
       }
       const code = err?.code || err?.name || underlying?.code || underlying?.name;
       const message = err?.message || underlying?.message || String(err);
       
       // Check for various ways AWS Cognito might indicate a user doesn't exist
       if (code === 'UserNotConfirmedException') {
         alert('Please confirm your account via the email we sent.');
         // navigation.navigate('ConfirmCode', { username });
       } else if (code === 'NotAuthorizedException') {
         // This often means user doesn't exist or wrong password
         // Check if the error message suggests user doesn't exist
         if (message.toLowerCase().includes('user does not exist') || 
             message.toLowerCase().includes('user not found') ||
             message.toLowerCase().includes('no user found')) {
           Alert.alert(
             'Account Not Found',
             'You do not have an account. Please create one.',
             [
               {
                 text: 'Cancel',
                 style: 'cancel'
               },
               {
                 text: 'Create Account',
                 onPress: () => navigation.navigate('SignUp')
               }
             ]
           );
         } else {
           alert('Invalid email or password.');
         }
       } else if (code === 'UserNotFoundException') {
         Alert.alert(
           'Account Not Found',
           'You do not have an account. Please create one.',
           [
             {
               text: 'Cancel',
               style: 'cancel'
             },
             {
               text: 'Create Account',
               onPress: () => navigation.navigate('SignUp')
             }
           ]
         );
       } else if (code === 'InvalidParameterException') {
         alert('Invalid email format.');
       } else {
         // Check if the error message contains keywords suggesting user doesn't exist
         if (message.toLowerCase().includes('user does not exist') || 
             message.toLowerCase().includes('user not found') ||
             message.toLowerCase().includes('no user found') ||
             message.toLowerCase().includes('account not found')) {
           Alert.alert(
             'Account Not Found',
             'You do not have an account. Please create one.',
             [
               {
                 text: 'Cancel',
                 style: 'cancel'
               },
               {
                 text: 'Create Account',
                 onPress: () => navigation.navigate('SignUp')
               }
             ]
           );
         } else {
           alert(`Login failed: ${message} (Code: ${code || 'unknown'})`);
         }
       }
     }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          <Pressable
            onPressIn={handleAllyPressIn}
            onPressOut={handleAllyPressOut}
            onHoverIn={handleAllyPressIn}
            onHoverOut={handleAllyPressOut}
            style={{ alignSelf: "center" }}
          >
            <Animated.Text
              style={[
                styles.allyWordLarge,
                { transform: [{ scale: allyScaleAnim }] },
              ]}
            >
              Ally
      
            </Animated.Text>
          </Pressable>
        </Text>
        
        {/* Login Section */}
        <View style={styles.loginSection}>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            onPress={handleLogin}
            onHoverIn={() => setIsLoginButtonHovered(true)}
            onHoverOut={() => setIsLoginButtonHovered(false)}
            style={({ pressed }) => [
              styles.loginButton,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text
              style={[
                styles.loginButtonText,
                isLoginButtonHovered && { color: "#cccccc" },
              ]}
            >
              Log In
            </Text>
          </Pressable>
                     <Pressable onPress={() => navigation.navigate('PasswordRecover')}>
             <Text style={styles.forgotPassword}>Forgotten password?</Text>
           </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Sign-In Button */}
        <Pressable
          onPress={handleGoogleSignIn}
          disabled={isGoogleSigningIn}
          style={({ pressed }) => [
            styles.googleSignInButton,
            pressed && { opacity: 0.9 },
            isGoogleSigningIn && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text style={styles.googleSignInText}>
            {isGoogleSigningIn ? 'Signing In...' : 'Continue with Google'}
          </Text>
        </Pressable>

        <View style={styles.buttonContainer}>
          <Pressable
            onHoverIn={() => setIsCreateAccountButtonHovered(true)}
            onHoverOut={() => setIsCreateAccountButtonHovered(false)}
            onPress={() => navigation.navigate("SignUp")}
            style={({ pressed }) => [
              styles.createAccountButton,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text
              style={[
                styles.createAccountButtonText,
                isCreateAccountButtonHovered && { color: "#cccccc" },
              ]}
            >
              Create New Account
            </Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.footbar}>
        <Text style={styles.footbarText}>© 2025 Ally</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fae7f7",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: isTablet ? 60 : 20,
    paddingVertical: 40,
  },
  compassContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: isTablet ? 32 : 24, // more space below
    alignSelf: "center",
  },
  compassCircle: {
    backgroundColor: "#6426A9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: "relative",
  },
  cardinal: {
    color: "#fff",
    fontWeight: "bold",
    position: "absolute",
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 2,
  },
  north: {
    top: 4,
    left: "50%",
    marginLeft: -10,
  },
  east: {
    right: 4,
    top: "50%",
    marginTop: -10,
  },
  south: {
    bottom: 4,
    left: "50%",
    marginLeft: -10,
  },
  west: {
    left: 4,
    top: "50%",
    marginTop: -10,
  },
  needle: {
    position: "absolute",
    width: 4,
    backgroundColor: "red",
    borderRadius: 2,
    zIndex: 2,
  },
  needleBase: {
    position: "absolute",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#6426A9",
    zIndex: 3,
  },
  compassImage: {
    width: isTablet ? 120 : 90,
    height: isTablet ? 120 : 90,
    alignSelf: "center",
    marginBottom: isTablet ? 32 : 24,
  },
  title: {
    fontSize: isTablet ? 48 : moderateScale(32),
    fontWeight: "bold" as const,
    color: "#6426A9",
    textAlign: "center",
    marginBottom: isTablet ? 16 : 8,
    lineHeight: isTablet ? 56 : moderateScale(40),
  },
  allyWord: {
    fontSize: isTablet ? 64 : 40,
    fontWeight: "bold",
    color: "#6426A9",
    
    lineHeight: isTablet? 200: 100, 
  },
  allyWordLarge: {
    fontSize: isTablet ? 90 : 56,
    fontWeight: "bold",
    color: "#6426A9",
    lineHeight: isTablet? 200: 100,
    letterSpacing: 2,
    textAlign: "center",
  },
  subtitle: {
    fontSize: isTablet ? 24 : moderateScale(18),
    color: "#666666",
    textAlign: "center",
    marginBottom: isTablet ? 60 : 40,
    lineHeight: isTablet ? 32 : moderateScale(24),
    marginTop: isTablet ? 32 : 24, // added margin to move subtitle down
  },
  buttonContainer: {
    width: isTablet ? 300 : "100%",
    maxWidth: 400,
    paddingHorizontal: isSmallDevice ? 20 : 0,
  },
  animatedButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  customButton: {
    backgroundColor: "#002a2d",
    borderRadius: 8,
    paddingVertical: isTablet ? 12 : 8,
    paddingHorizontal: isTablet ? 24 : 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: isTablet ? 36 : 28,
    marginBottom: isTablet ? 64 : 48, // increased margin below for more separation from footbar
    shadowColor: "#002a2d",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: "center",
  },
  customButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: isTablet ? 16 : 13,
    letterSpacing: 1,
  },

  loginSection: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    marginBottom: isTablet ? 32 : 24,
    marginTop: isTablet ? 16 : 8,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 12,
    padding: isTablet ? 24 : 16,
    shadowColor: "#6426A9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: isTablet ? 14 : 10,
    paddingHorizontal: isTablet ? 18 : 12,
    fontSize: isTablet ? 18 : 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0d6ef",
    color: "#6426A9",
  },
  loginButton: {
    backgroundColor: "#6426A9",
    borderRadius: 8,
    paddingVertical: isTablet ? 14 : 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#6426A9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 1,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: isTablet ? 18 : 16,
    letterSpacing: 1,
  },
  forgotPassword: {
    color: "#6426A9",
    fontSize: isTablet ? 13 : 11,
    textAlign: "center",
    marginTop: 8,
    textDecorationLine: "underline",
    fontWeight: "500",
    alignSelf: "center",
  },
  footbar: {
    width: "100%",
    backgroundColor: "#6426A9",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    marginTop: isTablet ? 36 : 24, // added top margin
  },
  footbarText: {
    color: "#fff",
    fontSize: isTablet ? 15 : 12,
    fontWeight: "500",
    letterSpacing: 1,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: isTablet ? 32 : 24,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
    fontSize: isTablet ? 16 : 13,
  },
  googleSignInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: isTablet ? 12 : 8,
    paddingHorizontal: isTablet ? 24 : 16,
    marginTop: isTablet ? 36 : 28,
    marginBottom: isTablet ? 64 : 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  googleSignInText: {
    marginLeft: 10,
    color: "#333",
    fontSize: isTablet ? 16 : 13,
    fontWeight: "bold",
  },
  createAccountButton: {
    backgroundColor: "#002a2d",
    borderRadius: 8,
    paddingVertical: isTablet ? 12 : 8,
    paddingHorizontal: isTablet ? 24 : 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: isTablet ? 36 : 28,
    marginBottom: isTablet ? 64 : 48, // increased margin below for more separation from footbar
    shadowColor: "#002a2d",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: "center",
  },
  createAccountButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: isTablet ? 16 : 13,
    letterSpacing: 1,
  },
});
