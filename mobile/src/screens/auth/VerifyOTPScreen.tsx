import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

type VerifyOTPScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VerifyOTP'>;
  route: RouteProp<RootStackParamList, 'VerifyOTP'>;
};

const OTP_LENGTH = 6;

export default function VerifyOTPScreen({ navigation, route }: VerifyOTPScreenProps) {
  const { phone } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { setAuth } = useAuthStore();

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();

    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (value && index === OTP_LENGTH - 1) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === OTP_LENGTH) {
        verifyOtp(fullOtp);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (otpCode: string) => {
    setIsLoading(true);
    try {
      const response = await api.auth.verifyOTP(phone, otpCode);
      const data = response.data || response;
      if (data.token && data.user) {
        await setAuth(data.token, data.user);
      }
    } catch (error: any) {
      Alert.alert(
        'Verification Failed',
        error.response?.data?.message || 'Invalid or expired OTP code'
      );
      // Clear OTP on failure
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      await api.auth.resendOTP(phone);
      Alert.alert('OTP Sent', 'A new verification code has been sent to your phone');
      setCanResend(false);
      setResendTimer(60);

      // Restart countdown
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to resend OTP. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = () => {
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }
    verifyOtp(otpCode);
  };

  const maskedPhone = phone.replace(/(\+233)(\d{2})(\d{3})(\d{4})/, '$1 $2 *** $4');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="phone-portrait" size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>Verify Your Phone</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phoneNumber}>{maskedPhone}</Text>
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : undefined,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} disabled={isLoading}>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
          )}
        </View>

        {/* Demo Note */}
        <View style={styles.demoNote}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={styles.demoNoteText}>
            Demo mode: Use code <Text style={styles.demoCode}>123456</Text> to verify
          </Text>
        </View>

        {/* Change Number */}
        <TouchableOpacity
          style={styles.changeNumber}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={16} color={colors.primary} />
          <Text style={styles.changeNumberText}>Change phone number</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  phoneNumber: {
    fontWeight: '600',
    color: colors.text,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: 6,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.text,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resendText: {
    fontSize: 14,
    color: colors.textLight,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  resendTimer: {
    fontSize: 14,
    color: colors.textLight,
  },
  demoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.info}15`,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  demoNoteText: {
    fontSize: 13,
    color: colors.info,
    marginLeft: spacing.xs,
  },
  demoCode: {
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  changeNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeNumberText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
});
