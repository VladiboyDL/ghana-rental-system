import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, formatCurrency } from '../../utils/theme';
import { RootStackParamList, Contract, Payment } from '../../types';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DashboardStats {
  activeContracts: number;
  pendingContracts: number;
  nextPaymentDue: Payment | null;
  totalPaidThisYear: number;
}

export default function TenantDashboard() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    activeContracts: 0,
    pendingContracts: 0,
    nextPaymentDue: null,
    totalPaidThisYear: 0,
  });
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  const fetchDashboardData = async () => {
    try {
      const [contractsRes, paymentsRes] = await Promise.all([
        api.contracts.getAll(),
        api.payments.getAll(),
      ]);

      const contracts = contractsRes.data || [];
      const payments = paymentsRes.data || [];

      // Calculate stats
      const active = contracts.filter((c: Contract) => c.status === 'ACTIVE');
      const pending = contracts.filter((c: Contract) =>
        c.status === 'PENDING_TENANT_CONFIRMATION'
      );

      const currentYear = new Date().getFullYear();
      const paidThisYear = payments
        .filter((p: Payment) => p.status === 'COMPLETED' && p.completedAt && new Date(p.completedAt).getFullYear() === currentYear)
        .reduce((sum: number, p: Payment) => sum + p.grossAmount, 0);

      // Find next payment due
      const pendingPayments = payments.filter((p: Payment) => p.status === 'PENDING');
      const nextPayment = pendingPayments.length > 0 ? pendingPayments[0] : null;

      setStats({
        activeContracts: active.length,
        pendingContracts: pending.length,
        nextPaymentDue: nextPayment,
        totalPaidThisYear: paidThisYear,
      });

      setActiveContract(active[0] || null);
      setRecentPayments(payments.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Pending Contract Alert */}
        {stats.pendingContracts > 0 && (
          <TouchableOpacity
            style={styles.alertCard}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Contracts' })}
          >
            <View style={styles.alertIcon}>
              <Ionicons name="alert-circle" size={24} color={colors.warning} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {stats.pendingContracts} Contract{stats.pendingContracts > 1 ? 's' : ''} Awaiting Confirmation
              </Text>
              <Text style={styles.alertDescription}>
                Tap to review and confirm your rental agreement
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}

        {/* Next Payment Due */}
        {stats.nextPaymentDue && (
          <View style={styles.paymentDueCard}>
            <View style={styles.paymentDueHeader}>
              <Text style={styles.paymentDueTitle}>Next Payment Due</Text>
              <Text style={styles.paymentDueDate}>
                {new Date(stats.nextPaymentDue.periodEnd).toLocaleDateString('en-GH', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <Text style={styles.paymentDueAmount}>
              {formatCurrency(stats.nextPaymentDue.grossAmount)}
            </Text>
            <TouchableOpacity
              style={styles.payNowButton}
              onPress={() => navigation.navigate('MakePayment', { contractId: stats.nextPaymentDue!.contractId, paymentId: stats.nextPaymentDue!.id })}
            >
              <Text style={styles.payNowText}>Pay Now</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.textOnPrimary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Active Contract Card */}
        {activeContract && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rental</Text>
            <TouchableOpacity
              style={styles.contractCard}
              onPress={() => navigation.navigate('ContractDetails', { contractId: activeContract.id })}
            >
              <View style={styles.contractHeader}>
                <View style={styles.contractIcon}>
                  <Ionicons name="home" size={24} color={colors.primary} />
                </View>
                <View style={styles.contractInfo}>
                  <Text style={styles.contractProperty}>
                    {activeContract.property?.neighborhood}, {activeContract.property?.city}
                  </Text>
                  <Text style={styles.contractNumber}>{activeContract.contractNumber}</Text>
                </View>
                <View style={styles.contractStatus}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>

              <View style={styles.contractDetails}>
                <View style={styles.contractDetailItem}>
                  <Text style={styles.detailLabel}>Monthly Rent</Text>
                  <Text style={styles.detailValue}>{formatCurrency(activeContract.monthlyRent)}</Text>
                </View>
                <View style={styles.contractDetailItem}>
                  <Text style={styles.detailLabel}>Landlord</Text>
                  <Text style={styles.detailValue}>
                    {activeContract.landlord?.firstName} {activeContract.landlord?.lastName}
                  </Text>
                </View>
                <View style={styles.contractDetailItem}>
                  <Text style={styles.detailLabel}>Valid Until</Text>
                  <Text style={styles.detailValue}>
                    {new Date(activeContract.endDate).toLocaleDateString('en-GH', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <ActionCard
              icon="card"
              label="Make Payment"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Payments' })}
            />
            <ActionCard
              icon="document-text"
              label="View Contract"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Contracts' })}
            />
            <ActionCard
              icon="receipt"
              label="Payment History"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Payments' })}
            />
          </View>
        </View>

        {/* Payment History */}
        <View style={[styles.section, { marginBottom: spacing.xl }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Payments' })}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentPayments.length > 0 ? (
            recentPayments.map((payment) => (
              <TouchableOpacity
                key={payment.id}
                style={styles.paymentCard}
                onPress={() => navigation.navigate('PaymentDetails', { paymentId: payment.id })}
              >
                <View style={styles.paymentIcon}>
                  <Ionicons
                    name={payment.status === 'COMPLETED' ? 'checkmark-circle' : 'time'}
                    size={24}
                    color={payment.status === 'COMPLETED' ? colors.success : colors.warning}
                  />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentRef}>{payment.paymentReference}</Text>
                  <Text style={styles.paymentDate}>
                    {new Date(payment.periodStart).toLocaleDateString('en-GH', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.paymentAmount}>
                  <Text style={styles.paymentGross}>{formatCurrency(payment.grossAmount)}</Text>
                  <Text style={[
                    styles.paymentStatus,
                    { color: payment.status === 'COMPLETED' ? colors.success : colors.warning }
                  ]}>
                    {payment.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyStateText}>No payment history</Text>
            </View>
          )}
        </View>

        {/* Year Summary */}
        <View style={[styles.section, { marginBottom: spacing.xl }]}>
          <View style={styles.yearSummary}>
            <Text style={styles.yearSummaryLabel}>Total Paid This Year</Text>
            <Text style={styles.yearSummaryValue}>{formatCurrency(stats.totalPaidThisYear)}</Text>
            <Text style={styles.yearSummaryTax}>
              Tax Contributed: {formatCurrency(stats.totalPaidThisYear * 0.08)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({ icon, label, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  greeting: {
    fontSize: 14,
    color: colors.textLight,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  notificationButton: {
    padding: spacing.sm,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  alertIcon: {
    marginRight: spacing.sm,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  alertDescription: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  paymentDueCard: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
  },
  paymentDueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  paymentDueTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  paymentDueDate: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
  },
  paymentDueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: spacing.md,
  },
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  payNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  contractCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  contractIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contractInfo: {
    flex: 1,
  },
  contractProperty: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  contractNumber: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  contractStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
    marginLeft: 4,
  },
  contractDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  contractDetailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textLight,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginHorizontal: spacing.xs,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionLabel: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  paymentIcon: {
    marginRight: spacing.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentRef: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  paymentDate: {
    fontSize: 12,
    color: colors.textLight,
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  paymentGross: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  paymentStatus: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  yearSummary: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
  },
  yearSummaryLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  yearSummaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  yearSummaryTax: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
});
