import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList, Property } from '../../types';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PropertiesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProperties = async () => {
    try {
      const response = await api.properties.getAll();
      setProperties(response.data || []);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProperties();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
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

  const renderProperty = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => navigation.navigate('PropertyDetails', { propertyId: item.id })}
    >
      {/* Property Image */}
      <View style={styles.imageContainer}>
        {item.photos && item.photos.length > 0 ? (
          <Image source={{ uri: item.photos[0] }} style={styles.propertyImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="business" size={40} color={colors.textLight} />
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
        {!item.isAvailable && (
          <View style={styles.occupiedBadge}>
            <Text style={styles.occupiedText}>OCCUPIED</Text>
          </View>
        )}
      </View>

      {/* Property Details */}
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyCode}>{item.propertyCode}</Text>
        <Text style={styles.propertyType}>
          {item.propertyType} • {item.propertyCategory}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textLight} />
          <Text style={styles.locationText}>
            {item.neighborhood}, {item.city}
          </Text>
        </View>

        <View style={styles.detailsRow}>
          {item.bedrooms !== null && (
            <View style={styles.detailItem}>
              <Ionicons name="bed-outline" size={16} color={colors.primary} />
              <Text style={styles.detailText}>{item.bedrooms} bed</Text>
            </View>
          )}
          {item.bathrooms !== null && (
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={16} color={colors.primary} />
              <Text style={styles.detailText}>{item.bathrooms} bath</Text>
            </View>
          )}
          {item.floorAreaSqm && (
            <View style={styles.detailItem}>
              <Ionicons name="resize-outline" size={16} color={colors.primary} />
              <Text style={styles.detailText}>{item.floorAreaSqm} sqm</Text>
            </View>
          )}
        </View>

        <View style={styles.featuresRow}>
          {item.isFurnished && (
            <View style={styles.featureBadge}>
              <Text style={styles.featureText}>Furnished</Text>
            </View>
          )}
          {item.hasParking && (
            <View style={styles.featureBadge}>
              <Text style={styles.featureText}>Parking</Text>
            </View>
          )}
          {item.hasSecurity && (
            <View style={styles.featureBadge}>
              <Text style={styles.featureText}>Security</Text>
            </View>
          )}
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} style={styles.arrow} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Properties</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProperty')}
        >
          <Ionicons name="add" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      {/* Properties List */}
      {properties.length > 0 ? (
        <FlatList
          data={properties}
          renderItem={renderProperty}
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
            <Ionicons name="business-outline" size={64} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No Properties Yet</Text>
          <Text style={styles.emptyDescription}>
            Add your first property to start creating rental contracts
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('AddProperty')}
          >
            <Ionicons name="add" size={20} color={colors.textOnPrimary} />
            <Text style={styles.emptyButtonText}>Add Property</Text>
          </TouchableOpacity>
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
  listContent: {
    padding: spacing.md,
  },
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 120,
    height: 140,
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textOnPrimary,
    textTransform: 'uppercase',
  },
  occupiedBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  occupiedText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  propertyInfo: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  propertyCode: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  propertyType: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  locationText: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  detailText: {
    fontSize: 11,
    color: colors.text,
    marginLeft: 2,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  featureBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: '500',
  },
  arrow: {
    alignSelf: 'center',
    marginRight: spacing.sm,
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
