import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getMyPatients, acceptPatient } from '../../src/services/dataService';
import { useAuthStore } from '../../src/store/authStore';
import { Avatar } from '../../src/components/ui/Avatar';
import { theme } from '../../src/constants/theme';
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout';
import { User, SymptomEntry } from '../../src/types';
import { Check, Search, AlertCircle, RefreshCw } from 'lucide-react-native';

interface PatientSummary {
  user: User;
  latestSymptom: SymptomEntry | null;
  hasFlag: boolean;
  isPending: boolean;
}

export default function PatientListScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { horizontalPadding } = useResponsiveLayout();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    loadPatients();
  }, [user?.uid]);

  const loadPatients = async () => {
    try {
      const data = await getMyPatients();
      setPatients(data);
    } catch (err) {
      console.error('[PatientList] load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadPatients();
  };

  const onAcceptPatient = async (patientId: string) => {
    if (!user?.uid) return;
    setIsProcessing(patientId);
    try {
      await acceptPatient(patientId);
      Alert.alert('Success', 'Patient application accepted.');
      loadPatients();
    } catch (error: any) {
      console.error('[Accept] Error details:', error);
      Alert.alert('Error', `Could not accept patient: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(null);
    }
  };

  // Filter patients by name or email based on search query
  const filteredPatients = patients.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.user.name.toLowerCase().includes(query) ||
      item.user.email.toLowerCase().includes(query)
    );
  });

  // Separate pending vs active for clean categorization
  const pendingPatients = filteredPatients.filter((p) => p.isPending);
  const activePatients = filteredPatients.filter((p) => !p.isPending);

  const renderPatientCard = (item: PatientSummary) => (
    <TouchableOpacity
      key={item.user.uid}
      style={[styles.card, item.hasFlag && styles.cardFlagged]}
      onPress={() =>
        router.push({ pathname: '/(doctor)/patient-detail', params: { uid: item.user.uid } })
      }
      activeOpacity={0.7}
    >
      <Avatar uri={item.user.avatarUrl} name={item.user.name} size={48} />
      
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.user.name}</Text>
          {item.hasFlag && (
            <View style={styles.flagBadge}>
              <AlertCircle size={12} color="#dc2626" style={{ marginRight: 2 }} />
              <Text style={styles.flagText}>Urgent</Text>
            </View>
          )}
        </View>
        <Text style={styles.email}>{item.user.email}</Text>
        <View style={styles.statusRow}>
          {item.latestSymptom ? (
            <Text style={styles.meta}>
              Pain: {item.latestSymptom.painLevel}/10 ·{' '}
              {item.hasFlag ? (
                <Text style={{ color: '#dc2626', fontWeight: '700' }}>Requires Review</Text>
              ) : (
                <Text style={{ color: '#059669', fontWeight: '700' }}>Stable</Text>
              )}
            </Text>
          ) : (
            <Text style={styles.meta}>No symptoms logged yet</Text>
          )}
        </View>
      </View>

      <View style={styles.cardActions}>
        {item.isPending ? (
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => onAcceptPatient(item.user.uid)}
            disabled={isProcessing === item.user.uid}
          >
            {isProcessing === item.user.uid ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.acceptText}>Accept</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.linkedBadge}>
            <Check size={14} color="#059669" strokeWidth={3} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.headerContainer, { paddingHorizontal: horizontalPadding }]}>
        <Text style={styles.pageTitle}>Patient Directory</Text>
        <Text style={styles.pageSubtitle}>Monitor status, symptoms, and reports</Text>
        
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search patient name or email..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={[
            ...(pendingPatients.length > 0 ? [{ id: 'pending-section-header', isHeader: true, title: `Connection Requests (${pendingPatients.length})` }, ...pendingPatients] : []),
            ...(activePatients.length > 0 ? [{ id: 'active-section-header', isHeader: true, title: `Active Patients (${activePatients.length})` }, ...activePatients] : [])
          ]}
          keyExtractor={(item) => (item as any).isHeader ? (item as any).id : (item as PatientSummary).user.uid}
          contentContainerStyle={[styles.scrollContainer, { paddingHorizontal: horizontalPadding }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => {
            if ((item as any).isHeader) {
              return <Text style={styles.sectionTitle}>{(item as any).title}</Text>;
            }
            return renderPatientCard(item as PatientSummary);
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AlertCircle size={36} color="#94a3b8" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No patients found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search query.' : 'Connected patient listings will show up here.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: '#f8fafc',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    paddingVertical: 8,
  },
  loadingArea: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  cardFlagged: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  flagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
  },
  email: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  cardActions: {
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
    borderColor: '#000000',
    borderWidth: 1.5,
  },
  acceptText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  linkedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});