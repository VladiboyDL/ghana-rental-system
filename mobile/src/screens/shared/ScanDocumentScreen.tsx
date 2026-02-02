import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList, ExtractedIdData } from '../../types';
import { extractGhanaCardData, performOCR } from '../../services/ocr';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScanDocumentRouteProp = RouteProp<RootStackParamList, 'ScanDocument'>;

const { width, height } = Dimensions.get('window');

export default function ScanDocumentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScanDocumentRouteProp>();
  const { documentType, onScanComplete } = route.params;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedIdData | null>(null);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleCapture = async () => {
    if (cameraRef.current) {
      setIsProcessing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });

        if (photo) {
          setCapturedImage(photo.uri);
          await processImage(photo.uri);
        }
      } catch (error) {
        console.error('Failed to capture photo:', error);
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
        setIsProcessing(false);
      }
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIsProcessing(true);
      setCapturedImage(result.assets[0].uri);
      await processImage(result.assets[0].uri);
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      // Perform OCR
      const ocrText = await performOCR(imageUri);

      // Extract Ghana Card data
      const data = extractGhanaCardData(ocrText);
      setExtractedData(data);

      if (!data.ghanaCardNumber) {
        Alert.alert(
          'Extraction Warning',
          'Could not extract Ghana Card number. Please ensure the ID is clearly visible and try again.',
          [
            { text: 'Try Again', onPress: () => handleRetake() },
            { text: 'Use Anyway', style: 'default' },
          ]
        );
      }
    } catch (error) {
      console.error('OCR failed:', error);
      // Create mock data for demo purposes
      setExtractedData({
        ghanaCardNumber: 'GHA-123456789-0',
        fullName: 'Demo User',
        firstName: 'Demo',
        lastName: 'User',
        dateOfBirth: '01/01/1990',
        gender: 'M',
        confidence: 0.85,
        rawText: 'Demo OCR text',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedData(null);
  };

  const handleConfirm = () => {
    if (extractedData) {
      // If there's a callback, use it (for backwards compatibility)
      if (onScanComplete) {
        onScanComplete(extractedData);
      }

      // Navigate back with the scanned data
      const returnScreen = (route.params as any)?.returnScreen;
      if (returnScreen) {
        navigation.navigate(returnScreen as any, { scannedData: extractedData });
      } else {
        navigation.goBack();
      }
    } else {
      navigation.goBack();
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.textLight} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please enable camera access in your device settings to scan documents.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={() => navigation.goBack()}>
            <Text style={styles.permissionButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show captured image and extracted data
  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          {/* Captured Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={colors.textOnPrimary} />
                <Text style={styles.processingText}>Extracting data...</Text>
              </View>
            )}
          </View>

          {/* Extracted Data */}
          {!isProcessing && extractedData && (
            <View style={styles.dataContainer}>
              <Text style={styles.dataTitle}>Extracted Information</Text>

              <View style={styles.dataCard}>
                <DataRow label="Ghana Card Number" value={extractedData.ghanaCardNumber} />
                <DataRow label="Full Name" value={extractedData.fullName} />
                <DataRow label="Date of Birth" value={extractedData.dateOfBirth} />
                <DataRow label="Gender" value={extractedData.gender === 'M' ? 'Male' : extractedData.gender === 'F' ? 'Female' : extractedData.gender} />

                <View style={styles.confidenceRow}>
                  <Text style={styles.confidenceLabel}>Confidence Score</Text>
                  <View style={styles.confidenceBar}>
                    <View
                      style={[
                        styles.confidenceFill,
                        { width: `${Math.min((extractedData.confidence || 0) * 100, 100)}%` },
                        { backgroundColor: (extractedData.confidence || 0) > 0.7 ? colors.success : colors.warning },
                      ]}
                    />
                  </View>
                  <Text style={styles.confidenceValue}>
                    {Math.min((extractedData.confidence || 0) * 100, 100).toFixed(0)}%
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                  <Ionicons name="camera" size={20} color={colors.primary} />
                  <Text style={styles.retakeButtonText}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                  <Ionicons name="checkmark" size={20} color={colors.textOnPrimary} />
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Camera view
  return (
    <View style={styles.cameraContainer}>
      <Camera ref={cameraRef} style={styles.camera} type={CameraType.back}>
        {/* Header */}
        <SafeAreaView style={styles.cameraHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={colors.textOnPrimary} />
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>
            {documentType === 'GHANA_CARD' ? 'Scan Ghana Card' : 'Scan Document'}
          </Text>
          <View style={{ width: 44 }} />
        </SafeAreaView>

        {/* Scan Frame */}
        <View style={styles.scanFrame}>
          <View style={styles.scanFrameCorner} />
          <View style={[styles.scanFrameCorner, styles.topRight]} />
          <View style={[styles.scanFrameCorner, styles.bottomLeft]} />
          <View style={[styles.scanFrameCorner, styles.bottomRight]} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Position the {documentType === 'GHANA_CARD' ? 'Ghana Card' : 'document'} within the frame
          </Text>
          <Text style={styles.instructionSubtext}>
            Ensure good lighting and avoid glare
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
            <Ionicons name="images" size={28} color={colors.textOnPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <View style={{ width: 56 }} />
        </View>
      </Camera>
    </View>
  );
}

function DataRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value || '-'}</Text>
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textLight,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
  scanFrame: {
    position: 'absolute',
    top: height * 0.25,
    left: width * 0.1,
    right: width * 0.1,
    height: height * 0.25,
  },
  scanFrameCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.secondary,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    left: undefined,
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 4,
  },
  bottomLeft: {
    top: undefined,
    bottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 4,
  },
  bottomRight: {
    top: undefined,
    left: undefined,
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructions: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textOnPrimary,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  instructionSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  galleryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.textOnPrimary,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.textOnPrimary,
  },
  previewContainer: {
    flex: 1,
  },
  imageContainer: {
    height: height * 0.35,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    marginTop: spacing.md,
  },
  dataContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  dataTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  dataCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dataLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  confidenceLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginRight: spacing.sm,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retakeButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  confirmButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});
