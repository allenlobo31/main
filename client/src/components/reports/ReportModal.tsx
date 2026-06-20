import React from 'react';
import { Modal, View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { X, Zap } from 'lucide-react-native';
import { Report } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../constants/theme';
import { formatDate } from '../../utils/dateHelpers';

interface ReportModalProps {
  visible: boolean;
  report: Report | null;
  onClose: () => void;
}

export function ReportModal({ visible, report, onClose }: ReportModalProps) {
  const token = useAuthStore((state) => state.token);
  if (!report) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {report.title}
              </Text>
              <Text style={styles.subtitle}>
                {formatDate(report.uploadedAt)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <X size={20} color="#000000" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Image Container */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {report.fileUrl ? (
              <Image
                source={{
                  uri: report.fileUrl,
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                }}
                style={styles.image}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>No Image Available</Text>
              </View>
            )}

            {/* AI Wound Analysis (If present) */}
            {report.aiWoundAnalysis && (
              <View style={styles.aiBox}>
                <View style={styles.aiHeader}>
                  <Zap size={16} color="#000000" fill="#000000" />
                  <Text style={styles.aiTitle}>AI Wound Analysis</Text>
                </View>
                <Text style={styles.aiContent}>{report.aiWoundAnalysis}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#fef9c3', // Light yellow accent
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 350,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#f8fafc',
  },
  errorBox: {
    width: '100%',
    height: 200,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
  },
  errorText: {
    fontWeight: '700',
    color: '#64748b',
  },
  aiBox: {
    width: '100%',
    marginTop: 16,
    padding: 14,
    backgroundColor: '#fef08a', // Amber/Yellow alert style box
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
  },
  aiContent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 18,
  },
});
