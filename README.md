# SGC-Trazabilidad - Sistema de Gestión de Calidad

## Instalación Rápida

### Windows
```bash
# Ejecutar el script de instalación
setup.bat
```

### Linux/Mac
```bash
# Dar permisos y ejecutar
chmod +x setup.sh
./setup.sh
```

## Despliegue Gratuito (Render.com)

1. Crear cuenta en [Render.com](https://render.com)
2. Conectar repositorio de GitHub
3. Render detectará automáticamente el archivo `render.yaml`
4. Los servicios se desplegarán automáticamente

## Credenciales de Prueba

- **Email:** admin@poderjudicial.gob.pe
- **Contraseña:** Admin2024#Secure

## Estructura del Proyecto

```
sgc-trazabilidad/
├── backend/          # API FastAPI (Python)
├── frontend/         # Frontend Next.js (React)
├── docker-compose.yml
├── render.yaml       # Configuración Render.com
└── setup.bat         # Script de instalación Windows
```

## Tecnologías

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL/SQLite
- **Frontend:** Next.js 14, React, MUI, Recharts, Tailwind CSS
- **Auth:** Next.js + JWT
