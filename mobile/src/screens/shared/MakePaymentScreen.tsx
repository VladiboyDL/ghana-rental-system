import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, formatCurrency } from '../../utils/theme';
import { RootStackParamList, Payment } from '../../types';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type MakePaymentRouteProp = RouteProp<RootStackParamList, 'MakePayment'>;

const PAYMENT_METHODS = [
  { id: 'MTN', name: 'MTN Mobile Money', icon: 'phone-portrait', color: '#FFC300' },
  { id: 'VODAFONE', name: 'Vodafone Cash', icon: 'phone-portrait', color: '#E60000' },
  { id: 'AIRTELTIGO', name: 'AirtelTigo Money', icon: 'phone-portrait', color: '#FF0000' },
  { id: 'BANK', name: 'Bank Transfer', icon: 'card', color: colors.primary },
];

export default function MakePaymentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<MakePaymentRouteProp>();
  const { contractId, paymentId } = route.params;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails();
    } else {
      setIsLoading(false);
    }
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
    if (!paymentId) return;
    try {
      const response = await api.payments.getById(paymentId);
      setPayment(response.data);
    } catch (error) {
      console.error('Failed to fetch payment:', error);
      Alert.alert('Error', 'Failed to load payment details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMethod = (methodId: string) => {
    setSelectedMethod(methodId);
    setStep(2);
  };

  const handlePay = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setIsProcessing(true);
    try {
      await api.payments.initiate(paymentId!, {
        paymentMethod: 'MOBILE_MONEY',
        paymentProvider: selectedMethod!,
        phoneNumber: phoneNumber.trim(),
      });

      Alert.alert(
        'Payment Initiated',
        `A payment prompt has been sent to your ${selectedMethod} number. Please approve the transaction on your phone.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // In production, this would poll for payment status
              // For demo, we'll simulate success
              setTimeout(() => {
                Alert.alert(
                  'Payment Successful',
                  'Your rent payment has been processed successfully. The tax amount has been automatically remitted to GRA.',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              }, 2000);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Payment Failed',
        error.response?.data?.message || 'Failed to process payment. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!payment) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Payment Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Amount Due</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(payment.grossAmount)}</Text>
          <Text style={styles.summaryPeriod}>
            Rent for{' '}
            {new Date(payment.periodStart).toLocaleDateString('en-GH', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Rent</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(payment.grossAmount)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Tax (8%)</Text>
              <Text style={[styles.breakdownValue, { color: colors.textLight }]}>
                {formatCurrency(payment.taxAmount)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>To Landlord</Text>
              <Text style={[styles.breakdownValue, { color: colors.success }]}>
                {formatCurrency(payment.netAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Step 1: Select Payment Method */}
        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  selectedMethod === method.id && styles.methodCardSelected,
                ]}
                onPress={() => handleSelectMethod(method.id)}
              >
                <View style={[styles.methodIcon, { backgroundColor: `${method.color}20` }]}>
                  <Ionicons name={method.icon as any} size={24} color={method.color} />
                </View>
                <Text style={styles.methodName}>{method.name}</Text>
                <Ionicons
                  name={selectedMethod === method.id ? 'checkmark-circle' : 'chevron-forward'}
                  size={20}
                  color={selectedMethod === method.id ? colors.primary : colors.textLight}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 2: Enter Phone Number */}
        {step === 2 && selectedMethod && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.backButtonText}>Change payment method</Text>
            </TouchableOpacity>

            <View style={styles.selectedMethodCard}>
              <View
                style={[
                  styles.methodIcon,
                  { backgroundColor: `${PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.color}20` },
                ]}
              >
                <Ionicons
                  name={PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.icon as any}
                  size={24}
                  color={PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.color}
                />
              </View>
              <Text style={styles.selectedMethodName}>
                {PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.name}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputWrapper}>
                <Text style={styles.phonePrefix}>+233</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="24 123 4567"
                  placeholderTextColor={colors.textLight}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <Text style={styles.inputHint}>
                You will receive a payment prompt on this number
              </Text>
            </View>

            {/* Payment Confirmation */}
            <View style={styles.confirmationCard}>
              <Text style={styles.confirmationTitle}>Payment Summary</Text>
              <View style={styles.confirmationRow}>
                <Text style={styles.confirmationLabel}>You Pay</Text>
                <Text style={styles.confirmationValue}>{formatCurrency(payment.grossAmount)}</Text>
              </View>
              <View style={styles.confirmationRow}>
                <Text style={styles.confirmationLabel}>Tax to GRA</Text>
                <Text style={styles.confirmationValue}>{formatCurrency(payment.taxAmount)}</Text>
              </View>
              <View style={styles.confirmationRow}>
                <Text style={styles.confirmationLabel}>Landlord Receives</Text>
                <Text style={styles.confirmationValue}>{formatCurrency(payment.netAmount)}</Text>
              </View>
            </View>

            {/* Tax Notice */}
            <View style={styles.taxNotice}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.taxNoticeText}>
                8% ({formatCurrency(payment.taxAmount)}) will be automatically remitted to Ghana Revenue Authority as withholding tax.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Pay Button */}
      {step === 2 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
            onPress={handlePay}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <>
                <Ionicons name="lock-closed" size={20} color={colors.textOnPrimary} />
                <Text style={styles.payButtonText}>Pay {formatCurrency(payment.grossAmount)}</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.securityText}>
            <Ionicons name="shield-checkmark" size={12} color={colors.textLight} />
            {' '}Secured by GRA Payment Gateway
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginTop: spacing.xs,
  },
  summaryPeriod: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textOnPrimary,
    marginTop: 2,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: colors.primary,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  methodName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  selectedMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  selectedMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  inputHint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  confirmationCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  confirmationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  confirmationLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  confirmationValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  taxNotice: {
    flexDirection: 'row',
    backgroundColor: `${colors.info}15`,
    borderRadius: 12,
    padding: spacing.md,
  },
  taxNoticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.info,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  securityText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
