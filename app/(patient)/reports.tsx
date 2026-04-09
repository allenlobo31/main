import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useReports } from '../../src/hooks/useReports';
import { ReportCard } from '../../src/components/reports/ReportCard';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { ReportType } from '../../src/types';
import * as ImageManipulator from 'expo-image-manipulator';

export default function ReportsScreen() {
  const {
    reports,
    isLoading,
    hasMore,
    uploadProgress,
    fetchReports,
    uploadReport,
    getSignedUrl,
    deleteReport,
  } = useReports();

  const [isPickerVisible, setPickerVisible] = useState(false);
  const { isCompact, horizontalPadding } = useResponsiveLayout();

  useEffect(() => {
    fetchReports(true);
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library access is needed to upload reports.',
        [{ text: 'OK' }],
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    // Compress: max 1200px, 80% quality
    const compressed = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
    );

    const base64 = await new File(compressed.uri).base64();

    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    await uploadReport({
      title: `Photo - ${new Date().toLocaleDateString()}`,
      type: 'wound_photo',
      fileData: bytes,
      filename: `wound_${Date.now()}.jpg`,
      contentType: 'image/jpeg',
    });

    Alert.alert('Uploaded ✅', 'Your wound photo has been securely uploaded.');
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    if ((asset.size ?? 0) > 20 * 1024 * 1024) {
      Alert.alert('File Too Large', 'Please select a file smaller than 20MB.');
      return;
    }

    const base64 = await new File(asset.uri).base64();

    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    await uploadReport({
      title: asset.name ?? 'Document',
      type: 'other',
      fileData: bytes,
      filename: asset.name ?? `doc_${Date.now()}.pdf`,
      contentType: asset.mimeType ?? 'application/pdf',
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Medical Reports</Text>

        {/* Upload area */}
        <Card style={styles.uploadCard} bordered>
          <Text style={styles.uploadTitle}>📤 Upload a report</Text>
          {uploadProgress !== null ? (
            <View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{uploadProgress}% uploaded...</Text>
            </View>
          ) : (
            <View style={[styles.uploadBtns, isCompact && styles.uploadBtnsCompact]}>
              <Button label="📸 Wound Photo" onPress={pickImage} variant="primary" style={[styles.uploadBtn, isCompact && styles.uploadBtnCompact]} />
              <Button label="📄 Document" onPress={pickDocument} variant="secondary" style={[styles.uploadBtn, isCompact && styles.uploadBtnCompact]} />
            </View>
          )}
        </Card>

        {/* Reports list */}
        <Text style={styles.sectionTitle}>Recent reports</Text>
        {reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onView={async () => {
              const url = await getSignedUrl(report.fileUrl);
              Alert.alert('File URL', url.slice(0, 80) + '…');
            }}
            onDelete={() => {
              Alert.alert('Delete Report', 'Are you sure you want to delete this report?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteReport(report.id) },
              ]);
            }}
          />
        ))}
        {hasMore && (
          <Button
            label="Load more"
            onPress={() => fetchReports(false)}
            variant="ghost"
            isLoading={isLoading}
            fullWidth
          />
        )}
        {reports.length === 0 && !isLoading && (
          <Text style={styles.empty}>No reports yet. Upload your first one above.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  pageTitle: { ...theme.typography.h1, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  uploadCard: { marginBottom: theme.spacing.lg },
  uploadTitle: { ...theme.typography.body, color: theme.colors.textPrimary, fontWeight: '700', marginBottom: theme.spacing.md },
  uploadBtns: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  uploadBtnsCompact: { flexDirection: 'column' },
  uploadBtn: { flex: 1 },
  uploadBtnCompact: { flexBasis: '100%' },
  progressTrack: { height: 8, backgroundColor: theme.colors.border, borderRadius: theme.borderRadius.full, overflow: 'hidden', marginBottom: theme.spacing.xs },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full },
  progressText: { ...theme.typography.caption, color: theme.colors.textMuted, textAlign: 'center' },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  empty: { ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing.xl, fontStyle: 'italic' },
});
