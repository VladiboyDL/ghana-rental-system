import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList, UserRole } from '../../types';
import api from '../../services/api';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Role Selection
  const [role, setRole] = useState<UserRole | null>(null);

  // Step 2: Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 3: Identity
  const [ghanaCardNumber, setGhanaCardNumber] = useState('');
  const [digitalAddress, setDigitalAddress] = useState('');
  const [region, setRegion] = useState('');

  // Step 4: Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!role) {
          Alert.alert('Error', 'Please select your role');
          return false;
        }
        break;
      case 2:
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
          Alert.alert('Error', 'Please fill in all required fields');
          return false;
        }
        if (!email.includes('@')) {
          Alert.alert('Error', 'Please enter a valid email address');
          return false;
        }
        if (!phone.startsWith('+233') && !phone.startsWith('0')) {
          Alert.alert('Error', 'Please enter a valid Ghana phone number');
          return false;
        }
        break;
      case 3:
        if (!ghanaCardNumber.trim() || !digitalAddress.trim() || !region.trim()) {
          Alert.alert('Error', 'Please fill in all required fields');
          return false;
        }
        if (!/^GHA-\d{9}-\d$/i.test(ghanaCardNumber)) {
          Alert.alert('Error', 'Please enter a valid Ghana Card number (GHA-XXXXXXXXX-X)');
          return false;
        }
        break;
      case 4:
        if (!password || !confirmPassword) {
          Alert.alert('Error', 'Please enter and confirm your password');
          return false;
        }
        if (password.length < 6) {
          Alert.alert('Error', 'Password must be at least 6 characters');
          return false;
        }
        if (password !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < 4) {
        setStep(step + 1);
      } else {
        handleRegister();
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      // Format phone number
      let formattedPhone = phone;
      if (phone.startsWith('0')) {
        formattedPhone = '+233' + phone.substring(1);
      }

      await api.auth.register({
        email: email.trim(),
        phone: formattedPhone,
        password,
        role: role!,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ghanaCardNumber: ghanaCardNumber.trim().toUpperCase(),
        digitalAddress: digitalAddress.trim().toUpperCase(),
        region: region.trim(),
      });

      navigation.navigate('VerifyOTP', { phone: formattedPhone, purpose: 'REGISTRATION' });
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>I am a...</Text>
      <Text style={styles.stepDescription}>Select your role to continue</Text>

      <TouchableOpacity
        style={[styles.roleCard, role === 'LANDLORD' && styles.roleCardSelected]}
        onPress={() => setRole('LANDLORD')}
      >
        <View style={[styles.roleIcon, role === 'LANDLORD' && styles.roleIconSelected]}>
          <Ionicons name="business" size={32} color={role === 'LANDLORD' ? colors.textOnPrimary : colors.primary} />
        </View>
        <View style={styles.roleText}>
          <Text style={[styles.roleTitle, role === 'LANDLORD' && styles.roleTitleSelected]}>Landlord</Text>
          <Text style={styles.roleDescription}>I own properties and want to rent them out</Text>
        </View>
        {role === 'LANDLORD' && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.roleCard, role === 'TENANT' && styles.roleCardSelected]}
        onPress={() => setRole('TENANT')}
      >
        <View style={[styles.roleIcon, role === 'TENANT' && styles.roleIconSelected]}>
          <Ionicons name="person" size={32} color={role === 'TENANT' ? colors.textOnPrimary : colors.primary} />
        </View>
        <View style={styles.roleText}>
          <Text style={[styles.roleTitle, role === 'TENANT' && styles.roleTitleSelected]}>Tenant</Text>
          <Text style={styles.roleDescription}>I want to rent a property</Text>
        </View>
        {role === 'TENANT' && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>Tell us about yourself</Text>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Kwame"
            placeholderTextColor={colors.textLight}
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Asante"
            placeholderTextColor={colors.textLight}
            value={lastName}
            onChangeText={setLastName}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="kwame@example.com"
          placeholderTextColor={colors.textLight}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+233 24 123 4567"
          placeholderTextColor={colors.textLight}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Identity Verification</Text>
      <Text style={styles.stepDescription}>We need to verify your identity</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Ghana Card Number</Text>
        <TextInput
          style={styles.input}
          placeholder="GHA-123456789-0"
          placeholderTextColor={colors.textLight}
          value={ghanaCardNumber}
          onChangeText={setGhanaCardNumber}
          autoCapitalize="characters"
        />
        <Text style={styles.hint}>Format: GHA-XXXXXXXXX-X</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Digital Address</Text>
        <TextInput
          style={styles.input}
          placeholder="GA-123-4567"
          placeholderTextColor={colors.textLight}
          value={digitalAddress}
          onChangeText={setDigitalAddress}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Region</Text>
        <TextInput
          style={styles.input}
          placeholder="Greater Accra"
          placeholderTextColor={colors.textLight}
          value={region}
          onChangeText={setRegion}
        />
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Create Password</Text>
      <Text style={styles.stepDescription}>Secure your account with a strong password</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter password"
            placeholderTextColor={colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor={colors.textLight}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
        />
      </View>

      <View style={styles.passwordRequirements}>
        <Text style={styles.requirementsTitle}>Password must:</Text>
        <PasswordRequirement met={password.length >= 6} text="Be at least 6 characters" />
        <PasswordRequirement met={password === confirmPassword && password.length > 0} text="Match confirmation" />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Indicator */}
          <View style={styles.progress}>
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  s <= step && styles.progressDotActive,
                  s < step && styles.progressDotCompleted,
                ]}
              >
                {s < step ? (
                  <Ionicons name="checkmark" size={12} color={colors.textOnPrimary} />
                ) : (
                  <Text style={[styles.progressText, s <= step && styles.progressTextActive]}>
                    {s}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <View style={styles.buttons}>
            {step > 1 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.nextButton, step === 1 && { flex: 1 }]}
              onPress={handleNext}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {step === 4 ? 'Create Account' : 'Continue'}
                  </Text>
                  {step < 4 && <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />}
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={styles.requirement}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={met ? colors.success : colors.textLight}
      />
      <Text style={[styles.requirementText, met && styles.requirementMet]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  progressDotActive: {
    borderColor: colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  progressTextActive: {
    color: colors.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: spacing.lg,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  roleIconSelected: {
    backgroundColor: colors.primary,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  roleTitleSelected: {
    color: colors.primary,
  },
  roleDescription: {
    fontSize: 13,
    color: colors.textLight,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  eyeIcon: {
    padding: spacing.md,
  },
  passwordRequirements: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  requirementText: {
    fontSize: 13,
    color: colors.textLight,
    marginLeft: spacing.xs,
  },
  requirementMet: {
    color: colors.success,
  },
  buttons: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  signInText: {
    color: colors.textLight,
    fontSize: 14,
  },
  signInLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
