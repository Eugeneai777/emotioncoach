import { useEffect, useRef, useState, useCallback } from 'react';
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
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Use ref to prevent multiple sync attempts (not for state tracking)
  const syncAttemptedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Guard: no user
    if (!user?.id) {
      return;
    }
    
    // Guard: user changed, reset attempt flag
    if (lastUserIdRef.current !== user.id) {
      lastUserIdRef.current = user.id;
      syncAttemptedRef.current = false;
      setSyncComplete(false);
    }
    
    // Guard: already attempted for this user
    if (syncAttemptedRef.current) {
      return;
    }
    
    // Check localStorage first (synchronous check)
    const storedUserId = localStorage.getItem(SYNC_STORAGE_KEY);
    if (storedUserId === user.id) {
      setSyncComplete(true);
      syncAttemptedRef.current = true;
      return;
    }
    
    // Mark as attempted immediately to prevent re-runs
    syncAttemptedRef.current = true;

    const syncAwakeningProgress = async () => {
      setIsSyncing(true);
      
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
          setIsSyncing(false);
          return;
        }
        
        // If progress exists, mark complete
        if (existingProgress) {
          localStorage.setItem(SYNC_STORAGE_KEY, user.id);
          setSyncComplete(true);
          setIsSyncing(false);
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
          syncAttemptedRef.current = false;
          setIsSyncing(false);
          return;
        }
        
        // No assessment means user hasn't completed Day 0
        if (!assessment) {
          localStorage.setItem(SYNC_STORAGE_KEY, user.id);
          setSyncComplete(true);
          setIsSyncing(false);
          return;
        }
        
        // 3. Calculate baseline awakening (inverted health score)
        // Note: Each layer scores 0-50, total max is 150
        const totalScore = (assessment.behavior_score || 0) + 
                           (assessment.emotion_score || 0) + 
                           (assessment.belief_score || 0);
        const healthScore = Math.round((totalScore / 150) * 100);
        const baselineAwakening = 100 - healthScore;
        
        // 4. Get journal entries
        const { data: journalEntries } = await supabase
          .from('wealth_journal_entries')
          .select('behavior_score, emotion_score, belief_score')
          .eq('user_id', user.id)
          .order('day_number', { ascending: false });
        
        // Calculate current awakening
        let currentAwakening = baselineAwakening;
        let totalPoints = 10;
        
        if (journalEntries && journalEntries.length > 0) {
          const awakeningScores = journalEntries.map(entry => {
            const avgScore = ((entry.behavior_score || 3) + (entry.emotion_score || 3) + (entry.belief_score || 3)) / 3;
            return Math.round((avgScore - 1) / 4 * 100);
          });
          
          const sortedScores = [...awakeningScores].sort((a, b) => b - a);
          const topScores = sortedScores.slice(0, 3);
          currentAwakening = Math.round(topScores.reduce((a, b) => a + b, 0) / topScores.length);
          totalPoints += journalEntries.length * 55;
        }
        
        // Calculate level
        const levelThresholds = [0, 50, 150, 300, 500, 800];
        let currentLevel = 1;
        for (let i = 0; i < levelThresholds.length; i++) {
          if (totalPoints >= levelThresholds[i]) {
            currentLevel = i + 1;
          }
        }
        
        // 5. Create progress record
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
          syncAttemptedRef.current = false;
          setIsSyncing(false);
          return;
        }
        
        console.log('✅ Synced awakening progress for user:', user.id);
        
        queryClient.invalidateQueries({ queryKey: ['awakening-progress'] });
        localStorage.setItem(SYNC_STORAGE_KEY, user.id);
        setSyncComplete(true);
        
      } catch (error) {
        console.error('Error syncing awakening progress:', error);
        syncAttemptedRef.current = false;
      } finally {
        setIsSyncing(false);
      }
    };

    syncAwakeningProgress();
  }, [user?.id, queryClient]);

  return { isSyncing, syncComplete };
};
