import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../../utils/theme';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Notification {
  id: string;
  type: 'PAYMENT' | 'CONTRACT' | 'SYSTEM' | 'TAX';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

// Mock notifications for demo
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'PAYMENT',
    title: 'Payment Received',
    message: 'You received GH₵ 3,220 from Ama Mensah for January rent.',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'TAX',
    title: 'Tax Certificate Available',
    message: 'Your monthly tax certificate for January 2024 is ready to download.',
    isRead: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    type: 'CONTRACT',
    title: 'Contract Confirmed',
    message: 'Kofi Owusu has confirmed the rental contract for PROP-KUM-001.',
    isRead: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '4',
    type: 'SYSTEM',
    title: 'Profile Verified',
    message: 'Your Ghana Card verification is complete. You can now create contracts.',
    isRead: true,
    createdAt: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: '5',
    type: 'PAYMENT',
    title: 'Payment Due Reminder',
    message: 'Rent payment for February is due in 3 days.',
    isRead: true,
    createdAt: new Date(Date.now() - 864000000).toISOString(),
  },
];

export default function NotificationsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setNotifications(MOCK_NOTIFICATIONS);
    setIsLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT':
        return { name: 'wallet', color: colors.success };
      case 'CONTRACT':
        return { name: 'document-text', color: colors.primary };
      case 'TAX':
        return { name: 'receipt', color: colors.warning };
      case 'SYSTEM':
        return { name: 'settings', color: colors.info };
      default:
        return { name: 'notifications', color: colors.textLight };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-GH', { month: 'short', day: 'numeric' });
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.isRead && styles.notificationUnread]}
        onPress={() => markAsRead(item.id)}
      >
        <View style={[styles.notificationIcon, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name as any} size={22} color={icon.color} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, !item.isRead && styles.notificationTitleUnread]}>
              {item.title}
            </Text>
            <Text style={styles.notificationTime}>{formatTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
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
            <Ionicons name="notifications-off-outline" size={64} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyDescription}>
            You're all caught up! We'll notify you when something important happens.
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
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textOnPrimary,
    flex: 1,
    textAlign: 'center',
  },
  markAllRead: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '500',
  },
  listContent: {
    padding: spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  notificationUnread: {
    backgroundColor: `${colors.primary}08`,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  notificationTitleUnread: {
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 11,
    color: colors.textLight,
  },
  notificationMessage: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
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
