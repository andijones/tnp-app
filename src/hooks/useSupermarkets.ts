// Hook to fetch available supermarkets from both legacy and new tables
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase/config';

export const useSupermarkets = () => {
  const [supermarkets, setSupermarkets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupermarkets = async () => {
      try {
        // Fetch from both sources in parallel
        const [legacyResult, newResult] = await Promise.all([
          // Legacy: Get unique supermarkets from foods table
          supabase
            .from('foods')
            .select('supermarket')
            .not('supermarket', 'is', null)
            .not('supermarket', 'eq', '')
            .eq('status', 'approved'),

          // New: Get all from food_supermarkets table
          supabase
            .from('food_supermarkets')
            .select('supermarket')
        ]);

        // Combine and deduplicate
        const allSupermarkets = new Set<string>();

        legacyResult.data?.forEach(item => {
          if (item.supermarket) allSupermarkets.add(item.supermarket);
        });

        newResult.data?.forEach(item => {
          if (item.supermarket) allSupermarkets.add(item.supermarket);
        });

        // Convert to sorted array
        const uniqueSupermarkets = Array.from(allSupermarkets).sort();
        setSupermarkets(uniqueSupermarkets);
      } catch (error) {
        console.error('Error fetching supermarkets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupermarkets();
  }, []);

  return { supermarkets, loading };
};
