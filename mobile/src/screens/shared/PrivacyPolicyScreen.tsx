import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: January 1, 2026</Text>

          <Section title="1. Introduction">
            <Text style={styles.paragraph}>
              Welcome to the Ghana Rental Market Taxation System ("the App"), operated by All Soft Corp s.r.o.
              in partnership with the Ghana Revenue Authority. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our mobile application.
            </Text>
          </Section>

          <Section title="2. Information We Collect">
            <Text style={styles.subheading}>Personal Information</Text>
            <Text style={styles.paragraph}>
              We collect information that you provide directly to us, including:
            </Text>
            <BulletPoint text="Full name, date of birth, and gender" />
            <BulletPoint text="Ghana Card number and TIN number" />
            <BulletPoint text="Email address and phone number" />
            <BulletPoint text="Digital address and physical address" />
            <BulletPoint text="Property information (for landlords)" />
            <BulletPoint text="Bank account and mobile money details" />

            <Text style={styles.subheading}>Automatically Collected Information</Text>
            <Text style={styles.paragraph}>
              When you use our App, we automatically collect certain information, including:
            </Text>
            <BulletPoint text="Device information (model, operating system)" />
            <BulletPoint text="IP address and location data" />
            <BulletPoint text="App usage data and analytics" />
            <BulletPoint text="Transaction history and payment records" />
          </Section>

          <Section title="3. How We Use Your Information">
            <Text style={styles.paragraph}>
              We use the information we collect to:
            </Text>
            <BulletPoint text="Process rental payments and tax withholdings" />
            <BulletPoint text="Verify your identity and prevent fraud" />
            <BulletPoint text="Generate tax certificates and reports" />
            <BulletPoint text="Send notifications about payments and contracts" />
            <BulletPoint text="Comply with legal and regulatory requirements" />
            <BulletPoint text="Improve our services and user experience" />
            <BulletPoint text="Provide customer support" />
          </Section>

          <Section title="4. Information Sharing">
            <Text style={styles.paragraph}>
              We may share your information with:
            </Text>
            <BulletPoint text="Ghana Revenue Authority for tax reporting purposes" />
            <BulletPoint text="Payment processors to facilitate transactions" />
            <BulletPoint text="Landlords or tenants as part of rental agreements" />
            <BulletPoint text="Law enforcement when required by law" />
            <BulletPoint text="Service providers who assist in our operations" />
            <Text style={styles.paragraph}>
              We do not sell your personal information to third parties.
            </Text>
          </Section>

          <Section title="5. Data Security">
            <Text style={styles.paragraph}>
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or
              destruction. These measures include:
            </Text>
            <BulletPoint text="End-to-end encryption for sensitive data" />
            <BulletPoint text="Secure servers with regular security audits" />
            <BulletPoint text="Two-factor authentication options" />
            <BulletPoint text="Regular employee training on data protection" />
          </Section>

          <Section title="6. Data Retention">
            <Text style={styles.paragraph}>
              We retain your personal information for as long as necessary to fulfill the purposes
              outlined in this Privacy Policy and to comply with legal obligations. Tax-related
              records are retained for a minimum of 6 years as required by Ghanaian tax law.
            </Text>
          </Section>

          <Section title="7. Your Rights">
            <Text style={styles.paragraph}>
              You have the right to:
            </Text>
            <BulletPoint text="Access your personal information" />
            <BulletPoint text="Correct inaccurate information" />
            <BulletPoint text="Request deletion of your data (subject to legal requirements)" />
            <BulletPoint text="Withdraw consent for optional processing" />
            <BulletPoint text="Lodge a complaint with the Data Protection Commission" />
          </Section>

          <Section title="8. Children's Privacy">
            <Text style={styles.paragraph}>
              Our App is not intended for use by individuals under the age of 18. We do not
              knowingly collect personal information from children. If you are a parent or
              guardian and believe your child has provided us with personal information,
              please contact us.
            </Text>
          </Section>

          <Section title="9. Changes to This Policy">
            <Text style={styles.paragraph}>
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the "Last
              Updated" date. You are advised to review this Privacy Policy periodically.
            </Text>
          </Section>

          <Section title="10. Contact Us">
            <Text style={styles.paragraph}>
              If you have any questions about this Privacy Policy, please contact us at:
            </Text>
            <Text style={styles.contactInfo}>Email: privacy@ghanarentaltax.gov.gh</Text>
            <Text style={styles.contactInfo}>Phone: +233 30 212 3456</Text>
            <Text style={styles.contactInfo}>Address: Independence Avenue, Accra, Ghana</Text>
          </Section>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By using the Ghana Rental Market Taxation System, you agree to the collection
              and use of information in accordance with this Privacy Policy.
            </Text>
          </View>

          <View style={{ height: spacing.xl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletPoint({ text }: { text: string }) {
  return (
    <View style={styles.bulletPoint}>
      <Text style={styles.bullet}>{'\u2022'}</Text>
      <Text style={styles.bulletText}>{text}</Text>
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
  content: {
    padding: spacing.lg,
  },
  lastUpdated: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginLeft: spacing.sm,
    marginBottom: spacing.xs,
  },
  bullet: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  contactInfo: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: spacing.sm,
    marginBottom: spacing.xs,
  },
  footer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});
