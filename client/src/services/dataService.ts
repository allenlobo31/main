import apiClient from './apiClient';

const normalizeSymptom = (s: any) => ({
  ...s,
  id: s._id || s.id,
  painLevel: typeof s.painLevel === 'number' ? s.painLevel : (typeof s.intensity === 'number' ? s.intensity : 0),
  date: s.date || s.timestamp || new Date()
});

const normalizeDiary = (d: any) => ({
  ...d,
  id: d._id || d.id,
  text: d.text || d.content || '',
  date: d.date || d.timestamp || new Date()
});

export const updateProfile = async (updates: any) => {
  const response = await apiClient.put('/users/profile', updates);
  return response.data;
};

export const getDoctors = async () => {
  const response = await apiClient.get('/users/doctors');
  return response.data;
};

export const submitSymptom = async (data: any) => {
  const response = await apiClient.post('/users/symptoms', data);
  return normalizeSymptom(response.data);
};

export const getSymptoms = async () => {
  const response = await apiClient.get('/users/symptoms');
  return response.data.map(normalizeSymptom);
};

export const submitDiary = async (data: any) => {
  const response = await apiClient.post('/users/diary', data);
  return normalizeDiary(response.data);
};

export const getDiary = async () => {
  const response = await apiClient.get('/users/diary');
  return response.data.map(normalizeDiary);
};

export const getPatientDetail = async (uid: string) => {
  const response = await apiClient.get(`/users/patients/${uid}`);
  const data = response.data;
  
  // Normalize symptoms in detail
  if (data.symptoms) {
    data.symptoms = data.symptoms.map(normalizeSymptom);
  }
  
  // Normalize reports in detail
  if (data.reports) {
    data.reports = data.reports.map((r: any) => ({
      ...r,
      id: r._id || r.id,
      fileUrl: r.fileUrl || r.url || ''
    }));
  }
  
  return data;
};

export const getMyPatients = async () => {
  const response = await apiClient.get('/users/my-patients');
  return response.data.map((item: any) => ({
    ...item,
    user: {
      ...item.user,
      uid: item.user.uid || item.user.id || item.user._id
    },
    latestSymptom: item.latestSymptom ? normalizeSymptom(item.latestSymptom) : null
  }));
};

export const acceptPatient = async (uid: string) => {
  const response = await apiClient.post(`/users/patients/${uid}/accept`);
  return response.data;
};