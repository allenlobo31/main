import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useReports } from '../../src/hooks/useReports';
import { ReportCard } from '../../src/components/reports/ReportCard';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { theme } from '../../src/constants/theme';
import * as ImageManipulator from 'expo-image-manipulator';

export default function ReportsScreen() {
  const {
    reports,
    isLoading,
    hasMore,
    uploadProgress,
    fetchReports,
    uploadReport,
    getDownloadUrl,
    deleteReport,
  } = useReports();

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

    try {
      // Compress: max 1200px, 80% quality
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );

      // Read as base64
      const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      await uploadReport({
        title: `Photo - ${new Date().toLocaleDateString()}`,
        type: 'wound_photo',
        fileData: bytes,
        filename: `wound_${Date.now()}.jpg`,
        contentType: 'image/jpeg',
      });

      Alert.alert('Uploaded ✅', 'Your wound photo has been securely uploaded.');
    } catch (error) {
      console.error('[Reports] pickImage error:', error);
      Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
    }
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

    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      await uploadReport({
        title: asset.name ?? 'Document',
        type: 'other',
        fileData: bytes,
        filename: asset.name ?? `doc_${Date.now()}.pdf`,
        contentType: asset.mimeType ?? 'application/pdf',
      });

      Alert.alert('Uploaded ✅', 'Your document has been securely uploaded.');
    } catch (error) {
      console.error('[Reports] pickDocument error:', error);
      Alert.alert('Upload Failed', 'Could not upload the document. Please try again.');
    }
  };

  const handleViewReport = async (report: (typeof reports)[0]) => {
    try {
      const url = await getDownloadUrl(report);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('View Report', `Download URL:\n${url.slice(0, 120)}…`);
      }
    } catch (error) {
      console.error('[Reports] view error:', error);
      Alert.alert('Error', 'Could not open the report. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
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
            <View style={styles.uploadBtns}>
              <Button label="📸 Wound Photo" onPress={pickImage} variant="primary" style={styles.uploadBtn} />
              <Button label="📄 Document" onPress={pickDocument} variant="secondary" style={styles.uploadBtn} />
            </View>
          )}
        </Card>

        {/* Reports list */}
        <Text style={styles.sectionTitle}>Recent reports</Text>
        {reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onView={() => handleViewReport(report)}
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
  container: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  pageTitle: { ...theme.typography.h1, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  uploadCard: { marginBottom: theme.spacing.lg },
  uploadTitle: { ...theme.typography.body, color: theme.colors.textPrimary, fontWeight: '700', marginBottom: theme.spacing.md },
  uploadBtns: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  uploadBtn: { flex: 1, minWidth: 120 },
  progressTrack: { height: 8, backgroundColor: theme.colors.border, borderRadius: theme.borderRadius.full, overflow: 'hidden', marginBottom: theme.spacing.xs },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full },
  progressText: { ...theme.typography.caption, color: theme.colors.textMuted, textAlign: 'center' },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  empty: { ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing.xl, fontStyle: 'italic' },
});
