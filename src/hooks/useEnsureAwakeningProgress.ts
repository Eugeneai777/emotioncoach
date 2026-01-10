import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

const SYNC_STORAGE_KEY = 'awakening_sync_complete';

/**
 * Hook to ensure awakening progress exists for users who have completed assessment
 * This syncs historical user data to the new user_awakening_progress table
 * Uses refs to prevent infinite loops and localStorage for persistence
 */
export const useEnsureAwakeningProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [syncComplete, setSyncComplete] = useState(false);
  
  // Use refs to prevent re-renders and infinite loops
  const syncAttemptedRef = useRef(false);
  const isSyncingRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const syncAwakeningProgress = async () => {
      // Guard: no user
      if (!user?.id) {
        return;
      }
      
      // Guard: user changed, reset refs
      if (currentUserIdRef.current !== user.id) {
        currentUserIdRef.current = user.id;
        syncAttemptedRef.current = false;
        isSyncingRef.current = false;
      }
      
      // Guard: already attempted or syncing
      if (syncAttemptedRef.current || isSyncingRef.current) {
        return;
      }
      
      // Check localStorage for this user
      const storedUserId = localStorage.getItem(SYNC_STORAGE_KEY);
      if (storedUserId === user.id) {
        setSyncComplete(true);
        return;
      }
      
      syncAttemptedRef.current = true;
      isSyncingRef.current = true;
      
      try {
        // 1. Check if awakening progress already exists
        const { data: existingProgress, error: progressError } = await supabase
          .from('user_awakening_progress')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (progressError) {
          console.error('Error checking awakening progress:', progressError);
          syncAttemptedRef.current = false; // Allow retry
          return;
        }
        
        // If progress exists, mark complete and save to localStorage
        if (existingProgress) {
          localStorage.setItem(SYNC_STORAGE_KEY, user.id);
          setSyncComplete(true);
          isSyncingRef.current = false;
          return;
        }
        
        // 2. Check if user has completed assessment
        const { data: assessment, error: assessmentError } = await supabase
          .from('wealth_block_assessments')
          .select('behavior_score, emotion_score, belief_score, dominant_poor, reaction_pattern')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (assessmentError) {
          console.error('Error fetching assessment:', assessmentError);
          syncAttemptedRef.current = false; // Allow retry
          return;
        }
        
        // No assessment means user hasn't completed Day 0
        if (!assessment) {
          localStorage.setItem(SYNC_STORAGE_KEY, user.id);
          setSyncComplete(true);
          isSyncingRef.current = false;
          return;
        }
        
        // 3. Calculate baseline awakening (inverted health score)
        const totalScore = (assessment.behavior_score || 0) + 
                           (assessment.emotion_score || 0) + 
                           (assessment.belief_score || 0);
        const healthScore = Math.round((totalScore / 300) * 100);
        const baselineAwakening = 100 - healthScore; // Higher awakening = better
        
        // 4. Get journal entries to calculate current awakening and points
        const { data: journalEntries, error: journalError } = await supabase
          .from('wealth_journal_entries')
          .select('behavior_score, emotion_score, belief_score')
          .eq('user_id', user.id)
          .order('day_number', { ascending: false });
        
        if (journalError) {
          console.error('Error fetching journal entries:', journalError);
        }
        
        // Calculate current awakening from best journal entries or use baseline
        let currentAwakening = baselineAwakening;
        let totalPoints = 10; // Starting points for completing assessment
        
        if (journalEntries && journalEntries.length > 0) {
          // Calculate awakening from journal entries (average of behavior, emotion, belief scores)
          const awakeningScores = journalEntries.map(entry => {
            const avgScore = (
              (entry.behavior_score || 3) + 
              (entry.emotion_score || 3) + 
              (entry.belief_score || 3)
            ) / 3;
            // Convert 1-5 scale to 0-100
            return Math.round((avgScore - 1) / 4 * 100);
          });
          
          // Use the best 3 days (peak performance model)
          const sortedScores = [...awakeningScores].sort((a, b) => b - a);
          const topScores = sortedScores.slice(0, 3);
          currentAwakening = Math.round(topScores.reduce((a, b) => a + b, 0) / topScores.length);
          
          // Calculate points: 20 per meditation, 20 per briefing, 15 per action
          totalPoints += journalEntries.length * 55; // Approximate points per day
        }
        
        // Calculate level based on points
        const levelThresholds = [0, 50, 150, 300, 500, 800];
        let currentLevel = 1;
        for (let i = 0; i < levelThresholds.length; i++) {
          if (totalPoints >= levelThresholds[i]) {
            currentLevel = i + 1;
          }
        }
        
        // 5. Create awakening progress record
        const { error: insertError } = await supabase
          .from('user_awakening_progress')
          .insert({
            user_id: user.id,
            baseline_awakening: baselineAwakening,
            baseline_behavior: assessment.behavior_score || 50,
            baseline_emotion: assessment.emotion_score || 50,
            baseline_belief: assessment.belief_score || 50,
            current_awakening: currentAwakening,
            current_level: currentLevel,
            total_points: totalPoints,
          });
        
        if (insertError) {
          console.error('Error creating awakening progress:', insertError);
          syncAttemptedRef.current = false; // Allow retry
          return;
        }
        
        console.log('✅ Synced awakening progress for user:', user.id);
        
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['awakening-progress'] });
        
        // Mark complete and save to localStorage
        localStorage.setItem(SYNC_STORAGE_KEY, user.id);
        setSyncComplete(true);
        
      } catch (error) {
        console.error('Error syncing awakening progress:', error);
        syncAttemptedRef.current = false; // Allow retry on error
      } finally {
        isSyncingRef.current = false;
      }
    };

    syncAwakeningProgress();
  }, [user?.id, queryClient]);

  return { 
    isSyncing: isSyncingRef.current && !syncComplete, 
    syncComplete 
  };
};
