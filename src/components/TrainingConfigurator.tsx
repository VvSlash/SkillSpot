/*
  Plik: /src/components/TrainingConfigurator.tsx
  Opis: Komponent do konfiguracji treningu
*/

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonRange,
  IonToggle,
  IonButton,
  IonIcon,
  IonImg,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  SelectCustomEvent,
  IonInput,
} from "@ionic/react";
import type { RangeCustomEvent, ToggleCustomEvent } from "@ionic/core";
import {
  speedometerOutline,
  resizeOutline,
  radioButtonOnOutline,
  shuffleOutline,
  timerOutline,
  listOutline,
  handRightOutline,
  footstepsOutline,
  bodyOutline,
  documentOutline,
  cloudUpload,
} from "ionicons/icons";
import {
  PredefinedTraining,
  TrainingAdjustments,
  CompleteTrainingConfig,
  TrainingMapData,
} from "../types/training";
import { predefinedTrainings } from "../config/predefinedTrainings";
import { defaultAdjustments } from "../config/defaultAdjustments";
import { v4 as uuidv4 } from "uuid";

// Predefiniowane treningi
// const predefinedTrainings: PredefinedTraining[] = [
//   {
//     id: 'full-body-basic',
//     name: 'Trening całego ciała - podstawowy',
//     description: 'Podstawowy trening angażujący wszystkie kończyny, idealny na początek.',
//     category: 'full',
//     imageUrl: '/assets/trainings/full-body-basic.jpg',
//     config: {
//       // Domyślna konfiguracja dla treningu całego ciała
//     }
//   },
//   {
//     id: 'upper-body-intense',
//     name: 'Intensywny trening górnych partii',
//     description: 'Szybki trening skupiający się na koordynacji rąk.',
//     category: 'upper',
//     imageUrl: '/assets/trainings/upper-body-intense.jpg',
//     config: {
//       // Konfiguracja dla treningu górnych partii
//     }
//   },
//   {
//     id: 'lower-body-precision',
//     name: 'Trening precyzji nóg',
//     description: 'Trening skupiający się na precyzyjnych ruchach nóg.',
//     category: 'lower',
//     imageUrl: '/assets/trainings/lower-body-precision.jpg',
//     config: {
//       // Konfiguracja dla treningu dolnych partii
//     }
//   },
//   {
//     id: 'random-training',
//     name: 'Trening losowy',
//     description: 'Pełna losowość celów i sekwencji dla maksymalnej różnorodności.',
//     category: 'random',
//     imageUrl: '/assets/trainings/random-training.jpg',
//     config: {
//       // Konfiguracja dla treningu losowego
//     }
//   }
// ];

// Domyślne ustawienia
// const defaultAdjustments: TrainingAdjustments = {
//   speed: 1.0,
//   targetSize: 30,
//   hitRadius: 30,
//   variation: 0,
//   disappearingProbability: 0.3,
//   sequenceProbability: 0.2,
//   minSequenceSize: 2,
//   maxSequenceSize: 5,
//   followProbability: 0.2,
//   minFollowDuration: 2000,
//   maxFollowDuration: 5000,
//   enabledKeypoints: {
//     leftWrist: true,
//     rightWrist: true,
//     leftAnkle: true,
//     rightAnkle: true,
//   },
// //   keypointProbabilities: {
// //     leftWrist: 0.25,
// //     rightWrist: 0.25,
// //     leftAnkle: 0.25,
// //     rightAnkle: 0.25,
// //   },
//   targetProbabilities: {
//     handPair: 0.2,
//     handSingle: 0.15,
//     singleLeftWrist: 0.25,
//     singleRightWrist: 0.25,
//     singleLeftAnkle: 0.25,
//     singleRightAnkle: 0.25,
//     anyHand: 0.1,
//     anyFoot: 0.05,
//     footSingle: 0.05,
//     anyLimb: 0.05,
//     sequence: 0.2,
//     follow: 0.2,
//   },
//   sequenceConfig: {
//     minDelay: 500,
//     maxDelay: 2000,
//     enforceOrder: true,
//     showNumbers: true,
//     handProbability: 0.7,
//     pairProbability: 0.3,
//     footMinDelay: 1000,
//     footMaxDelay: 2000,
//   },
//   followConfig: {
//     minDuration: 2000,
//     maxDuration: 5000,
//     minRadius: 30,
//     maxRadius: 100,
//     circleProbability: 0.6,
//     showPath: true,
//     pathOpacity: 0.4,
//     followThreshold: 1000,
//   },
//   disappearingConfig: {
//     minDuration: 2000,
//     maxDuration: 5000,
//     sequenceBuffer: 1000,
//     probabilities: {
//       sequence: 0.3,
//       follow: 0.2,
//       handPair: 0.3,
//       singleHand: 0.4,
//       anyHand: 0.4,
//       anyFoot: 0.3,
//       anyLimb: 0.3,
//       singleFoot: 0.3,
//     },
//   },
// };

// Grupa A: pojedyncze kończyny
const SINGLE_KEYPOINT_TARGETS = [
  "singleLeftWrist",
  "singleRightWrist",
  "singleLeftAnkle",
  "singleRightAnkle",
] as const;

// Grupa B: cele „zbiorcze"
const MULTI_KEYPOINT_TARGETS = [
  "handPair",
  "handSingle",
  "footSingle",
  "anyHand",
  "anyFoot",
  "anyLimb",
  "sequence",
  "follow",
] as const;

// (opcjonalnie) Grupa C: np. "sequence", "follow" - jeśli chcesz jeszcze inny rozdział

interface Props {
  onConfigChange: (config: CompleteTrainingConfig) => void;
  initialConfig?: CompleteTrainingConfig;
  onTrainingSelect?: (trainingId: string) => void;
}

// Funkcja pomocnicza do renderowania suwaka z wartością
const renderSlider = (
  label: string,
  value: number,
  onChange: (value: number) => void,
  min: number,
  max: number,
  step: number,
  unit: string = "",
  icon?: string,
  disabled: boolean = false,
  key?: string
) => (
  <IonItem key={key} style={{ width: "100%" }}>
    {icon ? (
      <>
        <IonLabel position="stacked">{label}</IonLabel>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <IonRange
            min={min}
            max={max}
            step={step}
            value={value}
            onIonChange={(e: RangeCustomEvent) =>
              onChange(e.detail.value as number)
            }
            disabled={disabled}
          >
            <IonIcon slot="start" icon={icon} />
          </IonRange>
          <div style={{ minWidth: "4em", textAlign: "right" }}>
            {value.toFixed(unit === "%" ? 0 : 2)}
            {unit}
          </div>
        </div>
      </>
    ) : (
      <>
        <IonLabel position="stacked">{label}</IonLabel>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <IonRange
            min={min}
            max={max}
            step={step}
            value={value}
            onIonChange={(e: RangeCustomEvent) =>
              onChange(e.detail.value as number)
            }
            disabled={disabled}
          />
          <div style={{ minWidth: "4em", textAlign: "right" }}>
            {value.toFixed(unit === "%" ? 0 : 2)}
            {unit}
          </div>
        </div>
      </>
    )}
  </IonItem>
);

