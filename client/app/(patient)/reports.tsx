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
  useWindowDimensions,
  Dimensions,
  Image,
} from 'react-native';
import {
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Trash2,
  Paperclip,
  FileText,
  Activity as ActivityIcon,
  Zap,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useReports } from '../../src/hooks/useReports';
import { useGamification } from '../../src/hooks/useGamification';
import { Button } from '../../src/components/ui/Button';
import { theme } from '../../src/constants/theme';
import * as ImageManipulator from 'expo-image-manipulator';
import { formatDate } from '../../src/utils/dateHelpers';
import { useLanguageStore } from '../../src/store/languageStore';

const TYPE_ICONS: Record<string, any> = {
  scan: ImageIcon,
  discharge: FileText,
  wound_photo: Camera,
  lab: ActivityIcon,
  other: Paperclip,
};

function ReportsScreen() {
  const { t, language } = useLanguageStore();
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
  const { width } = useWindowDimensions();

  const gapSize = 10;
  const paddingSize = 16; // theme.spacing.lg is 16
  const gridItemWidth = (width - paddingSize * 2 - gapSize * 2) / 3;
  const maxGridHeight = 4 * gridItemWidth + 3 * gapSize + 40;

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  React.useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [reports]);

  const careSlides = useMemo(() => [
    { id: 'clean', title: t('reports.careTips.clean'), subtitle: t('reports.careTips.cleanSub'), image: require('../../assets/care_clean_dry.png') },
    { id: 'clothes', title: t('reports.careTips.clothes'), subtitle: t('reports.careTips.clothesSub'), image: require('../../assets/care_loose_clothes.png') },
    { id: 'dressing', title: t('reports.careTips.dressing'), subtitle: t('reports.careTips.dressingSub'), image: require('../../assets/care_change_dressing.png') },
    { id: 'scratch', title: t('reports.careTips.scratch'), subtitle: t('reports.careTips.scratchSub'), image: require('../../assets/care_no_scratch.png') },
    { id: 'meds', title: t('reports.careTips.meds'), subtitle: t('reports.careTips.medsSub'), image: require('../../assets/care_take_meds.png') },
    { id: 'call', title: t('reports.careTips.call'), subtitle: t('reports.careTips.callSub'), image: require('../../assets/care_call_doctor.png') },
  ], [t, language]);

  const warningSlides = useMemo(() => [
    { id: 'redness', title: t('reports.warningSigns.redness'), subtitle: t('reports.warningSigns.rednessSub'), image: require('../../assets/warning_redness.png') },
    { id: 'swelling', title: t('reports.warningSigns.swelling'), subtitle: t('reports.warningSigns.swellingSub'), image: require('../../assets/warning_swelling.png') },
    { id: 'pus', title: t('reports.warningSigns.pus'), subtitle: t('reports.warningSigns.pusSub'), image: require('../../assets/warning_pus.png') },
    { id: 'bleeding', title: t('reports.warningSigns.bleeding'), subtitle: t('reports.warningSigns.bleedingSub'), image: require('../../assets/warning_bleeding.png') },
  ], [t, language]);

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
        t('reports.failUpload'),
        t('reports.failUploadDesc'),
        [{ text: t('common.close') }],
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

      Alert.alert(t('reports.successUpload'), t('reports.successUploadDesc'));
    } catch (error) {
      console.error('[Reports] pickImage error:', error);
      Alert.alert(t('reports.failUpload'), t('reports.failUploadDesc'));
    }
  };

  const handleViewReport = async (report: (typeof reports)[0]) => {
    try {
      const url = report.fileUrl;
      if (!url) {
        Alert.alert(t('experts.errorTitle'), t('reports.failUploadDesc'));
        return;
      }
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('reports.pageTitle'), `URL:\n${url.slice(0, 120)}…`);
      }
    } catch (error) {
      console.error('[Reports] view error:', error);
      Alert.alert(t('experts.errorTitle'), t('reports.failUploadDesc'));
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
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: theme.spacing.xxxl,
            marginTop: theme.spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* Upload area */}
        <View style={styles.uploadSection}>
          <Text style={styles.uploadTitle}>{t('reports.uploadTitle')}</Text>
          <Text style={styles.uploadSubtitle}>{t('reports.uploadDesc')}</Text>

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
              <Text style={styles.dropzoneText}>{t('reports.uploadTitle').toUpperCase()}</Text>
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
            <Text style={[styles.carouselSectionTitle, { color: '#34d399' }]}>{t('reports.careTipsHeader')}</Text>
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
            <Text style={[styles.carouselSectionTitle, { color: '#dc2626' }]}>{t('reports.warningSignsHeader')}</Text>
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

        {/* Reports list grouped by date as an album grid */}
        {reports.length > 0 && (
          <View style={{ width: '100%' }}>
            <Text style={styles.sectionHeader}>{t('reports.sectionHeader')}</Text>
            <ScrollView
              style={{ maxHeight: maxGridHeight }}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {groupedReports.map(([date, dateReports]) => (
                <View key={date} style={styles.dateGroup}>
                  <Text style={styles.dateHeader}>{date.toUpperCase()}</Text>
                  <View style={styles.albumGrid}>
                    {dateReports.map((report) => {
                      const isPhoto = report.type === 'wound_photo';
                      const Icon = TYPE_ICONS[report.type] || Paperclip;
                      
                      return (
                        <View key={report.id} style={[styles.albumItemContainer, { width: gridItemWidth }]}>
                          <TouchableOpacity
                            style={styles.albumItem}
                            onPress={() => handleViewReport(report)}
                            activeOpacity={0.8}
                          >
                            {isPhoto ? (
                              <Image source={{ uri: report.fileUrl }} style={styles.albumImage} />
                            ) : (
                              <View style={styles.albumDocFallback}>
                                <Icon size={24} color="#000000" strokeWidth={1.5} />
                                <Text style={styles.albumDocText} numberOfLines={1}>
                                  {report.title}
                                </Text>
                              </View>
                            )}
                            
                            {/* AI Analyzed Indicator */}
                            {report.aiWoundAnalysis && (
                              <View style={styles.albumAiBadge}>
                                <Zap size={10} color="#000000" fill="#000000" />
                              </View>
                            )}
                          </TouchableOpacity>
                          
                          {/* Delete Overlay Button */}
                          <TouchableOpacity
                            style={styles.albumDeleteBtn}
                            onPress={() => {
                              Alert.alert(t('reports.deleteTitle'), t('reports.deleteConfirm'), [
                                { text: t('common.cancel'), style: 'cancel' },
                                { text: t('reports.deleteTitle'), style: 'destructive', onPress: () => deleteReport(report.id) },
                              ]);
                            }}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={16} color="#ffffff" strokeWidth={2.5} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {hasMore && (
          <Button
            label={t('diary.loadMore')}
            onPress={() => fetchReports()}
            variant="ghost"
            isLoading={isLoading}
            fullWidth
          />
        )}
        {reports.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <ImageIcon size={48} color="#000000" style={{ marginBottom: 16 }} strokeWidth={1} />
            <Text style={styles.emptyTitle}>{t('reports.sectionHeader').toUpperCase()}</Text>
            <Text style={styles.emptyDesc}>{t('reports.uploadDesc')}</Text>
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
  uploadSection: { marginBottom: theme.spacing.xxl },
  uploadTitle: { ...theme.typography.h2, color: '#000000', fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  uploadSubtitle: { ...theme.typography.caption, color: '#404040', marginBottom: theme.spacing.md },

  uploadDropzone: {
    borderWidth: 2,
    borderColor: '#000000',
    borderStyle: 'dashed',
    borderRadius: 12,
    width: 200,
    height: 200,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  dropzoneText: { ...theme.typography.body, color: '#000000', fontWeight: '700', letterSpacing: 1.5, marginBottom: 4, textAlign: 'center' },
  dropzoneSubtext: { ...theme.typography.caption, color: '#333333', letterSpacing: 1, textAlign: 'center' },

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
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 10,
    paddingHorizontal: 2,
  },
  albumItemContainer: {
    aspectRatio: 1,
    position: 'relative',
    marginBottom: 10,
  },
  albumItem: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  albumDocFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding: 6,
  },
  albumDocText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000000',
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  albumAiBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 6,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  },
  albumDeleteBtn: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 1.2, height: 1.2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  sectionHeader: {
    ...theme.typography.h3,
    color: '#000000',
    fontWeight: '800',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    letterSpacing: 0.5,
  },
});

export default React.memo(ReportsScreen);
