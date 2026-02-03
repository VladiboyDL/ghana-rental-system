import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList } from '../../types';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Logo and Title */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="home" size={60} color={colors.secondary} />
            </View>
            <Text style={styles.title}>Ghana Rental</Text>
            <Text style={styles.subtitle}>Tax Compliance System</Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <FeatureItem
              icon="document-text"
              title="Digital Contracts"
              description="Create and sign rental agreements digitally"
            />
            <FeatureItem
              icon="scan"
              title="ID Verification"
              description="Scan Ghana Card for instant verification"
            />
            <FeatureItem
              icon="wallet"
              title="Easy Payments"
              description="Pay rent with automatic tax withholding"
            />
            <FeatureItem
              icon="shield-checkmark"
              title="GRA Compliant"
              description="Automatic 8% withholding tax to GRA"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            A Ghana Revenue Authority Initiative
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function FeatureItem({ icon, title, description }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={24} color={colors.secondary} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  features: {
    marginVertical: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textOnPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  buttons: {
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.textOnPrimary,
  },
  secondaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginBottom: spacing.md,
  },
});
