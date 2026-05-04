import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc, 
  serverTimestamp,
  query,
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export type NotificationType = 'product' | 'integration' | 'subscription' | 'system';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: Timestamp;
}

export function useNotifications() {
  const userId = auth.currentUser?.uid;

  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const q = query(
          collection(db, 'users', userId, 'notifications'),
          orderBy('created_at', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ 
          id: d.id, 
          ...d.data() 
        } as Notification));
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, `users/${userId}/notifications`);
      }
    },
    enabled: !!userId,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const userId = auth.currentUser?.uid;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Não autenticado');
      try {
        await updateDoc(doc(db, 'users', userId, 'notifications', id), {
          is_read: true
        });
      } catch (error) {
        return handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/notifications/${id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const userId = auth.currentUser?.uid;

  return useMutation({
    mutationFn: async (notifications: Notification[]) => {
      if (!userId) throw new Error('Não autenticado');
      try {
        const batch = writeBatch(db);
        const unread = notifications.filter(n => !n.is_read);
        
        unread.forEach(n => {
          const ref = doc(db, 'users', userId, 'notifications', n.id);
          batch.update(ref, { is_read: true });
        });
        
        await batch.commit();
      } catch (error) {
        return handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/notifications`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });
}

/**
 * Helper to create a notification
 */
export async function createNotification(userId: string, data: {
  title: string;
  message: string;
  type: NotificationType;
}) {
  try {
    await addDoc(collection(db, 'users', userId, 'notifications'), {
      ...data,
      is_read: false,
      created_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}
