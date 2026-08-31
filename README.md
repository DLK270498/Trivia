# Hauptstädte lernen

Eine kleine private Lern-App für die Hauptstädte der Welt (~197 Länder inkl. Vatikanstadt und Palästina), mit interessanten Facts und einem Leitner-Karteikasten-System für regelmäßige Wiederholung.

## So funktioniert's

1. Für jedes Land wirst du zuerst gefragt, ob du die Hauptstadt weißt (optionales Texteingabefeld zum Selbsttesten).
2. Nach Klick auf "Antwort zeigen" siehst du die richtige Hauptstadt und 2 interessante Facts dazu.
3. Du schätzt selbst ein: "Gewusst" oder "Nicht gewusst".
   - **Gewusst** → die Karte wandert eine Box im Leitner-System nach oben und wird erst später wieder fällig (1, 3, 7, 14 Tage).
   - **Nicht gewusst** → die Karte fällt zurück auf Box 1 und taucht **innerhalb derselben Runde bald wieder auf**, außerdem am nächsten Tag erneut.

Dein Fortschritt wird in `data/progress.json` gespeichert (lokale Datei, kein Server außer deinem eigenen Rechner).

## Starten

```bash
npm install
npm run dev
```

Dann die angezeigte lokale URL (z. B. http://localhost:5173) im Browser öffnen.

Die App läuft nur im Dev-Modus (`npm run dev`), da die Fortschritts-Speicherung über ein Vite-Plugin realisiert ist, das nur im Dev-Server aktiv ist – für eine rein private, lokal genutzte App ist das ausreichend.

## Daten erweitern

Die Hauptstädte samt Facts liegen in `src/data/capitals.json`. Einträge können frei ergänzt oder angepasst werden (Format: `{ "country", "capital", "region", "facts": [...] }`).
