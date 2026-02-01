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
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList, Contract, Payment } from '../../types';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DashboardStats {
  totalProperties: number;
  activeContracts: number;
  pendingContracts: number;
  monthlyIncome: number;
  totalTaxWithheld: number;
  pendingPayments: number;
}

export default function LandlordDashboard() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeContracts: 0,
    pendingContracts: 0,
    monthlyIncome: 0,
    totalTaxWithheld: 0,
    pendingPayments: 0,
  });
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  const fetchDashboardData = async () => {
    try {
      const [propertiesRes, contractsRes, paymentsRes] = await Promise.all([
        api.properties.getAll(),
        api.contracts.getAll(),
        api.payments.getAll(),
      ]);

      const properties = propertiesRes.data || [];
      const contracts = contractsRes.data || [];
      const payments = paymentsRes.data || [];

      // Calculate stats
      const activeContracts = contracts.filter((c: Contract) => c.status === 'ACTIVE');
      const pendingContracts = contracts.filter((c: Contract) =>
        c.status === 'PENDING_TENANT_CONFIRMATION' || c.status === 'DRAFT'
      );
      const completedPayments = payments.filter((p: Payment) => p.status === 'COMPLETED');

      const monthlyIncome = completedPayments.reduce((sum: number, p: Payment) =>
        sum + (p.netAmount || 0), 0
      );
      const totalTaxWithheld = completedPayments.reduce((sum: number, p: Payment) =>
        sum + (p.taxAmount || 0), 0
      );
      const pendingPaymentsCount = payments.filter((p: Payment) => p.status === 'PENDING').length;

      setStats({
        totalProperties: properties.length,
        activeContracts: activeContracts.length,
        pendingContracts: pendingContracts.length,
        monthlyIncome,
        totalTaxWithheld,
        pendingPayments: pendingPaymentsCount,
      });

      setRecentContracts(contracts.slice(0, 3));
      setRecentPayments(payments.slice(0, 3));
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

  const formatCurrency = (amount: number) => {
    return `GH₵ ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
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
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              icon="business"
              label="Properties"
              value={stats.totalProperties.toString()}
              color={colors.primary}
            />
            <StatCard
              icon="document-text"
              label="Active Contracts"
              value={stats.activeContracts.toString()}
              color={colors.success}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="wallet"
              label="Monthly Income"
              value={formatCurrency(stats.monthlyIncome)}
              color={colors.info}
              small
            />
            <StatCard
              icon="receipt"
              label="Tax Withheld"
              value={formatCurrency(stats.totalTaxWithheld)}
              color={colors.warning}
              small
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionButton
              icon="add-circle"
              label="Add Property"
              onPress={() => navigation.navigate('AddProperty')}
            />
            <ActionButton
              icon="document-attach"
              label="New Contract"
              onPress={() => navigation.navigate('CreateContract', {})}
            />
            <ActionButton
              icon="card"
              label="View Payments"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Payments' })}
            />
            <ActionButton
              icon="download"
              label="Tax Certificate"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Pending Contracts */}
        {stats.pendingContracts > 0 && (
          <View style={styles.section}>
            <View style={styles.alertCard}>
              <Ionicons name="time" size={24} color={colors.warning} />
              <View style={styles.alertText}>
                <Text style={styles.alertTitle}>
                  {stats.pendingContracts} Pending Contract{stats.pendingContracts > 1 ? 's' : ''}
                </Text>
                <Text style={styles.alertDescription}>
                  Waiting for tenant confirmation
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </View>
          </View>
        )}

        {/* Recent Contracts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Contracts</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Contracts' })}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentContracts.length > 0 ? (
            recentContracts.map((contract) => (
              <TouchableOpacity
                key={contract.id}
                style={styles.contractCard}
                onPress={() => navigation.navigate('ContractDetails', { contractId: contract.id })}
              >
                <View style={styles.contractInfo}>
                  <Text style={styles.contractNumber}>{contract.contractNumber}</Text>
                  <Text style={styles.contractTenant}>
                    Tenant: {contract.tenant?.firstName} {contract.tenant?.lastName}
                  </Text>
                  <Text style={styles.contractRent}>{formatCurrency(contract.monthlyRent)}/month</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contract.status) }]}>
                  <Text style={styles.statusText}>{formatStatus(contract.status)}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyStateText}>No contracts yet</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('CreateContract', {})}
              >
                <Text style={styles.emptyStateButtonText}>Create First Contract</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent Payments */}
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
                    {new Date(payment.periodStart).toLocaleDateString('en-GH', { month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.paymentAmount}>
                  <Text style={styles.paymentGross}>{formatCurrency(payment.grossAmount)}</Text>
                  <Text style={styles.paymentNet}>Net: {formatCurrency(payment.netAmount)}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyStateText}>No payments yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color, small }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  small?: boolean;
}) {
  return (
    <View style={[styles.statCard, small && styles.statCardSmall]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={small ? 18 : 24} color={color} />
      </View>
      <Text style={[styles.statValue, small && styles.statValueSmall]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({ icon, label, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return `${colors.success}20`;
    case 'PENDING_TENANT_CONFIRMATION':
    case 'DRAFT':
      return `${colors.warning}20`;
    case 'EXPIRED':
    case 'TERMINATED':
      return `${colors.error}20`;
    default:
      return `${colors.textLight}20`;
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
    position: 'relative',
    padding: spacing.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  statCardSmall: {
    paddingVertical: spacing.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  statValueSmall: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  actionButton: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    borderRadius: 12,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  alertText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  alertDescription: {
    fontSize: 12,
    color: colors.textLight,
  },
  contractCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contractInfo: {
    flex: 1,
  },
  contractNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  contractTenant: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  contractRent: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'uppercase',
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
  paymentNet: {
    fontSize: 11,
    color: colors.textLight,
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
  emptyStateButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
});
