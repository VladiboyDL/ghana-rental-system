import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  {
    id: '1',
    question: 'How is the rental income tax calculated?',
    answer: 'The rental income tax is calculated at 8% of the gross rent amount. This is automatically withheld when tenants make payments through the platform and remitted to the Ghana Revenue Authority.',
  },
  {
    id: '2',
    question: 'When do I receive my rental payments?',
    answer: 'After a tenant makes a payment, the net amount (gross rent minus 8% tax) is transferred to your registered bank account within 2-3 business days.',
  },
  {
    id: '3',
    question: 'How do I get my tax certificate?',
    answer: 'Tax certificates are automatically generated quarterly and annually. You can download them from the Tax Certificates section in your profile.',
  },
  {
    id: '4',
    question: 'Can I add multiple properties?',
    answer: 'Yes, landlords can register and manage multiple properties. Each property will have its own contracts and payment tracking.',
  },
  {
    id: '5',
    question: 'What payment methods are accepted?',
    answer: 'We accept Mobile Money (MTN, Vodafone, AirtelTigo) and bank cards (Visa, Mastercard). Cash payments are not supported to ensure proper tax documentation.',
  },
  {
    id: '6',
    question: 'How do I verify my identity?',
    answer: 'Identity verification is done using your Ghana Card. Simply scan your Ghana Card during registration or contract signing, and our system will verify your details.',
  },
  {
    id: '7',
    question: 'What happens if a tenant misses a payment?',
    answer: 'The system will send automatic reminders to tenants before payment due dates. If payment is missed, both landlord and tenant will be notified.',
  },
  {
    id: '8',
    question: 'Can I cancel a contract?',
    answer: 'Contract termination follows the terms agreed upon. Contact support for assistance with early termination or disputes.',
  },
];

export default function HelpSupportScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });

  const handleCall = () => {
    Linking.openURL('tel:+233302123456');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@ghanarentaltax.gov.gh');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/233244123456');
  };

  const handleSubmitTicket = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        'Ticket Submitted',
        'Your support request has been submitted. We will respond within 24-48 hours.',
        [{ text: 'OK', onPress: () => setShowContactForm(false) }]
      );
      setContactForm({ subject: '', message: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactOptions}>
            <TouchableOpacity style={styles.contactOption} onPress={handleCall}>
              <View style={[styles.contactIcon, { backgroundColor: `${colors.success}15` }]}>
                <Ionicons name="call" size={24} color={colors.success} />
              </View>
              <Text style={styles.contactLabel}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactOption} onPress={handleEmail}>
              <View style={[styles.contactIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="mail" size={24} color={colors.primary} />
              </View>
              <Text style={styles.contactLabel}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactOption} onPress={handleWhatsApp}>
              <View style={[styles.contactIcon, { backgroundColor: `${colors.success}15` }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <Text style={styles.contactLabel}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactOption} onPress={() => setShowContactForm(true)}>
              <View style={[styles.contactIcon, { backgroundColor: `${colors.secondary}30` }]}>
                <Ionicons name="chatbubble-ellipses" size={24} color={colors.primary} />
              </View>
              <Text style={styles.contactLabel}>Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Hours */}
        <View style={styles.section}>
          <View style={styles.supportHours}>
            <Ionicons name="time-outline" size={20} color={colors.textLight} />
            <View style={styles.supportHoursText}>
              <Text style={styles.supportHoursTitle}>Support Hours</Text>
              <Text style={styles.supportHoursValue}>Monday - Friday: 8:00 AM - 5:00 PM</Text>
              <Text style={styles.supportHoursValue}>Saturday: 9:00 AM - 1:00 PM</Text>
            </View>
          </View>
        </View>

        {/* Contact Form */}
        {showContactForm && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submit a Support Ticket</Text>
            <View style={styles.contactForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Subject</Text>
                <TextInput
                  style={styles.input}
                  value={contactForm.subject}
                  onChangeText={(text) => setContactForm({ ...contactForm, subject: text })}
                  placeholder="What do you need help with?"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={contactForm.message}
                  onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
                  placeholder="Describe your issue in detail..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  numberOfLines={5}
                />
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowContactForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitTicket}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            {FAQS.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={styles.faqItem}
                onPress={() => toggleFAQ(faq.id)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textLight}
                  />
                </View>
                {expandedFAQ === faq.id && (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  contactOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactOption: {
    alignItems: 'center',
    flex: 1,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contactLabel: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  supportHours: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  supportHoursText: {
    marginLeft: spacing.md,
  },
  supportHoursTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  supportHoursValue: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  contactForm: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
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
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
  faqList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginRight: spacing.sm,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
