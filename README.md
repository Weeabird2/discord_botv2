# WoW Raid Manager Bot

Discord-Bot auf TypeScript-Basis, der jede Woche automatisch eine Verfuegbarkeitsabfrage fuer die kommende Raid-Woche erstellt und am Mittwoch die zwei Tage mit den meisten Zusagen auswertet.

## Funktionen

- Automatische Abfrage am Freitag fuer die kommende Raid-Woche von Mittwoch bis Dienstag
- Kompakte Tagesauswahl ueber ein Auswahlmenue statt unuebersichtlicher Wochenbuttons
- Spieler waehlen einmalig WoW-Klasse und Spec, danach nur noch Tagesanmeldung
- In der Anmeldung werden pro Tag nur die Namen angezeigt
- In der Auswertung werden die finalen Raidtage sauber nach `Tank`, `Heal` und `DD` mit Klassen- und Spec-Symbolen gruppiert
- Automatische Auswertung am Mittwoch mit den zwei besten Raidtagen
- Slash-Commands fuer manuellen Eingriff und Status
- JSON-Persistenz ohne externe Datenbank

## Setup

1. Node.js 20 oder neuer installieren.
2. Abhaengigkeiten installieren:

```bash
npm install
```

3. `.env.example` nach `.env` kopieren und Werte eintragen.
4. Bot starten:

```bash
npm run dev
```

## Discord-Berechtigungen

Der Bot braucht mindestens:

- `View Channels`
- `Send Messages`
- `Embed Links`
- `Use Slash Commands`
- `Read Message History`

## Slash-Commands

- `/raid-profile klasse:<klasse> spec:<spec>` speichert dein WoW-Profil
- `/raid-post` erstellt die Abfrage sofort
- `/raid-finalize` wertet die aktuelle Raid-Woche sofort aus
- `/raid-finalize-now` finalisiert die aktive naechste Raid-Woche sofort fuer Tests
- `/raid-reset` loescht den aktiven Raid-Post und setzt die laufende Testplanung zurueck
- `/raid-status` zeigt den aktuellen Stand
- `/raid-config channel:<#kanal>` setzt den Zielkanal zur Laufzeit

## Ablauf fuer Spieler

1. Einmal `/raid-profile` ausfuehren und Klasse plus Spec speichern.
2. In der woechentlichen Raid-Abfrage im Auswahlmenue alle verfuegbaren Tage waehlen.
3. Nach der Auswertung bleiben die finalen Raidtage offen, damit sich Spieler weiter an- und abmelden koennen.

## Zeitlogik

- Freitags wird immer die naechste Raid-Woche vorbereitet
- Die Raid-Woche laeuft von Mittwoch bis Dienstag
- Mittwochs werden die zwei Tage mit den meisten Stimmen gewaehlt
- Bei Gleichstand gewinnen die frueheren Tage der Woche
