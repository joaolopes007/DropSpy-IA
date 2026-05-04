import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { logActivity } from "./useActivityLogs";

export interface Supplier {
  id: string;
  name: string;
  link: string;
  type: string;
  userId?: string;
  createdAt?: { seconds: number; nanoseconds: number };
}

export function useSuppliers() {
  const userId = auth.currentUser?.uid;

  return useQuery({
    queryKey: ['suppliers', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const q = query(collection(db, 'users', userId, 'suppliers'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Supplier[];
      } catch (error) {
        return handleFirestoreError(error, OperationType.LIST, `users/${userId}/suppliers`);
      }
    },
    enabled: !!userId
  });
}

export function useAddSupplier() {
  const queryClient = useQueryClient();
  const userId = auth.currentUser?.uid;

  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
      if (!userId) throw new Error('Não autenticado');
      try {
        const docRef = await addDoc(collection(db, 'users', userId, 'suppliers'), {
          ...supplier,
          userId,
          createdAt: serverTimestamp()
        });
        
        await logActivity(userId, {
          action: "Fornecedor Adicionado",
          description: `Você cadastrou o fornecedor "${supplier.name}" na sua lista personalizada.`,
          type: "supplier",
          metadata: { supplierId: docRef.id }
        });

        return { id: docRef.id, ...supplier };
      } catch (error) {
        return handleFirestoreError(error, OperationType.CREATE, `users/${userId}/suppliers`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', userId] });
    }
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  const userId = auth.currentUser?.uid;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Não autenticado');
      try {
        await deleteDoc(doc(db, 'users', userId, 'suppliers', id));
        
        await logActivity(userId, {
          action: "Fornecedor Removido",
          description: "Um fornecedor foi removido da sua lista personalizada.",
          type: "supplier"
        });
      } catch (error) {
        return handleFirestoreError(error, OperationType.DELETE, `users/${userId}/suppliers/${id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', userId] });
    }
  });
}
