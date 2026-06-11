import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  TouchableOpacity,
  LayoutAnimation,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import {
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
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
import { formatDate } from '../../src/utils/dateHelpers';

export default function ReportsScreen() {
  const {
    reports,
    isLoading,
    hasMore,
    uploadProgress,
    fetchReports,
    uploadReport,
    deleteReport,
  } = useReports();
  const gamification = useGamification();

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  React.useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [reports]);

  const careSlides = useMemo(() => [
    { id: 'clean', title: 'Keep clean & dry', subtitle: 'Protect the incision area', image: require('../../assets/care_clean_dry.png') },
    { id: 'clothes', title: 'Wear loose clothes', subtitle: 'Avoid friction and tightness', image: require('../../assets/care_loose_clothes.png') },
    { id: 'dressing', title: 'Change dressing daily', subtitle: 'Maintain proper hygiene', image: require('../../assets/care_change_dressing.png') },
    { id: 'scratch', title: 'Do not scratch', subtitle: 'Prevent wound irritation', image: require('../../assets/care_no_scratch.png') },
    { id: 'meds', title: 'Take meds on time', subtitle: 'Support recovery and pain relief', image: require('../../assets/care_take_meds.png') },
    { id: 'call', title: 'Inform Doctor if concerned', subtitle: 'Reach out for help early', image: require('../../assets/care_call_doctor.png') },
  ], []);

  const warningSlides = useMemo(() => [
    { id: 'redness', title: 'Redness', subtitle: 'Watch for spreading discoloration', image: require('../../assets/warning_redness.png') },
    { id: 'swelling', title: 'Swelling', subtitle: 'Check for abnormal fluid or expansion', image: require('../../assets/warning_swelling.png') },
    { id: 'pus', title: 'Pus discharge', subtitle: 'Report any cloudy or yellow discharge', image: require('../../assets/warning_pus.png') },
    { id: 'bleeding', title: 'Bleeding', subtitle: 'Monitor for active blood flow', image: require('../../assets/warning_bleeding.png') },
  ], []);

  const [activeCareIndex, setActiveCareIndex] = useState(0);
  const [activeWarningIndex, setActiveWarningIndex] = useState(0);

  const fadeCareAnim = useRef(new Animated.Value(1)).current;
  const fadeWarningAnim = useRef(new Animated.Value(1)).current;

  const changeCareSlideIndex = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCareIndex(index);
  };

  const changeWarningSlideIndex = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveWarningIndex(index);
  };

  // Auto-play timer for Care Tips (2.5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      changeCareSlideIndex(activeCareIndex === careSlides.length - 1 ? 0 : activeCareIndex + 1);
    }, 2500);
    return () => clearInterval(timer);
  }, [activeCareIndex, careSlides.length]);

  // Auto-play timer for Warning Signs (2.5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      changeWarningSlideIndex(activeWarningIndex === warningSlides.length - 1 ? 0 : activeWarningIndex + 1);
    }, 2500);
    return () => clearInterval(timer);
  }, [activeWarningIndex, warningSlides.length]);

  // Smooth fade-in animation for Care Tips
  useEffect(() => {
    fadeCareAnim.setValue(0.4);
    Animated.timing(fadeCareAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [activeCareIndex]);

  // Smooth fade-in animation for Warning Signs
  useEffect(() => {
    fadeWarningAnim.setValue(0.4);
    Animated.timing(fadeWarningAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [activeWarningIndex]);

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

      // Provide all required arguments to uploadReport (passing base64 data)
      await uploadReport(
        base64,
        `wound_${Date.now()}.jpg`,
        'wound_photo'
      );

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
      const url = report.fileUrl;
      if (!url) {
        Alert.alert('Error', 'This report has no valid file URL.');
        return;
      }
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

  const groupedReports = React.useMemo(() => {
    const groups: Record<string, typeof reports> = {};
    reports.forEach(r => {
      const dateKey = formatDate(r.uploadedAt);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(r);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[1][0].uploadedAt).getTime() - new Date(a[1][0].uploadedAt).getTime());
  }, [reports]);

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
              <Text style={styles.dropzoneText}>UPLOAD PHOTO</Text>
              <Text style={styles.dropzoneSubtext}>JPEG/PNG · MAX 20MB</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ======================================================== */}
        {/* CAROUSEL 1: WOUND CARE TIPS */}
        {/* ======================================================== */}
        <View style={styles.carouselContainer}>
          <View style={styles.carouselHeader}>
            <View style={[styles.iconWrapSuccess, { backgroundColor: '#dcfce7' }]}>
              <CheckCircle2 size={18} color="#34d399" strokeWidth={2.5} />
            </View>
            <Text style={[styles.carouselSectionTitle, { color: '#34d399' }]}>Wound Care Tips</Text>
          </View>

          <View style={[styles.carouselCard, styles.canDoCardBorder]}>
            <Animated.View style={{ opacity: fadeCareAnim, width: '100%', height: '100%' }}>
              <Image
                source={careSlides[activeCareIndex].image}
                style={styles.carouselImage}
                resizeMode="cover"
              />
              <View style={[styles.carouselOverlay, styles.canDoOverlay]}>
                <Text style={styles.carouselOverlayTitle}>{careSlides[activeCareIndex].title}</Text>
                <Text style={[styles.carouselOverlaySubtitle, { color: '#dcfce7' }]}>
                  {careSlides[activeCareIndex].subtitle}
                </Text>
              </View>
            </Animated.View>
            
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowLeft]}
              activeOpacity={0.8}
              onPress={() => changeCareSlideIndex(activeCareIndex === 0 ? careSlides.length - 1 : activeCareIndex - 1)}
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowRight]}
              activeOpacity={0.8}
              onPress={() => changeCareSlideIndex(activeCareIndex === careSlides.length - 1 ? 0 : activeCareIndex + 1)}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.thumbnailsRow}>
            {careSlides.map((slide, index) => {
              const isActive = activeCareIndex === index;
              return (
                <TouchableOpacity
                  key={slide.id}
                  style={[
                    styles.thumbnailContainer,
                    isActive ? styles.thumbnailContainerActiveCanDo : styles.thumbnailContainerInactive
                  ]}
                  activeOpacity={0.9}
                  onPress={() => changeCareSlideIndex(index)}
                >
                  <Image source={slide.image} style={styles.thumbnailImage} resizeMode="cover" />
                  {isActive && <View style={styles.thumbnailOverlayActiveCanDo} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ======================================================== */}
        {/* CAROUSEL 2: WARNING SIGNS */}
        {/* ======================================================== */}
        <View style={[styles.carouselContainer, { marginTop: 16, marginBottom: 24 }]}>
          <View style={styles.carouselHeader}>
            <View style={[styles.iconWrapDanger, { backgroundColor: '#fecaca' }]}>
              <XCircle size={18} color="#dc2626" strokeWidth={2.5} />
            </View>
            <Text style={[styles.carouselSectionTitle, { color: '#dc2626' }]}>Warning Signs (Check for)</Text>
          </View>

          <View style={[styles.carouselCard, styles.notToDoCardBorder]}>
            <Animated.View style={{ opacity: fadeWarningAnim, width: '100%', height: '100%' }}>
              <Image
                source={warningSlides[activeWarningIndex].image}
                style={styles.carouselImage}
                resizeMode="cover"
              />
              <View style={[styles.carouselOverlay, styles.notToDoOverlay]}>
                <Text style={styles.carouselOverlayTitle}>{warningSlides[activeWarningIndex].title}</Text>
                <Text style={styles.carouselOverlaySubtitle}>
                  {warningSlides[activeWarningIndex].subtitle}
                </Text>
              </View>
            </Animated.View>
            
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowLeft]}
              activeOpacity={0.8}
              onPress={() => changeWarningSlideIndex(activeWarningIndex === 0 ? warningSlides.length - 1 : activeWarningIndex - 1)}
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowRight]}
              activeOpacity={0.8}
              onPress={() => changeWarningSlideIndex(activeWarningIndex === warningSlides.length - 1 ? 0 : activeWarningIndex + 1)}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.thumbnailsRow}>
            {warningSlides.map((slide, index) => {
              const isActive = activeWarningIndex === index;
              return (
                <TouchableOpacity
                  key={slide.id}
                  style={[
                    styles.thumbnailContainerWarning,
                    isActive ? styles.thumbnailContainerActiveNotToDo : styles.thumbnailContainerInactive
                  ]}
                  activeOpacity={0.9}
                  onPress={() => changeWarningSlideIndex(index)}
                >
                  <Image source={slide.image} style={styles.thumbnailImage} resizeMode="cover" />
                  {isActive && <View style={styles.thumbnailOverlayActiveNotToDo} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Reports list grouped by date */}
        {groupedReports.map(([date, dateReports]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{date.toUpperCase()}</Text>
            {dateReports.map((report) => (
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
          </View>
        ))}

        {hasMore && (
          <Button
            label="Load more"
            onPress={() => fetchReports()}
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

  dateGroup: {
    marginBottom: theme.spacing.lg,
  },
  dateHeader: {
    ...theme.typography.caption,
    color: '#000000',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: theme.spacing.sm,
    paddingLeft: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#000000',
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
    backgroundColor: theme.colors.surface,
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

  emptyState: {
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.xxxl,
    borderTopWidth: 2,
    borderColor: '#000000',
  },
  emptyTitle: { ...theme.typography.body, color: '#000000', fontWeight: '700', letterSpacing: 1.5, marginBottom: theme.spacing.xs },
  emptyDesc: { ...theme.typography.caption, color: '#404040', letterSpacing: 0.5 },

  // Carousel Styles (copied from Activity page)
  carouselContainer: {
    marginBottom: theme.spacing.lg,
  },
  carouselCard: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 24,
    width: Dimensions.get('window').width - 120,
    height: Dimensions.get('window').width - 120,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    alignSelf: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#000000',
  },
  carouselOverlayTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  carouselOverlaySubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fecaca',
    marginTop: 2,
  },
  arrowBtn: {
    position: 'absolute',
    top: '40%',
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
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  arrowText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 24,
    textAlign: 'center',
  },
  carouselHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  carouselSectionTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  thumbnailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  thumbnailContainer: {
    width: (Dimensions.get('window').width - 40 - 50) / 6,
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  thumbnailContainerWarning: {
    width: (Dimensions.get('window').width - 40 - 50) / 4,
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  canDoCardBorder: {
    borderColor: '#bbf7d0',
  },
  canDoOverlay: {
    backgroundColor: 'rgba(52, 211, 153, 0.85)',
  },
  notToDoCardBorder: {
    borderColor: '#dc2626',
  },
  notToDoOverlay: {
    backgroundColor: 'rgba(127, 29, 29, 0.85)',
  },
  thumbnailContainerActiveCanDo: {
    borderWidth: 2.5,
    borderColor: '#34d399',
    transform: [{ scale: 1.05 }],
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  thumbnailOverlayActiveCanDo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  thumbnailContainerActiveNotToDo: {
    borderWidth: 2.5,
    borderColor: '#ef4444',
    transform: [{ scale: 1.05 }],
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  thumbnailOverlayActiveNotToDo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  thumbnailContainerInactive: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    opacity: 0.65,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  iconWrapSuccess: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
