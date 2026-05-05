import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { theme } from '../../constants/theme';
import { Expert } from '../../types';
import { Star } from 'lucide-react-native';

interface ExpertCardProps {
  expert: Expert;
  onCallPress: () => void;
  isCallLoading?: boolean;
}

const ROLE_LABELS: Record<Expert['role'], string> = {
  surgeon: 'Surgeon',
  physiotherapist: 'Physiotherapist',
  pain_specialist: 'Pain Specialist',
  nurse: 'Nurse',
};

export function ExpertCard({ expert, onCallPress, isCallLoading = false }: ExpertCardProps) {
  return (
    <View style={styles.container}>
      <Avatar uri={expert.avatarUrl} name={expert.name} size={48} />
      <View style={styles.info}>
        <Text style={styles.name}>{expert.name}</Text>
        <Text style={styles.role}>{ROLE_LABELS[expert.role]}</Text>
        <View style={styles.meta}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Star size={12} color={theme.colors.warning} fill={theme.colors.warning} />
            <Text style={styles.rating}>{expert.rating.toFixed(1)}</Text>
          </View>
          <Badge
            label={expert.isOnline ? 'Online' : 'Offline'}
            variant={expert.isOnline ? 'success' : 'muted'}
          />
        </View>
      </View>
      <Button
        label="Call"
        onPress={onCallPress}
        variant={expert.isOnline ? 'primary' : 'secondary'}
        disabled={!expert.isOnline}
        isLoading={isCallLoading}
        style={styles.callBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  info: { flex: 1, minWidth: 0 },
  name: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  role: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' },
  rating: { ...theme.typography.caption, color: theme.colors.warning },
  callBtn: { paddingHorizontal: theme.spacing.md, minHeight: 36, minWidth: 96, alignSelf: 'flex-start' },
});
