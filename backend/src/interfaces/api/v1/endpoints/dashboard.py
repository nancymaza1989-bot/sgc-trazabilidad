from fastapi import APIRouter, Depends
from src.core.dependencies import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/general")
async def obtener_dashboard_general(current_user = Depends(get_current_user)):
    return {
        "kpis": [
            {"nombre": "Incidencias Abiertas", "valor": 12, "unidad": "unidades", "objetivo": 50, "estado": "excelente"},
            {"nombre": "Tasa de Resolución", "valor": 85.5, "unidad": "%", "objetivo": 80, "estado": "bueno"},
            {"nombre": "MTTR", "valor": 3.2, "unidad": "horas", "objetivo": 4, "estado": "excelente"},
            {"nombre": "Calidad ISO", "valor": 82.5, "unidad": "%", "objetivo": 80, "estado": "bueno"}
        ],
        "tendencias": [
            {
                "fechas": ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"],
                "valores": [5, 8, 3, 12, 7],
                "etiqueta": "Incidencias Nuevas",
                "color": "#1976d2"
            },
            {
                "fechas": ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"],
                "valores": [4, 6, 2, 10, 5],
                "etiqueta": "Incidencias Resueltas",
                "color": "#22c55e"
            }
        ],
        "alertas": [
            {"id": "1", "titulo": "Servidor API con latencia alta", "nivel": "Alta", "fecha": datetime.utcnow().isoformat(), "origen": "Monitoreo", "estado": "activa"},
            {"id": "2", "titulo": "Base de datos con 80% de uso", "nivel": "Media", "fecha": (datetime.utcnow() - timedelta(hours=2)).isoformat(), "origen": "Monitoreo", "estado": "activa"}
        ],
        "distribuciones": {
            "estado": {"Reportado": 3, "En análisis": 5, "Resuelto": 4, "Cerrado": 8},
            "prioridad": {"Crítica": 2, "Alta": 5, "Media": 8, "Baja": 5}
        },
        "ultimas_actividades": [
            {"tipo": "incidencia_creada", "titulo": "Error en login", "usuario": "admin", "fecha": datetime.utcnow().isoformat()},
            {"tipo": "incidencia_resuelta", "titulo": "Bug en reportes", "usuario": "dev", "fecha": (datetime.utcnow() - timedelta(hours=1)).isoformat()}
        ],
        "fecha_actualizacion": datetime.utcnow().isoformat()
    }