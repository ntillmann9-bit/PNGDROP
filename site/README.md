# HST – Website-Mockup (Heizung · Sanitär · Trojanski)

Entwurf einer dunklen One-Page-Website mit zwei umschaltbaren 3D-Modellen
(**Wärmepumpe | Bad**, Umschalter oben im 3D-Bereich, direkt per `?modell=bad`).

Dunkle One-Page-Website (monochrom, feine Linien, Akzent Wärme-Orange)
mit scrollgesteuerter 3D-Wärmepumpe. Im Hero windet sich ein Luftstrom-Strudel aus
tausenden feinen Linien auf die Wärmepumpe herab.
Die Wärmepumpe ist komplett in three.js-Code gebaut (kein 3D-Modell, kein Download)
und zerlegt sich beim Scrollen Station für Station:

| Station | Was passiert |
|---|---|
| Hero | Linien-Strudel (Luftstrom) über der Außeneinheit, Ventilator dreht |
| 01 Gehäuse | Frontverkleidung + Lüftergitter fahren nach vorn |
| 02 Ventilator | Verkleidung gleitet aus dem Bild, Nahaufnahme EC-Ventilator |
| 03 Verdichter | Seitenwand schwenkt weg, Verdichter + Abscheider fahren heraus |
| 04 Verdampfer | Kamera hinter dem Gerät, Lamellen-Wärmetauscher fährt nach hinten |
| 05 Regelung | Deckel hebt ab, Inverter-Platine kippt heraus |
| 06 Explosion | Alle Teile auseinander, 360°-Drehteller, Zusammenbau |

### Bad (Schnittmodell)

| Station | Was passiert |
|---|---|
| Hero | Bad-Diorama im Linien-Strudel (Akzente wasserblau) |
| 01 Badewanne | Freistehende Rechteckwanne hebt ab – Wannenträger & Ablaufgarnitur darunter |
| 02 Waschtisch | Schwarzes Aufsatzbecken, Armatur, Platte & Unterschrank fahren auseinander – Siphon & Eckventile |
| 03 Vorwand | WC und Verkleidung fahren weg – Tragrahmen mit Unterputzspülkasten |
| 04 Fußbodenheizung | Fliesen & Estrich werden durchsichtig – Heizrohre auf der Dämmung |
| 05 Explosion | Alles auseinander, 360°-Drehteller |

## Lokal ansehen

```bash
cd site
python3 -m http.server 8000
# → http://localhost:8000
```

(Muss über einen Server laufen, nicht per Doppelklick – wegen ES-Modulen.)

## Dateien

- `index.html` – Seite & Texte
- `css/styles.css` – Gestaltung (Farben oben in `:root`)
- `js/heatpump.js` – 3D-Wärmepumpe (helle Außeneinheit mit Lamellenfront)
- `js/bath.js` – 3D-Bad (Wanne, Waschtisch, WC/Vorwand, Fußbodenheizung)
- `js/vortex.js` – Luftstrom-Strudel (Linien + Partikel, Shader)
- `js/main.js` – Drehbücher (`WP_STAGES`, `BAD_STAGES`), Kamerafahrt, Scroll-Steuerung, Umschalter
- `vendor/` – three.js r170 (lokal, keine CDN-Abhängigkeit)
- `assets/hst-mark.svg` – Platzhalter-Logo

## Noch zu ergänzen (Platzhalter)

- Echtes Logo (aktuell Platzhalter „HST“)
- Telefonnummer, E-Mail, PLZ
- Über uns: Gründung, Inhaber, Team, Einsatzgebiet, Kennzahlen
- Echte Google-Bewertungen
- Leistungen prüfen (z. B. ob Notdienst angeboten wird)
- Fotos von Projekten/Team
- Impressum & Datenschutz
