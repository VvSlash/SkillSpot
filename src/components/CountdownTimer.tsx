/*
  Plik: /src/components/CountdownTimer.tsx
  Opis: Komponent odliczający czas do rozpoczęcia treningu
*/

import React, { useEffect, useState } from 'react';
import { IonText } from '@ionic/react';
import './CountdownTimer.css';

interface Props {
  duration?: number; // czas w sekundach
  onComplete: () => void;
}

const CountdownTimer: React.FC<Props> = ({ duration = 5, onComplete }) => {
  const [count, setCount] = useState(duration);

  useEffect(() => {
    if (count === 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setCount(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [count, onComplete]);

  return (
    <div className="countdown-overlay">
      <div className="countdown-container">
        <IonText color="light">
          <div className="countdown-number">{count}</div>
          <div className="countdown-text">Ustaw się w zaznaczonym obszarze</div>
        </IonText>
      </div>
      <div className="training-area">
        <div className="area-marker top-left" />
        <div className="area-marker top-right" />
        <div className="area-marker bottom-left" />
        <div className="area-marker bottom-right" />
        <div className="human-silhouette">
          {/* Głowa */}
          <div className="silhouette-head" />
          {/* Tułów */}
          <div className="silhouette-body" />
          {/* Ręce */}
          <div className="silhouette-arm left" />
          <div className="silhouette-arm right" />
          {/* Nogi */}
          <div className="silhouette-leg left" />
          <div className="silhouette-leg right" />
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer; 