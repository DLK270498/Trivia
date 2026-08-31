# Hauptstädte lernen

Eine kleine private Lern-App für die Hauptstädte der Welt (~197 Länder inkl. Vatikanstadt und Palästina), mit interessanten Facts und einem Leitner-Karteikasten-System für regelmäßige Wiederholung. Als installierbare Web-App (PWA) fürs Handy nutzbar.

## So funktioniert's

1. Für jedes Land wirst du zuerst gefragt, ob du die Hauptstadt weißt (optionales Texteingabefeld zum Selbsttesten).
2. Nach Klick auf "Antwort zeigen" siehst du die richtige Hauptstadt und 2 interessante Facts dazu.
3. Du schätzt selbst ein: "Gewusst" oder "Nicht gewusst".
   - **Gewusst** → die Karte wandert eine Box im Leitner-System nach oben und wird erst später wieder fällig (1, 3, 7, 14 Tage).
   - **Nicht gewusst** → die Karte fällt zurück auf Box 1 und taucht **innerhalb derselben Runde bald wieder auf**, außerdem am nächsten Tag erneut.

Dein Fortschritt wird direkt im Browser gespeichert (`localStorage`) – bleibt also auf dem Gerät/Browser, mit dem du lernst, und braucht keinen Server.

## Auf dem Handy nutzen (als Web-App)

Die App wird automatisch per GitHub Actions auf **GitHub Pages** veröffentlicht, sobald auf den Branch `claude/capitals-learning-app-afp8m7` gepusht wird.

**Einmaliges Setup (im GitHub-Repo):**

1. Auf GitHub zu *Settings → Pages* gehen.
2. Unter "Build and deployment" → "Source" auf **GitHub Actions** stellen.
3. Danach läuft der Workflow automatisch bei jedem Push und veröffentlicht die App unter:
   `https://dlk270498.github.io/Trivia/`

**Auf dem Handy installieren:**

- **iPhone (Safari):** Seite öffnen → Teilen-Symbol → "Zum Home-Bildschirm".
- **Android (Chrome):** Seite öffnen → Menü (⋮) → "App installieren" bzw. "Zum Startbildschirm hinzufügen".

Die App öffnet sich danach wie eine normale App im Vollbild (ohne Browserleiste) und funktioniert dank Service Worker auch offline, sobald sie einmal geladen wurde.

⚠️ Da der Fortschritt in `localStorage` liegt, zählt jedes Gerät/jeder Browser separat – Handy und PC teilen sich den Lernstand nicht automatisch.

## Lokal entwickeln

```bash
npm install
npm run dev
```

Dann die angezeigte lokale URL (z. B. http://localhost:5173) im Browser öffnen.

Zum Testen des Produktions-Builds (inkl. PWA/Service Worker) lokal:

```bash
npm run build
npm run preview
```

## Daten erweitern

Die Hauptstädte samt Facts liegen in `src/data/capitals.json`. Einträge können frei ergänzt oder angepasst werden (Format: `{ "country", "capital", "region", "facts": [...] }`).
