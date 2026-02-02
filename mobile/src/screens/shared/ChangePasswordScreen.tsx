import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList } from '../../types';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ChangePasswordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return { minLength, hasUppercase, hasLowercase, hasNumber };
  };

  const passwordValidation = validatePassword(formData.newPassword);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleChangePassword = async () => {
    if (!formData.currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (!isPasswordValid) {
      Alert.alert('Error', 'Please ensure your new password meets all requirements');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await api.users.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      Alert.alert('Success', 'Password changed successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={formData.currentPassword}
                  onChangeText={(text) => setFormData({ ...formData, currentPassword: text })}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons
                    name={showCurrentPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color={colors.textLight}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={formData.newPassword}
                  onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color={colors.textLight}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Requirements */}
            <View style={styles.requirements}>
              <Text style={styles.requirementsTitle}>Password must have:</Text>
              <RequirementItem label="At least 8 characters" met={passwordValidation.minLength} />
              <RequirementItem label="One uppercase letter" met={passwordValidation.hasUppercase} />
              <RequirementItem label="One lowercase letter" met={passwordValidation.hasLowercase} />
              <RequirementItem label="One number" met={passwordValidation.hasNumber} />
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color={colors.textLight}
                  />
                </TouchableOpacity>
              </View>
              {formData.confirmPassword.length > 0 && formData.newPassword !== formData.confirmPassword && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isPasswordValid || formData.newPassword !== formData.confirmPassword) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={isLoading || !isPasswordValid || formData.newPassword !== formData.confirmPassword}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text style={styles.submitButtonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RequirementItem({ label, met }: { label: string; met: boolean }) {
  return (
    <View style={styles.requirementItem}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={met ? colors.success : colors.textLight}
      />
      <Text style={[styles.requirementText, met && styles.requirementMet]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    padding: spacing.md,
  },
  requirements: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  requirementText: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: spacing.sm,
  },
  requirementMet: {
    color: colors.success,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
});
