import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: `${colors.success}20`, text: colors.success },
  COMPLETED: { bg: `${colors.success}20`, text: colors.success },
  VERIFIED: { bg: `${colors.info}20`, text: colors.info },
  PENDING: { bg: `${colors.warning}20`, text: colors.warning },
  PENDING_TENANT_CONFIRMATION: { bg: `${colors.warning}20`, text: colors.warning },
  PENDING_VERIFICATION: { bg: `${colors.warning}20`, text: colors.warning },
  DRAFT: { bg: `${colors.textLight}20`, text: colors.textLight },
  TERMINATED: { bg: `${colors.error}20`, text: colors.error },
  EXPIRED: { bg: `${colors.error}20`, text: colors.error },
  CANCELLED: { bg: `${colors.error}20`, text: colors.error },
  FAILED: { bg: `${colors.error}20`, text: colors.error },
};

const formatStatus = (status: string): string => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const colorScheme = STATUS_COLORS[status] || { bg: `${colors.textLight}20`, text: colors.textLight };

  return (
    <View style={[
      styles.badge,
      { backgroundColor: colorScheme.bg },
      size === 'small' && styles.badgeSmall
    ]}>
      <Text style={[
        styles.text,
        { color: colorScheme.text },
        size === 'small' && styles.textSmall
      ]}>
        {formatStatus(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  textSmall: {
    fontSize: 9,
  },
});
