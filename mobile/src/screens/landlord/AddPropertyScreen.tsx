import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList } from '../../types';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'TOWNHOUSE', 'OFFICE', 'SHOP', 'WAREHOUSE', 'STUDIO'];
const PROPERTY_CATEGORIES = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'];
const OWNERSHIP_TYPES = ['FREEHOLD', 'LEASEHOLD'];
const REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Central',
  'Eastern',
  'Northern',
  'Volta',
  'Brong-Ahafo',
  'Upper East',
  'Upper West',
];

export default function AddPropertyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Location
  const [digitalAddress, setDigitalAddress] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  // Property Info
  const [propertyType, setPropertyType] = useState('');
  const [propertyCategory, setPropertyCategory] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [floorArea, setFloorArea] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');

  // Features
  const [isFurnished, setIsFurnished] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasSecurity, setHasSecurity] = useState(false);
  const [hasGenerator, setHasGenerator] = useState(false);

  // Ownership
  const [ownershipType, setOwnershipType] = useState('');

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!digitalAddress.trim() || !region || !district.trim()) {
          Alert.alert('Error', 'Please fill in all required location fields');
          return false;
        }
        break;
      case 2:
        if (!propertyType || !propertyCategory) {
          Alert.alert('Error', 'Please select property type and category');
          return false;
        }
        break;
      case 3:
        if (!ownershipType) {
          Alert.alert('Error', 'Please select ownership type');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < 3) {
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

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await api.properties.create({
        digitalAddress: digitalAddress.trim().toUpperCase(),
        region,
        district: district.trim(),
        city: city.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        propertyType,
        propertyCategory,
        bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
        bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
        floorAreaSqm: floorArea ? parseFloat(floorArea) : undefined,
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : undefined,
        isFurnished,
        hasParking,
        hasSecurity,
        hasGenerator,
        ownershipType,
      });

      Alert.alert(
        'Success',
        'Property added successfully! It will be reviewed and verified shortly.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to add property. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Property Location</Text>
      <Text style={styles.stepDescription}>Enter the location details of your property</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Digital Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., GA-123-4567"
          placeholderTextColor={colors.textLight}
          value={digitalAddress}
          onChangeText={setDigitalAddress}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Region *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {REGIONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, region === r && styles.chipSelected]}
              onPress={() => setRegion(r)}
            >
              <Text style={[styles.chipText, region === r && styles.chipTextSelected]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>District *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Accra Metropolitan"
          placeholderTextColor={colors.textLight}
          value={district}
          onChangeText={setDistrict}
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Accra"
            placeholderTextColor={colors.textLight}
            value={city}
            onChangeText={setCity}
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.label}>Neighborhood</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., East Legon"
            placeholderTextColor={colors.textLight}
            value={neighborhood}
            onChangeText={setNeighborhood}
          />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Property Details</Text>
      <Text style={styles.stepDescription}>Describe your property</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Property Type *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {PROPERTY_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, propertyType === type && styles.chipSelected]}
              onPress={() => setPropertyType(type)}
            >
              <Text style={[styles.chipText, propertyType === type && styles.chipTextSelected]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category *</Text>
        <View style={styles.chipRow}>
          {PROPERTY_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, propertyCategory === cat && styles.chipSelected]}
              onPress={() => setPropertyCategory(cat)}
            >
              <Text style={[styles.chipText, propertyCategory === cat && styles.chipTextSelected]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>Bedrooms</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.textLight}
            value={bedrooms}
            onChangeText={setBedrooms}
            keyboardType="number-pad"
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.label}>Bathrooms</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.textLight}
            value={bathrooms}
            onChangeText={setBathrooms}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>Floor Area (sqm)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.textLight}
            value={floorArea}
            onChangeText={setFloorArea}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.label}>Year Built</Text>
          <TextInput
            style={styles.input}
            placeholder="2020"
            placeholderTextColor={colors.textLight}
            value={yearBuilt}
            onChangeText={setYearBuilt}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
      </View>

      <Text style={styles.label}>Features</Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Furnished</Text>
        <Switch
          value={isFurnished}
          onValueChange={setIsFurnished}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Parking Available</Text>
        <Switch
          value={hasParking}
          onValueChange={setHasParking}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Security</Text>
        <Switch
          value={hasSecurity}
          onValueChange={setHasSecurity}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Generator/Backup Power</Text>
        <Switch
          value={hasGenerator}
          onValueChange={setHasGenerator}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Ownership Details</Text>
      <Text style={styles.stepDescription}>Provide ownership information</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Ownership Type *</Text>
        <View style={styles.chipRow}>
          {OWNERSHIP_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, ownershipType === type && styles.chipSelected, { flex: 1 }]}
              onPress={() => setOwnershipType(type)}
            >
              <Text style={[styles.chipText, ownershipType === type && styles.chipTextSelected]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={colors.info} />
        <Text style={styles.infoText}>
          Your property will be submitted for verification. A GRA inspector may contact you to verify ownership documents.
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Property Summary</Text>
        <SummaryItem label="Digital Address" value={digitalAddress.toUpperCase()} />
        <SummaryItem label="Location" value={`${neighborhood || city}, ${region}`} />
        <SummaryItem label="Type" value={`${propertyType} - ${propertyCategory}`} />
        {bedrooms && <SummaryItem label="Bedrooms" value={bedrooms} />}
        {bathrooms && <SummaryItem label="Bathrooms" value={bathrooms} />}
        <SummaryItem label="Ownership" value={ownershipType} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={styles.progress}>
          {[1, 2, 3].map((step) => (
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
              {step < 3 && (
                <View style={[styles.progressLine, step < currentStep && styles.progressLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
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
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === 3 ? 'Add Property' : 'Continue'}
              </Text>
              {currentStep < 3 && <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
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
  inputRow: {
    flexDirection: 'row',
  },
  chipScroll: {
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
  },
  chipTextSelected: {
    color: colors.textOnPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  switchLabel: {
    fontSize: 14,
    color: colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${colors.info}15`,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.info,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
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
