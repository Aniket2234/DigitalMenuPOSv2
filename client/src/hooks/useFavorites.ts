import { useQuery, useMutation } from '@tanstack/react-query';
import { useCustomer } from '@/contexts/CustomerContext';
import { apiRequest, queryClient } from '@/lib/queryClient';

export function useFavorites() {
  const { customer } = useCustomer();

  const { data: favoritesData, isLoading } = useQuery<{ favorites: string[] }>({
    queryKey: ['/api/customers', customer?._id, 'favorites'],
    enabled: !!customer?._id,
  });

  const favorites = new Set(favoritesData?.favorites || []);

  const addFavoriteMutation = useMutation({
    mutationFn: async (menuItemId: string) => {
      if (!customer?._id) throw new Error("Not logged in");
      await apiRequest("POST", `/api/customers/${customer._id}/favorites`, { menuItemId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers', customer?._id, 'favorites'] });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (menuItemId: string) => {
      if (!customer?._id) throw new Error("Not logged in");
      await apiRequest("DELETE", `/api/customers/${customer._id}/favorites/${menuItemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers', customer?._id, 'favorites'] });
    },
  });

  const toggleFavorite = (itemId: string) => {
    if (!customer?._id) {
      console.warn("Cannot toggle favorite: Customer not logged in");
      return;
    }
    
    if (favorites.has(itemId)) {
      removeFavoriteMutation.mutate(itemId);
    } else {
      addFavoriteMutation.mutate(itemId);
    }
  };

  const isFavorite = (itemId: string) => favorites.has(itemId);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    favoritesCount: favorites.size,
    isLoading,
  };
}
