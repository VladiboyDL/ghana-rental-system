import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList } from '../../types';
import api from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SignContractRouteProp = RouteProp<RootStackParamList, 'SignContract'>;

export default function SignContractScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SignContractRouteProp>();
  const { contractId, onSignComplete } = route.params;

  const signatureRef = useRef<SignatureViewRef>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setHasSignature(false);
  };

  const handleBegin = () => {
    setIsSigning(true);
  };

  const handleEnd = () => {
    setIsSigning(false);
    setHasSignature(true);
  };

  const handleSubmit = () => {
    if (!hasSignature) {
      Alert.alert('Error', 'Please provide your signature');
      return;
    }
    signatureRef.current?.readSignature();
  };

  const handleSignature = async (signature: string) => {
    setIsSubmitting(true);
    try {
      // Upload signature
      await api.contracts.sign(contractId, {
        signature: signature,
      });

      if (onSignComplete) {
        onSignComplete();
      }

      Alert.alert(
        'Signature Saved',
        'Your digital signature has been recorded.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to save signature. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmpty = () => {
    Alert.alert('Error', 'Please provide your signature');
  };

  const webStyle = `.m-signature-pad {
    box-shadow: none;
    border: none;
    margin: 0;
    padding: 0;
  }
  .m-signature-pad--body {
    border: none;
  }
  .m-signature-pad--footer {
    display: none;
  }
  body, html {
    background-color: ${colors.surface};
  }`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Digital Signature</Text>
        <Text style={styles.subtitle}>
          Sign below to confirm your agreement to the rental contract
        </Text>
      </View>

      {/* Signature Canvas */}
      <View style={styles.signatureContainer}>
        <View style={styles.signatureWrapper}>
          <SignatureScreen
            ref={signatureRef}
            onOK={handleSignature}
            onEmpty={handleEmpty}
            onBegin={handleBegin}
            onEnd={handleEnd}
            webStyle={webStyle}
            backgroundColor={colors.surface}
            penColor={colors.text}
            minWidth={2}
            maxWidth={4}
            dotSize={3}
          />
        </View>
        <View style={styles.signatureLine}>
          <View style={styles.signatureLineLeft} />
          <Text style={styles.signatureLabel}>Sign here</Text>
          <View style={styles.signatureLineRight} />
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <View style={styles.instructionItem}>
          <Ionicons name="finger-print" size={20} color={colors.textLight} />
          <Text style={styles.instructionText}>
            Use your finger to sign within the box
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="shield-checkmark" size={20} color={colors.textLight} />
          <Text style={styles.instructionText}>
            Your signature is legally binding
          </Text>
        </View>
      </View>

      {/* Legal Notice */}
      <View style={styles.legalNotice}>
        <Ionicons name="information-circle" size={20} color={colors.info} />
        <Text style={styles.legalText}>
          By signing, you agree to all terms and conditions in this rental contract, including the automatic 8% withholding tax deduction.
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          disabled={isSubmitting}
        >
          <Ionicons name="trash" size={20} color={colors.error} />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, !hasSignature && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!hasSignature || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={colors.textOnPrimary} />
              <Text style={styles.submitButtonText}>Confirm Signature</Text>
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
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  signatureContainer: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  signatureWrapper: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  signatureLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  signatureLineLeft: {
    flex: 1,
    height: 1,
    backgroundColor: colors.textLight,
  },
  signatureLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginHorizontal: spacing.sm,
  },
  signatureLineRight: {
    flex: 1,
    height: 1,
    backgroundColor: colors.textLight,
  },
  instructions: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  instructionText: {
    fontSize: 13,
    color: colors.textLight,
    marginLeft: spacing.sm,
  },
  legalNotice: {
    flexDirection: 'row',
    backgroundColor: `${colors.info}15`,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  legalText: {
    flex: 1,
    fontSize: 12,
    color: colors.info,
    marginLeft: spacing.sm,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    marginRight: spacing.sm,
  },
  clearButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  submitButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});
