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
import { Picker } from '@react-native-picker/picker';
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList, Property, ExtractedIdData } from '../../types';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CreateContractRouteProp = RouteProp<RootStackParamList, 'CreateContract'>;

export default function CreateContractScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CreateContractRouteProp>();
  const preselectedPropertyId = route.params?.propertyId;

  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Property Selection
  const [selectedPropertyId, setSelectedPropertyId] = useState(preselectedPropertyId || '');

  // Step 2: Tenant Details (from ID scan or manual)
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantIdData, setTenantIdData] = useState<ExtractedIdData | null>(null);

  // Step 3: Contract Terms
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [serviceCharge, setServiceCharge] = useState('');
  const [advanceMonths, setAdvanceMonths] = useState('2');
  const [paymentFrequency, setPaymentFrequency] = useState('MONTHLY');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await api.properties.getAll();
      // Filter to only show available, verified properties
      const availableProperties = (response.data || []).filter(
        (p: Property) => p.isAvailable && p.status === 'VERIFIED'
      );
      setProperties(availableProperties);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  };

  const handleScanId = () => {
    navigation.navigate('ScanDocument', {
      documentType: 'GHANA_CARD',
      returnScreen: 'CreateContract',
    });
  };

  // Listen for scan results when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if there's scan data in route params
      const scanData = (route.params as any)?.scannedData;
      if (scanData) {
        setTenantIdData(scanData);
        // Clear the param so it doesn't persist
        navigation.setParams({ scannedData: undefined } as any);
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!selectedPropertyId) {
          Alert.alert('Error', 'Please select a property');
          return false;
        }
        break;
      case 2:
        if (!tenantPhone.trim()) {
          Alert.alert('Error', 'Please enter tenant phone number');
          return false;
        }
        break;
      case 3:
        if (!startDate || !endDate || !monthlyRent) {
          Alert.alert('Error', 'Please fill in all required contract terms');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateTax = () => {
    const rent = parseFloat(monthlyRent) || 0;
    return rent * 0.08;
  };

  const calculateNetRent = () => {
    const rent = parseFloat(monthlyRent) || 0;
    return rent - calculateTax();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await api.contracts.create({
        propertyId: selectedPropertyId,
        tenantPhone: tenantPhone.trim(),
        tenantEmail: tenantEmail.trim() || undefined,
        tenantExtractedData: tenantIdData ? JSON.stringify(tenantIdData) : undefined,
        startDate,
        endDate,
        monthlyRent: parseFloat(monthlyRent),
        securityDeposit: securityDeposit ? parseFloat(securityDeposit) : 0,
        serviceCharge: serviceCharge ? parseFloat(serviceCharge) : 0,
        advanceMonths: parseInt(advanceMonths),
        paymentFrequency,
      });

      Alert.alert(
        'Contract Created',
        `Contract ${response.data.contractNumber} has been created.\n\nA confirmation code will be sent to the tenant's phone.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create contract. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Property</Text>
      <Text style={styles.stepDescription}>Choose the property for this rental contract</Text>

      {properties.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>No available properties</Text>
          <Text style={styles.emptySubtext}>
            Add a verified property first to create contracts
          </Text>
        </View>
      ) : (
        <View style={styles.propertyList}>
          {properties.map((property) => (
            <TouchableOpacity
              key={property.id}
              style={[
                styles.propertyCard,
                selectedPropertyId === property.id && styles.propertyCardSelected,
              ]}
              onPress={() => setSelectedPropertyId(property.id)}
            >
              <View style={styles.propertyIcon}>
                <Ionicons name="business" size={24} color={colors.primary} />
              </View>
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyCode}>{property.propertyCode}</Text>
                <Text style={styles.propertyLocation}>
                  {property.neighborhood}, {property.city}
                </Text>
                <Text style={styles.propertyType}>
                  {property.propertyType} • {property.bedrooms} bed • {property.bathrooms} bath
                </Text>
              </View>
              {selectedPropertyId === property.id && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tenant Details</Text>
      <Text style={styles.stepDescription}>Enter or scan tenant information</Text>

      {/* Scan ID Button */}
      <TouchableOpacity style={styles.scanButton} onPress={handleScanId}>
        <View style={styles.scanIcon}>
          <Ionicons name="scan" size={32} color={colors.primary} />
        </View>
        <View style={styles.scanText}>
          <Text style={styles.scanTitle}>Scan Ghana Card</Text>
          <Text style={styles.scanDescription}>
            Automatically extract tenant details from ID
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>

      {/* Scanned Data */}
      {tenantIdData && (
        <View style={styles.scannedData}>
          <View style={styles.scannedHeader}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.scannedTitle}>ID Scanned Successfully</Text>
          </View>
          <View style={styles.scannedItem}>
            <Text style={styles.scannedLabel}>Name</Text>
            <Text style={styles.scannedValue}>{tenantIdData.fullName || 'Not extracted'}</Text>
          </View>
          <View style={styles.scannedItem}>
            <Text style={styles.scannedLabel}>Ghana Card</Text>
            <Text style={styles.scannedValue}>{tenantIdData.ghanaCardNumber || 'Not extracted'}</Text>
          </View>
          <View style={styles.scannedItem}>
            <Text style={styles.scannedLabel}>Date of Birth</Text>
            <Text style={styles.scannedValue}>{tenantIdData.dateOfBirth || 'Not extracted'}</Text>
          </View>
          <Text style={styles.confidenceText}>
            Confidence: {((tenantIdData.confidence || 0) * 100).toFixed(0)}%
          </Text>
        </View>
      )}

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or enter manually</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Tenant Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="+233 24 123 4567"
          placeholderTextColor={colors.textLight}
          value={tenantPhone}
          onChangeText={setTenantPhone}
          keyboardType="phone-pad"
        />
        <Text style={styles.hint}>The tenant will receive a confirmation code via SMS</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Tenant Email (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="tenant@example.com"
          placeholderTextColor={colors.textLight}
          value={tenantEmail}
          onChangeText={setTenantEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Contract Terms</Text>
      <Text style={styles.stepDescription}>Set the rental terms and conditions</Text>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>Start Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textLight}
            value={startDate}
            onChangeText={setStartDate}
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.label}>End Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textLight}
            value={endDate}
            onChangeText={setEndDate}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Monthly Rent (GH₵) *</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor={colors.textLight}
          value={monthlyRent}
          onChangeText={setMonthlyRent}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>Security Deposit (GH₵)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.textLight}
            value={securityDeposit}
            onChangeText={setSecurityDeposit}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.label}>Service Charge (GH₵)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.textLight}
            value={serviceCharge}
            onChangeText={setServiceCharge}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>Advance Months</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={advanceMonths}
              onValueChange={setAdvanceMonths}
              style={styles.picker}
            >
              <Picker.Item label="1 Month" value="1" />
              <Picker.Item label="2 Months" value="2" />
              <Picker.Item label="3 Months" value="3" />
              <Picker.Item label="6 Months" value="6" />
              <Picker.Item label="12 Months" value="12" />
            </Picker>
          </View>
        </View>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.label}>Payment Frequency</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={paymentFrequency}
              onValueChange={setPaymentFrequency}
              style={styles.picker}
            >
              <Picker.Item label="Monthly" value="MONTHLY" />
              <Picker.Item label="Quarterly" value="QUARTERLY" />
              <Picker.Item label="Annually" value="ANNUAL" />
            </Picker>
          </View>
        </View>
      </View>

      {/* Tax Info */}
      <View style={styles.taxInfo}>
        <Text style={styles.taxTitle}>Withholding Tax (8%)</Text>
        <Text style={styles.taxDescription}>
          GRA automatically withholds 8% of rent as income tax
        </Text>
        {monthlyRent && (
          <View style={styles.taxCalculation}>
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>Gross Rent</Text>
              <Text style={styles.taxValue}>GH₵ {parseFloat(monthlyRent).toFixed(2)}</Text>
            </View>
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>Tax (8%)</Text>
              <Text style={[styles.taxValue, { color: colors.error }]}>
                - GH₵ {calculateTax().toFixed(2)}
              </Text>
            </View>
            <View style={[styles.taxRow, styles.taxRowTotal]}>
              <Text style={styles.taxLabelBold}>Net to Landlord</Text>
              <Text style={styles.taxValueBold}>GH₵ {calculateNetRent().toFixed(2)}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review Contract</Text>
      <Text style={styles.stepDescription}>Review all details before creating the contract</Text>

      {/* Property Summary */}
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Property</Text>
        {selectedProperty && (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewValue}>{selectedProperty.propertyCode}</Text>
            <Text style={styles.reviewSubvalue}>
              {selectedProperty.neighborhood}, {selectedProperty.city}
            </Text>
          </View>
        )}
      </View>

      {/* Tenant Summary */}
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Tenant</Text>
        <View style={styles.reviewCard}>
          {tenantIdData?.fullName && (
            <Text style={styles.reviewValue}>{tenantIdData.fullName}</Text>
          )}
          <Text style={styles.reviewSubvalue}>{tenantPhone}</Text>
          {tenantIdData?.ghanaCardNumber && (
            <Text style={styles.reviewSubvalue}>ID: {tenantIdData.ghanaCardNumber}</Text>
          )}
        </View>
      </View>

      {/* Terms Summary */}
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Contract Terms</Text>
        <View style={styles.reviewCard}>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Duration</Text>
            <Text style={styles.reviewRowValue}>{startDate} to {endDate}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Monthly Rent</Text>
            <Text style={styles.reviewRowValue}>GH₵ {parseFloat(monthlyRent).toFixed(2)}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Security Deposit</Text>
            <Text style={styles.reviewRowValue}>
              GH₵ {(parseFloat(securityDeposit) || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Advance Required</Text>
            <Text style={styles.reviewRowValue}>{advanceMonths} month(s)</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Tax Withheld (8%)</Text>
            <Text style={[styles.reviewRowValue, { color: colors.error }]}>
              GH₵ {calculateTax().toFixed(2)}/month
            </Text>
          </View>
        </View>
      </View>

      {/* Agreement Notice */}
      <View style={styles.agreementNotice}>
        <Ionicons name="information-circle" size={20} color={colors.info} />
        <Text style={styles.agreementText}>
          The tenant will receive an SMS with a confirmation code. They must confirm the contract within 72 hours.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={styles.progress}>
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <View
                style={[
                  styles.progressDot,
                  step <= currentStep && styles.progressDotActive,
                ]}
              >
                {step < currentStep ? (
                  <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />
                ) : (
                  <Text style={[styles.progressText, step <= currentStep && styles.progressTextActive]}>
                    {step}
                  </Text>
                )}
              </View>
              {step < 4 && (
                <View style={[styles.progressLine, step < currentStep && styles.progressLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, currentStep === 1 && { flex: 1 }]}
          onPress={handleNext}
          disabled={isLoading || (currentStep === 1 && properties.length === 0)}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === 4 ? 'Create Contract' : 'Continue'}
              </Text>
              {currentStep < 4 && <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />}
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
  scrollView: {
    flex: 1,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  progressTextActive: {
    color: colors.textOnPrimary,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  stepContent: {
    padding: spacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  propertyList: {
    marginTop: spacing.sm,
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  propertyCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  propertyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  propertyLocation: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  propertyType: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
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
    marginBottom: spacing.lg,
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
  scanText: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  scanDescription: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  scannedData: {
    backgroundColor: `${colors.success}10`,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success,
  },
  scannedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scannedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    marginLeft: spacing.xs,
  },
  scannedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  scannedLabel: {
    fontSize: 13,
    color: colors.textLight,
  },
  scannedValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  confidenceText: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textLight,
    marginHorizontal: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  taxInfo: {
    backgroundColor: `${colors.warning}10`,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  taxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  taxDescription: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  taxCalculation: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  taxRowTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
  taxLabel: {
    fontSize: 13,
    color: colors.textLight,
  },
  taxValue: {
    fontSize: 13,
    color: colors.text,
  },
  taxLabelBold: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  taxValueBold: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  reviewSection: {
    marginBottom: spacing.lg,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  reviewValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  reviewSubvalue: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  reviewLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  reviewRowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  agreementNotice: {
    flexDirection: 'row',
    backgroundColor: `${colors.info}15`,
    borderRadius: 12,
    padding: spacing.md,
  },
  agreementText: {
    flex: 1,
    fontSize: 13,
    color: colors.info,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
});
