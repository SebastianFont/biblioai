# `lib/pdf` — Extracción de texto de PDFs

Aísla la lectura de PDFs detrás de una función simple (`extractPdfText`) tipada
como `PdfTextExtractor`.

- Usa `unpdf` (sin dependencias nativas, apta para entornos server) y la importa
  de forma diferida: solo se carga al procesar un PDF.
- Al estar detrás de un tipo, se puede **inyectar un extractor falso** en los
  tests de los services, sin procesar PDFs reales.

El texto extraído es la base para el resumen y el mapa conceptual que genera la
capa de IA.
