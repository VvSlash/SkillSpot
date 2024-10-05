/*
  Plik: /src/pages/Progress.tsx
  Opis:
  Komponent Progress jest odpowiedzialny za wyświetlanie listy wszystkich sesji treningowych użytkownika.
  Każda sesja zawiera informacje o liczbie trafień, średnim czasie reakcji oraz dokładności.
*/

import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel } from '@ionic/react';

// Komponent Progress
const Progress: React.FC = () => {
  // Stan przechowujący wszystkie zapisane sesje treningowe
  const [sessions, setSessions] = useState<any[]>([]);

  /*
    useEffect - Hook, który uruchamia się po załadowaniu komponentu.
    Pobiera dane z localStorage, aby załadować wszystkie zapisane sesje treningowe.
  */
  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    setSessions(savedSessions);
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Progress</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          {sessions.map((session, index) => (
            <IonItem key={index}>
              <IonLabel>
                <h2>Session {index + 1}</h2> {/* Numer sesji */}
                <p>Hits: {session.hitCount}</p> {/* Liczba trafień w sesji */}
                <p>Average Reaction Time: {session.averageReactionTime.toFixed(2)} ms</p> {/* Średni czas reakcji w milisekundach */}
                <p>Accuracy: {session.accuracy}%</p> {/* Dokładność w procentach */}
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Progress;

/*
  Podsumowanie:
  - Komponent Progress wyświetla listę wszystkich zapisanych sesji treningowych.
  - Pobiera dane z localStorage, aby wyświetlić szczegóły każdej sesji, takie jak liczba trafień, średni czas reakcji oraz dokładność.
  - Wyświetla sesje w postaci listy, gdzie każda sesja jest reprezentowana jako element IonItem.
*/