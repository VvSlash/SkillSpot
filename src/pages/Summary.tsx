/*
  Plik: /src/pages/Summary.tsx
  Opis:
  Komponent Summary jest odpowiedzialny za wyświetlanie podsumowania wyników sesji treningowej użytkownika. 
  Wyświetla liczbę trafień, całkowitą liczbę celów, dokładność oraz średni czas reakcji.
*/

import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/react';

// Komponent Summary
const Summary: React.FC = () => {
  // Stan przechowujący dane ostatniej sesji treningowej
  const [session, setSession] = useState<{ hitCount: number; totalCues: number; accuracy: number; averageReactionTime: number } | null>(null);

  /*
    useEffect - Hook, który uruchamia się po załadowaniu komponentu. 
    Pobiera dane z localStorage, aby załadować wyniki ostatniej sesji treningowej.
  */
  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    if (sessions.length > 0) {
      setSession(sessions[sessions.length - 1]); // Załaduj najnowszą sesję
    }
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Training Summary</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {session ? (
          <div>
            <h2>Hits: {session.hitCount}</h2> {/* Liczba trafień */}
            <h2>Total Cues: {session.totalCues}</h2> {/* Całkowita liczba celów */}
            <h2>Accuracy: {session.accuracy.toFixed(2)}%</h2> {/* Dokładność w procentach */}
            <h2>Average Reaction Time: {session.averageReactionTime.toFixed(2)} ms</h2> {/* Średni czas reakcji */}
          </div>
        ) : (
          <p>No session data available.</p> 
        )} {/* Komunikat, gdy brak danych sesji */}
        <IonButton expand="block" routerLink="/home">Go to Home</IonButton> {/* Przycisk do przejścia do strony głównej */}
      </IonContent>
    </IonPage>
  );
};

export default Summary;

/*
  Podsumowanie:
  - Komponent Summary wyświetla podsumowanie wyników ostatniej sesji treningowej.
  - Pobiera dane z localStorage, aby wyświetlić liczbę trafień, całkowitą liczbę celów, dokładność oraz średni czas reakcji.
  - Umożliwia użytkownikowi powrót do strony głównej za pomocą przycisku.
*/