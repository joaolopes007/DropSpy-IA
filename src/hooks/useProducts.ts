import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, collection, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { useAuth } from './useAuth';
import { logActivity } from './useActivityLogs';

export function calculateOpportunityScore(demand: number, competition: number, margin: number) {
  const score = (demand * 0.5) + ((100 - competition) * 0.3) + (margin * 0.2);
  return Math.min(Math.max(Math.round(score), 0), 100);
}

export function useDiscoverProducts(filters: {
  page?: number;
  limit?: number;
  category?: string;
  platform?: string;
  minScore?: number;
  maxPrice?: number;
  competition?: string;
}) {
  return useQuery({
    queryKey: ['discover_products', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
      
      const userId = auth.currentUser?.uid;
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao buscar produtos');
      }
      return response.json() as Promise<{
        data: Product[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
          hasMore: boolean;
        }
      }>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, 'products');
      }
    }
  });
}

export function useSavedProducts() {
  const userId = auth.currentUser?.uid;
  return useQuery({
    queryKey: ['saved_products', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const snap = await getDocs(collection(db, 'users', userId, 'saved_products'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, `users/${userId}/saved_products`);
      }
    },
    enabled: !!userId
  });
}

export function useSaveProduct() {
  const queryClient = useQueryClient();
  const userId = auth.currentUser?.uid;
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (product: Product) => {
      if (!userId) throw new Error('Não autenticado');
      
      const response = await fetch('/api/products/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, product })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar produto');
      }
      
      await logActivity(userId, {
        action: "Produto Minerado",
        description: `O produto "${product.name}" foi adicionado à sua lista de minerados.`,
        type: "product",
        metadata: { productId: product.id }
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_products', userId] });
      // Call refreshProfile to update the daily usage counter in the context
      refreshProfile();
    }
  });
}

export function useUnsaveProduct() {
  const queryClient = useQueryClient();
  const userId = auth.currentUser?.uid;

  return useMutation({
    mutationFn: async (saveId: string) => {
      if (!userId) throw new Error('Não autenticado');
      try {
        await deleteDoc(doc(db, 'users', userId, 'saved_products', saveId));
      } catch (error) {
        return handleFirestoreError(error, OperationType.DELETE, `users/${userId}/saved_products/${saveId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_products', userId] });
    }
  });
}

export function useCreateManualProduct() {
  const queryClient = useQueryClient();
  const userId = auth.currentUser?.uid;

  return useMutation({
    mutationFn: async (product: Partial<Product>) => {
      if (!userId) throw new Error('Não autenticado');
      
      try {
        const fullProduct = {
          ...product,
          id: `manual-${Date.now()}`,
          userId,
          mode: 'own',
          createdAt: new Date().toISOString(),
          trendStatus: 'up',
          score: 100,
          performance: 'Excelente'
        };
        
        const docRef = await addDoc(collection(db, 'users', userId, 'own_products'), fullProduct);
        
        await logActivity(userId, {
          action: "Produto Criado Manualmente",
          description: `Você cadastrou manualmente o produto "${product.name}".`,
          type: "product",
          metadata: { productId: docRef.id }
        });

        return { ...fullProduct, id: docRef.id };
      } catch (error) {
        return handleFirestoreError(error, OperationType.CREATE, `users/${userId}/own_products`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['own_products', userId] });
    }
  });
}

export function useOwnProducts() {
  const userId = auth.currentUser?.uid;
  return useQuery({
    queryKey: ['own_products', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const snap = await getDocs(collection(db, 'users', userId, 'own_products'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, `users/${userId}/own_products`);
      }
    },
    enabled: !!userId
  });
}

export function useDashboardStats() {
  const userId = auth.currentUser?.uid;
  return useQuery({
    queryKey: ['dashboard_stats', userId],
    queryFn: async () => {
      if (!userId) return { sales: 0, revenue: 0, listings: 0, messages: 0 };
      
      try {
        const [listingsSnap, savedSnap] = await Promise.all([
          getDocs(collection(db, 'users', userId, 'published_listings')),
          getDocs(collection(db, 'users', userId, 'saved_products'))
        ]);

        // In a real app, sales and revenue would come from a 'sales' collection
        // For now we assume 0 unless we implement a sales tracker
        return {
          sales: 0,
          revenue: 0,
          listings: listingsSnap.size,
          savedCount: savedSnap.size,
          messages: 0
        };
      } catch (error) {
        console.error("Error fetching stats:", error);
        return { sales: 0, revenue: 0, listings: 0, savedCount: 0, messages: 0 };
      }
    },
    enabled: !!userId
  });
}

