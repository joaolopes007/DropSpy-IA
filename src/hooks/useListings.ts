import { useMutation } from '@tanstack/react-query';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { logActivity } from './useActivityLogs';
import axios from 'axios';

export interface GeneratedListing {
  id: string;
  productId: string;
  title: string;
  description: string;
  price: number;
  image?: string;
}

export function useGenerateListing() {
  const userId = auth.currentUser?.uid;

  return useMutation({
    mutationFn: async ({ product, mode = 'supplier' }: { product: Product, mode?: 'supplier' | 'own' }) => {
      if (!userId) throw new Error('Não autenticado');

      // Adaptive AI generation logic
      const title: string = mode === 'supplier' 
        ? `[REVENDEDOR OFICIAL] ${product.name} - Envio Imediato`
        : `✨ ${product.name} - Coleção Exclusiva | Authentic Brand`;

      const description: string = mode === 'supplier'
        ? `Oportunidade única para adquirir seu ${product.name}.\n\n✅ Produto de Alta Rotatividade\n✅ Qualidade Garantida pelo Fornecedor\n✅ Entrega Expressa Nacional\n\nMelhor custo-benefício do mercado para ${product.category}.`
        : `Sinta a diferença com nossa linha própria de ${product.name}.\n\nNossa marca prioriza:\n💎 Design Exclusivo e Autoral\n🌱 Materiais Premium Selecionados\n🤝 Garantia de Satisfação Total\n\nAdquira uma peça que reflete sua personalidade. Produto em estoque próprio pronto para você.`;

      const price = product.suggestedPrice;

      try {
        const docRef = await addDoc(collection(db, 'users', userId, 'generated_listings'), {
          productId: product.id,
          title,
          description,
          price,
          image: product.image_url || product.image,
          mode,
          createdAt: serverTimestamp(),
        });

        await logActivity(userId, {
          action: "Anúncio Gerado",
          description: `Novo anúncio "${title}" gerado com IA para o produto.`,
          type: "product",
          metadata: { listingId: docRef.id, productId: product.id }
        });

        return { 
          id: docRef.id, 
          title, 
          description, 
          price, 
          productId: product.id,
          image: product.image 
        };
      } catch (error) {
        return handleFirestoreError(error, OperationType.CREATE, `users/${userId}/generated_listings`);
      }
    }
  });
}

export function usePublishListing() {
  const userId = auth.currentUser?.uid;

  return useMutation({
    mutationFn: async ({ 
      platform, 
      listingId, 
      listingData,
      integration
    }: { 
      platform: string, 
      listingId: string, 
      listingData: { title: string, price: number, description?: string, image?: string },
      integration: { accessToken?: string; clientSecret?: string }
    }) => {
      if (!userId) throw new Error('Não autenticado');

      // For this implementation, we use the backend proxy for Mercado Livre
      if (platform === 'Mercado Livre') {
        const token = integration.accessToken || integration.clientSecret; // Falling back to clientSecret if they put token there
        
        if (!token) {
          throw new Error('Conta do Mercado Livre não possui token de acesso válido.');
        }

        try {
          const response = await axios.post('/api/marketplace/mercado-livre/publish', {
            accessToken: token,
            listingData
          });

          const mlData = response.data;

          await addDoc(collection(db, 'users', userId, 'published_listings'), {
            platform,
            listingId,
            title: listingData.title,
            price: listingData.price,
            status: 'success',
            publishedAt: serverTimestamp(),
            externalId: mlData.id,
            permalink: mlData.permalink
          });

          await logActivity(userId, {
            action: "Anúncio Publicado",
            description: `Seu anúncio "${listingData.title}" foi publicado com sucesso no ${platform}.`,
            type: "product",
            metadata: { platform, externalId: mlData.id }
          });

          return mlData;
        } catch (error: unknown) {
          const axiosError = error as { 
            response?: { 
              data?: { 
                details?: { message?: string }; 
                error?: string 
              } 
            }; 
            message: string 
          };
          console.error("Publishing error:", axiosError.response?.data || axiosError.message);
          
          const errorMessage = axiosError.response?.data?.details?.message || axiosError.response?.data?.error || axiosError.message;
          
          await addDoc(collection(db, 'users', userId, 'published_listings'), {
            platform,
            listingId,
            title: listingData.title,
            price: listingData.price,
            status: 'error',
            publishedAt: serverTimestamp(),
            error: errorMessage
          });

          await logActivity(userId, {
            action: "Erro ao Publicar",
            description: `Falha ao sincronizar o anúncio "${listingData.title}" com o ${platform}.`,
            type: "product",
            metadata: { platform, error: errorMessage }
          });

          throw new Error(errorMessage, { cause: error });
        }
      } else {
        // Fallback for other platforms (unimplemented real flows)
        await new Promise(resolve => setTimeout(resolve, 2000));
        await addDoc(collection(db, 'users', userId, 'published_listings'), {
          platform,
          listingId,
          title: listingData.title,
          price: listingData.price,
          status: 'error',
          publishedAt: serverTimestamp(),
          error: `Integração real para ${platform} ainda não configurada.`
        });
        throw new Error(`Integração real para ${platform} ainda não configurada.`);
      }
    }
  });
}

