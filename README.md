# LIMINAL — Dreamcore Asset Generator

Ein interaktiver, generativer Asset-Generator für Indie-Games im **Dreamcore / Backrooms**-Stil.
Projekt für das Uni-Modul *Generative Gestaltung*.

Erstellt prozedural drei Arten von Game-Assets, jeweils live über Parameter & Prompts steuerbar:

| # | Use Case      | Was es erzeugt                                                        |
|---|---------------|----------------------------------------------------------------------|
| 1 | **Background** | Liminale Räume: endlose Korridore, Säulenhallen, void rooms          |
| 2 | **Entities**   | Spielfiguren & Monster mit Augen, Gliedmaßen, verschiedenen Renderings|
| 3 | **Audio**      | Prozedurale Soundscapes & Musik (Backrooms · Creepy · Horror · Dreamcore) per Prompt + Slidern |

---

## Technische Grundlage

- **p5.js** (v1.9) — gesamte visuelle Generierung (Background + Entities) auf einem `<canvas>`
- **Tone.js** (v14.7) — prozedurale Audio-Synthese / generativer Musik-Sequencer in Echtzeit
- **Vanilla HTML/CSS/JS** — UI, Tabs, Slider, Prompt-Felder

Kein Build-Step, kein Node, kein npm, kein Backend. Alles läuft direkt im Browser über CDN.

---

## Starten

### Variante A — VS Code (empfohlen)
1. Ordner in **VS Code** öffnen
2. Extension **Live Server** (Ritwick Dey) installieren
3. Rechtsklick auf `index.html` → **"Open with Live Server"**

### Variante B — direkt
`index.html` einfach im Browser öffnen (Doppelklick).

> Hinweis: Audio startet erst nach Klick auf **START SIGNAL** (Browser-Autoplay-Policy).

---

## Bedienung

Oben die drei Tabs (**01 Background / 02 Entities / 03 Audio**).
Rechts das Control-Panel mit:

- **Prompt-Feld** → freier Text, Button `→ INTERPRET` mappt Stichwörter auf Parameter
  (z. B. *"flooded pink hallway with fog"* oder *"tall watcher, many eyes, thin limbs"*)
- **Presets** (Chips) → schnelle Ausgangspunkte
- **Slider & Toggles** → Feinjustierung jedes Parameters in Echtzeit
- **REGENERATE** → neuer Zufalls-Seed (gleiche Parameter, neue Variante)
- **SAVE PNG** → exportiert das aktuelle Canvas als Bild

Bei **Entities** folgen die Augen dem Mauszeiger (Toggle *track cursor*).

---

## Projektstruktur

```
dreamcore-generator/
├── index.html      Struktur + UI
├── style.css       Dreamcore/CRT-Styling (VT323-Pixelfont, Scanlines, Grain)
├── background.js   Use Case 1 — Raum-Generator (Perspektive, Fog, Grain)
├── entity.js       Use Case 2 — Wesen-Generator (Blobs, Augen, Dither)
├── audio.js        Use Case 3 — Tone.js Musik-Sequencer (prompt-gesteuert)
├── app.js          Controller (p5-Sketch, Tabs, Controls, Prompt, Export)
└── README.md
```

---

## Wie die Generierung funktioniert (kurz)

**Background** — Ein-Punkt-Perspektive: rechteckige "Frames" werden von fern (klein)
nach nah (groß) gestapelt, daraus ergeben sich Wände/Decke/Boden. Perlin-Noise
variiert die Schattierung, ein Bloom am Fluchtpunkt + Fog + Filmkorn liefern den Look.

**Entities** — Eine Silhouette wird aus noise-deformierten Outline-Punkten gebaut
(`curveVertex`), Augen werden ohne Überlappung im Inneren verteilt, Gliedmaßen als
mehrgliedrige Ketten angehängt. Render-Modi: *solid*, *1-bit dither* (Floyd–Steinberg,
Gameboy-Look) oder *photo-grain*.

**Audio** — Ein prozeduraler, prompt-gesteuerter **Musik-Sequencer** auf Tone.js. Über
`Tone.Transport` läuft ein Beat-Raster; pro Takt schaltet eine **Akkordfolge** weiter, die
diatonisch aus der Stimmungs-Tonleiter gebaut wird (Mood → Dur/Moll/phrygisch/oktatonisch).
Darüber echte Instrumente: **Bass** (folgt der Harmonie), **Drums** (Kick/Snare/HiHat-Pattern:
lofi/driving/chase/tension/industrial), **Pad**, **Lead/Arp/Melodie**. Dazu ein Ambient-Bett aus
Rauschen, Neon-Summen, VHS-Hiss und Drone. Effekt-Kette: `Distortion → BitCrusher (Lo-Fi) →
Lowpass → Reverb`. Alles läuft 100 % im Browser, ohne Installation oder Wartezeit.

**Steuerung:** freier **Prompt** (z. B. *"schnelle gruselige Verfolgungsjagd"* oder *"dreamcore
mit nostalgischen Synths, melancholisch"*) setzt Stil & Stimmung; die Slider (Intensität,
Lautstärke, Tempo, Reverb, Verzerrung, Lo-Fi/VHS, Zufälligkeit) justieren **live** weiter.
`RANDOM` würfelt einen Stil, `RENDER CLIP` schneidet das Live-Signal als Audiodatei mit.

> Hinweis: Eine frühere Version nutzte echte KI (MusicGen/AudioCraft) über ein lokales Python-
> Backend. Das wurde verworfen — auf CPU war es zu langsam und speicherhungrig. Die prozedurale
> Lösung läuft sofort, offline und gratis.

---

## Ideen für die Erweiterung
- Export von Entities als transparentes PNG-Spritesheet
- Audio: weitere Drum-Pattern & Akkordfolgen, mehr Lead-Klangfarben
- Seed-Sharing per URL-Parameter (reproduzierbare Assets)
