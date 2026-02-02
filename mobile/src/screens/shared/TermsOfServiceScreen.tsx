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

export default function TermsOfServiceScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.lastUpdated}>Last Updated: January 1, 2026</Text>

          <Section title="1. Acceptance of Terms">
            <Text style={styles.paragraph}>
              By downloading, installing, or using the Ghana Rental Market Taxation System
              ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you
              do not agree to these Terms, do not use the App.
            </Text>
            <Text style={styles.paragraph}>
              The App is operated by All Soft Corp s.r.o. in partnership with the Ghana
              Revenue Authority to facilitate rental income tax collection in Ghana.
            </Text>
          </Section>

          <Section title="2. Eligibility">
            <Text style={styles.paragraph}>
              To use this App, you must:
            </Text>
            <BulletPoint text="Be at least 18 years of age" />
            <BulletPoint text="Be a resident of Ghana or own property in Ghana" />
            <BulletPoint text="Have a valid Ghana Card for identity verification" />
            <BulletPoint text="Have a valid TIN (Tax Identification Number)" />
            <BulletPoint text="Have the legal capacity to enter into contracts" />
          </Section>

          <Section title="3. User Accounts">
            <Text style={styles.subheading}>Registration</Text>
            <Text style={styles.paragraph}>
              You must register for an account to use the App. You agree to provide accurate,
              current, and complete information during registration and to update such
              information to keep it accurate, current, and complete.
            </Text>

            <Text style={styles.subheading}>Account Security</Text>
            <Text style={styles.paragraph}>
              You are responsible for safeguarding your account credentials and for any
              activity that occurs under your account. You must notify us immediately of
              any unauthorized access to your account.
            </Text>

            <Text style={styles.subheading}>Account Types</Text>
            <BulletPoint text="Landlord Account: For property owners who receive rental income" />
            <BulletPoint text="Tenant Account: For individuals who pay rent" />
          </Section>

          <Section title="4. Services Provided">
            <Text style={styles.paragraph}>
              The App provides the following services:
            </Text>
            <BulletPoint text="Registration and management of rental properties" />
            <BulletPoint text="Creation and management of rental contracts" />
            <BulletPoint text="Processing of rental payments" />
            <BulletPoint text="Automatic withholding of rental income tax (8%)" />
            <BulletPoint text="Remittance of withheld tax to GRA" />
            <BulletPoint text="Generation of tax certificates" />
            <BulletPoint text="Payment history and reporting" />
          </Section>

          <Section title="5. Tax Obligations">
            <Text style={styles.paragraph}>
              By using this App:
            </Text>
            <BulletPoint text="Landlords acknowledge that 8% of gross rental income will be withheld as tax and remitted to GRA" />
            <BulletPoint text="Tenants acknowledge that their payments will include tax withholding" />
            <BulletPoint text="All parties agree to comply with Ghana's tax laws and regulations" />
            <BulletPoint text="Tax certificates generated through the App are valid for tax filing purposes" />
          </Section>

          <Section title="6. Payment Terms">
            <Text style={styles.subheading}>Payment Processing</Text>
            <Text style={styles.paragraph}>
              Payments are processed through authorized payment providers (Mobile Money and
              bank cards). The net amount (gross rent minus 8% tax) is transferred to
              landlords within 2-3 business days.
            </Text>

            <Text style={styles.subheading}>Fees</Text>
            <Text style={styles.paragraph}>
              A small platform fee may be charged for payment processing. All fees will be
              clearly displayed before you confirm any transaction.
            </Text>

            <Text style={styles.subheading}>Refunds</Text>
            <Text style={styles.paragraph}>
              Refund requests must be submitted within 7 days of payment. Refunds are subject
              to review and approval. Tax amounts already remitted to GRA cannot be refunded
              through the App.
            </Text>
          </Section>

          <Section title="7. User Conduct">
            <Text style={styles.paragraph}>
              You agree not to:
            </Text>
            <BulletPoint text="Provide false or misleading information" />
            <BulletPoint text="Use the App for any illegal purpose" />
            <BulletPoint text="Attempt to evade tax obligations" />
            <BulletPoint text="Interfere with the proper functioning of the App" />
            <BulletPoint text="Access accounts belonging to others" />
            <BulletPoint text="Use the App to harass or harm other users" />
          </Section>

          <Section title="8. Intellectual Property">
            <Text style={styles.paragraph}>
              The App and its content, features, and functionality are owned by All Soft Corp
              s.r.o. and/or the Ghana Revenue Authority and are protected by copyright,
              trademark, and other intellectual property laws.
            </Text>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <Text style={styles.paragraph}>
              THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED,
              ERROR-FREE, OR COMPLETELY SECURE.
            </Text>
          </Section>

          <Section title="10. Limitation of Liability">
            <Text style={styles.paragraph}>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE
              OF THE APP.
            </Text>
          </Section>

          <Section title="11. Dispute Resolution">
            <Text style={styles.paragraph}>
              Any disputes arising from these Terms or your use of the App shall be resolved
              through arbitration in accordance with the laws of Ghana. The arbitration shall
              take place in Accra, Ghana.
            </Text>
          </Section>

          <Section title="12. Termination">
            <Text style={styles.paragraph}>
              We may terminate or suspend your account at any time for violation of these
              Terms or for any other reason. Upon termination, your right to use the App
              will immediately cease. Tax records will be retained as required by law.
            </Text>
          </Section>

          <Section title="13. Changes to Terms">
            <Text style={styles.paragraph}>
              We reserve the right to modify these Terms at any time. We will notify you of
              significant changes through the App or via email. Your continued use of the
              App after changes constitutes acceptance of the new Terms.
            </Text>
          </Section>

          <Section title="14. Governing Law">
            <Text style={styles.paragraph}>
              These Terms shall be governed by and construed in accordance with the laws of
              the Republic of Ghana.
            </Text>
          </Section>

          <Section title="15. Contact Information">
            <Text style={styles.paragraph}>
              For questions about these Terms, please contact us at:
            </Text>
            <Text style={styles.contactInfo}>Email: legal@ghanarentaltax.gov.gh</Text>
            <Text style={styles.contactInfo}>Phone: +233 30 212 3456</Text>
            <Text style={styles.contactInfo}>Address: Independence Avenue, Accra, Ghana</Text>
          </Section>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By using the Ghana Rental Market Taxation System, you acknowledge that you have
              read, understood, and agree to be bound by these Terms of Service.
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
