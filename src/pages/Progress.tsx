/*
  Plik: /src/pages/Progress.tsx
  Opis:
  Komponent Progress jest odpowiedzialny za wyświetlanie listy wszystkich sesji treningowych użytkownika.
  Każda sesja zawiera informacje o liczbie trafień, średnim czasie reakcji oraz dokładności.
  
  Zmiany:
  - Dodano funkcję eksportu do CSV
  - Rozszerzono widok o dodatkowe statystyki
  - Dodano formatowanie daty
  - Dodano przycisk eksportu
  - Poprawiono format daty w CSV
*/

import React, { useState, useEffect } from 'react';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonLabel,
  IonButton,
  IonIcon,
  IonButtons
} from '@ionic/react';
import { download } from 'ionicons/icons';
import { predefinedTrainings } from '../config/predefinedTrainings';

interface TrainingSession {
  trainingId: string;
  hitCount: number;
  totalCues: number;
  accuracy: number;
  averageReactionTime: number;
  trainingTime: number;
  timestamp: number;
}

// Komponent Progress
const Progress: React.FC = () => {
  // Stan przechowujący wszystkie zapisane sesje treningowe
  const [sessions, setSessions] = useState<TrainingSession[]>([]);

  // Funkcja formatująca datę do wyświetlenia
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Funkcja formatująca datę do CSV
  const formatDateForCSV = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toISOString()
      .replace('T', ' ')
      .slice(0, 19);
  };

  // Funkcja formatująca czas treningu
  const formatTrainingTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Funkcja pobierająca nazwę treningu
  const getTrainingName = (trainingId: string): string => {
    const training = predefinedTrainings.find(t => t.id === trainingId);
    return training ? training.name : 'Nieznany trening';
  };

  // Funkcja zabezpieczająca wartości CSV
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  // Funkcja eksportująca dane do CSV
  const exportToCSV = () => {
    // Nagłówki CSV
    const headers = [
      'Data',
      'Nazwa treningu',
      'Liczba trafień',
      'Całkowita liczba wskazówek',
      'Dokładność (%)',
      'Średni czas reakcji (ms)',
      'Czas treningu'
    ].join(',');

    // Dane sesji
    const csvData = sessions.map(session => [
      formatDateForCSV(session.timestamp),
      escapeCSV(getTrainingName(session.trainingId)),
      session.hitCount,
      session.totalCues,
      session.accuracy.toFixed(2),
      session.averageReactionTime.toFixed(2),
      formatTrainingTime(session.trainingTime)
    ].map(String).map(escapeCSV).join(','));

    // Połącz wszystko w jeden string
    const csvContent = [headers, ...csvData].join('\n');

    // Utwórz i pobierz plik
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `trening_statystyki_${formatDateForCSV(Date.now()).replace(/[: ]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /*
    useEffect - Hook, który uruchamia się po załadowaniu komponentu.
    Pobiera dane z localStorage, aby załadować wszystkie zapisane sesje treningowe.
  */
  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    setSessions(savedSessions.sort((a: TrainingSession, b: TrainingSession) => b.timestamp - a.timestamp));
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Postępy</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={exportToCSV}>
              <IonIcon slot="icon-only" icon={download} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          {sessions.map((session, index) => (
            <IonItem key={index}>
              <IonLabel>
                <h2>{getTrainingName(session.trainingId)}</h2>
                <p>Data: {formatDate(session.timestamp)}</p>
                <p>Trafienia: {session.hitCount} / {session.totalCues}</p>
                <p>Dokładność: {session.accuracy.toFixed(1)}%</p>
                <p>Średni czas reakcji: {session.averageReactionTime.toFixed(0)} ms</p>
                <p>Czas treningu: {formatTrainingTime(session.trainingTime)}</p>
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