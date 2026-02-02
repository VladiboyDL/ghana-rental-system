import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, formatCurrency } from '../../utils/theme';
import { RootStackParamList, Payment } from '../../types';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PaymentsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  const isLandlord = user?.role === 'LANDLORD';

  const fetchPayments = async () => {
    try {
      const response = await api.payments.getAll();
      console.log('Payments API response:', JSON.stringify(response, null, 2));
      if (response.data && response.data.length > 0) {
        console.log('First payment grossAmount:', response.data[0].grossAmount, 'type:', typeof response.data[0].grossAmount);
      }
      setPayments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const getFilteredPayments = () => {
    if (filter === 'ALL') return payments;
    if (filter === 'PENDING') return payments.filter((p) => p.status === 'PENDING');
    if (filter === 'COMPLETED') return payments.filter((p) => p.status === 'COMPLETED');
    return payments;
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

  const renderPayment = ({ item }: { item: Payment }) => {
    const isPending = item.status === 'PENDING';

    return (
      <TouchableOpacity
        style={styles.paymentCard}
        onPress={() => navigation.navigate('PaymentDetails', { paymentId: item.id })}
      >
        <View style={styles.paymentHeader}>
          <View style={styles.paymentIcon}>
            <Ionicons
              name={item.status === 'COMPLETED' ? 'checkmark-circle' : 'time'}
              size={24}
              color={getStatusColor(item.status)}
            />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentRef}>{item.paymentReference}</Text>
            <Text style={styles.paymentPeriod}>
              {new Date(item.periodStart).toLocaleDateString('en-GH', {
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.paymentAmount}>
            <Text style={styles.grossAmount}>{formatCurrency(item.grossAmount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        {item.status === 'COMPLETED' && (
          <View style={styles.paymentDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tax</Text>
              <Text style={styles.detailValue}>-{formatCurrency(item.taxAmount)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Net</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.netAmount)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Method</Text>
              <Text style={styles.detailValue}>{item.paymentMethod}</Text>
            </View>
          </View>
        )}

        {isPending && !isLandlord && (
          <TouchableOpacity
            style={styles.payNowButton}
            onPress={() => navigation.navigate('MakePayment', { contractId: item.contractId, paymentId: item.id })}
          >
            <Text style={styles.payNowText}>Pay Now</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.textOnPrimary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Calculate summary stats
  const completedPayments = payments.filter((p) => p.status === 'COMPLETED');
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.grossAmount, 0);
  const totalTax = completedPayments.reduce((sum, p) => sum + p.taxAmount, 0);
  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const filteredPayments = getFilteredPayments();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{isLandlord ? 'Total Received' : 'Total Paid'}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalPaid)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Tax {isLandlord ? 'Withheld' : 'Contributed'}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalTax)}</Text>
        </View>
      </View>

      {/* Pending Alert */}
      {pendingCount > 0 && !isLandlord && (
        <TouchableOpacity
          style={styles.pendingAlert}
          onPress={() => setFilter('PENDING')}
        >
          <Ionicons name="alert-circle" size={20} color={colors.warning} />
          <Text style={styles.pendingAlertText}>
            {pendingCount} payment{pendingCount > 1 ? 's' : ''} due
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.warning} />
        </TouchableOpacity>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['ALL', 'PENDING', 'COMPLETED'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payments List */}
      {filteredPayments.length > 0 ? (
        <FlatList
          data={filteredPayments}
          renderItem={renderPayment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="wallet-outline" size={64} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No Payments</Text>
          <Text style={styles.emptyDescription}>
            {filter === 'ALL'
              ? 'Payment history will appear here'
              : `No ${filter.toLowerCase()} payments found`}
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
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingTop: 0,
    marginTop: -spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.xs,
  },
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: 8,
  },
  pendingAlertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.warning,
    marginLeft: spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textLight,
  },
  filterTabTextActive: {
    color: colors.textOnPrimary,
  },
  listContent: {
    padding: spacing.md,
  },
  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    marginRight: spacing.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentRef: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  paymentPeriod: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  grossAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  paymentDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  detailItem: {
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
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  payNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textOnPrimary,
    marginRight: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});