// Komponent główny
const TrainingConfigurator: React.FC<Props> = ({ onConfigChange, initialConfig, onTrainingSelect }): JSX.Element => {
  // Inicjalizacja stanu z initialConfig lub domyślnymi wartościami
  const [selectedTraining, setSelectedTraining] = useState<PredefinedTraining>(
    initialConfig?.selectedTraining || predefinedTrainings[0]
  );
  const [adjustments, setAdjustments] = useState<TrainingAdjustments>(
    initialConfig?.adjustments || defaultAdjustments
  );
  // 3. Mapa treningowa (jeżeli wczytaliśmy JSON)
  const [mapData, setMapData] = useState<TrainingMapData | null>(null);

  // 4. Lokalny stan do tworzenia nowego treningu (np. nazwa, opis, obrazek)
  const [newTrainingName, setNewTrainingName] = useState<string>("");
  const [newTrainingDesc, setNewTrainingDesc] = useState<string>("");
  const [newTrainingImage, setNewTrainingImage] = useState<string>("");

  // Jeśli nie mamy newTrainingImage, wyświetlamy placeholder
  const displayedImage = newTrainingImage || selectedTraining.imageUrl;

  // 5. Lista dostępnych treningów z localStorage / predefiniowanych
  const [trainingList, setTrainingList] = useState<PredefinedTraining[]>(() => {
    // Odczyt z localStorage i scalenie z domyślnymi.
    // Uwaga: W rzeczywistości warto rozważyć unikanie duplikatów, kluczy itp.
    const stored = localStorage.getItem("customTrainings");
    const parsed: PredefinedTraining[] = stored ? JSON.parse(stored) : [];
    return [...predefinedTrainings, ...parsed];
  });

  // Obliczanie konfiguracji przy użyciu useMemo
  const currentConfig = useMemo<CompleteTrainingConfig>(
    () => ({
      selectedTraining,
      adjustments,
    }),
    [selectedTraining, adjustments]
  );

  // Wywołanie onConfigChange przy użyciu useCallback
  const handleConfigChange = useCallback(() => {
    onConfigChange(currentConfig);
  }, [currentConfig, onConfigChange]);

  // Efekt aktualizujący konfigurację po zmianach
  useEffect(() => {
    handleConfigChange();
  }, [handleConfigChange]);

  // Obsługa wczytywania mapy treningowej
  const handleMapUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // 1. Odczyt JSON
          const mapData = JSON.parse(
            (e.target as FileReader).result as string
          ) as TrainingMapData;

          // 2. Ustawienie mapy treningowej
          setMapData(mapData);

          // 3. Tworzenie nowego treningu na podstawie mapy
          const mapTraining: PredefinedTraining = {
            id: `map-${mapData.name}-${uuidv4()}`,
            name: mapData.name,
            description: `Mapa treningowa stworzona przez ${mapData.author}`,
            category: "map",
            isMapTraining: true,
            mapData: mapData,
            config: {
              // Konfiguracja specyficzna dla mapy
            },
          };

          setSelectedTraining(mapTraining);
        } catch (error) {
          console.error("Błąd podczas wczytywania mapy:", error);
          // TODO: Dodać obsługę błędów
        }
      };
      reader.readAsText(file);
    }
  };

  // =====================================================================
  // Obsługa tworzenia NOWEGO treningu (proceduralnego)
  // =====================================================================
  const handleCreateNewTraining = () => {
    let finalName = newTrainingName;
  
    if (!newTrainingName) {
      const baseName = selectedTraining.name + "-custom";
      let count = 1;
      let testName = baseName + count;
      while (trainingList.some(t => t.name === testName)) {
        count++;
        testName = baseName + count;
      }
      finalName = testName;
    }
  
    const newId = `custom-${finalName.toLowerCase().replace(/\s+/g, "-")}-${uuidv4()}`;
  
    // Dodajemy 'adjustments' do pola config:
    const newProcTraining: PredefinedTraining = {
      id: newId,
      name: finalName,
      description: newTrainingDesc || "Nowy trening proceduralny",
      category: "random",
      isMapTraining: false,
      mapData: undefined,
      imageUrl: newTrainingImage || displayedImage,
      config: {
        // Zachowujemy np. całe aktualne 'adjustments' (lub wybrane pola).
        // W ten sposób przy ponownym załadowaniu treningu mamy te same parametry.
        trainingArea: {
          aspectRatio: adjustments.trainingArea.aspectRatio,
          margin: adjustments.trainingArea.margin,
          targetSize: adjustments.trainingArea.targetSize,
          hitRadius: adjustments.trainingArea.hitRadius,
          overlayOpacity: adjustments.trainingArea.overlayOpacity,
          upperZoneRatio: adjustments.trainingArea.upperZoneRatio,
        },
        defaultBehavior: adjustments.defaultBehavior,
        enabledKeypoints: {
            leftWrist: adjustments.enabledKeypoints.leftWrist,
            rightWrist: adjustments.enabledKeypoints.rightWrist,
            leftAnkle: adjustments.enabledKeypoints.leftAnkle,
            rightAnkle: adjustments.enabledKeypoints.rightAnkle,
        },
        targetProbabilities: {
          sequence: adjustments.targetProbabilities.sequence,
          follow: adjustments.targetProbabilities.follow,
          handPair: adjustments.targetProbabilities.handPair,
          singleLeftWrist: adjustments.targetProbabilities.singleLeftWrist,
          singleRightWrist: adjustments.targetProbabilities.singleRightWrist,
          singleLeftAnkle: adjustments.targetProbabilities.singleLeftAnkle,
          singleRightAnkle: adjustments.targetProbabilities.singleRightAnkle,
          anyHand: adjustments.targetProbabilities.anyHand,
          anyFoot: adjustments.targetProbabilities.anyFoot,
          anyLimb: adjustments.targetProbabilities.anyLimb,
        },
        sequenceConfig: {
            minSequenceSize: adjustments.sequenceConfig.minSequenceSize,
            maxSequenceSize: adjustments.sequenceConfig.maxSequenceSize,
            enforceOrder: adjustments.sequenceConfig.enforceOrder,
            showNumbers: adjustments.sequenceConfig.showNumbers,
            delayBetweenTargets: adjustments.sequenceConfig.delayBetweenTargets,
            handProbability: adjustments.sequenceConfig.handProbability,
            pairProbability: adjustments.sequenceConfig.pairProbability,
            footMinDelay: adjustments.sequenceConfig.footMinDelay,
            footMaxDelay: adjustments.sequenceConfig.footMaxDelay,
            minDelay: adjustments.sequenceConfig.minDelay,
            maxDelay: adjustments.sequenceConfig.maxDelay,
        },
        followConfig: {
            minDuration: adjustments.followConfig.minDuration,
            maxDuration: adjustments.followConfig.maxDuration,
            minRadius: adjustments.followConfig.minRadius,
            maxRadius: adjustments.followConfig.maxRadius,
            circleProbability: adjustments.followConfig.circleProbability,
            showPath: adjustments.followConfig.showPath,
            pathOpacity: adjustments.followConfig.pathOpacity,
            segments: {
                path: adjustments.followConfig.segments.path,
                circle: adjustments.followConfig.segments.circle,
                line: adjustments.followConfig.segments.line,
            },
        },
        disappearingConfig: {
            minDuration: adjustments.disappearingConfig.minDuration,
            maxDuration: adjustments.disappearingConfig.maxDuration,
            sequenceBuffer: adjustments.disappearingConfig.sequenceBuffer,
            probabilities: {
              sequence: adjustments.disappearingConfig.probabilities.sequence,
              follow: adjustments.disappearingConfig.probabilities.follow,
              handPair: adjustments.disappearingConfig.probabilities.handPair,
              singleHand: adjustments.disappearingConfig.probabilities.singleHand,
              anyHand: adjustments.disappearingConfig.probabilities.anyHand,
              anyFoot: adjustments.disappearingConfig.probabilities.anyFoot,
              anyLimb: adjustments.disappearingConfig.probabilities.anyLimb,
              singleFoot: adjustments.disappearingConfig.probabilities.singleFoot,
            },
        },
      },
    };
  
    // 1. Pobierz już zapisane customTrainings
    const stored = localStorage.getItem("customTrainings");
    const parsed: PredefinedTraining[] = stored ? JSON.parse(stored) : [];
  
    // 2. Dodaj nowy trening do customTrainings
    const updatedCustomList = [...parsed, newProcTraining];
  
    // 3. Zapisz w localStorage
    localStorage.setItem("customTrainings", JSON.stringify(updatedCustomList));
  
    // 4. Zaktualizuj trainingList (łącząc prel. z customami)
    const updatedFullList = [...predefinedTrainings, ...updatedCustomList];
    setTrainingList(updatedFullList);
  
    // 5. Ustaw nowy trening jako wybrany
    setSelectedTraining(newProcTraining);
  
    // Zerowanie stanów formularza
    setNewTrainingName("");
    setNewTrainingDesc("");
    setNewTrainingImage("");
  };

  // =====================================================================
  // Obsługa zapisu zmian w WYBRANYM treningu (update)
  // =====================================================================
  const handleSaveTraining = () => {
    // 1. Szukamy w trainingList (jeśli istnieje) i podmieniamy
    const trainingIndex = trainingList.findIndex(
      (t) => t.id === selectedTraining.id
    );
    if (trainingIndex === -1) {
      // Nie znaleziono w localStorage – np. to może być wstępnie predefiniowany
      // lub map. Możemy dodać go do customTrainings:
      const newList = [...trainingList, selectedTraining];
      setTrainingList(newList);
      localStorage.setItem("customTrainings", JSON.stringify(newList));
    } else {
      // Podmieniamy starą wersję
      const newList = [...trainingList];
      newList[trainingIndex] = {
        ...selectedTraining,
        config: {
          ...selectedTraining.config,
        },
      };
      setTrainingList(newList);
      localStorage.setItem("customTrainings", JSON.stringify(newList));
    }
  };

  // =====================================================================
  // Zmiana w selektorze treningu (pozwala wybrać inny trening z listy)
  // =====================================================================
  const handleSelectTraining = (e: SelectCustomEvent) => {
    const trainingId = e.detail.value;
    const found = trainingList.find((t) => t.id === trainingId);
    if (found) {
      setSelectedTraining(found);
      onTrainingSelect?.(trainingId);

      // Głębokie scalanie konfiguracji z wartościami domyślnymi
      const mergedAdjustments = {
        ...defaultAdjustments, // Najpierw wartości domyślne jako baza
        ...adjustments, // Następnie aktualne ustawienia
        ...(found.config || {}), // Na końcu konfiguracja z wybranego treningu
        
        // Głębokie scalanie zagnieżdżonych obiektów
        trainingArea: {
          ...defaultAdjustments.trainingArea,
          ...adjustments.trainingArea,
          ...(found.config?.trainingArea || {}),
        },
        defaultBehavior: {
          ...defaultAdjustments.defaultBehavior,
          ...adjustments.defaultBehavior,
          ...(found.config?.defaultBehavior || {}),
        },
        enabledKeypoints: {
          ...defaultAdjustments.enabledKeypoints,
          ...adjustments.enabledKeypoints,
          ...(found.config?.enabledKeypoints || {}),
        },
        targetProbabilities: {
          ...defaultAdjustments.targetProbabilities,
          ...adjustments.targetProbabilities,
          ...(found.config?.targetProbabilities || {}),
        },
        sequenceConfig: {
          ...defaultAdjustments.sequenceConfig,
          ...adjustments.sequenceConfig,
          ...(found.config?.sequenceConfig || {}),
        },
        followConfig: {
          ...defaultAdjustments.followConfig,
          ...adjustments.followConfig,
          ...(found.config?.followConfig || {}),
          segments: {
            ...defaultAdjustments.followConfig.segments,
            ...adjustments.followConfig.segments,
            ...(found.config?.followConfig?.segments || {}),
          },
        },
        disappearingConfig: {
          ...defaultAdjustments.disappearingConfig,
          ...adjustments.disappearingConfig,
          ...(found.config?.disappearingConfig || {}),
          probabilities: {
            ...defaultAdjustments.disappearingConfig.probabilities,
            ...adjustments.disappearingConfig.probabilities,
            ...(found.config?.disappearingConfig?.probabilities || {}),
          },
        },
      };

      // Upewniamy się, że wszystkie wartości numeryczne są zainicjowane
      const sanitizedAdjustments: TrainingAdjustments = {
        ...mergedAdjustments,
        speed: parseFloat(mergedAdjustments.speed?.toString() || "1") || 1,
        variation: parseFloat(mergedAdjustments.variation?.toString() || "0") || 0,
        trainingArea: {
          ...mergedAdjustments.trainingArea,
          targetSize: parseFloat(mergedAdjustments.trainingArea.targetSize?.toString() || "0") || 0,
          hitRadius: parseFloat(mergedAdjustments.trainingArea.hitRadius?.toString() || "0") || 0,
          aspectRatio: parseFloat(mergedAdjustments.trainingArea.aspectRatio?.toString() || "0") || 0,
          margin: parseFloat(mergedAdjustments.trainingArea.margin?.toString() || "0") || 0,
          overlayOpacity: parseFloat(mergedAdjustments.trainingArea.overlayOpacity?.toString() || "0.0") || 0.0,
          upperZoneRatio: parseFloat(mergedAdjustments.trainingArea.upperZoneRatio?.toString() || "0.0") || 0.0,
        },
        targetProbabilities: {
          handPair: parseFloat(mergedAdjustments.targetProbabilities.handPair?.toString() || "0.0") || 0.0,
          handSingle: parseFloat(mergedAdjustments.targetProbabilities.handSingle?.toString() || "0.0") || 0.0,
          singleLeftWrist: parseFloat(mergedAdjustments.targetProbabilities.singleLeftWrist?.toString() || "0.0") || 0.0,
          singleRightWrist: parseFloat(mergedAdjustments.targetProbabilities.singleRightWrist?.toString() || "0.0") || 0.0,
          singleLeftAnkle: parseFloat(mergedAdjustments.targetProbabilities.singleLeftAnkle?.toString() || "0.0") || 0.0,
          singleRightAnkle: parseFloat(mergedAdjustments.targetProbabilities.singleRightAnkle?.toString() || "0.0") || 0.0,
          anyHand: parseFloat(mergedAdjustments.targetProbabilities.anyHand?.toString() || "0.0") || 0.0,
          anyFoot: parseFloat(mergedAdjustments.targetProbabilities.anyFoot?.toString() || "0.0") || 0.0,
          footSingle: parseFloat(mergedAdjustments.targetProbabilities.footSingle?.toString() || "0.0") || 0.0,
          anyLimb: parseFloat(mergedAdjustments.targetProbabilities.anyLimb?.toString() || "0.0") || 0.0,
          sequence: parseFloat(mergedAdjustments.targetProbabilities.sequence?.toString() || "0.0") || 0.0,
          follow: parseFloat(mergedAdjustments.targetProbabilities.follow?.toString() || "0.0") || 0.0,
        },
        sequenceConfig: {
          ...mergedAdjustments.sequenceConfig,
          minSequenceSize: parseFloat(mergedAdjustments.sequenceConfig.minSequenceSize?.toString() || "0") || 0,
          maxSequenceSize: parseFloat(mergedAdjustments.sequenceConfig.maxSequenceSize?.toString() || "0") || 0,
          minDelay: parseFloat(mergedAdjustments.sequenceConfig.minDelay?.toString() || "0") || 0,
          maxDelay: parseFloat(mergedAdjustments.sequenceConfig.maxDelay?.toString() || "0") || 0,
          handProbability: parseFloat(mergedAdjustments.sequenceConfig.handProbability?.toString() || "0.0") || 0.0,
          pairProbability: parseFloat(mergedAdjustments.sequenceConfig.pairProbability?.toString() || "0.0") || 0.0,
          footMinDelay: parseFloat(mergedAdjustments.sequenceConfig.footMinDelay?.toString() || "0") || 0,
          footMaxDelay: parseFloat(mergedAdjustments.sequenceConfig.footMaxDelay?.toString() || "0") || 0,
          enforceOrder: mergedAdjustments.sequenceConfig.enforceOrder ?? false,
          showNumbers: mergedAdjustments.sequenceConfig.showNumbers ?? false,
        },
        followConfig: {
          ...mergedAdjustments.followConfig,
          minDuration: parseFloat(mergedAdjustments.followConfig.minDuration?.toString() || "0") || 0,
          maxDuration: parseFloat(mergedAdjustments.followConfig.maxDuration?.toString() || "0") || 0,
          minRadius: parseFloat(mergedAdjustments.followConfig.minRadius?.toString() || "0") || 0,
          maxRadius: parseFloat(mergedAdjustments.followConfig.maxRadius?.toString() || "0") || 0,
          circleProbability: parseFloat(mergedAdjustments.followConfig.circleProbability?.toString() || "0.0") || 0.0,
          pathOpacity: parseFloat(mergedAdjustments.followConfig.pathOpacity?.toString() || "0.0") || 0.0,
          showPath: mergedAdjustments.followConfig.showPath ?? false,
          segments: {
            path: mergedAdjustments.followConfig.segments?.path ?? [],
            circle: mergedAdjustments.followConfig.segments?.circle ?? [],
            line: mergedAdjustments.followConfig.segments?.line ?? [],
          }
        },
        disappearingConfig: {
          ...mergedAdjustments.disappearingConfig,
          minDuration: parseFloat(mergedAdjustments.disappearingConfig.minDuration?.toString() || "0") || 0,
          maxDuration: parseFloat(mergedAdjustments.disappearingConfig.maxDuration?.toString() || "0") || 0,
          sequenceBuffer: parseFloat(mergedAdjustments.disappearingConfig.sequenceBuffer?.toString() || "0") || 0,
          probabilities: {
            sequence: parseFloat(mergedAdjustments.disappearingConfig.probabilities?.sequence?.toString() || "0.0") || 0.0,
            follow: parseFloat(mergedAdjustments.disappearingConfig.probabilities?.follow?.toString() || "0.0") || 0.0,
            handPair: parseFloat(mergedAdjustments.disappearingConfig.probabilities?.handPair?.toString() || "0.0") || 0.0,
            singleHand: parseFloat(mergedAdjustments.disappearingConfig.probabilities?.singleHand?.toString() || "0.0") || 0.0,
            anyHand: parseFloat(mergedAdjustments.disappearingConfig.probabilities?.anyHand?.toString() || "0.0") || 0.0,
            anyFoot: parseFloat(mergedAdjustments.disappearingConfig.probabilities?.anyFoot?.toString() || "0.0") || 0.0,
            anyLimb: parseFloat(mergedAdjustments.disappearingConfig.probabilities?.anyLimb?.toString() || "0.0") || 0.0,
            singleFoot: parseFloat(mergedAdjustments.disappearingConfig.probabilities?.singleFoot?.toString() || "0.0") || 0.0,
          },
        },
        enabledKeypoints: {
          leftWrist: mergedAdjustments.enabledKeypoints.leftWrist ?? false,
          rightWrist: mergedAdjustments.enabledKeypoints.rightWrist ?? false,
          leftAnkle: mergedAdjustments.enabledKeypoints.leftAnkle ?? false,
          rightAnkle: mergedAdjustments.enabledKeypoints.rightAnkle ?? false,
        },
        defaultBehavior: {
          ...mergedAdjustments.defaultBehavior,
          followThreshold: parseFloat(mergedAdjustments.defaultBehavior.followThreshold?.toString() || "0") || 0,
        }
      };
  
      // Ustaw lokalny stan i wywołaj callback
      setAdjustments(sanitizedAdjustments);
      onConfigChange({
        selectedTraining: found,
        adjustments: sanitizedAdjustments
      });

      // Obsługa treningu mapy
      if (found.isMapTraining && found.mapData) {
        setMapData(found.mapData);
      } else {
        setMapData(null);
      }
    }
  };

  // =====================================================================
  // Renderowanie suwaka – z disable, jeśli to jest mapTraining
  // (oprócz włączania/wyłączania keypoints i ewentualnie czasu trwania)
  // =====================================================================
  const isMap = !!selectedTraining.isMapTraining;

  // Funkcja do aktualizacji prawdopodobieństw kończyn z zachowaniem sumy 100%
  //   const updateKeypointProbability = (
  //     keypoint: keyof typeof adjustments.keypointProbabilities,
  //     newValue: number
  //   ) => {
  //     const otherKeypoints = Object.keys(adjustments.keypointProbabilities).filter(
  //       k => k !== keypoint && adjustments.enabledKeypoints[k as keyof typeof adjustments.enabledKeypoints]
  //     ) as Array<keyof typeof adjustments.keypointProbabilities>;

  //     if (otherKeypoints.length === 0) {
  //       // Jeśli to jedyna aktywna kończyna, ustawiamy jej prawdopodobieństwo na 100%
  //       setAdjustments(prev => ({
  //         ...prev,
  //         keypointProbabilities: {
  //           ...prev.keypointProbabilities,
  //           [keypoint]: 1
  //         }
  //       }));
  //       return;
  //     }
  //     const updateTargetProbability = (
  //         target: keyof typeof adjustments.targetProbabilities,
  //         newValue: number
  //     ) => {
  //         const otherTargets = Object.keys(adjustments.targetProbabilities).filter(
  //         t => t !== target && adjustments.enabledKeypoints[t as keyof typeof adjustments.enabledKeypoints]
  //         ) as Array<keyof typeof adjustments.targetProbabilities>;

  //         if (otherTargets.length === 0) {
  //         // Jeśli to jedyna aktywna kończyna, ustawiamy jej prawdopodobieństwo na 100%
  //         setAdjustments(prev => ({
  //             ...prev,
  //             targetProbabilities: {
  //             ...prev.targetProbabilities,
  //             [target]: 1
  //             }
  //         }));
  //         return;
  //         }

  //     const remainingProbability = 100 - newValue;
  //     // const currentSum = otherKeypoints.reduce(
  //     //   (sum, k) => sum + adjustments.keypointProbabilities[k] * 100,
  //     //   0
  //     // );

  //     const currentSum = otherTargets.reduce(
  //         (sum, t) => sum + adjustments.targetProbabilities[t] * 100,
  //         0
  //       );

  //     const ratio = remainingProbability / currentSum;

  //     setAdjustments(prev => ({
  //       ...prev,
  //     //   keypointProbabilities: {
  //     //     ...prev.keypointProbabilities,
  //     //     [keypoint]: newValue / 100,
  //     //     ...Object.fromEntries(
  //     //       otherKeypoints.map(k => [
  //     //         k,
  //     //         (prev.keypointProbabilities[k] * 100 * ratio) / 100
  //     //       ])
  //     //     )
  //     //   },

  //     // Aktualizacja prawdopodobieństw celów
  //         targetProbabilities: {
  //             ...prev.targetProbabilities,
  //             [target]: newValue / 100,
  //             ...Object.fromEntries(
  //             otherTargets.map(k => [
  //                 k,
  //                 (prev.targetProbabilities[k] * 100 * ratio) / 100
  //             ])
  //             )
  //         },
  //     //   targetProbabilities: {
  //     //      ...prev.targetProbabilities,
  //     //     handPair: prev.enabledKeypoints.leftWrist && prev.enabledKeypoints.rightWrist ?
  //     //       prev.targetProbabilities.handPair : 0,
  //     //     handSingle: prev.enabledKeypoints.leftWrist || prev.enabledKeypoints.rightWrist ?
  //     //       prev.targetProbabilities.handSingle : 0,
  //     //     singleLeftWrist: prev.enabledKeypoints.leftWrist ?
  //     //       prev.targetProbabilities.singleLeftWrist : 0,
  //     //     singleRightWrist: prev.enabledKeypoints.rightWrist ?
  //     //       prev.targetProbabilities.singleRightWrist : 0,
  //     //     singleLeftAnkle: prev.enabledKeypoints.leftAnkle ?
  //     //       prev.targetProbabilities.singleLeftAnkle : 0,
  //     //     singleRightAnkle: prev.enabledKeypoints.rightAnkle ?
  //     //       prev.targetProbabilities.singleRightAnkle : 0,
  //     //     anyHand: (prev.enabledKeypoints.leftWrist || prev.enabledKeypoints.rightWrist) ?
  //     //       prev.targetProbabilities.anyHand : 0,
  //     //     anyFoot: (prev.enabledKeypoints.leftAnkle || prev.enabledKeypoints.rightAnkle) ?
  //     //       prev.targetProbabilities.anyFoot : 0,
  //     //     footSingle: (prev.enabledKeypoints.leftAnkle || prev.enabledKeypoints.rightAnkle) ?
  //     //       prev.targetProbabilities.footSingle : 0,
  //     //     anyLimb: (prev.enabledKeypoints.leftWrist || prev.enabledKeypoints.rightWrist ||
  //     //              prev.enabledKeypoints.leftAnkle || prev.enabledKeypoints.rightAnkle) ?
  //     //       prev.targetProbabilities.anyLimb : 0
  //     //   }
  //     }));
  //   };

  function forceZeroIfKeypointsUnavailable(
    target: keyof TrainingAdjustments["targetProbabilities"],
    adjustments: TrainingAdjustments,
    newVal: number,
  ): number {
    // 1. Sprawdzamy, czy target wymaga rąk
    if (target === "handPair" || target === "handSingle") {
      // aby wystąpiły "ręce", musimy mieć co najmniej jedną rękę przy SINGLE,
      // i obie ręce przy PAIR:
      const { leftWrist, rightWrist } = adjustments.enabledKeypoints;
  
      if (target === "handPair" && (!leftWrist || !rightWrist)) {
        adjustments.targetProbabilities.handPair = 0;
        return 0; // bo para rąk niemożliwa
      }
      if (target === "handSingle" && !leftWrist && !rightWrist) {
        adjustments.targetProbabilities.handSingle = 0;
        return 0; // bo pojedyncza ręka niemożliwa, jeśli obie wyłączone
      }
    }
  
    // 2. Podobnie dla stóp
    if (target === "footSingle" || target === "anyFoot") {
      const { leftAnkle, rightAnkle } = adjustments.enabledKeypoints;
  
      if (!leftAnkle && !rightAnkle) {
        adjustments.targetProbabilities.footSingle = 0;
        return 0; 
      }
    }
  
    // 3. anyHand => co najmniej jedna ręka
    if (target === "anyHand") {
      const { leftWrist, rightWrist } = adjustments.enabledKeypoints;
      if (!leftWrist && !rightWrist) {
        adjustments.targetProbabilities.anyHand = 0;
        return 0;
      }
    }
  
    // 4. anyLimb => co najmniej jedna z 4 kończyn
    if (target === "anyLimb") {
      const { leftWrist, rightWrist, leftAnkle, rightAnkle } = adjustments.enabledKeypoints;
      if (!leftWrist && !rightWrist && !leftAnkle && !rightAnkle) {
        adjustments.targetProbabilities.anyLimb = 0;
        return 0;
      }
    }
  
    // 5. singleLeftWrist => brak lewego nadgarstka => 0
    if (target === "singleLeftWrist" && !adjustments.enabledKeypoints.leftWrist) {
      adjustments.targetProbabilities.singleLeftWrist = 0;
      return 0;
    }
    if (target === "sequence" && !adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist && !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) {
      adjustments.targetProbabilities.sequence = 0;
      return 0;
    }
    if (target === "follow" && !adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist && !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) {
      adjustments.targetProbabilities.follow = 0;
      return 0;
    }
    // ... analogicznie singleRightWrist, singleLeftAnkle, singleRightAnkle
  
    // Nic nie stoi na przeszkodzie -> zwracamy oryginalną wartość
    return newVal;
  }
  
  /**
   * Normalizuje wartości w obrębie jednej grupy tak,
   * aby suma wynosiła 1.0 (100%).
   */
  function normalizeGroup(
    groupKeys: readonly (keyof TrainingAdjustments["targetProbabilities"])[],
    targetProbabilities: TrainingAdjustments["targetProbabilities"],
    target: keyof TrainingAdjustments["targetProbabilities"],
    newValueNormalized: number
  ): TrainingAdjustments["targetProbabilities"] {
    // 1. Inicjalizacja
    const otherTargets = groupKeys.filter((t) => t !== target);
    const currentSumOthers = otherTargets.reduce(
      (acc, t) => acc + targetProbabilities[t],
      0
    );

    // const updated: Partial<TrainingAdjustments["targetProbabilities"]> = {};
    // groupKeys.forEach((k) => {
    //   updated[k] = targetProbabilities[k] / currentSumOthers; // normalizacja do 1
    // });
  
    // 2. Obsługa krańcowych przypadków
    if (newValueNormalized >= 1) {
      // Ten cel = 1, reszta = 0
      const updated = otherTargets.reduce((acc, o) => {
        acc[o] = 0;
        return acc;
      }, {} as Record<keyof typeof targetProbabilities, number>);
  
      return {
        ...targetProbabilities,
        ...updated,
        [target]: 1,
      };
    }
    if (newValueNormalized <= 0) {
      // Ten cel = 0, reszta normalizujemy do sumy = 1
      if (currentSumOthers > 0) {
        const updated = otherTargets.reduce((acc, o) => {
          // poprzedni udział / currentSumOthers
          acc[o] = targetProbabilities[o] / currentSumOthers;
          return acc;
        }, {} as Record<keyof typeof targetProbabilities, number>);
  
        return {
          ...targetProbabilities,
          ...updated,
          [target]: 0,
        };
      }
      // Jeżeli currentSumOthers = 0, to wszystko = 0
      return {
        ...targetProbabilities,
        [target]: 0,
      };
    }
  
    // 3. Standardowa ścieżka (0 < newValueNormalized < 1)
    // Najpierw ustalamy, ile zostaje do „rozdania" pozostałym
    const remain = 1 - newValueNormalized;
  
    // Jeżeli currentSumOthers = 0, to cały budżet idzie w target
    if (currentSumOthers === 0) {
      return {
        ...targetProbabilities,
        [target]: newValueNormalized,
      };
    }
  
    // Obliczamy współczynnik skalowania
    const scale = remain / currentSumOthers;
  
    // Tworzymy zaktualizowany obiekt
    const updatedTargets = otherTargets.reduce((acc, o) => {
      const oldVal = targetProbabilities[o];
      acc[o] = oldVal * scale; // skalujemy
      return acc;
    }, {} as Record<keyof typeof targetProbabilities, number>);
  
    // Scal i zwróć
    return {
      ...targetProbabilities,
      ...updatedTargets,
      [target]: newValueNormalized,
    };
  }
  

  function updateSingleTargetProbability(
    target: keyof TrainingAdjustments["targetProbabilities"],
    newValuePercent: number,
    prev: TrainingAdjustments
  ): TrainingAdjustments {
    // 1. Konwertujemy z % na [0..1]
    const raw = newValuePercent / 100;
  
    // 2. Wymuszamy 0, jeśli brakuje keypointa:
    const finalVal = forceZeroIfKeypointsUnavailable(target, prev, raw);
  
    // 3. Nadpisujemy w starej mapie
    const newTargetProbabilities = {
      ...prev.targetProbabilities,
      [target]: finalVal,
    };
  
    // 4. Normalizujemy *tylko* grupę single-limb (A)
    const updatedTP = normalizeGroup(SINGLE_KEYPOINT_TARGETS, newTargetProbabilities, target, finalVal);
  
    // 5. Zwracamy nowy obiekt `adjustments`
    return {
      ...prev,
      targetProbabilities: updatedTP,
    };
  }  

  function updateMultiTargetProbability(
    target: keyof TrainingAdjustments["targetProbabilities"],
    newValuePercent: number,
    prev: TrainingAdjustments
  ): TrainingAdjustments {
    const raw = newValuePercent / 100;
    const finalVal = forceZeroIfKeypointsUnavailable(target, prev, raw);
  
    const newTP = {
      ...prev.targetProbabilities,
      [target]: finalVal,
    };
  
    const updatedTP = normalizeGroup(MULTI_KEYPOINT_TARGETS, newTP, target, finalVal);
  
    return {
      ...prev,
      targetProbabilities: updatedTP,
      followConfig: {
        ...prev.followConfig,
        showPath: (updatedTP.follow === 0) ? false : prev.followConfig.showPath
      },
      sequenceConfig: {
        ...prev.sequenceConfig,
        showNumbers: (updatedTP.sequence === 0) ? false : prev.sequenceConfig.showNumbers,
        enforceOrder: (updatedTP.sequence === 0) ? false : prev.sequenceConfig.enforceOrder
      }
    };
  }
  

  const updateTargetProbability = (
    target: keyof typeof adjustments.targetProbabilities,
    newValue: number
  ) => {
    setAdjustments((prev) => {
      // 1. Lista aktywnych celów (np. singleLeftWrist, singleRightWrist),
      //    ale jednocześnie takich, których prawdopodobieństwo > 0
      //    (lub które są włączone w enabledKeypoints, zależnie od logiki).
      const activeTargets: Array<keyof typeof prev.targetProbabilities> =
        Object.keys(prev.targetProbabilities)
          .filter((k) => {
            // Warunek "aktywności" można uzależnić np. od
            //   - czy suwak jest włączony
            //   - czy keypoint jest włączony (enabledKeypoints)
            //   - czy prev.targetProbabilities[k] > 0
            // Tu przykładowo sprawdzamy, czy keypoint w enabledKeypoints jest true
            // i tym samym dopuszczamy go do rozdziału prawdopodobieństwa.
            if (
              k.startsWith("singleLeftWrist") &&
              !prev.enabledKeypoints.leftWrist
            )
              return false;
            if (
              k.startsWith("singleRightWrist") &&
              !prev.enabledKeypoints.rightWrist
            )
              return false;
            if (
              k.startsWith("singleLeftAnkle") &&
              !prev.enabledKeypoints.leftAnkle
            )
              return false;
            if (
              k.startsWith("singleRightAnkle") &&
              !prev.enabledKeypoints.rightAnkle
            )
              return false;
            if (
              k.startsWith("anyHand") &&
              !prev.enabledKeypoints.leftWrist &&
              !prev.enabledKeypoints.rightWrist
            )
              return false;
            if (
              k.startsWith("anyFoot") &&
              !prev.enabledKeypoints.leftAnkle &&
              !prev.enabledKeypoints.rightAnkle
            )
              return false;
            if (
              k.startsWith("anyLimb") &&
              !prev.enabledKeypoints.leftWrist &&
              !prev.enabledKeypoints.rightWrist &&
              !prev.enabledKeypoints.leftAnkle &&
              !prev.enabledKeypoints.rightAnkle
            )
              return false;
            if (
              k.startsWith("handPair") &&
              !prev.enabledKeypoints.leftWrist &&
              !prev.enabledKeypoints.rightWrist
            )
              return false;
            if (
              k.startsWith("handSingle") &&
              !prev.enabledKeypoints.leftWrist &&
              !prev.enabledKeypoints.rightWrist
            )
              return false;
            if (
              k.startsWith("footSingle") &&
              !prev.enabledKeypoints.leftAnkle &&
              !prev.enabledKeypoints.rightAnkle
            )
              return false;
            return true;
          })
          .map((k) => k as keyof typeof prev.targetProbabilities);

      // Jeżeli to jedyna aktywna kończyna/cele, ustawiamy wartość na 100%
      if (activeTargets.length === 1 && activeTargets.includes(target)) {
        return {
          ...prev,
          targetProbabilities: {
            ...prev.targetProbabilities,
            [target]: 1,
          },
        };
      }

      // 2. Oblicz sumę prawdopodobieństw pozostałych aktywnych celów (bez aktualnie edytowanego)
      const otherTargets = activeTargets.filter((t) => t !== target);
      const currentSumOthers = otherTargets.reduce(
        (acc, t) => acc + prev.targetProbabilities[t],
        0
      );

      // 3. Konwertujemy newValue na skalę 0..1
      const newValueNormalized = newValue / 100; // (bo suwak w UI ma zakres 0..100)

      // 4. Jeśli jest 0 lub 1, obsłużmy krańce (np. 0 => cała reszta dostaje 1.0)
      if (newValueNormalized >= 1) {
        // Wybrany cel = 1, reszta = 0
        const updated = otherTargets.reduce((acc, o) => {
          acc[o] = 0;
          return acc;
        }, {} as Record<keyof typeof prev.targetProbabilities, number>);

        return {
          ...prev,
          targetProbabilities: {
            ...prev.targetProbabilities,
            ...updated,
            [target]: 1,
          },
        };
      }
      if (newValueNormalized <= 0) {
        // Wybrany cel = 0, reszta aktywnych rozdziela 1.0 w starej proporcji
        if (currentSumOthers > 0) {
          const updated = otherTargets.reduce((acc, o) => {
            // Zachowujemy proporcje poprzednie, ale normalizujemy do sumy = 1
            acc[o] = prev.targetProbabilities[o] / currentSumOthers;
            return acc;
          }, {} as Record<keyof typeof prev.targetProbabilities, number>);

          return {
            ...prev,
            targetProbabilities: {
              ...prev.targetProbabilities,
              ...updated,
              [target]: 0,
            },
          };
        }
        // Jeśli currentSumOthers = 0, to wszystkie = 0 (niespotykany, krańcowy przypadek)
        return {
          ...prev,
          targetProbabilities: {
            ...prev.targetProbabilities,
            [target]: 0,
          },
        };
      }

      // 5. Wyliczamy „pozostałe" do rozdzielenia = 1.0 - newValueNormalized
      //    i proporcjonalnie skaluje rozkład u pozostałych
      const remain = 1 - newValueNormalized;

      // Jeśli no. sumothers = 0, to reszta = 0 => wówczas przypisujemy remain tylko do target
      if (currentSumOthers === 0) {
        // Pozostałe = 0, bo były wyłączone (?), a target = newValueNormalized
        return {
          ...prev,
          targetProbabilities: {
            ...prev.targetProbabilities,
            [target]: newValueNormalized,
          },
        };
      }

      // 6. Obliczamy ratio skalowania
      const scale = remain / currentSumOthers; // np. 0.4 / 0.8 = 0.5

      // 7. Przeliczamy pozostałe
      const updatedTargets = otherTargets.reduce((acc, o) => {
        const oldVal = prev.targetProbabilities[o];
        const newVal = oldVal * scale; // skala
        acc[o] = newVal;
        return acc;
      }, {} as Record<keyof typeof prev.targetProbabilities, number>);

      // 8. Tworzymy nowy obiekt docelowy
      return {
        ...prev,
        targetProbabilities: {
          ...prev.targetProbabilities,
          ...updatedTargets,
          [target]: newValueNormalized,
        },
      };
    });
  };

  // Funkcja do włączania/wyłączania kończyn
  //   const toggleKeypoint = (
  //     keypoint: keyof typeof adjustments.enabledKeypoints,
  //     enabled: boolean
  //   ) => {
  //     setAdjustments(prev => {
  //       const newEnabledKeypoints = {
  //         ...prev.enabledKeypoints,
  //         [keypoint]: enabled
  //       };

  //       // Obliczanie nowych prawdopodobieństw dla pozostałych aktywnych kończyn
  //       const activeKeypoints = Object.entries(newEnabledKeypoints)
  //         .filter(([_, isEnabled]) => isEnabled)
  //         .map(([key]) => key) as Array<keyof typeof adjustments.keypointProbabilities>;

  //       const equalProbability = 1 / activeKeypoints.length;

  //       const newKeypointProbabilities = {
  //         ...prev.keypointProbabilities,
  //         [keypoint]: enabled ? equalProbability : 0
  //       };

  //       if (enabled) {
  //         // Redystrybucja prawdopodobieństw
  //         activeKeypoints.forEach(k => {
  //           if (k !== keypoint) {
  //             newKeypointProbabilities[k] = equalProbability;
  //           }
  //         });
  //       } else {
  //         // Redystrybucja prawdopodobieństwa wyłączonej kończyny
  //         const remainingKeypoints = activeKeypoints.filter(k => k !== keypoint);
  //         if (remainingKeypoints.length > 0) {
  //           const newProbability = 1 / remainingKeypoints.length;
  //           remainingKeypoints.forEach(k => {
  //             newKeypointProbabilities[k] = newProbability;
  //           });
  //         }
  //       }

  //       // Aktualizacja prawdopodobieństw celów
  //       const newTargetProbabilities = {
  //         ...prev.targetProbabilities,
  //         handPair: newEnabledKeypoints.leftWrist && newEnabledKeypoints.rightWrist ?
  //           prev.targetProbabilities.handPair : 0,
  //         handSingle: newEnabledKeypoints.leftWrist || newEnabledKeypoints.rightWrist ?
  //           prev.targetProbabilities.handSingle : 0,
  //         singleLeftWrist: newEnabledKeypoints.leftWrist ?
  //           prev.targetProbabilities.singleLeftWrist : 0,
  //         singleRightWrist: newEnabledKeypoints.rightWrist ?
  //           prev.targetProbabilities.singleRightWrist : 0,
  //         singleLeftAnkle: newEnabledKeypoints.leftAnkle ?
  //           prev.targetProbabilities.singleLeftAnkle : 0,
  //         singleRightAnkle: newEnabledKeypoints.rightAnkle ?
  //           prev.targetProbabilities.singleRightAnkle : 0,
  //         anyHand: (newEnabledKeypoints.leftWrist || newEnabledKeypoints.rightWrist) ?
  //           prev.targetProbabilities.anyHand : 0,
  //         anyFoot: (newEnabledKeypoints.leftAnkle || newEnabledKeypoints.rightAnkle) ?
  //           prev.targetProbabilities.anyFoot : 0,
  //         footSingle: (newEnabledKeypoints.leftAnkle || newEnabledKeypoints.rightAnkle) ?
  //           prev.targetProbabilities.footSingle : 0,
  //         anyLimb: (newEnabledKeypoints.leftWrist || newEnabledKeypoints.rightWrist ||
  //                  newEnabledKeypoints.leftAnkle || newEnabledKeypoints.rightAnkle) ?
  //           prev.targetProbabilities.anyLimb : 0
  //       };

  //       return {
  //         ...prev,
  //         enabledKeypoints: newEnabledKeypoints,
  //         keypointProbabilities: newKeypointProbabilities,
  //         targetProbabilities: newTargetProbabilities
  //       };
  //     });
  //   };
  /**
   * Funkcja toggleKeypoint - poprawiona aktualizacja prawdopodobieństw wystąpienia celów
   * dla aktywnych kończyn. W komentarzach znajduje się opis wykonanych zmian.
   */

  const toggleKeypoint = (
    keypoint: keyof typeof adjustments.enabledKeypoints,
    enabled: boolean
  ) => {
    setAdjustments((prev) => {
      // 1. Aktualizujemy aktywność kończyn
      const newEnabledKeypoints = {
        ...prev.enabledKeypoints,
        [keypoint]: enabled,
      };

      // 2. Tworzymy kopię targetProbabilities
      const newTargetProbabilities = { ...prev.targetProbabilities };

      // 3. Ustalamy, które kończyny (Single) są aktywne
      //    (np. singleLeftWrist, singleRightWrist, singleLeftAnkle, singleRightAnkle)
      type SingleKey =
        | "singleLeftWrist"
        | "singleRightWrist"
        | "singleLeftAnkle"
        | "singleRightAnkle";

      // Mapa powiązań: klucz "enabledKeypoints" -> klucz "targetProbabilities"
      const keypointMap: Record<
        keyof typeof adjustments.enabledKeypoints,
        SingleKey
      > = {
        leftWrist: "singleLeftWrist",
        rightWrist: "singleRightWrist",
        leftAnkle: "singleLeftAnkle",
        rightAnkle: "singleRightAnkle",
      };

      // 4. Najpierw zerujemy wszystkie singleKey
      (
        Object.keys(keypointMap) as Array<
          keyof typeof adjustments.enabledKeypoints
        >
      ).forEach((k) => {
        const probKey = keypointMap[k];
        newTargetProbabilities[probKey] = 0;
      });

      // 5. Wyszukujemy aktywne SingleKey
      const activeSingles: SingleKey[] = [];
      (
        Object.keys(newEnabledKeypoints) as Array<
          keyof typeof adjustments.enabledKeypoints
        >
      ).forEach((k) => {
        if (newEnabledKeypoints[k]) {
          activeSingles.push(keypointMap[k]);
        }
      });

      // 6. Jeśli mamy activeSingles, dzielimy prawdopodobieństwo równo
      //    (np. 2 aktywne => 50% i 50%, 3 aktywne => ~33.33% każde, itd.)
      if (activeSingles.length > 0) {
        const singleProb = 1 / activeSingles.length; // to jest 1.0 == 100% / liczba aktywnych

        activeSingles.forEach((k) => {
          newTargetProbabilities[k] = singleProb;
        });
      }

      // 7. Opcjonalnie, można wyzerować wartości pair/any/footSingle w zależności od aktywności:
      //    (Jeśli lewa i prawa ręka nieaktywne => handPair = 0, itd.)
      newTargetProbabilities.handPair =
        newEnabledKeypoints.leftWrist && newEnabledKeypoints.rightWrist
          ? newTargetProbabilities.handPair
          : 0;
      newTargetProbabilities.footSingle =
        newEnabledKeypoints.leftAnkle || newEnabledKeypoints.rightAnkle
          ? newTargetProbabilities.footSingle
          : 0;
      newTargetProbabilities.handSingle =
        newEnabledKeypoints.leftWrist || newEnabledKeypoints.rightWrist
          ? newTargetProbabilities.handSingle
          : 0;
      newTargetProbabilities.anyHand =
        newEnabledKeypoints.leftWrist || newEnabledKeypoints.rightWrist
          ? newTargetProbabilities.anyHand
          : 0;
      newTargetProbabilities.anyFoot =
        newEnabledKeypoints.leftAnkle || newEnabledKeypoints.rightAnkle
          ? newTargetProbabilities.anyFoot
          : 0;
      newTargetProbabilities.anyLimb =
        newEnabledKeypoints.leftWrist || newEnabledKeypoints.rightWrist ||
        newEnabledKeypoints.leftAnkle || newEnabledKeypoints.rightAnkle
          ? newTargetProbabilities.anyLimb
          : 0;
      newTargetProbabilities.sequence =
      newEnabledKeypoints.leftWrist || newEnabledKeypoints.rightWrist ||
      newEnabledKeypoints.leftAnkle || newEnabledKeypoints.rightAnkle
          ? newTargetProbabilities.sequence
          : 0;
      newTargetProbabilities.follow =
        newEnabledKeypoints.leftWrist || newEnabledKeypoints.rightWrist ||
        newEnabledKeypoints.leftAnkle || newEnabledKeypoints.rightAnkle
          ? newTargetProbabilities.follow
          : 0;
      // ... analogicznie dla anyHand, anyFoot, anyLimb
      // (zależy, jak bardzo chcesz dzielić też ich "budżet" – tu przykładowo zerujemy,
      // bo załóżmy, że te tryby nie są aktualnie obsługiwane suwakami).

      // 8. Zwróćmy nowy stan
      return {
        ...prev,
        enabledKeypoints: newEnabledKeypoints,
        targetProbabilities: newTargetProbabilities,
      };
    });
  };

  // Obsługa kliknięcia w obraz: tworzymy <input type="file"> i czekamy na wczytanie
  const handleImageClick = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            // Zapis do localStorage i stanu
            localStorage.setItem("myTrainingImage", reader.result);
            setNewTrainingImage(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    fileInput.click();
  };

  // Obsługa wyboru treningu w selektorze
  const handleTrainingChange = (e: SelectCustomEvent) => {
    const trainingId = e.detail.value;
    const found = trainingList.find(t => t.id === trainingId);
    if (found) {
      setSelectedTraining(found);
      onTrainingSelect?.(trainingId);

      // Aktualizacja konfiguracji
      onConfigChange({
        selectedTraining: found,
        adjustments: adjustments
      });

      if (found.isMapTraining && found.mapData) {
        setMapData(found.mapData);
      } else {
        setMapData(null);
      }
    }
  };
  function isProbabilityDisabled(
    key: string, 
    enabledKeypoints: {
      leftWrist: boolean;
      rightWrist: boolean;
      leftAnkle: boolean;
      rightAnkle: boolean;
    }
  ): boolean {
    const noHands = !enabledKeypoints.leftWrist && !enabledKeypoints.rightWrist; 
    const noFeet  = !enabledKeypoints.leftAnkle && !enabledKeypoints.rightAnkle;

    switch (key) {
      case "sequence":
        // Dla sequence warunkiem jest brak *wszystkich* kończyn lub targetProbabilities.sequence === 0
        return noHands && noFeet || (adjustments.targetProbabilities.sequence === 0);
      case "follow":
        // Dla follow warunkiem jest brak *wszystkich* kończyn lub targetProbabilities.follow === 0 
        return noHands && noFeet || (adjustments.targetProbabilities.follow === 0);

      case "handPair":
        // Żeby handPair miało sens, muszą działać obie ręce
        return !enabledKeypoints.leftWrist || !enabledKeypoints.rightWrist;

      case "singleHand":
      case "anyHand":
        // Wystarczy, że żadna z rąk nie jest włączona
        return noHands || (adjustments.targetProbabilities.anyHand === 0);

      case "anyFoot":
      case "singleFoot":
        // Wystarczy, że żadna ze stóp nie jest włączona
        return noFeet || (adjustments.targetProbabilities.anyFoot === 0);

      case "anyLimb":
        // Musi być włączona co najmniej jedna kończyna (ręka lub noga),
        // więc jeśli wszystkie wyłączone, to true
        return noHands && noFeet || (adjustments.targetProbabilities.anyLimb === 0);

      default:
        return false; // dla innego klucza nie wyłączaj
    }
  }

  return (
    <IonCard
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        margin: 0,
      }}
    >
      <IonCardHeader>
        <IonCardTitle>Konfiguracja treningu</IonCardTitle>
      </IonCardHeader>

      <IonCardContent
        className="config-content"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 16px",
        }}
      >
        <style>
          {`
            .config-content {
              --overflow: auto;
              --background: var(--ion-background-color);
            }
          `}
        </style>
        {/* Wybór treningu */}
        <IonList>
          <IonItem>
            <IonLabel>Wybierz trening</IonLabel>
            <IonSelect
              value={selectedTraining.id}
              onIonChange={handleSelectTraining}
            >
              {trainingList.map((t) => (
                <IonSelectOption key={t.id} value={t.id}>
                  {t.name} ({t.isMapTraining ? "MAPA" : "PROC"})
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        </IonList>

        {/* Sekcja tworzenia nowego treningu proceduralnego */}
        {/* <IonList style={{ marginTop: "1rem" }}>
          <IonItem>
            <IonLabel position="stacked">Nazwa nowego treningu</IonLabel>
            <IonInput
              value={newTrainingName}
              placeholder="np. Wyzwanie szybkie nogi"
              onIonChange={(e: {
                detail: { value: React.SetStateAction<string> };
              }) => setNewTrainingName(e.detail.value!)}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Opis nowego treningu</IonLabel>
            <IonInput
              value={newTrainingDesc}
              placeholder="Dowolny opis"
              onIonChange={(e: {
                detail: { value: React.SetStateAction<string> };
              }) => setNewTrainingDesc(e.detail.value!)}
            />
          </IonItem>
          <IonItem>
            <IonImg
              src={displayedImage}
              onClick={handleImageClick}
              style={{ cursor: "pointer", width: "200px", height: "200px" }}
            />
          </IonItem>
          <IonButton
            onClick={handleCreateNewTraining}
            style={{ marginTop: "0.5rem" }}
          >
            Utwórz nowy trening
          </IonButton>
        </IonList> */}
        {/* Informacje o wybranym treningu */}
        {selectedTraining && (
          <IonCard>
            <IonCardContent>
              {selectedTraining.imageUrl && (
                // <IonImg
                //   src={selectedTraining.imageUrl}
                //   alt={selectedTraining.name}
                // />
                <IonImg
                  src={displayedImage}
                  alt={selectedTraining.name}
                  onClick={handleImageClick}
                />
              )}
              {/* <IonText>
                <h2>{selectedTraining.name}</h2>
                <p>{selectedTraining.description}</p>
              </IonText> */}
              <IonLabel position="stacked">Nazwa treningu:</IonLabel>
              <IonInput
                value={newTrainingName}
                placeholder={selectedTraining.name}
                onIonChange={(e: {
                  detail: { value: React.SetStateAction<string> };
                }) => setNewTrainingName(e.detail.value!)}
              />
              <IonLabel position="stacked">Opis treningu:</IonLabel>
              <IonInput
                value={newTrainingDesc}
                placeholder={selectedTraining.description}
                onIonChange={(e: {
                  detail: { value: React.SetStateAction<string> };
                }) => setNewTrainingDesc(e.detail.value!)}
              />
              <IonButton onClick={handleCreateNewTraining}>
                Utwórz nowy trening
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        {/* Wczytywanie mapy treningowej */}
        <IonItem>
          <IonLabel>Wczytaj mapę treningową</IonLabel>
          {/* <input
            type="file"
            accept=".json"
            onChange={handleMapUpload}
            style={{ display: "none" }}
            id="map-upload"
          />
          <IonButton
            onClick={() => document.getElementById("map-upload")?.click()}
          >
            Wybierz plik
          </IonButton> */}
          <IonButton
            color="medium"
            onClick={() => {
              const fileInput = document.createElement("input");
              fileInput.type = "file";
              fileInput.accept = ".json";
              fileInput.onchange = (e) => {
                handleMapUpload(
                  e as unknown as React.ChangeEvent<HTMLInputElement>
                );
              };
              fileInput.click();
            }}
          >
            <IonIcon icon={cloudUpload} slot="start" />
            Załaduj mapę (JSON)
          </IonButton>
        </IonItem>

        {/* Kontrolki dostępne również dla map treningowych */}

        {/* ------------------------------------------ */}
        {/* Sekcja Keypoints – włączanie konkretnych kończyn */}
        {/* ------------------------------------------ */}
        <IonList style={{ marginTop: "1rem" }}>
          <IonItem>
            <IonLabel>Wybór aktywnych kończyn</IonLabel>
          </IonItem>

          <IonGrid>
            <IonRow>
              <IonCol size="6">
                <IonItem>
                  <IonLabel>Lewa ręka</IonLabel>
                  <IonToggle
                    checked={adjustments.enabledKeypoints.leftWrist}
                    onIonChange={(e: ToggleCustomEvent) =>
                      toggleKeypoint("leftWrist", e.detail.checked)
                    }
                  />
                </IonItem>
                {renderSlider(
                  "Szansa (Lewa ręka)",
                  adjustments.targetProbabilities.singleLeftWrist * 100,
                  (val) => {
                    setAdjustments((prev) =>
                      updateSingleTargetProbability("singleLeftWrist", val, prev)
                    );
                  },
                  0,
                  100,
                  5,
                  "%",
                  undefined,
                  !adjustments.enabledKeypoints.leftWrist,
                  "leftWristProbability"
                )}
              </IonCol>

              <IonCol size="6">
                <IonItem>
                  <IonLabel>Prawa ręka</IonLabel>
                  <IonToggle
                    checked={adjustments.enabledKeypoints.rightWrist}
                    onIonChange={(e: ToggleCustomEvent) =>
                      toggleKeypoint("rightWrist", e.detail.checked)
                    }
                  />
                </IonItem>
                {renderSlider(
                  "Szansa (Prawa ręka)",
                  adjustments.targetProbabilities.singleRightWrist * 100,
                  (val) => {
                    setAdjustments((prev) =>
                      updateSingleTargetProbability("singleRightWrist", val, prev)
                    );
                  },
                  0,
                  100,
                  5,
                  "%",
                  undefined,
                  !adjustments.enabledKeypoints.rightWrist,
                  "rightWristProbability"
                )}
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol size="6">
                <IonItem>
                  <IonLabel>Lewa noga</IonLabel>
                  <IonToggle
                    checked={adjustments.enabledKeypoints.leftAnkle}
                    onIonChange={(e: ToggleCustomEvent) =>
                      toggleKeypoint("leftAnkle", e.detail.checked)
                    }
                  />
                </IonItem>
                {renderSlider(
                  "Szansa (Lewa noga)",
                  adjustments.targetProbabilities.singleLeftAnkle * 100,
                  (val) => {
                    setAdjustments((prev) =>
                      updateSingleTargetProbability("singleLeftAnkle", val, prev)
                    );
                  },
                  0,
                  100,
                  5,
                  "%",
                  undefined,
                  !adjustments.enabledKeypoints.leftAnkle,
                  "leftAnkleProbability"
                )}
              </IonCol>

              <IonCol size="6">
                <IonItem>
                  <IonLabel>Prawa noga</IonLabel>
                  <IonToggle
                    checked={adjustments.enabledKeypoints.rightAnkle}
                    onIonChange={(e: ToggleCustomEvent) =>
                      toggleKeypoint("rightAnkle", e.detail.checked)
                    }
                  />
                </IonItem>
                {renderSlider(
                  "Szansa (Prawa noga)",
                  adjustments.targetProbabilities.singleRightAnkle * 100,
                  (val) => {
                    setAdjustments((prev) =>
                      updateSingleTargetProbability("singleRightAnkle", val, prev)
                    );
                  },
                  0,
                  100,
                  5,
                  "%",
                  undefined,
                  !adjustments.enabledKeypoints.rightAnkle,
                  "rightAnkleProbability"
                )}
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonList>

        {/* ------------------------------------------ */}
        {/* Sekcja głównych parametrów Adjustments     */}
        {/* ------------------------------------------ */}

        <IonList style={{ marginTop: "1rem" }}>
          <IonItem>
            <IonLabel>Parametry podstawowe</IonLabel>
          </IonItem>

          {renderSlider(
            "Prędkość treningu",
            Number.isNaN(parseFloat(adjustments.speed.toString())) ? 0 : adjustments.speed,
            (value) => setAdjustments((prev) => ({ ...prev, speed: parseFloat(value.toString()) || 0 })),
            0.5,
            2,
            0.1,
            "x",
            speedometerOutline,
            false,
            "speed"
          )}

          {renderSlider(
            "Rozmiar celów",
            Number.isNaN(parseFloat(adjustments.trainingArea.targetSize.toString())) ? 0 : adjustments.trainingArea.targetSize,
            (value) => setAdjustments((prev) => ({ ...prev, trainingArea: { ...prev.trainingArea, targetSize: parseFloat(value.toString()) || 0 } })),
            10,
            60,
            5,
            "px",
            resizeOutline,
            false,
            "targetSize"
          )}

          {renderSlider(
            "Promień trafienia",
            Number.isNaN(parseFloat(adjustments.trainingArea.hitRadius.toString())) ? 0 : adjustments.trainingArea.hitRadius,
            (value) => setAdjustments((prev) => ({ ...prev, trainingArea: { ...prev.trainingArea, hitRadius: parseFloat(value.toString()) || 0 } })),
            10,
            80,
            5,
            "px",
            radioButtonOnOutline,
            false,
            "hitRadius"
          )}

          {renderSlider(
            "Wariacja pozycji (losowe przesunięcie)",
            Number.isNaN(parseFloat(adjustments.variation.toString())) ? 0 : adjustments.variation,
            (value) => setAdjustments((prev) => ({ ...prev, variation: parseFloat(value.toString()) || 0 })),
            0,
            50,
            5,
            "px",
            shuffleOutline,
            isMap,
            "variation"
          )}

          {/* Jeżeli w Adjustments mamy aspectRatio, margin, overlayOpacity, itp. */}
          {renderSlider(
            "Aspect Ratio (dla siatki)",
            Number.isNaN(parseFloat((adjustments.trainingArea.aspectRatio ?? 1).toString())) ? 1 : adjustments.trainingArea.aspectRatio ?? 1,
            (value) => setAdjustments((prev) => ({ ...prev, trainingArea: { ...prev.trainingArea, aspectRatio: parseFloat(value.toString()) || 1 } })),
            0.5,
            2,
            0.1,
            "",
            undefined,
            false,
            "aspectRatio"
          )}

          {renderSlider(
            "Margines (dla siatki)",
            Number.isNaN(parseFloat((adjustments.trainingArea.margin ?? 0).toString())) ? 0 : adjustments.trainingArea.margin ?? 0,
            (value) => setAdjustments((prev) => ({ ...prev, trainingArea: { ...prev.trainingArea, margin: parseFloat(value.toString()) || 0 } })),
            0,
            100,
            5,
            "px",
            undefined,
            false,
            "margin"
          )}

          {renderSlider(
            "Przezroczystość nakładki",
            Number.isNaN(parseFloat(((adjustments.trainingArea.overlayOpacity ?? 0.5) * 100).toString())) ? 50 : (adjustments.trainingArea.overlayOpacity ?? 0.5) * 100,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                trainingArea: { ...prev.trainingArea, overlayOpacity: (parseFloat(value.toString()) || 0) / 100 },
              })),
            0,
            100,
            10,
            "%",
            undefined,
            false,
            "overlayOpacity"
          )}

          {renderSlider(
            "Wysokość górnej strefy (relatywna)",
            Number.isNaN(parseFloat(((adjustments.trainingArea.upperZoneRatio ?? 0.4) * 100).toString())) ? 40 : (adjustments.trainingArea.upperZoneRatio ?? 0.4) * 100,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                trainingArea: { ...prev.trainingArea, upperZoneRatio: (parseFloat(value.toString()) || 0) / 100 },
              })),
            0,
            100,
            10,
            "%",
            undefined,
            false,
            "upperZoneRatio"
          )}
        </IonList>

        {/* ------------------------------------------ */}
        {/* Pozostałe targetProbabilities (np. handPair, anyHand, anyFoot, itp.) */}
        {/* ------------------------------------------ */}

        <IonList style={{ marginTop: "1rem" }}>
          <IonItem>
            <IonLabel>Pozostałe prawdopodobieństwa celów</IonLabel>
          </IonItem>

          {renderSlider(
            "Para rąk (handPair)",
            adjustments.targetProbabilities.handPair * 100,
            (val) => {
              setAdjustments((prev) =>
                updateMultiTargetProbability("handPair", val, prev)
              );
            },
            0,
            100,
            5,
            "%",
            undefined,
            !adjustments.enabledKeypoints.leftWrist || !adjustments.enabledKeypoints.rightWrist,
            "handPair"
          )}

          {renderSlider(
            "Pojedyncza ręka (handSingle)",
            adjustments.targetProbabilities.handSingle * 100,
            (val) => {
              setAdjustments((prev) =>
                updateMultiTargetProbability("handSingle", val, prev)
              );
            },
            0,
            100,
            5,
            "%",
            undefined,
            !adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist,
            "handSingle"
          )}

          {renderSlider(
            "Dowolna ręka (anyHand)",
            adjustments.targetProbabilities.anyHand * 100,
            (val) => {
              setAdjustments((prev) =>
                updateMultiTargetProbability("anyHand", val, prev)
              );
            },
            0,
            100,
            5,
            "%",
            undefined,
            !adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist,
            "anyHand"
          )}

          {renderSlider(
            "Dowolna stopa (anyFoot)",
            adjustments.targetProbabilities.anyFoot * 100,
            (val) => {
              setAdjustments((prev) =>
                updateMultiTargetProbability("anyFoot", val, prev)
              );
            },
            0,
            100,
            5,
            "%",
            undefined,
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle,
            "anyFoot"
          )}

          {renderSlider(
            "Pojedyncza stopa (footSingle)",
            adjustments.targetProbabilities.footSingle * 100,
            (val) => {
              setAdjustments((prev) =>
                updateMultiTargetProbability("footSingle", val, prev)
              );
            },
            0,
            100,
            5,
            "%",
            undefined,
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle,
            "footSingle"
          )}

          {renderSlider(
            "Dowolna kończyna (anyLimb)",
            adjustments.targetProbabilities.anyLimb * 100,
            (val) => {
              setAdjustments((prev) =>
                updateMultiTargetProbability("anyLimb", val, prev)
              );
            },
            0,
            100,
            5,
            "%",
            undefined,
            !adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle,
            "anyLimb"
          )}

          {renderSlider(
            "Szansa sekwencji (sequence)",
            adjustments.targetProbabilities.sequence * 100,
            (val) => {
              setAdjustments((prev) =>
                updateMultiTargetProbability("sequence", val, prev)
              );
            },
            0,
            100,
            5,
            "%",
            undefined,
            !adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle,
            "sequenceProbability"
          )}

          {renderSlider(
            "Szansa śledzenia (follow)",
            adjustments.targetProbabilities.follow * 100,
            (val) => {
              setAdjustments((prev) =>
                updateMultiTargetProbability("follow", val, prev)
              );
            },
            0,
            100,
            5,
            "%",
            undefined,
            !adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle,
            "followProbability"
          )}
        </IonList>

        {/* ------------------------------------------ */}
        {/* Parametry sekwencji (sequenceConfig)       */}
        {/* ------------------------------------------ */}

        <IonList style={{ marginTop: "1rem" }}>
          <IonItem>
            <IonLabel>Parametry sekwencji</IonLabel>
          </IonItem>

          {/* minSequenceSize, maxSequenceSize */}
          {renderSlider(
            "Minimalna długość sekwencji",
            Number.isNaN(parseFloat(adjustments.sequenceConfig.minSequenceSize.toString())) ? 1 : adjustments.sequenceConfig.minSequenceSize,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                sequenceConfig: { ...prev.sequenceConfig, minSequenceSize: parseFloat(value.toString()) || 1 },
              })),
            1,
            10,
            1,
            "",
            listOutline,
            (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) || (adjustments.targetProbabilities.sequence === 0),
            "minSequenceSize"
          )}

          {renderSlider(
            "Maksymalna długość sekwencji",
            Number.isNaN(parseFloat(adjustments.sequenceConfig.maxSequenceSize.toString())) ? 2 : adjustments.sequenceConfig.maxSequenceSize,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                sequenceConfig: { ...prev.sequenceConfig, maxSequenceSize: parseFloat(value.toString()) || 2 },
              })),
            1,
            20,
            1,
            "",
            listOutline,
            (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) || (adjustments.targetProbabilities.sequence === 0),
            "maxSequenceSize"
          )}

          {/* enforceOrder, showNumbers */}
          <IonItem>
            <IonLabel>Wymagaj kolejności trafień</IonLabel>
            <IonToggle
              checked={adjustments.sequenceConfig.enforceOrder}
              onIonChange={(e: ToggleCustomEvent) =>
                setAdjustments((prev) => ({
                  ...prev,
                  sequenceConfig: {
                    ...prev.sequenceConfig,
                    enforceOrder: (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) ? e.detail.checked : false,
                  },
                }))
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel>Wyświetlaj numerację celów</IonLabel>
            <IonToggle
              checked={adjustments.sequenceConfig.showNumbers}
              onIonChange={(e: ToggleCustomEvent) =>
                setAdjustments((prev) => ({
                  ...prev,
                  sequenceConfig: {
                    ...prev.sequenceConfig,
                    showNumbers: (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) ? e.detail.checked : false,
                  },
                }))
              }
            />
          </IonItem>

          {/* minDelay, maxDelay */}
          {renderSlider(
            "Minimalny odstęp między celami",
            Number.isNaN(parseFloat(adjustments.sequenceConfig.minDelay.toString())) ? 100 : adjustments.sequenceConfig.minDelay,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                sequenceConfig: { ...prev.sequenceConfig, minDelay: parseFloat(value.toString()) || 100 },
              })),
            100,
            5000,
            100,
            "ms",
            timerOutline,
            (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) || (adjustments.targetProbabilities.sequence === 0),
            "seqMinDelay"
          )}

          {renderSlider(
            "Maksymalny odstęp między celami",
            Number.isNaN(parseFloat(adjustments.sequenceConfig.maxDelay.toString())) ? 200 : adjustments.sequenceConfig.maxDelay,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                sequenceConfig: { ...prev.sequenceConfig, maxDelay: parseFloat(value.toString()) || 200 },
              })),
            200,
            10000,
            100,
            "ms",
            timerOutline,
            (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) || (adjustments.targetProbabilities.sequence === 0),
            "seqMaxDelay"
          )}

          {/* handProbability, pairProbability, footMinDelay, footMaxDelay */}
          {renderSlider(
            "Prawdopodobieństwo ręki w sekwencji",
            Number.isNaN(parseFloat((adjustments.sequenceConfig.handProbability * 100).toString())) ? 50 : adjustments.sequenceConfig.handProbability * 100,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                sequenceConfig: {
                  ...prev.sequenceConfig,
                  handProbability: (parseFloat(value.toString()) || 0) / 100,
                },
              })),
            0,
            100,
            5,
            "%",
            undefined,
            (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist) || (adjustments.targetProbabilities.sequence === 0),
            "seqHandProbability"
          )}

          {renderSlider(
            "Prawdopodobieństwo par kończyn",
            Number.isNaN(parseFloat((adjustments.sequenceConfig.pairProbability * 100).toString())) ? 50 : adjustments.sequenceConfig.pairProbability * 100,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                sequenceConfig: {
                  ...prev.sequenceConfig,
                  pairProbability: (parseFloat(value.toString()) || 0) / 100,
                },
              })),
            0,
            100,
            5,
            "%",
            undefined,
            (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) || (adjustments.targetProbabilities.sequence === 0),
            "seqPairProbability"
          )}

          {renderSlider(
            "Min. odstęp dla sekwencji stóp",
            Number.isNaN(parseFloat(adjustments.sequenceConfig.footMinDelay.toString())) ? 100 : adjustments.sequenceConfig.footMinDelay,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                sequenceConfig: {
                  ...prev.sequenceConfig,
                  footMinDelay: parseFloat(value.toString()) || 100,
                },
              })),
            100,
            5000,
            100,
            "ms",
            undefined,
            (!adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) || (adjustments.targetProbabilities.sequence === 0),
            "seqFootMinDelay"
          )}

          {renderSlider(
            "Max. odstęp dla sekwencji stóp",
            Number.isNaN(parseFloat(adjustments.sequenceConfig.footMaxDelay.toString())) ? 500 : adjustments.sequenceConfig.footMaxDelay,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                sequenceConfig: {
                  ...prev.sequenceConfig,
                  footMaxDelay: parseFloat(value.toString()) || 500,
                },
              })),
            500,
            10000,
            100,
            "ms",
            undefined,
            (!adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) || (adjustments.targetProbabilities.sequence === 0),
            "seqFootMaxDelay"
          )}
        </IonList>

        {/* ------------------------------------------ */}
        {/* Parametry śledzenia (followConfig)         */}
        {/* ------------------------------------------ */}

        <IonList style={{ marginTop: "1rem" }}>
          <IonItem>
            <IonLabel>Parametry celu śledzącego (followConfig)</IonLabel>
          </IonItem>

          {renderSlider(
            "Minimalny czas trwania śledzenia",
            Number.isNaN(parseFloat(adjustments.followConfig.minDuration.toString())) ? 500 : adjustments.followConfig.minDuration,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                followConfig: { ...prev.followConfig, minDuration: parseFloat(value.toString()) || 500 },
              })),
            500,
            5000,
            100,
            "ms",
            undefined,
            (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) || (adjustments.targetProbabilities.follow === 0),
            "followMinDuration"
          )}

          {renderSlider(
            "Maksymalny czas trwania śledzenia",
            Number.isNaN(parseFloat(adjustments.followConfig.maxDuration.toString())) ? 1000 : adjustments.followConfig.maxDuration,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                followConfig: { ...prev.followConfig, maxDuration: parseFloat(value.toString()) || 1000 },
              })),
            1000,
            10000,
            100,
            "ms",
            undefined,
            (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) || (adjustments.targetProbabilities.follow === 0),
            "followMaxDuration"
          )}

          {renderSlider(
            "Minimalny promień śledzenia",
            Number.isNaN(parseFloat(adjustments.followConfig.minRadius.toString())) ? adjustments.trainingArea.targetSize*2 : adjustments.followConfig.minRadius,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                followConfig: { ...prev.followConfig, minRadius: parseFloat(value.toString()) || prev.trainingArea.targetSize*2 },
              })),
            adjustments.trainingArea.targetSize*2,
            adjustments.trainingArea.targetSize*5,
            30,
            "px",
            undefined,
            (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) || (adjustments.targetProbabilities.follow === 0),
            "followMinRadius"
          )}

          {renderSlider(
            "Maksymalny promień śledzenia",
            Number.isNaN(parseFloat(adjustments.followConfig.maxRadius.toString())) ? 20 : adjustments.followConfig.maxRadius,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                followConfig: { ...prev.followConfig, maxRadius: parseFloat(value.toString()) || 20 },
              })),
            adjustments.trainingArea.targetSize*2,
            adjustments.trainingArea.targetSize*5,
            120,
            "px",
            undefined,
            (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) || (adjustments.targetProbabilities.follow === 0),
            "followMaxRadius"
          )}

          {renderSlider(
            "Prawdopodobieństwo ścieżki kołowej",
            Number.isNaN(parseFloat((adjustments.followConfig.circleProbability * 100).toString())) ? 50 : adjustments.followConfig.circleProbability * 100,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                followConfig: {
                  ...prev.followConfig,
                  circleProbability: (parseFloat(value.toString()) || 0) / 100,
                },
              })),
            0,
            100,
            5,
            "%",
            undefined,
            (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) || (adjustments.targetProbabilities.follow === 0),
            "circleProbability"
          )}

          <IonItem>
            <IonLabel>Pokazuj ścieżkę?</IonLabel>
            <IonToggle
              checked={adjustments.followConfig.showPath}
              onIonChange={(e: ToggleCustomEvent) =>
                setAdjustments((prev) => ({
                  ...prev,
                  followConfig: {
                    ...prev.followConfig,
                    showPath: (adjustments.targetProbabilities.follow === 0) ? false : e.detail.checked,
                  },
                }))
              }
            />
          </IonItem>

          {renderSlider(
            "Przezroczystość ścieżki",
            Number.isNaN(parseFloat((adjustments.followConfig.pathOpacity * 100).toString())) ? 50 : adjustments.followConfig.pathOpacity * 100,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                followConfig: {
                  ...prev.followConfig,
                  pathOpacity: (parseFloat(value.toString()) || 0) / 100,
                },
              })),
            0,
            100,
            5,
            "%",
            undefined,
            (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) || !adjustments.followConfig.showPath || (adjustments.targetProbabilities.follow === 0),
            "followPathOpacity"
          )}

          {renderSlider(
            "Próg uznania ruchu za śledzenie",
            Number.isNaN(parseFloat(adjustments.defaultBehavior.followThreshold.toString())) ? 100 : adjustments.defaultBehavior.followThreshold,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                defaultBehavior: {
                  ...prev.defaultBehavior,
                  followThreshold: parseFloat(value.toString()) || 100,
                },
              })),
            100,
            5000,
            100,
            "ms",
            undefined,
            (!adjustments.enabledKeypoints.leftWrist && !adjustments.enabledKeypoints.rightWrist &&
            !adjustments.enabledKeypoints.leftAnkle && !adjustments.enabledKeypoints.rightAnkle) || (adjustments.targetProbabilities.follow === 0),
            "followThreshold"
          )}
        </IonList>

        {/* ------------------------------------------ */}
        {/* Parametry znikających celów (disappearing) */}
        {/* ------------------------------------------ */}

        <IonList style={{ marginTop: "1rem" }}>
          <IonItem>
            <IonLabel>Parametry znikania (disappearingConfig)</IonLabel>
          </IonItem>

          {/* pętla po probabilities */}
          {
            // Bezpiecznie pobieramy wartości z probabilities
            Object.entries(adjustments.disappearingConfig?.probabilities ?? {}).map(
              ([key, val]) => {
                const sliderValue = parseFloat((val ?? 0).toString()) * 100;
                return renderSlider(
                  `Szansa zniknięcia: ${key}`,
                  // Zabezpieczamy się przed NaN
                  Number.isNaN(sliderValue) ? 0 : sliderValue,
                  (newValueRaw) => {
                    const newValue = parseFloat(newValueRaw.toString()) || 0;
                    setAdjustments((prev) => ({
                      ...prev,
                      disappearingConfig: {
                        ...prev.disappearingConfig,
                        probabilities: {
                          ...prev.disappearingConfig?.probabilities,
                          // Dzielimy przez 100 (z suwaka)
                          [key]: (newValue / 100),
                        },
                      },
                    }));
                  },
                  0,
                  100,
                  5,
                  "%",
                  undefined,
                  isProbabilityDisabled(key, adjustments.enabledKeypoints),
                  `disappearing-${key}`
                );
              }
            )
          }

          {renderSlider(
            "Minimalny czas trwania",
            Number.isNaN(parseFloat(adjustments.disappearingConfig.minDuration.toString())) ? 500 : adjustments.disappearingConfig.minDuration,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                disappearingConfig: { ...prev.disappearingConfig, minDuration: parseFloat(value.toString()) || 500 },
              })),
            500,
            5000,
            100,
            "ms",
            undefined,
            false,
            "disappearMinDuration"
          )}

          {renderSlider(
            "Maksymalny czas trwania",
            Number.isNaN(parseFloat(adjustments.disappearingConfig.maxDuration.toString())) ? 1000 : adjustments.disappearingConfig.maxDuration,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                disappearingConfig: { ...prev.disappearingConfig, maxDuration: parseFloat(value.toString()) || 1000 },
              })),
            1000,
            10000,
            100,
            "ms",
            undefined,
            false,
            "disappearMaxDuration"
          )}

          {renderSlider(
            "Bufor czasowy dla sekwencji (sequenceBuffer)",
            Number.isNaN(parseFloat(adjustments.disappearingConfig.sequenceBuffer.toString())) ? 0 : adjustments.disappearingConfig.sequenceBuffer,
            (value) =>
              setAdjustments((prev) => ({
                ...prev,
                disappearingConfig: {
                  ...prev.disappearingConfig,
                  sequenceBuffer: parseFloat(value.toString()) || 0,
                },
              })),
            0,
            5000,
            100,
            "ms",
            undefined,
            isProbabilityDisabled("sequence", adjustments.enabledKeypoints),
            "disappearSeqBuffer"
          )}
        </IonList>
      </IonCardContent>
    </IonCard>
  );
};


export default TrainingConfigurator;
