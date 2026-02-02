import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, formatCurrency } from '../../utils/theme';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface TaxCertificate {
  id: string;
  year: number;
  quarter?: number;
  certificateNumber: string;
  totalRentCollected: number;
  totalTaxWithheld: number;
  status: 'GENERATED' | 'VERIFIED' | 'PENDING';
  generatedAt: string;
  downloadUrl?: string;
}

// Mock data for tax certificates
const MOCK_CERTIFICATES: TaxCertificate[] = [
  {
    id: '1',
    year: 2025,
    certificateNumber: 'GRA-TC-2025-001234',
    totalRentCollected: 42000,
    totalTaxWithheld: 3360,
    status: 'VERIFIED',
    generatedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '2',
    year: 2025,
    quarter: 4,
    certificateNumber: 'GRA-TC-2025-Q4-001234',
    totalRentCollected: 10500,
    totalTaxWithheld: 840,
    status: 'VERIFIED',
    generatedAt: '2026-01-05T10:00:00Z',
  },
  {
    id: '3',
    year: 2025,
    quarter: 3,
    certificateNumber: 'GRA-TC-2025-Q3-001234',
    totalRentCollected: 10500,
    totalTaxWithheld: 840,
    status: 'VERIFIED',
    generatedAt: '2025-10-05T10:00:00Z',
  },
  {
    id: '4',
    year: 2025,
    quarter: 2,
    certificateNumber: 'GRA-TC-2025-Q2-001234',
    totalRentCollected: 10500,
    totalTaxWithheld: 840,
    status: 'VERIFIED',
    generatedAt: '2025-07-05T10:00:00Z',
  },
  {
    id: '5',
    year: 2025,
    quarter: 1,
    certificateNumber: 'GRA-TC-2025-Q1-001234',
    totalRentCollected: 10500,
    totalTaxWithheld: 840,
    status: 'VERIFIED',
    generatedAt: '2025-04-05T10:00:00Z',
  },
  {
    id: '6',
    year: 2024,
    certificateNumber: 'GRA-TC-2024-001234',
    totalRentCollected: 36000,
    totalTaxWithheld: 2880,
    status: 'VERIFIED',
    generatedAt: '2025-01-15T10:00:00Z',
  },
];

export default function TaxCertificatesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const [certificates, setCertificates] = useState<TaxCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isLandlord = user?.role === 'LANDLORD';

  const fetchCertificates = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCertificates(MOCK_CERTIFICATES);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCertificates();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCertificates();
  };

  const handleDownload = (certificate: TaxCertificate) => {
    Alert.alert(
      'Download Certificate',
      `Download ${certificate.certificateNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            Alert.alert('Success', 'Certificate downloaded successfully');
          },
        },
      ]
    );
  };

  const handleShare = async (certificate: TaxCertificate) => {
    try {
      await Share.share({
        message: `Tax Withholding Certificate\n\nCertificate Number: ${certificate.certificateNumber}\nYear: ${certificate.year}${certificate.quarter ? ` Q${certificate.quarter}` : ''}\nTotal Tax Withheld: ${formatCurrency(certificate.totalTaxWithheld)}\n\nIssued by Ghana Revenue Authority`,
        title: `Tax Certificate ${certificate.certificateNumber}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return colors.success;
      case 'GENERATED':
        return colors.warning;
      case 'PENDING':
        return colors.textLight;
      default:
        return colors.textLight;
    }
  };

  const renderCertificate = ({ item }: { item: TaxCertificate }) => (
    <View style={styles.certificateCard}>
      <View style={styles.certificateHeader}>
        <View style={styles.certificateIcon}>
          <Ionicons name="document-text" size={24} color={colors.primary} />
        </View>
        <View style={styles.certificateInfo}>
          <Text style={styles.certificateTitle}>
            {item.quarter ? `Q${item.quarter} ${item.year}` : `Annual ${item.year}`}
          </Text>
          <Text style={styles.certificateNumber}>{item.certificateNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.certificateDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Rent {isLandlord ? 'Received' : 'Paid'}</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.totalRentCollected)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tax {isLandlord ? 'Withheld' : 'Contributed'}</Text>
          <Text style={[styles.detailValue, { color: colors.primary }]}>
            {formatCurrency(item.totalTaxWithheld)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Generated</Text>
          <Text style={styles.detailValue}>
            {new Date(item.generatedAt).toLocaleDateString('en-GH', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      </View>

      <View style={styles.certificateActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDownload(item)}
        >
          <Ionicons name="download-outline" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShare(item)}
        >
          <Ionicons name="share-outline" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tax Certificates</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={styles.infoBannerText}>
          {isLandlord
            ? 'These certificates show the tax withheld from your rental income. Use them for your tax filing.'
            : 'These certificates show your contribution to rental income tax through your payments.'}
        </Text>
      </View>

      {/* Certificates List */}
      {certificates.length > 0 ? (
        <FlatList
          data={certificates}
          renderItem={renderCertificate}
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
            <Ionicons name="document-outline" size={64} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No Certificates</Text>
          <Text style={styles.emptyDescription}>
            Tax certificates will appear here after you have completed rental payments.
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.primary}10`,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
  listContent: {
    padding: spacing.md,
  },
  certificateCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  certificateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certificateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  certificateInfo: {
    flex: 1,
  },
  certificateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  certificateNumber: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  certificateDetails: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textLight,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  certificateActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: spacing.xs,
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
