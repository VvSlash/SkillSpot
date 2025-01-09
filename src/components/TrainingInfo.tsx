/*
  Plik: /src/components/TrainingInfo.tsx
  Opis: Komponent wyświetlający informacje o treningu w formie przewijanej karuzeli kart
*/

import React, { useState, useEffect, useRef } from 'react';
import { IonCard, IonCardContent, IonText } from '@ionic/react';
import { CompleteTrainingConfig } from '../types/training';
import { predefinedTrainings } from '../config/predefinedTrainings';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import './TrainingInfo.css';

interface Props {
  config: CompleteTrainingConfig;
  onTrainingSelect: (trainingId: string) => void;
}

interface BestScore {
  accuracy: number;
  averageReactionTime: number;
  timestamp: Date;
}

const TrainingInfo: React.FC<Props> = ({ config, onTrainingSelect }) => {
  const swiperRef = useRef<SwiperType>();
  // Połącz predefiniowane treningi z treningami użytkownika
  const [allTrainings, setAllTrainings] = useState(() => {
    const stored = localStorage.getItem('customTrainings');
    const customTrainings = stored ? JSON.parse(stored) : [];
    return [...predefinedTrainings, ...customTrainings];
  });

  // Aktualizuj listę treningów gdy zmienia się localStorage
  useEffect(() => {
    const loadTrainings = () => {
      const stored = localStorage.getItem('customTrainings');
      const customTrainings = stored ? JSON.parse(stored) : [];
      setAllTrainings([...predefinedTrainings, ...customTrainings]);
    };

    loadTrainings();
    window.addEventListener('storage', loadTrainings);
    return () => window.removeEventListener('storage', loadTrainings);
  }, []);

  // Efekt przesuwający slajder do wybranego treningu
  useEffect(() => {
    if (swiperRef.current) {
      const index = allTrainings.findIndex(t => t.id === config.selectedTraining.id);
      if (index >= 0) {
        swiperRef.current.slideTo(index);
      }
    }
  }, [config.selectedTraining.id, allTrainings]);

  // Pobierz najlepszy wynik dla wybranego treningu
  const getBestScore = (trainingId: string): BestScore | null => {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const trainingScores = sessions.filter((s: any) => s.trainingId === trainingId);
    
    if (trainingScores.length === 0) return null;

    return trainingScores.reduce((best: any, current: any) => {
      if (!best || current.accuracy > best.accuracy) {
        return current;
      }
      return best;
    }, null);
  };

  // Znajdź początkowy indeks dla aktualnie wybranego treningu
  const initialSlide = allTrainings.findIndex(t => t.id === config.selectedTraining.id);

  return (
    <div className="training-info-container">
      <Swiper
        modules={[Pagination]}
        spaceBetween={20}
        slidesPerView={1}
        pagination={{ clickable: true }}
        initialSlide={initialSlide >= 0 ? initialSlide : 0}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper) => {
          const training = allTrainings[swiper.activeIndex];
          if (training) {
            onTrainingSelect(training.id);
          }
        }}
        className="training-swiper"
        style={{ padding: '20px 0' }}
      >
        {allTrainings.map((training) => {
          const bestScore = getBestScore(training.id);
          return (
            <SwiperSlide key={training.id}>
              <div className="training-slide">
                <div 
                  className="training-slide-background"
                  style={{ backgroundImage: `url(${training.imageUrl})` }}
                />
                <IonCard className="training-slide-content">
                  <IonCardContent>
                    <IonText color="light">
                      <h1 className="training-title">
                        {training.name}
                      </h1>
                      <p className="training-description">
                        {training.description}
                      </p>
                      <div className="training-section">
                        <h2 className="section-title">
                          Aktywne kończyny:
                        </h2>
                        <ul className="keypoints-list">
                          {config.adjustments.enabledKeypoints.leftWrist && (
                            <li>✓ Lewa ręka</li>
                          )}
                          {config.adjustments.enabledKeypoints.rightWrist && (
                            <li>✓ Prawa ręka</li>
                          )}
                          {config.adjustments.enabledKeypoints.leftAnkle && (
                            <li>✓ Lewa noga</li>
                          )}
                          {config.adjustments.enabledKeypoints.rightAnkle && (
                            <li>✓ Prawa noga</li>
                          )}
                        </ul>
                      </div>
                      <div className="training-section">
                        <h2 className="section-title">
                          Parametry:
                        </h2>
                        <p>Prędkość: {config.adjustments.speed}x</p>
                        <p>Rozmiar celów: {config.adjustments.trainingArea.targetSize}px</p>
                        <p>Promień trafienia: {config.adjustments.trainingArea.hitRadius}px</p>
                      </div>
                      {bestScore && (
                        <div className="best-score-section">
                          <h2 className="section-title">
                            Najlepszy wynik:
                          </h2>
                          <p>Dokładność: {bestScore.accuracy.toFixed(1)}%</p>
                          <p>Średni czas reakcji: {(bestScore.averageReactionTime / 1000).toFixed(2)}s</p>
                          <p>Data: {new Date(bestScore.timestamp).toLocaleDateString()}</p>
                        </div>
                      )}
                    </IonText>
                  </IonCardContent>
                </IonCard>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};

export default TrainingInfo; 