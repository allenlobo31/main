import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Animated, Image } from 'react-native';
import { theme } from '../../constants/theme';
import { Report } from '../../types';
import { formatDate } from '../../utils/dateHelpers';
import { FileText, Camera, Activity, Paperclip, Image as ImageIcon, Zap, Eye, Trash2 } from 'lucide-react-native';

const TYPE_ICONS: Record<Report['type'], any> = {
  scan: ImageIcon,
  discharge: FileText,
  wound_photo: Camera,
  lab: Activity,
  other: Paperclip,
};

const TYPE_LABELS: Record<Report['type'], string> = {
  scan: 'SCAN',
  discharge: 'DISCHARGE',
  wound_photo: 'WOUND PHOTO',
  lab: 'LAB RESULT',
  other: 'OTHER',
};

interface ReportCardProps {
  report: Report;
  onView: () => void;
  onDelete?: () => void;
}

export function ReportCard({ report, onView, onDelete }: ReportCardProps) {
  const [scaleValue] = useState(new Animated.Value(1));

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const Icon = TYPE_ICONS[report.type];
  const isPhoto = report.type === 'wound_photo';

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onView}>
      <Animated.View style={[styles.container, isPhoto && styles.photoContainer, { transform: [{ scale: scaleValue }] }]}>
        {isPhoto ? (
          <Image source={{ uri: report.fileUrl }} style={styles.cardImage} />
        ) : (
          <View style={styles.iconBox}>
            <Icon size={24} color="#000000" strokeWidth={1.5} />
          </View>
        )}
        <View style={[styles.info, isPhoto && styles.photoInfo]}>
          <Text style={styles.title} numberOfLines={1}>{report.title}</Text>
          <Text style={styles.meta}>{formatDate(report.uploadedAt).toUpperCase()}</Text>
          <View style={styles.tagsContainer}>
            <Text style={styles.typeLabel}>{TYPE_LABELS[report.type]}</Text>
            {report.aiWoundAnalysis && (
              <View style={styles.aiTag}>
                <Zap size={12} color="#000000" fill="#000000" style={{ marginRight: 4 }} />
                <Text style={styles.aiChip}>AI ANALYZED</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.actions, isPhoto && styles.photoActions]}>
          <TouchableOpacity style={styles.viewBtn} onPress={onView} activeOpacity={0.7}>
            <Eye size={14} color="#ffffff" style={{ marginRight: 6 }} strokeWidth={2} />
            <Text style={styles.viewText}>{isPhoto ? 'FULL' : 'VIEW'}</Text>
          </TouchableOpacity>
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} activeOpacity={0.6}>
              <Trash2 size={14} color="#000000" style={{ marginRight: 6 }} strokeWidth={2} />
              <Text style={styles.deleteText}>REMOVE</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoContainer: {
    padding: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  iconBox: {
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#ffffff',
  },
  info: { flex: 1, gap: 4, minWidth: 0, paddingRight: theme.spacing.md },
  title: {
    ...theme.typography.h3,
    color: '#000000',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  meta: {
    ...theme.typography.caption,
    color: '#333333',
    letterSpacing: 1,
    fontSize: 10,
    marginBottom: 4,
  },
  tagsContainer: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center', flexWrap: 'wrap' },
  typeLabel: {
    ...theme.typography.caption,
    fontSize: 10,
    color: '#404040',
    letterSpacing: 1,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiChip: {
    ...theme.typography.caption,
    fontSize: 10,
    color: '#000000',
    fontWeight: '700',
    letterSpacing: 1,
  },
  actions: { alignItems: 'flex-end', gap: theme.spacing.sm },
  viewBtn: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewText: { ...theme.typography.caption, color: '#ffffff', fontWeight: '700', letterSpacing: 1 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
  },
  deleteText: {
    ...theme.typography.caption,
    color: '#000000',
    fontWeight: '700',
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
  photoInfo: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  photoActions: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    paddingTop: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
