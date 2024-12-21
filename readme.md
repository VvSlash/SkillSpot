# Aplikacja Wspomagająca Trening Koordynacji Ruchowej

Aplikacja wspomagająca trening koordynacji ruchowej z wykorzystaniem wizualnych wskazówek i analizy ruchu. Mierzy czas reakcji użytkownika podczas ćwiczeń polegających na zbiciu punktów wyświetlanych na obrazie z kamery odpowiednią dłonią lub stopą. Aplikacja stanowi alternatywę dla istniejących rozwiązań opartych o dedykowane urządzenia.

## Spis treści

- [Opis](#opis)
- [Technologie](#technologie)
- [Wymagania](#wymagania)
- [Instalacja](#instalacja)
- [Uruchomienie](#uruchomienie)
- [Funkcjonalności](#funkcjonalności)
- [Przyszły Rozwój](#przyszły-rozwój)
- [Autorzy](#autorzy)
- [Licencja](#licencja)

## Opis

Celem aplikacji jest wsparcie treningu koordynacji ruchowej poprzez interaktywne ćwiczenia, które angażują użytkownika w zbicie pojawiających się na ekranie punktów za pomocą odpowiedniej dłoni lub stopy. Aplikacja wykorzystuje kamerę do analizy ruchu i mierzy czas reakcji, dostarczając użytkownikowi informacji zwrotnej na temat postępów.

## Technologie

Projekt jest stworzony w oparciu o:

- [React](https://reactjs.org/)
- [Ionic Framework](https://ionicframework.com/)
- [MediaPipe](https://mediapipe.dev/)
- [TensorFlow MoveNet](https://www.tensorflow.org/hub/tutorials/movenet)

## Wymagania

- Node.js w wersji 12.x lub wyższej
- npm lub yarn
- Kamera internetowa

## Instalacja

1. **Sklonuj repozytorium**

   ```bash
   git clone https://github.com/twoj-uzytkownik/skillspot.git
   ```

2. **Przejdź do katalogu projektu**

   ```bash
   cd skillspot
   ```

3. **Zainstaluj zależności**

   ```bash
   npm install
   # lub
   yarn install
   ```

## Uruchomienie

Aby uruchomić aplikację w trybie deweloperskim:

```bash
npm start
# lub
yarn start
```

Aplikacja powinna otworzyć się w przeglądarce pod adresem `http://localhost:8100/`.

## Funkcjonalności

- **Analiza Ruchu**: Wykorzystanie MediaPipe i TensorFlow MoveNet do śledzenia ruchów użytkownika.
- **Interaktywne Ćwiczenia**: Wyświetlanie punktów do zbicia odpowiednią dłonią lub stopą.
- **Pomiar Czasu Reakcji**: Monitorowanie i zapisywanie czasu reakcji użytkownika.
- **Responsywny Interfejs**: Dostosowanie do różnych rozmiarów ekranów i urządzeń.

## Przyszły Rozwój

- **Personalizacja Ćwiczeń**: Możliwość dostosowania poziomu trudności i rodzaju ćwiczeń.
- **Statystyki i Raporty**: Rozszerzone funkcje analizy wyników użytkownika.
- **Integracja z Urządzeniami Mobilnymi**: Optymalizacja pod kątem aplikacji mobilnych.

## Autorzy

- **VvSlash** - [GitHub](https://github.com/VvSlash)

## Licencja

Jeszcze nie wiem jaka ...