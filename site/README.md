# HST – Website-Mockup (Heizung · Sanitär · Trojanski)

Erster Entwurf einer One-Page-Website mit scrollgesteuerter 3D-Wärmepumpe.
Die Wärmepumpe ist komplett in three.js-Code gebaut (kein 3D-Modell, kein Download)
und zerlegt sich beim Scrollen Station für Station:

| Station | Was passiert |
|---|---|
| Hero | Außeneinheit in 3/4-Ansicht, Ventilator dreht |
| 01 Gehäuse | Frontverkleidung + Lüftergitter fahren nach vorn |
| 02 Ventilator | Verkleidung gleitet aus dem Bild, Nahaufnahme EC-Ventilator |
| 03 Verdichter | Seitenwand schwenkt weg, Verdichter + Abscheider fahren heraus |
| 04 Verdampfer | Kamera hinter dem Gerät, Lamellen-Wärmetauscher fährt nach hinten |
| 05 Regelung | Deckel hebt ab, Inverter-Platine kippt heraus |
| 06 Explosion | Alle Teile auseinander, 360°-Drehteller, Zusammenbau |

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
- `js/heatpump.js` – das 3D-Modell, jedes Bauteil als Funktion
- `js/main.js` – Drehbuch (`STAGES`), Kamerafahrt, Scroll-Steuerung
- `vendor/` – three.js r170 (lokal, keine CDN-Abhängigkeit)
- `assets/hst-mark.svg` – Platzhalter-Logo

## Noch zu ergänzen (Platzhalter)

- Echtes Logo & Hausfarben (aktuell: Navy + Orange als Vorschlag)
- Telefonnummer, E-Mail, PLZ
- Über uns: Gründung, Inhaber, Team, Einsatzgebiet, Kennzahlen
- Echte Google-Bewertungen
- Leistungen prüfen (z. B. ob Notdienst angeboten wird)
- Fotos von Projekten/Team
- Impressum & Datenschutz
