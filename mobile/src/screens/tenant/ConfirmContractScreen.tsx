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
import { RootStackParamList, Contract, ExtractedIdData } from '../../types';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ConfirmContractRouteProp = RouteProp<RootStackParamList, 'ConfirmContract'>;

export default function ConfirmContractScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ConfirmContractRouteProp>();
  const { contractId } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [contract, setContract] = useState<Contract | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [idData, setIdData] = useState<ExtractedIdData | null>(null);
  const [hasScannedId, setHasScannedId] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);

  useEffect(() => {
    fetchContractDetails();
  }, [contractId]);

  // Listen for scan results when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if there's scan data in route params
      const scanData = (route.params as any)?.scannedData;
      if (scanData) {
        setIdData(scanData);
        setHasScannedId(true);
        // Clear the param so it doesn't persist
        navigation.setParams({ scannedData: undefined } as any);
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

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

  const handleScanId = () => {
    navigation.navigate('ScanDocument', {
      documentType: 'GHANA_CARD',
      returnScreen: 'ConfirmContract',
    });
  };

  const handleSignContract = () => {
    navigation.navigate('SignContract', {
      contractId,
    });
  };

  const handleConfirm = async () => {
    if (!confirmationCode.trim()) {
      Alert.alert('Error', 'Please enter the confirmation code sent to your phone');
      return;
    }

    if (!hasScannedId) {
      Alert.alert('Error', 'Please scan your Ghana Card to verify your identity');
      return;
    }

    if (!hasAgreed) {
      Alert.alert('Error', 'Please agree to the terms and conditions');
      return;
    }

    setIsConfirming(true);
    try {
      await api.contracts.confirm(contractId, {
        confirmationCode: confirmationCode.trim(),
        extractedIdData: idData ? JSON.stringify(idData) : undefined,
      });

      Alert.alert(
        'Contract Confirmed',
        'You have successfully confirmed the rental contract. You can now make payments through the app.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to confirm contract. Please try again.'
      );
    } finally {
      setIsConfirming(false);
    }
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Contract Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contract Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Contract Number</Text>
              <Text style={styles.summaryValue}>{contract.contractNumber}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Property</Text>
              <Text style={styles.summaryValue}>
                {contract.property?.propertyCode}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Location</Text>
              <Text style={styles.summaryValue}>
                {contract.property?.neighborhood}, {contract.property?.city}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Landlord</Text>
              <Text style={styles.summaryValue}>
                {contract.landlord?.firstName} {contract.landlord?.lastName}
              </Text>
            </View>
          </View>
        </View>

        {/* Contract Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Terms</Text>
          <View style={styles.termsCard}>
            <View style={styles.termRow}>
              <View style={styles.termItem}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={styles.termLabel}>Start Date</Text>
                <Text style={styles.termValue}>
                  {new Date(contract.startDate).toLocaleDateString('en-GH')}
                </Text>
              </View>
              <View style={styles.termItem}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={styles.termLabel}>End Date</Text>
                <Text style={styles.termValue}>
                  {new Date(contract.endDate).toLocaleDateString('en-GH')}
                </Text>
              </View>
            </View>

            <View style={styles.rentBreakdown}>
              <Text style={styles.breakdownTitle}>Monthly Payment Breakdown</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Gross Rent</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(contract.monthlyRent)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Withholding Tax (8%)</Text>
                <Text style={[styles.breakdownValue, { color: colors.error }]}>
                  -{formatCurrency(contract.monthlyRent * 0.08)}
                </Text>
              </View>
              {contract.serviceCharge > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Service Charge</Text>
                  <Text style={styles.breakdownValue}>{formatCurrency(contract.serviceCharge)}</Text>
                </View>
              )}
              <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                <Text style={styles.breakdownLabelBold}>Total Monthly</Text>
                <Text style={styles.breakdownValueBold}>
                  {formatCurrency(contract.monthlyRent + (contract.serviceCharge || 0))}
                </Text>
              </View>
            </View>

            {contract.securityDeposit > 0 && (
              <View style={styles.depositInfo}>
                <Ionicons name="shield-checkmark" size={20} color={colors.info} />
                <Text style={styles.depositText}>
                  Security Deposit: {formatCurrency(contract.securityDeposit)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ID Verification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity Verification</Text>
          <TouchableOpacity
            style={[styles.scanButton, hasScannedId && styles.scanButtonComplete]}
            onPress={handleScanId}
          >
            <View style={styles.scanIcon}>
              <Ionicons
                name={hasScannedId ? 'checkmark-circle' : 'scan'}
                size={32}
                color={hasScannedId ? colors.success : colors.primary}
              />
            </View>
            <View style={styles.scanContent}>
              <Text style={[styles.scanTitle, hasScannedId && { color: colors.success }]}>
                {hasScannedId ? 'ID Verified' : 'Scan Your Ghana Card'}
              </Text>
              {hasScannedId && idData ? (
                <Text style={styles.scanDetail}>
                  {idData.fullName} • {idData.ghanaCardNumber}
                </Text>
              ) : (
                <Text style={styles.scanDescription}>
                  Required to confirm your identity
                </Text>
              )}
            </View>
            {!hasScannedId && <Ionicons name="chevron-forward" size={20} color={colors.textLight} />}
          </TouchableOpacity>
        </View>

        {/* Confirmation Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confirmation Code</Text>
          <Text style={styles.codeDescription}>
            Enter the 6-digit code sent to your phone number
          </Text>
          <TextInput
            style={styles.codeInput}
            placeholder="Enter code"
            placeholderTextColor={colors.textLight}
            value={confirmationCode}
            onChangeText={setConfirmationCode}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        {/* Digital Signature */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signButton} onPress={handleSignContract}>
            <Ionicons name="create" size={24} color={colors.primary} />
            <Text style={styles.signText}>Add Digital Signature</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Agreement */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.agreementRow}
            onPress={() => setHasAgreed(!hasAgreed)}
          >
            <View style={[styles.checkbox, hasAgreed && styles.checkboxChecked]}>
              {hasAgreed && <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />}
            </View>
            <Text style={styles.agreementText}>
              I have read and agree to the terms of this rental contract. I understand that 8% of my rent will be withheld as income tax and remitted to GRA.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tax Notice */}
        <View style={styles.taxNotice}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={styles.taxNoticeText}>
            The Ghana Revenue Authority will automatically receive 8% of your rent payments as withholding tax on behalf of your landlord.
          </Text>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, (!hasAgreed || !hasScannedId) && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={isConfirming || !hasAgreed || !hasScannedId}
        >
          {isConfirming ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={colors.textOnPrimary} />
              <Text style={styles.confirmButtonText}>Confirm Contract</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  section: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  termsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  termItem: {
    flex: 1,
    alignItems: 'center',
  },
  termLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  termValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  rentBreakdown: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  breakdownLabel: {
    fontSize: 13,
    color: colors.textLight,
  },
  breakdownValue: {
    fontSize: 13,
    color: colors.text,
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  breakdownLabelBold: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  breakdownValueBold: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  depositInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: `${colors.info}15`,
    borderRadius: 8,
  },
  depositText: {
    fontSize: 13,
    color: colors.info,
    marginLeft: spacing.sm,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  scanButtonComplete: {
    backgroundColor: `${colors.success}10`,
    borderColor: colors.success,
    borderStyle: 'solid',
  },
  scanIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  scanContent: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  scanDetail: {
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  scanDescription: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  codeDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  codeInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 8,
  },
  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  signText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  agreementText: {
    flex: 1,
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
  },
  taxNotice: {
    flexDirection: 'row',
    backgroundColor: `${colors.info}15`,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
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
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  confirmButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
