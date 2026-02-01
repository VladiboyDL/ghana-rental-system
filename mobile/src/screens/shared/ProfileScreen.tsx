import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Not Available', 'Account deletion is not available in the demo.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userRole}>
            {user?.role === 'LANDLORD' ? 'Property Owner' : 'Tenant'}
          </Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.verifiedText}>Verified Account</Text>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="mail" label="Email" value={user?.email} />
            <InfoRow icon="call" label="Phone" value={user?.phone} />
            <InfoRow icon="card" label="Ghana Card" value={user?.ghanaCardNumber} />
            <InfoRow icon="location" label="Digital Address" value={user?.digitalAddress} />
            <InfoRow icon="map" label="Region" value={user?.region} />
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications-outline" size={22} color={colors.text} />
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="finger-print-outline" size={22} color={colors.text} />
                <Text style={styles.settingLabel}>Biometric Login</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="person"
              label="Edit Profile"
              onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon.')}
            />
            <MenuItem
              icon="lock-closed"
              label="Change Password"
              onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon.')}
            />
            <MenuItem
              icon="document-text"
              label="Tax Certificates"
              onPress={() => Alert.alert('Coming Soon', 'Tax certificates will be available soon.')}
              badge={user?.role === 'LANDLORD' ? '3' : undefined}
            />
            <MenuItem
              icon="help-circle"
              label="Help & Support"
              onPress={() => Alert.alert('Support', 'Contact us at support@ghanarentaltax.gov.gh')}
            />
            <MenuItem
              icon="shield"
              label="Privacy Policy"
              onPress={() => {}}
            />
            <MenuItem
              icon="document"
              label="Terms of Service"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.appInfo}>
            <Text style={styles.appVersion}>Ghana Rental Tax App v1.0.0</Text>
            <Text style={styles.appCopyright}>© 2024 Ghana Revenue Authority</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={`${icon}-outline` as any} size={20} color={colors.textLight} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '-'}</Text>
      </View>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  badge,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: string;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={`${icon}-outline` as any} size={22} color={colors.text} />
      <Text style={styles.menuLabel}>{label}</Text>
      {badge && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.primary,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  verifiedText: {
    fontSize: 12,
    color: colors.textOnPrimary,
    marginLeft: spacing.xs,
  },
  section: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginTop: 2,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    color: colors.text,
    marginLeft: spacing.md,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    marginLeft: spacing.md,
  },
  menuBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: spacing.sm,
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  appVersion: {
    fontSize: 13,
    color: colors.textLight,
  },
  appCopyright: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: spacing.sm,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  deleteButtonText: {
    fontSize: 14,
    color: colors.textLight,
  },
});
