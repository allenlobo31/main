import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../constants/theme';
import { Report } from '../../types';
import { formatDate } from '../../utils/dateHelpers';
import { Badge } from '../ui/Badge';

const TYPE_LABELS: Record<Report['type'], string> = {
  scan: 'Scan',
  discharge: 'Discharge',
  wound_photo: 'Wound Photo',
  lab: 'Lab Result',
  other: 'Other',
};

const TYPE_EMOJI: Record<Report['type'], string> = {
  scan: '🖼️',
  discharge: '📄',
  wound_photo: '📸',
  lab: '🧪',
  other: '📎',
};

interface ReportCardProps {
  report: Report;
  onView: () => void;
  onDelete?: () => void;
}

export function ReportCard({ report, onView, onDelete }: ReportCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{TYPE_EMOJI[report.type]}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{report.title}</Text>
        <Text style={styles.meta}>{formatDate(report.uploadedAt)}</Text>
        <Badge label={TYPE_LABELS[report.type]} variant="muted" />
        {report.aiWoundAnalysis && (
          <Text style={styles.aiChip}>🤖 AI Analyzed</Text>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.viewBtn} onPress={onView}>
          <Text style={styles.viewText}>View</Text>
        </TouchableOpacity>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  info: { flex: 1, gap: 2, minWidth: 0 },
  title: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  meta: { ...theme.typography.caption, color: theme.colors.textMuted },
  aiChip: { ...theme.typography.caption, color: theme.colors.primaryLight, marginTop: 2 },
  actions: { gap: theme.spacing.xs, marginLeft: 'auto' },
  viewBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    minWidth: 72,
    alignItems: 'center',
  },
  viewText: { ...theme.typography.caption, color: '#fff', fontWeight: '700' },
  deleteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
  },
  deleteText: { color: theme.colors.danger, fontWeight: '700' },
});
