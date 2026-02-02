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
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function EditProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    otherNames: user?.otherNames || '',
    phone: user?.phone || '',
    digitalAddress: user?.digitalAddress || '',
    region: user?.region || '',
    district: user?.district || '',
    city: user?.city || '',
    streetAddress: user?.streetAddress || '',
  });

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.users.updateProfile(formData);
      if (response.data) {
        setUser({ ...user, ...response.data });
        Alert.alert('Success', 'Profile updated successfully');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading} style={styles.saveButton}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {formData.firstName?.[0]}{formData.lastName?.[0]}
              </Text>
            </View>
            <TouchableOpacity style={styles.changePhotoButton}>
              <Ionicons name="camera" size={16} color={colors.primary} />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                placeholder="Enter first name"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                placeholder="Enter last name"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Other Names</Text>
              <TextInput
                style={styles.input}
                value={formData.otherNames}
                onChangeText={(text) => setFormData({ ...formData, otherNames: text })}
                placeholder="Enter other names"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Address Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Digital Address</Text>
              <TextInput
                style={styles.input}
                value={formData.digitalAddress}
                onChangeText={(text) => setFormData({ ...formData, digitalAddress: text })}
                placeholder="e.g., GA-123-4567"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Region</Text>
              <TextInput
                style={styles.input}
                value={formData.region}
                onChangeText={(text) => setFormData({ ...formData, region: text })}
                placeholder="Enter region"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>District</Text>
              <TextInput
                style={styles.input}
                value={formData.district}
                onChangeText={(text) => setFormData({ ...formData, district: text })}
                placeholder="Enter district"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="Enter city"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.streetAddress}
                onChangeText={(text) => setFormData({ ...formData, streetAddress: text })}
                placeholder="Enter street address"
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.readOnlySection}>
            <Text style={styles.sectionTitle}>Read-only Information</Text>
            <Text style={styles.readOnlyNote}>
              The following information cannot be changed. Contact support if you need to update these details.
            </Text>

            <View style={styles.readOnlyItem}>
              <Text style={styles.readOnlyLabel}>Email</Text>
              <Text style={styles.readOnlyValue}>{user?.email}</Text>
            </View>

            <View style={styles.readOnlyItem}>
              <Text style={styles.readOnlyLabel}>Ghana Card Number</Text>
              <Text style={styles.readOnlyValue}>{user?.ghanaCardNumber || 'Not provided'}</Text>
            </View>

            <View style={styles.readOnlyItem}>
              <Text style={styles.readOnlyLabel}>TIN Number</Text>
              <Text style={styles.readOnlyValue}>{user?.tinNumber || 'Not provided'}</Text>
            </View>
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  form: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  readOnlySection: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  readOnlyNote: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  readOnlyItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  readOnlyLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  readOnlyValue: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginTop: 2,
  },
});
