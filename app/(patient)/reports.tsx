import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  TouchableOpacity,
  LayoutAnimation,
} from 'react-native';
import {
  AlertTriangle,
  Camera,
  Droplets,
  Hand,
  Image as ImageIcon,
  Pill,
  Shirt,
  Shield,
  Phone,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useReports } from '../../src/hooks/useReports';
import { useGamification } from '../../src/hooks/useGamification';
import { ReportCard } from '../../src/components/reports/ReportCard';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/constants/theme';
import * as ImageManipulator from 'expo-image-manipulator';

const CARE_TIPS: Array<{
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}> = [
  { id: 'clean', label: 'Keep clean & dry', icon: Shield },
  { id: 'clothes', label: 'Wear loose clothes', icon: Shirt },
  { id: 'dressing', label: 'Change dressing daily', icon: Droplets },
  { id: 'scratch', label: 'Do not scratch', icon: Hand },
  { id: 'meds', label: 'Take meds on time', icon: Pill },
  { id: 'call', label: 'Inform Doctor if concerned', icon: Phone },

];

const WARNING_SIGNS: Array<{
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}> = [
  { id: 'redness', label: 'Redness', icon: AlertTriangle },
  { id: 'swelling', label: 'Swelling', icon: AlertTriangle },
  { id: 'pus', label: 'Pus discharge', icon: AlertTriangle },
  { id: 'bleeding', label: 'Bleeding', icon: AlertTriangle },

];

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
  const gamification = useGamification();

  React.useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [reports]);

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

      // Auto-complete the wound_photo task
      const taskId = 'wound_photo';
      if (!gamification.tasksCompletedToday.includes(taskId)) {
        await gamification.completeTask(taskId, 30);
      }

      Alert.alert('Uploaded ✅', 'Your wound photo has been securely uploaded. Task completed!');
    } catch (error) {
      console.error('[Reports] pickImage error:', error);
      Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
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
        <Text style={styles.pageTitle}>Wound Health</Text>

        {/* Upload area */}
        <View style={styles.uploadSection}>
          <Text style={styles.uploadTitle}>Upload photo</Text>
          <Text style={styles.uploadSubtitle}>Latest wound image</Text>

          {uploadProgress !== null ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Uploading securely...</Text>
                <Text style={styles.progressPercent}>{Math.round(uploadProgress)}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadDropzone}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Camera size={32} color="#000000" style={{ marginBottom: 12 }} strokeWidth={1.5} />
              <Text style={styles.dropzoneText}>UPLOAD</Text>
              <Text style={styles.dropzoneSubtext}>JPEG/PNG · MAX 20MB</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionHeading}>Care</Text>
          <View style={styles.grid}>
            {CARE_TIPS.map((item) => {
              const Icon = item.icon;
              return (
                <View key={item.id} style={styles.tile}>
                  <Icon size={18} color="#111111" strokeWidth={2} />
                  <Text style={styles.tileText}>{item.label}</Text>
                </View>
              );
            })}
            {CARE_TIPS.length % 2 !== 0 && <View style={styles.tilePlaceholder} />}
          </View>
        </View>

        <View style={styles.warningSection}>
          <Text style={styles.warningTitle}>Warning signs</Text>
          <Text style={styles.warningSubTitle}>Check for</Text>
          <View style={styles.grid}>
            {WARNING_SIGNS.map((item) => {
              const Icon = item.icon;
              return (
                <View key={item.id} style={styles.warningTile}>
                  <Icon size={18} color="#9b1c1c" strokeWidth={2} />
                  <Text style={styles.warningTileText}>{item.label}</Text>
                </View>
              );
            })}
            {WARNING_SIGNS.length % 2 !== 0 && <View style={styles.tilePlaceholder} />}
          </View>
        </View>

        {/* Reports list */}
        <Text style={styles.sectionTitle}>Recent</Text>
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
          <View style={styles.emptyState}>
            <ImageIcon size={48} color="#000000" style={{ marginBottom: 16 }} strokeWidth={1} />
            <Text style={styles.emptyTitle}>NO PHOTOS</Text>
            <Text style={styles.emptyDesc}>Your reports will appear here.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  pageTitle: { ...theme.typography.h1, color: '#000000', marginBottom: theme.spacing.lg, letterSpacing: -0.5 },

  infoSection: {
    marginBottom: theme.spacing.lg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    padding: theme.spacing.md,
  },
  sectionHeading: {
    ...theme.typography.caption,
    color: '#262626',
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.spacing.sm,
  },
  tile: {
    width: '48%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f7fff9',
    padding: theme.spacing.sm,
    gap: 6,
    minHeight: 72,
    justifyContent: 'center',
  },
  tileText: {
    ...theme.typography.caption,
    color: '#1f2937',
    fontWeight: '600',
    lineHeight: 16,
  },
  tilePlaceholder: {
    width: '48%',
    minHeight: 72,
  },

  warningSection: {
    marginBottom: theme.spacing.xl,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    padding: theme.spacing.md,
  },
  warningTitle: {
    ...theme.typography.body,
    color: '#7f1d1d',
    fontWeight: '700',
    marginBottom: 2,
  },
  warningSubTitle: {
    ...theme.typography.caption,
    color: '#991b1b',
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  warningTile: {
    width: '48%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fee2e2',
    padding: theme.spacing.sm,
    gap: 6,
    minHeight: 64,
    justifyContent: 'center',
  },
  warningTileText: {
    ...theme.typography.caption,
    color: '#7f1d1d',
    fontWeight: '700',
    lineHeight: 16,
  },

  // Upload Section
  uploadSection: { marginBottom: theme.spacing.xl },
  uploadTitle: { ...theme.typography.body, color: '#000000', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  uploadSubtitle: { ...theme.typography.caption, color: '#404040', marginBottom: theme.spacing.md },

  uploadDropzone: {
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface, // this is the light green now
  },
  dropzoneText: { ...theme.typography.body, color: '#000000', fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  dropzoneSubtext: { ...theme.typography.caption, color: '#333333', letterSpacing: 1 },

  progressContainer: {
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  progressLabel: { ...theme.typography.caption, color: '#000000', letterSpacing: 1, fontWeight: '700' },
  progressPercent: { ...theme.typography.caption, color: '#000000', letterSpacing: 1, fontWeight: '700' },
  progressTrack: { height: 4, backgroundColor: '#e5e5e5', width: '100%', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#000000' },

  // List Section
  sectionTitle: { ...theme.typography.caption, color: '#333333', marginBottom: theme.spacing.md, letterSpacing: 1.5, fontWeight: '700' },

  emptyState: {
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.xxxl,
    borderTopWidth: 2,
    borderColor: '#000000',
  },
  emptyTitle: { ...theme.typography.body, color: '#000000', fontWeight: '700', letterSpacing: 1.5, marginBottom: theme.spacing.xs },
  emptyDesc: { ...theme.typography.caption, color: '#404040', letterSpacing: 0.5 },
});
