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
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList, Contract } from '../../types';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ContractsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'EXPIRED'>('ALL');

  const isLandlord = user?.role === 'LANDLORD';

  const fetchContracts = async () => {
    try {
      const response = await api.contracts.getAll();
      setContracts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchContracts();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchContracts();
  };

  const getFilteredContracts = () => {
    if (filter === 'ALL') return contracts;
    if (filter === 'ACTIVE') return contracts.filter((c) => c.status === 'ACTIVE');
    if (filter === 'PENDING')
      return contracts.filter((c) =>
        ['DRAFT', 'PENDING_TENANT_CONFIRMATION', 'PENDING_SIGNATURE'].includes(c.status)
      );
    if (filter === 'EXPIRED')
      return contracts.filter((c) => ['EXPIRED', 'TERMINATED'].includes(c.status));
    return contracts;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return colors.success;
      case 'DRAFT':
      case 'PENDING_TENANT_CONFIRMATION':
      case 'PENDING_SIGNATURE':
        return colors.warning;
      case 'EXPIRED':
      case 'TERMINATED':
        return colors.error;
      default:
        return colors.textLight;
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  const formatCurrency = (amount: number) => {
    return `GH₵ ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
  };

  const handleContractPress = (contract: Contract) => {
    if (
      !isLandlord &&
      contract.status === 'PENDING_TENANT_CONFIRMATION'
    ) {
      navigation.navigate('ConfirmContract', { contractId: contract.id });
    } else {
      navigation.navigate('ContractDetails', { contractId: contract.id });
    }
  };

  const renderContract = ({ item }: { item: Contract }) => {
    const otherParty = isLandlord ? item.tenant : item.landlord;
    const isPendingConfirmation = !isLandlord && item.status === 'PENDING_TENANT_CONFIRMATION';

    return (
      <TouchableOpacity
        style={[styles.contractCard, isPendingConfirmation && styles.contractCardHighlight]}
        onPress={() => handleContractPress(item)}
      >
        {isPendingConfirmation && (
          <View style={styles.pendingBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.warning} />
            <Text style={styles.pendingBannerText}>Action Required</Text>
          </View>
        )}

        <View style={styles.contractHeader}>
          <Text style={styles.contractNumber}>{item.contractNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {formatStatus(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.propertyInfo}>
          <Ionicons name="location-outline" size={16} color={colors.textLight} />
          <Text style={styles.propertyText}>
            {item.property?.neighborhood}, {item.property?.city}
          </Text>
        </View>

        <View style={styles.contractDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{isLandlord ? 'Tenant' : 'Landlord'}</Text>
            <Text style={styles.detailValue}>
              {otherParty?.firstName} {otherParty?.lastName}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Monthly Rent</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.monthlyRent)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Period</Text>
            <Text style={styles.detailValue}>
              {new Date(item.startDate).toLocaleDateString('en-GH', { month: 'short', year: '2-digit' })}
              {' - '}
              {new Date(item.endDate).toLocaleDateString('en-GH', { month: 'short', year: '2-digit' })}
            </Text>
          </View>
        </View>

        {isPendingConfirmation && (
          <View style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Tap to Confirm</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const filteredContracts = getFilteredContracts();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Contracts</Text>
        {isLandlord && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateContract', {})}
          >
            <Ionicons name="add" size={24} color={colors.textOnPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollableFilters
          filter={filter}
          setFilter={setFilter}
          counts={{
            ALL: contracts.length,
            ACTIVE: contracts.filter((c) => c.status === 'ACTIVE').length,
            PENDING: contracts.filter((c) =>
              ['DRAFT', 'PENDING_TENANT_CONFIRMATION', 'PENDING_SIGNATURE'].includes(c.status)
            ).length,
            EXPIRED: contracts.filter((c) => ['EXPIRED', 'TERMINATED'].includes(c.status)).length,
          }}
        />
      </View>

      {/* Contracts List */}
      {filteredContracts.length > 0 ? (
        <FlatList
          data={filteredContracts}
          renderItem={renderContract}
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
            <Ionicons name="document-text-outline" size={64} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No Contracts</Text>
          <Text style={styles.emptyDescription}>
            {filter === 'ALL'
              ? isLandlord
                ? 'Create your first rental contract'
                : 'No contracts assigned to you yet'
              : `No ${filter.toLowerCase()} contracts found`}
          </Text>
          {isLandlord && filter === 'ALL' && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('CreateContract', {})}
            >
              <Ionicons name="add" size={20} color={colors.textOnPrimary} />
              <Text style={styles.emptyButtonText}>Create Contract</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function ScrollableFilters({
  filter,
  setFilter,
  counts,
}: {
  filter: string;
  setFilter: (f: any) => void;
  counts: { ALL: number; ACTIVE: number; PENDING: number; EXPIRED: number };
}) {
  const filters: { key: 'ALL' | 'ACTIVE' | 'PENDING' | 'EXPIRED'; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'EXPIRED', label: 'Expired' },
  ];

  return (
    <View style={styles.filterTabs}>
      {filters.map((f) => (
        <TouchableOpacity
          key={f.key}
          style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
          onPress={() => setFilter(f.key)}
        >
          <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
            {f.label}
          </Text>
          {counts[f.key] > 0 && (
            <View style={[styles.filterBadge, filter === f.key && styles.filterBadgeActive]}>
              <Text style={[styles.filterBadgeText, filter === f.key && styles.filterBadgeTextActive]}>
                {counts[f.key]}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.primary,
  },
  filterBadge: {
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  filterBadgeActive: {
    backgroundColor: colors.primary,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textLight,
  },
  filterBadgeTextActive: {
    color: colors.textOnPrimary,
  },
  listContent: {
    padding: spacing.md,
  },
  contractCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  contractCardHighlight: {
    borderWidth: 2,
    borderColor: colors.warning,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  pendingBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 4,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contractNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  propertyText: {
    fontSize: 13,
    color: colors.textLight,
    marginLeft: 4,
  },
  contractDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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
    marginBottom: spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});
