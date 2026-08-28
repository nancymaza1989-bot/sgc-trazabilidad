from enum import Enum

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