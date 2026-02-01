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
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList, Contract } from '../../types';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ContractDetailsRouteProp = RouteProp<RootStackParamList, 'ContractDetails'>;

export default function ContractDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ContractDetailsRouteProp>();
  const { contractId } = route.params;
  const { user } = useAuthStore();

  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLandlord = user?.role === 'LANDLORD';

  useEffect(() => {
    fetchContractDetails();
  }, [contractId]);

  const fetchContractDetails = async () => {
    try {
      const response = await api.contracts.getById(contractId);
      setContract(response.data);
    } catch (error) {
      console.error('Failed to fetch contract:', error);
      Alert.alert('Error', 'Failed to load contract details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!contract) {
    return null;
  }

  const taxRate = contract.taxRate || 0.08;
  const taxAmount = contract.monthlyRent * taxRate;
  const netAmount = contract.monthlyRent - taxAmount;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${getStatusColor(contract.status)}15` }]}>
          <Ionicons
            name={contract.status === 'ACTIVE' ? 'checkmark-circle' : 'time'}
            size={24}
            color={getStatusColor(contract.status)}
          />
          <View style={styles.statusContent}>
            <Text style={[styles.statusText, { color: getStatusColor(contract.status) }]}>
              {formatStatus(contract.status)}
            </Text>
            {contract.status === 'PENDING_TENANT_CONFIRMATION' && (
              <Text style={styles.statusDescription}>
                Waiting for tenant to confirm
              </Text>
            )}
          </View>
        </View>

        {/* Contract Info */}
        <View style={styles.section}>
          <Text style={styles.contractNumber}>{contract.contractNumber}</Text>
          <Text style={styles.contractType}>{contract.contractType} Contract</Text>
        </View>

        {/* Property Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={18} color={colors.textLight} />
              <Text style={styles.infoLabel}>Property Code</Text>
              <Text style={styles.infoValue}>{contract.property?.propertyCode}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={colors.textLight} />
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {contract.property?.neighborhood}, {contract.property?.city}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="map-outline" size={18} color={colors.textLight} />
              <Text style={styles.infoLabel}>Digital Address</Text>
              <Text style={styles.infoValue}>{contract.property?.digitalAddress}</Text>
            </View>
          </View>
        </View>

        {/* Parties Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={styles.partiesRow}>
            <View style={styles.partyCard}>
              <View style={styles.partyIcon}>
                <Ionicons name="business" size={20} color={colors.primary} />
              </View>
              <Text style={styles.partyRole}>Landlord</Text>
              <Text style={styles.partyName}>
                {contract.landlord?.firstName} {contract.landlord?.lastName}
              </Text>
              <Text style={styles.partyPhone}>{contract.landlord?.phone}</Text>
            </View>
            <View style={styles.partyCard}>
              <View style={styles.partyIcon}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
              <Text style={styles.partyRole}>Tenant</Text>
              <Text style={styles.partyName}>
                {contract.tenant?.firstName} {contract.tenant?.lastName}
              </Text>
              <Text style={styles.partyPhone}>{contract.tenant?.phone}</Text>
            </View>
          </View>
        </View>

        {/* Contract Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationCard}>
            <View style={styles.durationItem}>
              <Text style={styles.durationLabel}>Start Date</Text>
              <Text style={styles.durationValue}>
                {new Date(contract.startDate).toLocaleDateString('en-GH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.durationArrow}>
              <Ionicons name="arrow-forward" size={20} color={colors.textLight} />
            </View>
            <View style={styles.durationItem}>
              <Text style={styles.durationLabel}>End Date</Text>
              <Text style={styles.durationValue}>
                {new Date(contract.endDate).toLocaleDateString('en-GH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Financial Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Terms</Text>
          <View style={styles.financialCard}>
            <View style={styles.financialHeader}>
              <Text style={styles.financialTitle}>Monthly Breakdown</Text>
            </View>

            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Gross Rent</Text>
              <Text style={styles.financialValue}>{formatCurrency(contract.monthlyRent)}</Text>
            </View>

            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Withholding Tax ({(taxRate * 100).toFixed(0)}%)</Text>
              <Text style={[styles.financialValue, { color: colors.error }]}>
                -{formatCurrency(taxAmount)}
              </Text>
            </View>

            {contract.serviceCharge > 0 && (
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Service Charge</Text>
                <Text style={styles.financialValue}>+{formatCurrency(contract.serviceCharge)}</Text>
              </View>
            )}

            <View style={[styles.financialRow, styles.financialTotal]}>
              <Text style={styles.financialLabelBold}>
                {isLandlord ? 'Net to Landlord' : 'Total Payment'}
              </Text>
              <Text style={styles.financialValueBold}>
                {formatCurrency(isLandlord ? netAmount : contract.monthlyRent + (contract.serviceCharge || 0))}
              </Text>
            </View>

            {contract.securityDeposit > 0 && (
              <View style={styles.depositRow}>
                <Ionicons name="shield-checkmark" size={18} color={colors.info} />
                <Text style={styles.depositLabel}>Security Deposit</Text>
                <Text style={styles.depositValue}>{formatCurrency(contract.securityDeposit)}</Text>
              </View>
            )}
          </View>

          <View style={styles.paymentInfo}>
            <View style={styles.paymentInfoItem}>
              <Text style={styles.paymentInfoLabel}>Advance Required</Text>
              <Text style={styles.paymentInfoValue}>{contract.advanceMonths} month(s)</Text>
            </View>
            <View style={styles.paymentInfoItem}>
              <Text style={styles.paymentInfoLabel}>Payment Frequency</Text>
              <Text style={styles.paymentInfoValue}>{contract.paymentFrequency}</Text>
            </View>
          </View>
        </View>

        {/* Tax Summary */}
        <View style={styles.section}>
          <View style={styles.taxSummary}>
            <Ionicons name="receipt" size={24} color={colors.primary} />
            <View style={styles.taxSummaryContent}>
              <Text style={styles.taxSummaryTitle}>Total Tax Withheld</Text>
              <Text style={styles.taxSummaryValue}>
                {formatCurrency(contract.totalTaxWithheld || 0)}
              </Text>
              <Text style={styles.taxSummaryDescription}>
                Automatically remitted to Ghana Revenue Authority
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.section, { marginBottom: spacing.xl }]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Payments' })}
          >
            <Ionicons name="wallet" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>View Payments</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          {isLandlord && contract.status === 'ACTIVE' && (
            <TouchableOpacity style={styles.actionButtonSecondary}>
              <Ionicons name="document-text" size={20} color={colors.textLight} />
              <Text style={styles.actionButtonTextSecondary}>Download Contract PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 12,
  },
  statusContent: {
    marginLeft: spacing.sm,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusDescription: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  section: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  contractNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  contractType: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: spacing.sm,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  partiesRow: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
  },
  partyCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  partyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  partyRole: {
    fontSize: 11,
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
    textAlign: 'center',
  },
  partyPhone: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  durationItem: {
    flex: 1,
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 11,
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  durationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  durationArrow: {
    paddingHorizontal: spacing.md,
  },
  financialCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  financialHeader: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  financialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  financialLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  financialValue: {
    fontSize: 14,
    color: colors.text,
  },
  financialTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  financialLabelBold: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  financialValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  depositRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  depositLabel: {
    fontSize: 14,
    color: colors.info,
    marginLeft: spacing.sm,
    flex: 1,
  },
  depositValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.info,
  },
  paymentInfo: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  paymentInfoItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.sm,
  },
  paymentInfoLabel: {
    fontSize: 11,
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  paymentInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  taxSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: spacing.md,
  },
  taxSummaryContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  taxSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  taxSummaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 2,
  },
  taxSummaryDescription: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: spacing.sm,
  },
});
