import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList, Property } from '../../types';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PropertyDetailsRouteProp = RouteProp<RootStackParamList, 'PropertyDetails'>;

// Helper to extract photo URL from either string or object format
const getPhotoUrl = (photo: any): string | null => {
  if (!photo) return null;
  if (typeof photo === 'string') return photo;
  if (typeof photo === 'object' && photo.url) return photo.url;
  return null;
};

const { width } = Dimensions.get('window');

export default function PropertyDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PropertyDetailsRouteProp>();
  const { propertyId } = route.params;

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPropertyDetails();
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      const response = await api.properties.getById(propertyId);
      setProperty(response.data);
    } catch (error) {
      console.error('Failed to fetch property details:', error);
      Alert.alert('Error', 'Failed to load property details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContract = () => {
    navigation.navigate('CreateContract', { propertyId: property!.id });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return colors.success;
      case 'PENDING_VERIFICATION':
        return colors.warning;
      case 'REJECTED':
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

  if (!property) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        {/* Property Image */}
        <View style={styles.imageContainer}>
          {property.photos && property.photos.length > 0 && getPhotoUrl(property.photos[0]) ? (
            <Image source={{ uri: getPhotoUrl(property.photos[0])! }} style={styles.propertyImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="business" size={80} color={colors.textLight} />
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(property.status) }]}>
            <Text style={styles.statusText}>{property.status.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* Property Header */}
        <View style={styles.header}>
          <Text style={styles.propertyCode}>{property.propertyCode}</Text>
          <Text style={styles.propertyType}>
            {property.propertyType} • {property.propertyCategory}
          </Text>
          <View style={styles.availabilityBadge}>
            <View style={[styles.availabilityDot, { backgroundColor: property.isAvailable ? colors.success : colors.error }]} />
            <Text style={styles.availabilityText}>
              {property.isAvailable ? 'Available for Rent' : 'Currently Occupied'}
            </Text>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="location" label="Digital Address" value={property.digitalAddress} />
            <InfoRow icon="map" label="Region" value={property.region} />
            <InfoRow icon="business" label="District" value={property.district} />
            <InfoRow icon="home" label="City" value={property.city || '-'} />
            <InfoRow icon="pin" label="Neighborhood" value={property.neighborhood || '-'} />
          </View>
        </View>

        {/* Property Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.detailsGrid}>
            {property.bedrooms != null && (
              <DetailCard icon="bed" label="Bedrooms" value={String(property.bedrooms)} />
            )}
            {property.bathrooms != null && (
              <DetailCard icon="water" label="Bathrooms" value={String(property.bathrooms)} />
            )}
            {property.floorAreaSqm && (
              <DetailCard icon="resize" label="Floor Area" value={`${property.floorAreaSqm} sqm`} />
            )}
            {property.yearBuilt && (
              <DetailCard icon="calendar" label="Year Built" value={property.yearBuilt.toString()} />
            )}
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features & Amenities</Text>
          <View style={styles.featuresGrid}>
            <FeatureItem icon="sofa" label="Furnished" enabled={property.isFurnished} />
            <FeatureItem icon="car" label="Parking" enabled={property.hasParking} />
            <FeatureItem icon="shield-checkmark" label="Security" enabled={property.hasSecurity} />
            <FeatureItem icon="flash" label="Generator" enabled={property.hasGenerator} />
          </View>
        </View>

        {/* Ownership */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ownership</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="document" label="Ownership Type" value={property.ownershipType} />
            <InfoRow
              icon="checkmark-circle"
              label="Verified"
              value={property.ownershipVerified ? 'Yes' : 'No'}
              valueColor={property.ownershipVerified ? colors.success : colors.warning}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {property.isAvailable && property.status === 'VERIFIED' && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleCreateContract}>
              <Ionicons name="document-text" size={20} color={colors.textOnPrimary} />
              <Text style={styles.primaryButtonText}>Create Contract</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="create" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Edit Property</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, valueColor }: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        <Ionicons name={`${icon}-outline` as any} size={18} color={colors.textLight} />
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    </View>
  );
}

function DetailCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailCard}>
      <Ionicons name={`${icon}-outline` as any} size={24} color={colors.primary} />
      <Text style={styles.detailValue}>{value}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
  );
}

function FeatureItem({ icon, label, enabled }: { icon: string; label: string; enabled: boolean }) {
  return (
    <View style={[styles.featureItem, !enabled && styles.featureItemDisabled]}>
      <Ionicons
        name={`${icon}-outline` as any}
        size={24}
        color={enabled ? colors.primary : colors.textLight}
      />
      <Text style={[styles.featureLabel, !enabled && styles.featureLabelDisabled]}>{label}</Text>
      <Ionicons
        name={enabled ? 'checkmark-circle' : 'close-circle'}
        size={16}
        color={enabled ? colors.success : colors.textLight}
      />
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
  imageContainer: {
    width: width,
    height: 220,
    position: 'relative',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textOnPrimary,
    textTransform: 'uppercase',
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  propertyCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  propertyType: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
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
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabelText: {
    fontSize: 14,
    color: colors.textLight,
    marginLeft: spacing.sm,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  detailCard: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.xs,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  featureItem: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  featureItemDisabled: {
    opacity: 0.5,
  },
  featureLabel: {
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  featureLabelDisabled: {
    color: colors.textLight,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
