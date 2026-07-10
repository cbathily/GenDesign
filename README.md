# LIMINAL - Dreamcore Asset Generator

Ein interaktiver Generator für Game-Assets im Dreamcore und Backrooms Stil. Projektarbeit für Generative Gestaltung.

Erstellt drei Arten von Assets, alle live über Parameter steuerbar:

## Features

**Background** - Prozedurale liminale Räume. Endlose Korridore, Säulenhallen, Void Rooms mit Perspektive, Filmkorn und Fog.

**Entities** - Charaktere und Monster mit individuellen Eigenschaften. Augen, Gliedmaßen, verschiedene Render-Modi (solid, 1-bit dither, photo-grain).

**Audio** - Prozedurale Horror-Atmosphären. Layering von Sounds für Ambience und Atmosphäre.

## Technologie

Frontend-Only: p5.js (visuelle Generierung), Tone.js (Audio), Three.js (3D-Viewer), Vanilla HTML/CSS/JS. Kein Build-Step, kein Backend - alles im Browser via CDN.

## Installation

Option 1: VS Code + Live Server Extension. Rechtsklick auf index.html, "Open with Live Server".

Option 2: index.html direkt im Browser öffnen.

## Bedienung

Drei Tabs oben: Background, Entities, Audio.

Rechts das Control-Panel mit Presets, Schiebereglern und Buttons.

**Presets** - schnelle Ausgangspunkte.

**Slider** - Parameter feinjustieren.

**Regenerate** - neuer Seed mit gleichen Einstellungen.

**Save PNG** - aktuelles Canvas als Bild exportieren.

Bei Entities: Augen folgen dem Mauszeiger (toggle "track cursor").

## Projektstruktur

index.html - UI und Struktur
style.css - Styling mit Dreamcore Ästhetik
background.js - Raum-Generator
entity.js - Charakter-Generator
entity3d.js - 3D-Modell Viewer
audio.js - Sound-Mixer
lightsout3d.js - 3D Szenen
app.js - Controller und Events
