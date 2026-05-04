import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { createNotification } from './useNotifications';
import { logActivity } from './useActivityLogs';

export interface Integration {
  id: string;
  platform: string;
  accessToken?: string;
  clientSecret?: string;
  apiKey?: string;
  connectedAt: { seconds: number; nanoseconds: number } | null;
  is_custom?: boolean;
  type?: string;
  url?: string;
}

export function useIntegrations() {
  const userId = auth.currentUser?.uid;

  return useQuery({
    queryKey: ['integrations', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const snap = await getDocs(collection(db, 'users', userId, 'integrations'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Integration));
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, `users/${userId}/integrations`);
      }
    },
    enabled: !!userId,
  });
}

export function useConnectIntegration() {
  const queryClient = useQueryClient();
  const userId = auth.currentUser?.uid;

  return useMutation({
    mutationFn: async (data: { platform: string; [key: string]: string | number | boolean | undefined | null }) => {
      if (!userId) throw new Error('Não autenticado');
      
      try {
        await addDoc(collection(db, 'users', userId, 'integrations'), {
          ...data,
          connectedAt: serverTimestamp(),
        });
        
        await createNotification(userId, {
          title: "Integração Conectada",
          message: `Sua conta do ${data.platform} foi vinculada com sucesso!`,
          type: "integration"
        });

        await logActivity(userId, {
          action: "Integração Conectada",
          description: `A plataforma ${data.platform} foi conectada à sua conta.`,
          type: "integration",
          metadata: { platform: data.platform }
        });
      } catch (error) {
        return handleFirestoreError(error, OperationType.CREATE, `users/${userId}/integrations`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', userId] });
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();
  const userId = auth.currentUser?.uid;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Não autenticado');
      try {
        await deleteDoc(doc(db, 'users', userId, 'integrations', id));
        
        await logActivity(userId, {
          action: "Integração Desconectada",
          description: "Uma integração foi removida da sua conta.",
          type: "integration"
        });
      } catch (error) {
        return handleFirestoreError(error, OperationType.DELETE, `users/${userId}/integrations/${id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', userId] });
    },
  });
}
