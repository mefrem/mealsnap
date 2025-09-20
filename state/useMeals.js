import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { db } from '@/config/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter, 
  addDoc, 
  serverTimestamp,
  doc,
  deleteDoc
} from 'firebase/firestore';

export const useMeals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mealsQuery = useQuery({
    queryKey: ['meals', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      
      const q = query(
        collection(db, `meals/${user.uid}/items`),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },
    enabled: !!user,
  });

  const addMealMutation = useMutation({
    mutationFn: async (mealData) => {
      if (!user) throw new Error('User not authenticated');
      
      const docData = {
        ...mealData,
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, `meals/${user.uid}/items`), docData);
      return { id: docRef.id, ...docData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', user?.uid] });
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (mealId) => {
      if (!user) throw new Error('User not authenticated');
      
      await deleteDoc(doc(db, `meals/${user.uid}/items`, mealId));
      return mealId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', user?.uid] });
    },
  });

  return {
    meals: mealsQuery.data || [],
    isLoading: mealsQuery.isLoading,
    error: mealsQuery.error,
    refetch: mealsQuery.refetch,
    addMeal: addMealMutation.mutate,
    deleteMeal: deleteMealMutation.mutate,
    isAddingMeal: addMealMutation.isPending,
    isDeletingMeal: deleteMealMutation.isPending,
  };
};

export const useMealsByRange = (startDate, endDate) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['meals', user?.uid, 'range', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (!user || !startDate || !endDate) return [];
      
      const q = query(
        collection(db, `meals/${user.uid}/items`),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(q);
      const allMeals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter by date range on client side (since Firestore where clauses are limited)
      return allMeals.filter(meal => {
        const mealDate = meal.createdAt?.toDate ? meal.createdAt.toDate() : new Date(meal.createdAt);
        return mealDate >= startDate && mealDate <= endDate;
      });
    },
    enabled: !!user && !!startDate && !!endDate,
  });
};
