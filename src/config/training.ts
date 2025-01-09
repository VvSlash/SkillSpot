// Konfiguracja treningu testowego z typami number
export const TEST_TRAINING_CONFIG = {
  SPEED: 1.0,
  VARIATION: 0,
  DISAPPEARING_PROBABILITY: 0.3,
  // SEQUENCE_PROBABILITY: 0.2,
  // MIN_SEQUENCE_SIZE: 2,
  // MAX_SEQUENCE_SIZE: 5,
  // FOLLOW_PROBABILITY: 0.2,
  // MIN_FOLLOW_DURATION: 2000,
  // MAX_FOLLOW_DURATION: 5000,
  DEFAULT_BEHAVIOR: {
    TYPE: 'static',
    MIN_FOLLOW_DISTANCE: 3000,
    FOLLOW_THRESHOLD: 3000,
  },
  // Prawdopodobieństwa
  TARGET_PROBABILITIES: {
    SEQUENCE: 0.30, // 30% szans na sekwencję
    FOLLOW: 0.30, // 30% szans na follow
    HAND_PAIR: 0.30, // 30% szans na parę rąk
    SINGLE_LEFT_WRIST: 0.25, // 25% szans na rękę lewą
    SINGLE_RIGHT_WRIST: 0.25, // 25% szans na rękę prawą
    SINGLE_LEFT_ANKLE: 0.25, // 25% szans na stopę lewą
    SINGLE_RIGHT_ANKLE: 0.25, // 25% szans na stopę prawą
    ANY_HAND: 0.04, // 4% szans na dowolną rękę
    ANY_FOOT: 0.03, // 3% szans na dowolną stopę
    ANY_LIMB: 0.03, // 3% szans na dowolny kończyny
  },
  ENABLED_KEYPOINTS: {
    LEFT_WRIST: true,
    RIGHT_WRIST: true,
    LEFT_ANKLE: true,
    RIGHT_ANKLE: true,
  },
  // Konfiguracja sekwencji
  SEQUENCE: {
    MIN_SIZE: 2, // Minimalna liczba celów w sekwencji
    MAX_SIZE: 5, // Maksymalna liczba celów w sekwencji
    MIN_DELAY: 500, // Minimalny czas między celami w sekwencji
    MAX_DELAY: 2000, // Maksymalny czas między celami w sekwencji
    ENFORCE_ORDER: true, // Wymuszanie kolejności celów
    SHOW_NUMBERS: true, // Wyświetlanie numerów celów
    HAND_PROBABILITY: 0.7, // Prawdopodobieństwo pojawienia się rąk
    PAIR_PROBABILITY: 0.3, // Prawdopodobieństwo pojawienia się pary rąk
    FOOT_MIN_DELAY: 1000, // Minimalny czas między stopami
    FOOT_MAX_DELAY: 2000, // Maksymalny czas między stopami
    DELAY_BETWEEN_TARGETS: 500, // Czas między celami w sekwencji
  },

  // Konfiguracja celów typu follow
  FOLLOW: {
    MIN_DURATION: 2000, // Minimalny czas trwania celu typu follow
    MAX_DURATION: 5000, // Maksymalny czas trwania celu typu follow
    MIN_RADIUS: 30, // Minimalny promień celu typu follow
    MAX_RADIUS: 100, // Maksymalny promień celu typu follow
    CIRCLE_PROBABILITY: 0.5, // Prawdopodobieństwo pojawienia się koła
    SHOW_PATH: true, // Wyświetlanie ścieżki
    PATH_OPACITY: 0.4, // Przeźroczystość ścieżki
    SEGMENTS: {
      PATH: 16, // Liczba segmentów ścieżki
      CIRCLE: 24, // Liczba segmentów koła
      LINE: 2, // Liczba segmentów linii
    },
  },

  // Konfiguracja obszaru treningu
  TRAINING_AREA: {
    ASPECT_RATIO: 9 / 16, //proporcja obszaru treningu
    MARGIN: 40, //margines od krawędzi ekranu
    TARGET_SIZE: 30, //rozmiar celu
    HIT_RADIUS: 30, //promień trafienia
    OVERLAY_OPACITY: 0.5, //przeźroczystość nakładki
    UPPER_ZONE_RATIO: 0.66, //proporcja górnej części ekranu
  },

  // Konfiguracja znikających celów
  DISAPPEARING: {
    PROBABILITIES: {
      SEQUENCE: 0.3, //prawdopodobieństwo zniknięcia sekwencji
      FOLLOW: 0.2, //prawdopodobieństwo zniknięcia follow
      HAND_PAIR: 0.3, //prawdopodobieństwo zniknięcia pary rąk
      SINGLE_HAND: 0.4, //prawdopodobieństwo zniknięcia pojedynczej ręki
      ANY_HAND: 0.4, //prawdopodobieństwo zniknięcia dowolnej ręki
      ANY_FOOT: 0.3, //prawdopodobieństwo zniknięcia dowolnej stopy
      ANY_LIMB: 0.3, //prawdopodobieństwo zniknięcia dowolnego kończyna
      SINGLE_FOOT: 0.3, //prawdopodobieństwo zniknięcia pojedynczej stopy
    },
    MIN: 2000, //minimalny czas trwania celu
    MAX: 5000, //maksymalny czas trwania celu
    SEQUENCE_BUFFER: 1000, //bufor czasu przed zniknięciem sekwencji
    
  },
}; 