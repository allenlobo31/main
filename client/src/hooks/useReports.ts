import { useState, useCallback } from 'react';
import { Report } from '../types';
import { useAuthStore } from '../store/authStore';
import apiClient from '../services/apiClient';

export function useReports() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fetchReports = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const response = await apiClient.get('/users/reports');
      const normalized = response.data.map((r: any) => ({
        ...r,
        id: r._id || r.id,
        fileUrl: r.fileUrl || r.url || ''
      }));
      setReports(normalized);
    } catch (error) {
      console.error('[useReports] fetchReports error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  const uploadReport = useCallback(async (uri: string, filename: string, type: string) => {
    if (!user?.uid) return;
    setUploadProgress(0);
    try {
      // Image upload logic to Node.js backend
      const response = await apiClient.post('/upload', {
        fileData: uri, 
        filename,
        contentType: type.includes('/') ? type : 'image/jpeg' // Fallback to image/jpeg if type is an enum value
      });
      
      // Link image to report in MongoDB
      await apiClient.post('/users/reports', {
        title: filename || 'Wound Photo',
        type,
        fileUrl: `${apiClient.defaults.baseURL}/images/${response.data.imageId}`,
        uploadedAt: new Date()
      });

      await fetchReports();
      setUploadProgress(100);
    } catch (error) {
      console.error('[useReports] upload error:', error);
    } finally {
      setUploadProgress(null);
    }
  }, [user?.uid, fetchReports]);

  const deleteReport = useCallback(async (reportId: string) => {
    try {
      await apiClient.delete(`/users/reports/${reportId}`);
      await fetchReports();
    } catch (error) {
      console.error('[useReports] delete error:', error);
    }
  }, [fetchReports]);

  return {
    reports,
    isLoading,
    uploadProgress,
    fetchReports,
    uploadReport,
    deleteReport,
    hasMore: false,
  };
}