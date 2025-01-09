import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import './TrainingStats.css';

export interface TrainingStatsRef {
  updateHits: (hits: number) => void;
  updateCues: (cues: number) => void;
  updateReactionTime: (time: number) => void;
  reset: () => void;
  getStats: () => {
    hits: number;
    totalCues: number;
    reactionTimes: number[];
    accuracy: number;
    averageReactionTime: number;
  };
}

interface TrainingStatsProps {
  onStatsUpdate?: (stats: { 
    hits: number; 
    totalCues: number; 
    reactionTimes: number[]; 
  }) => void;
}

export const TrainingStats = forwardRef<TrainingStatsRef, TrainingStatsProps>(
  ({ onStatsUpdate }, ref) => {
    const statsRef = useRef({
      hits: 0,
      totalCues: 0,
      reactionTimes: [] as number[],
      accuracy: 0,
      avgReactionTime: 0,
      rollingSum: 0,
      windowSize: 50
    });

    const hitsDisplayRef = useRef<HTMLDivElement>(null);
    const cuesDisplayRef = useRef<HTMLDivElement>(null);
    const accuracyDisplayRef = useRef<HTMLDivElement>(null);
    const reactionTimeDisplayRef = useRef<HTMLDivElement>(null);
    const updateTimeoutRef = useRef<number>();

    // Debounced update with direct DOM manipulation
    const updateDisplays = () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = window.setTimeout(() => {
        const { hits, totalCues, reactionTimes, rollingSum, windowSize } = statsRef.current;
        
        // Pre-calculate stats
        const accuracy = totalCues > 0 ? (hits / totalCues) * 100 : 0;
        const avgReactionTime = reactionTimes.length > 0 
          ? rollingSum / Math.min(reactionTimes.length, windowSize) 
          : 0;

        // Direct DOM updates
        const updates = new Map([
          [hitsDisplayRef.current, `Trafienia: ${hits}`],
          [cuesDisplayRef.current, `Cele: ${totalCues}`],
          [accuracyDisplayRef.current, `Dokładność: ${accuracy.toFixed(1)}%`],
          [reactionTimeDisplayRef.current, `Średni czas: ${(avgReactionTime / 1000).toFixed(2)}s`]
        ]);

        // Batch update in one go
        updates.forEach((text, element) => {
          if (element && element.textContent !== text) {
            element.textContent = text;
          }
        });

        // Notify parent
        if (onStatsUpdate) {
          onStatsUpdate({ 
            hits, 
            totalCues, 
            reactionTimes: reactionTimes.slice(-windowSize) 
          });
        }
      }, 16); // Minimum delay between updates
    };

    useImperativeHandle(ref, () => ({
      updateHits: (hits: number) => {
        statsRef.current.hits = hits;
        updateDisplays();
      },
      updateCues: (cues: number) => {
        statsRef.current.totalCues = cues;
        updateDisplays();
      },
      updateReactionTime: (time: number) => {
        const { reactionTimes, windowSize, rollingSum } = statsRef.current;
        
        if (reactionTimes.length >= windowSize) {
          statsRef.current.rollingSum = rollingSum - reactionTimes[0] + time;
          reactionTimes.shift();
        } else {
          statsRef.current.rollingSum = rollingSum + time;
        }
        
        reactionTimes.push(time);
        updateDisplays();
      },
      reset: () => {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        statsRef.current = {
          hits: 0,
          totalCues: 0,
          reactionTimes: [],
          accuracy: 0,
          avgReactionTime: 0,
          rollingSum: 0,
          windowSize: 50
        };
        updateDisplays();
      },
      getStats: () => {
        const { hits, totalCues, reactionTimes, rollingSum, windowSize } = statsRef.current;
        const accuracy = totalCues > 0 ? (hits / totalCues) * 100 : 0;
        const averageReactionTime = reactionTimes.length > 0 
          ? rollingSum / Math.min(reactionTimes.length, windowSize)
          : 0;
        return { 
          hits, 
          totalCues, 
          reactionTimes: reactionTimes.slice(-windowSize),
          accuracy, 
          averageReactionTime 
        };
      }
    }));

    return (
      <div className="training-stats">
        <div className="stats-row">
          <div ref={cuesDisplayRef}>Cele: 0</div>
          <div ref={hitsDisplayRef}>Trafienia: 0</div>
        </div>
        <div className="stats-row">
          <div ref={accuracyDisplayRef}>Dokładność: 0%</div>
          <div ref={reactionTimeDisplayRef}>Średni czas: 0.00s</div>
        </div>
      </div>
    );
  }
); 