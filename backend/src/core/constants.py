from enum import Enum

class EstadoEvaluacion(str, Enum):
    PENDIENTE_ASIGNACION = "Pendiente de asignación"
    EN_PROCESO = "Proceso de evaluación"
    PENDIENTE_ENTREGA = "Pendiente de entrega"
    ENTREGADO = "Entregado por el Analista"
    EN_VALIDACION = "En validación"
    CERRADO = "Cerrado"

class TipoAtencion(str, Enum):
    PASE_VERSION = "Pase de versión"
    PASE_PUNTUAL = "Pase puntual"
    REQUERIMIENTO = "Requerimiento"

class TipoError(str, Enum):
    FUNCIONAL = "Funcional"
    NO_FUNCIONAL = "No funcional"
    BASE_DATOS = "Base de datos"
    DISENO = "Diseño"
    DOCUMENTACION = "Documentación"
    DATA = "Data"
    TABLAS_MAESTRAS = "Tablas maestras"
    OTROS = "Otros"

class EstadoIncidencia(str, Enum):
    REPORTADO = "Reportado"
    ASIGNADO = "Asignado"
    EN_ANALISIS = "En análisis"
    EN_DESARROLLO = "En desarrollo"
    EN_PRUEBAS = "En pruebas"
    RESUELTO = "Resuelto"
    VERIFICADO = "Verificado"
    CERRADO = "Cerrado"
    REABIERTO = "Reabierto"

class Prioridad(str, Enum):
    CRITICA = "Crítica"
    ALTA = "Alta"
    MEDIA = "Media"
    BAJA = "Baja"

class Severidad(str, Enum):
    CRITICA = "Crítica"
    ALTA = "Alta"
    MEDIA = "Media"
    BAJA = "Baja"

class PrioridadIncidencia(str, Enum):
    """Prioridad del Formato de Incidencia del Poder Judicial: BAJO / MEDIO / ALTO."""
    BAJO = "Bajo"
    MEDIO = "Medio"
    ALTO = "Alto"

class TipoPase(str, Enum):
    """Tipo de pase del Formato de Caso de Prueba (RA-105)."""
    VERSION = "Versión"
    PUNTUAL = "Puntual"
    PRUEBAS_UNITARIAS = "Pruebas Unitarias"

class ResultadoPrueba(str, Enum):
    """Resultado del Formato de Caso de Prueba (RA-105)."""
    APROBADO = "Aprobado"
    RECHAZADO = "Rechazado"
    OBSERVADO = "Observado"
    PENDIENTE = "Pendiente"

class MotorBD(str, Enum):
    """Motor de base de datos del Formato de Incidencia."""
    POSTGRESQL = "PostgreSQL"
    MYSQL = "MySQL"
    SQL_SERVER = "SQL Server"
    ORACLE = "Oracle"
    OTROS = "Otros"

TRANSICIONES_INCIDENCIA = {
    EstadoIncidencia.REPORTADO: [EstadoIncidencia.ASIGNADO, EstadoIncidencia.CERRADO],
    EstadoIncidencia.ASIGNADO: [EstadoIncidencia.EN_ANALISIS, EstadoIncidencia.REABIERTO],
    EstadoIncidencia.EN_ANALISIS: [EstadoIncidencia.EN_DESARROLLO, EstadoIncidencia.REPORTADO],
    EstadoIncidencia.EN_DESARROLLO: [EstadoIncidencia.EN_PRUEBAS, EstadoIncidencia.EN_ANALISIS],
    EstadoIncidencia.EN_PRUEBAS: [EstadoIncidencia.RESUELTO, EstadoIncidencia.EN_DESARROLLO],
    EstadoIncidencia.RESUELTO: [EstadoIncidencia.VERIFICADO, EstadoIncidencia.REABIERTO],
    EstadoIncidencia.VERIFICADO: [EstadoIncidencia.CERRADO, EstadoIncidencia.REABIERTO],
    EstadoIncidencia.CERRADO: [EstadoIncidencia.REABIERTO],
    EstadoIncidencia.REABIERTO: [EstadoIncidencia.ASIGNADO]
}