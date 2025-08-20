import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Animated,
  Pressable,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { signUp } from '../utils/optionalAuth';
// awsconfig optional; avoid direct import when backend is removed
let awsconfig: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maybe = require('../aws-exports.js');
  awsconfig = maybe?.default ?? maybe;
} catch {}
import { RootStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState, useEffect } from "react";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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

export default function SignUp() {
  const allyScaleAnim = React.useRef(new Animated.Value(1)).current;
  const [firstName, setFirstName] = React.useState("");
  const [surname, setSurname] = React.useState("");
  const [dob, setDob] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [mobile, setMobile] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [firstNameError, setFirstNameError] = React.useState("");
  const [surnameError, setSurnameError] = React.useState("");
  const [dobError, setDobError] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [mobileError, setMobileError] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [confirmPasswordError, setConfirmPasswordError] = React.useState("");
  const [isButtonHovered, setIsButtonHovered] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  // DateTimePicker state
  const [date, setDate] = React.useState(new Date());
  const [showPicker, setShowPicker] = React.useState(false);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?!]/.test(
      password
    );

    return (
      minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar
    );
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

  type Nav = NativeStackNavigationProp<RootStackParamList>;
  const navigation = useNavigation<Nav>();
  const handleSignUp = async () => {
    // Reset all errors
    setFirstNameError("");
    setSurnameError("");
    setDobError("");
    setEmailError("");
    setMobileError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // Validate each field
    let hasErrors = false;

    if (!firstName.trim()) {
      setFirstNameError("Enter First name");
      hasErrors = true;
    }

    if (!surname.trim()) {
      setSurnameError("Enter Surname");
      hasErrors = true;
    }

    if (!dob.trim()) {
      setDobError("Enter Date of birth (DD/MM/YYYY)");
      hasErrors = true;
    }

    if (!email.trim()) {
      setEmailError("Enter Email address");
      hasErrors = true;
    } else if (!email.includes("@")) {
      setEmailError("Enter a valid email address");
      hasErrors = true;
    }

    if (!mobile.trim()) {
      setMobileError("Enter Mobile number");
      hasErrors = true;
    } else if (mobile.length < 10) {
      setMobileError("Enter a valid mobile number (at least 10 digits)");
      hasErrors = true;
    } else if (!/^[0-9+\-\s()]+$/.test(mobile)) {
      setMobileError("Mobile number can only contain numbers, +, -, spaces, and parentheses");
      hasErrors = true;
    }

    if (!password.trim()) {
      setPasswordError("Enter New password");
      hasErrors = true;
    } else if (!validatePassword(password)) {
      setPasswordError(
        "Password needs minimum 8 characters, 1 uppercase, 1 lowercase, 1 number and a special character (@#$%^&*()_+-=[]{}|;:,.<>?!)"
      );
      hasErrors = true;
    } else {
      setPasswordError(""); // Clear error if password meets requirements
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Enter Confirm password");
      hasErrors = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      setPasswordError("Passwords do not match");
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Format date for AWS Cognito (YYYY-MM-DD)
      const formatDateForCognito = (dateStr: string) => {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };

      // Format phone number for AWS Cognito (E.164 format)
      const formatPhoneForCognito = (phone: string) => {
        // Remove all non-digit characters
        const digits = phone.replace(/\D/g, '');
        
        // Handle Australian phone numbers (assuming you're in Australia based on region)
        if (digits.startsWith('0')) {
          // Convert 04XX XXX XXX to +614XX XXX XXX
          return `+61${digits.substring(1)}`;
        } else if (digits.startsWith('4') && digits.length === 9) {
          // Already in 4XX XXX XXX format, add +61
          return `+61${digits}`;
        } else if (digits.startsWith('61')) {
          // Already has country code
          return `+${digits}`;
        } else {
          // Default: add +61 for Australian numbers
          return `+61${digits}`;
        }
      };

      // Prepare user attributes for AWS Cognito
      const userAttributes = {
        email: email,
        phone_number: formatPhoneForCognito(mobile),
        given_name: firstName,
        family_name: surname,
        birthdate: formatDateForCognito(dob),
      };
      
      console.log("Attempting AWS Cognito signup with:", {
        username: email,
        userAttributes: userAttributes
      });
      
      // Log AWS configuration for debugging
      if (awsconfig) {
        console.log("AWS Region:", awsconfig.aws_cognito_region);
        console.log("User Pool ID:", awsconfig.aws_user_pools_id);
        console.log("Verification mechanisms:", awsconfig.aws_cognito_verification_mechanisms);
      }
      
      const result = await signUp({
        username: email, // use email as username
        password,
        options: {
          userAttributes: userAttributes,
          autoSignIn: { enabled: true },
        },
      });
      console.log("signUp result →", result);
      alert(
        "Account created successfully! Check your e‑mail/SMS for the confirmation code!"
      );
      navigation.navigate("ConfirmCode", { username: email });
      return;
    } catch (err: any) {
      console.error("SignUp error:", err);
      
      // Better error handling for AWS Cognito
      let errorMessage = "Sign-up failed: ";
      
      if (err.name === 'UsernameExistsException') {
        errorMessage += "An account with this email already exists. Please use a different email or try logging in.";
      } else if (err.name === 'InvalidPasswordException') {
        errorMessage += "Password does not meet requirements. Please ensure it has at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character.";
      } else if (err.name === 'InvalidParameterException') {
        errorMessage += "Invalid input parameters. Please check your email and phone number format.";
      } else if (err.name === 'CodeDeliveryFailureException') {
        errorMessage += "Failed to send verification code. Please check your email address and try again.";
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "Unknown error occurred. Please try again.";
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
      // Format date as DD/MM/YYYY
      const formatted = `${selectedDate
        .getDate()
        .toString()
        .padStart(2, "0")}/${(selectedDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${selectedDate.getFullYear()}`;
      setDob(formatted);
      
      // On iOS, keep the picker open for spinner mode
      // On Android, close the picker after selection
      if (Platform.OS === "android") {
        setShowPicker(false);
      }
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          extraScrollHeight={20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
              <Text style={styles.signupSubtitle}>Create a new Account</Text>
              <View style={styles.signupForm}>
                <View style={styles.nameRow}>
                  <View style={styles.nameInputContainer}>
                    <TextInput
                      style={[styles.input, styles.nameInput]}
                      placeholder="First name"
                      placeholderTextColor="#999"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />
                    {firstNameError ? (
                      <Text style={styles.errorText}>{firstNameError}</Text>
                    ) : null}
                  </View>
                  <View style={styles.nameInputContainer}>
                    <TextInput
                      style={[styles.input, styles.nameInput, { marginRight: 0 }]}
                      placeholder="Surname"
                      placeholderTextColor="#999"
                      value={surname}
                      onChangeText={setSurname}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />
                    {surnameError ? (
                      <Text style={styles.errorText}>{surnameError}</Text>
                    ) : null}
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Date of birth (DD/MM/YYYY)"
                  placeholderTextColor="#999"
                  value={dob}
                  onChangeText={setDob}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onPressIn={() => setShowPicker(true)}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}
                {showPicker && (
                  <View style={styles.datePickerContainer}>
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                    />
                    {Platform.OS === "ios" && (
                      <TouchableOpacity
                        style={styles.closePickerButton}
                        onPress={() => setShowPicker(false)}
                      >
                        <Text style={styles.closePickerButtonText}>Done</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                
                
                                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}
                
                <TextInput
                  style={styles.input}
                  placeholder="Mobile number"
                  placeholderTextColor="#999"
                  value={mobile}
                  onChangeText={setMobile}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                {mobileError ? (
                  <Text style={styles.errorText}>{mobileError}</Text>
                ) : null}
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="New password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.showPasswordButton}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6426A9"
                    />
                  </Pressable>
                </View>
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm password"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.showPasswordButton}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#6426A9"
                    />
                  </Pressable>
                </View>
                {confirmPasswordError ? (
                  <Text style={styles.errorText}>{confirmPasswordError}</Text>
                ) : null}
                <Pressable
                  onPress={handleSignUp}
                  onHoverIn={() => setIsButtonHovered(true)}
                  onHoverOut={() => setIsButtonHovered(false)}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.signupButton,
                    pressed && { opacity: 0.9 },
                    isLoading && { opacity: 0.6 },
                  ]}
                >
                  <Text
                    style={[
                      styles.signupButtonText,
                      isButtonHovered && { color: "#cccccc" },
                    ]}
                  >
                    {isLoading ? "Creating Account..." : "Sign up"}
                  </Text>
                </Pressable>
                
                <Text style={styles.orText}>or</Text>
                
                <Pressable
                  onPress={() => navigation.navigate("Auth")}
                  style={({ pressed }) => [
                    styles.loginButton,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Text style={styles.loginButtonText}>
                    Log in
                  </Text>
                </Pressable>
                
                <Text style={styles.loginPromptText}>
                  If you already have an account
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
      <View style={styles.footbar}>
        <Text style={styles.footbarText}>© 2025 Ally</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fae7f7",
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight || 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 60 : 20,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  title: {
    textAlign: "center",
    marginTop: isTablet ? 32 : 24,
    marginBottom: isTablet ? 32 : 24,
  },
  allyWordLarge: {
    fontSize: isTablet ? 90 : 56,
    fontWeight: "bold",
    color: "#6426A9",
    lineHeight: isTablet ? 100 : 64,
    letterSpacing: 2,
    textAlign: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: isTablet ? 60 : 40,
  },
  avatarContainer: {
    width: isTablet ? 120 : 80,
    height: isTablet ? 120 : 80,
    borderRadius: isTablet ? 60 : 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: isTablet ? 24 : 16,
  },
  avatarText: {
    fontSize: isTablet ? 48 : 32,
    fontWeight: "bold" as const,
    color: "#FFFFFF",
  },
  welcomeText: {
    fontSize: isTablet ? 36 : moderateScale(24),
    fontWeight: "bold" as const,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: isTablet ? 8 : 4,
  },
  subtitle: {
    fontSize: isTablet ? 20 : moderateScale(16),
    color: "#666666",
    textAlign: "center",
  },
  infoSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: isTablet ? 24 : moderateScale(18),
    fontWeight: 600 as const,
    color: "#1A1A1A",
    marginBottom: isTablet ? 24 : 16,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: isTablet ? 16 : 12,
    padding: isTablet ? 24 : 16,
    marginBottom: isTablet ? 16 : 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: isTablet ? 16 : moderateScale(14),
    color: "#666666",
    marginBottom: isTablet ? 8 : 4,
  },
  infoValue: {
    fontSize: isTablet ? 18 : moderateScale(16),
    fontWeight: 600 as const,
    color: "#1A1A1A",
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
    marginTop: isTablet ? 48 : 32,
  },
  footbarText: {
    color: "#fff",
    fontSize: isTablet ? 15 : 12,
    fontWeight: "500",
    letterSpacing: 1,
  },
  signupSubtitle: {
    color: "#6426A9",
    fontSize: isTablet ? 22 : 15,
    textAlign: "center",
    marginBottom: isTablet ? 32 : 20,
    fontWeight: "500",
    letterSpacing: 1,
  },
  signupForm: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
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
    paddingVertical: isTablet ? 10 : 8,
    paddingHorizontal: isTablet ? 18 : 12,
    fontSize: isTablet ? 15 : 13,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0d6ef",
    color: "#6426A9",
  },
  signupButton: {
    backgroundColor: "#002a2d",
    borderRadius: 8,
    paddingVertical: isTablet ? 12 : 8,
    paddingHorizontal: isTablet ? 40 : 32, // increased horizontal padding
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8, // reduced from 16 to 8 for closer spacing to "or"
    shadowColor: "#002a2d",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: "center",
  },
  signupButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: isTablet ? 16 : 13,
    letterSpacing: 1,
  },
  
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  nameInputContainer: {
    flex: 1,
  },
  nameInput: {
    flex: 0.48,
    marginRight: 6,
    paddingVertical: isTablet ? 10 : 8,
    paddingHorizontal: isTablet ? 12 : 8,
    fontSize: isTablet ? 15 : 13,
    width: "100%",
    marginBottom: 12, // match the regular input margin
    marginHorizontal: 3,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0d6ef",
    marginBottom: 12,
    height: isTablet ? 56 : 48,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: isTablet ? 18 : 12,
    fontSize: isTablet ? 15 : 13,
    color: "#6426A9",
    height: "100%",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: isTablet ? 12 : 10,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  datePickerContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  closePickerButton: {
    backgroundColor: "#6426A9",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  closePickerButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#6426A9",
    borderRadius: 8,
    paddingVertical: isTablet ? 12 : 8,
    paddingHorizontal: isTablet ? 40 : 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8, // reduced from 24 to 8 for closer spacing to "or"
    marginBottom: 16,
    shadowColor: "#6426A9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: isTablet ? 16 : 13,
    letterSpacing: 1,
  },
  loginPromptText: {
    color: "#6426A9",
    fontSize: isTablet ? 14 : 12,
    textAlign: "center",
    marginTop: 0,
    marginBottom: 16,
    fontWeight: "500",
  },
  orText: {
    color: "#6426A9",
    fontSize: isTablet ? 16 : 14,
    textAlign: "center",
    marginVertical: 8,
    fontWeight: "600",
  },
  showPasswordButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(100, 38, 169, 0.1)",
    borderRadius: 4,
    minWidth: 44,
    minHeight: 44,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});
