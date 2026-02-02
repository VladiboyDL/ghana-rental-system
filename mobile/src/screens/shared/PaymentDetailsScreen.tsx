import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, formatCurrency } from '../../utils/theme';
import { RootStackParamList, Payment } from '../../types';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PaymentDetailsRouteProp = RouteProp<RootStackParamList, 'PaymentDetails'>;

export default function PaymentDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentDetailsRouteProp>();
  const { paymentId } = route.params;
  const { user } = useAuthStore();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLandlord = user?.role === 'LANDLORD';

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return colors.success;
      case 'PENDING':
        return colors.warning;
      case 'FAILED':
        return colors.error;
      default:
        return colors.textLight;
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
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: `${getStatusColor(payment.status)}15` }]}>
          <Ionicons
            name={payment.status === 'COMPLETED' ? 'checkmark-circle' : 'time'}
            size={48}
            color={getStatusColor(payment.status)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
            {payment.status === 'COMPLETED' ? 'Payment Completed' : 'Payment Pending'}
          </Text>
          <Text style={styles.paymentRef}>{payment.paymentReference}</Text>
        </View>

        {/* Amount Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Breakdown</Text>
          <View style={styles.breakdownCard}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Gross Rent</Text>
              <Text style={styles.amountValue}>{formatCurrency(payment.grossAmount)}</Text>
            </View>
            <View style={styles.amountRow}>
              <View style={styles.taxLabelRow}>
                <Text style={styles.amountLabel}>Withholding Tax (8%)</Text>
                <TouchableOpacity>
                  <Ionicons name="information-circle-outline" size={16} color={colors.textLight} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.amountValue, { color: colors.error }]}>
                -{formatCurrency(payment.taxAmount)}
              </Text>
            </View>
            {payment.platformFee > 0 && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Platform Fee</Text>
                <Text style={[styles.amountValue, { color: colors.textLight }]}>
                  -{formatCurrency(payment.platformFee)}
                </Text>
              </View>
            )}
            <View style={[styles.amountRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>
                {isLandlord ? 'Net Amount Received' : 'Amount Paid'}
              </Text>
              <Text style={styles.totalValue}>
                {formatCurrency(isLandlord ? payment.netAmount : payment.grossAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Period</Text>
          <View style={styles.periodCard}>
            <View style={styles.periodItem}>
              <Text style={styles.periodLabel}>From</Text>
              <Text style={styles.periodValue}>
                {new Date(payment.periodStart).toLocaleDateString('en-GH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.textLight} />
            <View style={styles.periodItem}>
              <Text style={styles.periodLabel}>To</Text>
              <Text style={styles.periodValue}>
                {new Date(payment.periodEnd).toLocaleDateString('en-GH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        {payment.status === 'COMPLETED' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.methodCard}>
              <View style={styles.methodIcon}>
                <Ionicons
                  name={payment.paymentMethod === 'MOBILE_MONEY' ? 'phone-portrait' : 'card'}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>
                  {payment.paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : payment.paymentMethod}
                </Text>
                {payment.paymentProvider && (
                  <Text style={styles.methodProvider}>{payment.paymentProvider}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineCard}>
            <TimelineItem
              icon="create"
              label="Payment Created"
              date={payment.initiatedAt || payment.createdAt || ''}
              isFirst
            />
            {payment.completedAt && (
              <TimelineItem
                icon="checkmark-circle"
                label="Payment Completed"
                date={payment.completedAt}
              />
            )}
            {payment.completedAt && !payment.failedAt && (
              <TimelineItem
                icon="wallet"
                label="Settled to Landlord"
                date={payment.completedAt}
                isLast
              />
            )}
            {payment.failedAt && (
              <TimelineItem
                icon="close-circle"
                label="Payment Failed"
                date={payment.failedAt}
                isLast
                isError
              />
            )}
          </View>
        </View>

        {/* Tax Info */}
        <View style={styles.section}>
          <View style={styles.taxInfoCard}>
            <Ionicons name="receipt" size={24} color={colors.primary} />
            <View style={styles.taxInfoContent}>
              <Text style={styles.taxInfoTitle}>Tax Withheld</Text>
              <Text style={styles.taxInfoAmount}>{formatCurrency(payment.taxAmount)}</Text>
              <Text style={styles.taxInfoDescription}>
                Automatically remitted to Ghana Revenue Authority
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {payment.status === 'PENDING' && !isLandlord && (
          <View style={[styles.section, { marginBottom: spacing.xl }]}>
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => navigation.navigate('MakePayment', { contractId: payment.contractId, paymentId: payment.id })}
            >
              <Ionicons name="card" size={20} color={colors.textOnPrimary} />
              <Text style={styles.payButtonText}>Make Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {payment.status === 'COMPLETED' && (
          <View style={[styles.section, { marginBottom: spacing.xl }]}>
            <TouchableOpacity style={styles.downloadButton}>
              <Ionicons name="download" size={20} color={colors.primary} />
              <Text style={styles.downloadButtonText}>Download Receipt</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TimelineItem({
  icon,
  label,
  date,
  isFirst,
  isLast,
  isError,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  date: string;
  isFirst?: boolean;
  isLast?: boolean;
  isError?: boolean;
}) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineIndicator}>
        {!isFirst && <View style={[styles.timelineLine, isError && styles.timelineLineError]} />}
        <View style={[styles.timelineDot, isError && styles.timelineDotError]}>
          <Ionicons name={icon} size={14} color={isError ? colors.error : colors.primary} />
        </View>
        {!isLast && <View style={[styles.timelineLine, isError && styles.timelineLineError]} />}
      </View>
      <View style={styles.timelineContent}>
        <Text style={[styles.timelineLabel, isError && { color: colors.error }]}>{label}</Text>
        <Text style={styles.timelineDate}>
          {new Date(date).toLocaleDateString('en-GH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
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
  statusCard: {
    alignItems: 'center',
    padding: spacing.xl,
    margin: spacing.lg,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  paymentRef: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  taxLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginRight: spacing.xs,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: spacing.xs,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  periodItem: {
    flex: 1,
  },
  periodLabel: {
    fontSize: 11,
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  periodValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: 2,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  methodProvider: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineIndicator: {
    width: 32,
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: `${colors.primary}30`,
  },
  timelineLineError: {
    backgroundColor: `${colors.error}30`,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotError: {
    backgroundColor: `${colors.error}15`,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.md,
    paddingLeft: spacing.sm,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  timelineDate: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  taxInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: spacing.md,
  },
  taxInfoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  taxInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  taxInfoAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 2,
  },
  taxInfoDescription: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  payButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  downloadButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
