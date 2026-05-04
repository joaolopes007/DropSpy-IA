import { useQuery } from '@tanstack/react-query';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export type ActivityType = 'auth' | 'product' | 'integration' | 'subscription' | 'supplier' | 'system';

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  type: ActivityType;
  metadata?: Record<string, unknown>;
  created_at: Timestamp;
}

export function useActivityLogs() {
  const userId = auth.currentUser?.uid;

  return useQuery({
    queryKey: ['activity_logs', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const q = query(
          collection(db, 'users', userId, 'activity_logs'),
          orderBy('created_at', 'desc'),
          limit(100)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ 
          id: d.id, 
          ...d.data() 
        } as ActivityLog));
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, `users/${userId}/activity_logs`);
      }
    },
    enabled: !!userId,
  });
}

/**
 * Helper to log activity
 */
export async function logActivity(userId: string, data: {
  action: string;
  description: string;
  type: ActivityType;
  metadata?: Record<string, unknown>;
}) {
  try {
    await addDoc(collection(db, 'users', userId, 'activity_logs'), {
      ...data,
      created_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
