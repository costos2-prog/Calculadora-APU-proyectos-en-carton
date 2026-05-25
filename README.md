# DIFORMA APU Calculator

Herramienta de Análisis de Precios Unitarios (APU) para cajas y empaques de cartón corrugado, microcorrugado y cartulina plegadiza. Orientada al mercado colombiano.

## Inicio rápido (Windows)

```batch
start.bat
```

Este script instala dependencias, carga los datos iniciales y levanta ambos servidores.

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Documentación API | http://localhost:8000/docs |

## Inicio manual

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python seed_data.py           # Cargar datos iniciales (solo primera vez)
python main.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.11 + FastAPI + SQLAlchemy |
| Base de datos | SQLite (archivo `backend/apu_calculator.db`) |
| Frontend | React 18 + Vite + Tailwind CSS |
| Estado | Zustand |
| Formularios | React Hook Form + Zod |
| Excel | openpyxl |

## Funcionalidades principales

- **Dashboard** con resumen de proyectos
- **Calculadora APU** con cálculo en tiempo real (debounce 500 ms)
- **Exportación Excel** con 3 hojas: encabezado, APU detallado, resumen comparativo
- **Panel de administración** para materiales, acabados, máquinas y variables globales
- **Validación** de dimensiones de pieza vs. tamaño de pliego
- **Recomendación automática** de proceso según cantidad producida

## Variables globales editables

Todas las variables de costo (MO, CIF, margen, IVA, troquel, insumos) se configuran desde **Administración → Variables Globales** sin tocar código.
