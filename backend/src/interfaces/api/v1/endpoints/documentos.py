"""Generación de PDFs de los formatos del Poder Judicial.

- ``GET /documentos/incidencia/{incidencia_id}``  -> Formato de Incidencia
- ``GET /documentos/caso-prueba/{caso_id}``       -> Formato de Caso de Prueba (RA-105)
"""
import base64
import io
import os
import re
from uuid import UUID
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    Image as RLImage,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from src.core.dependencies import get_current_user
from src.infrastructure.database.connection import get_db
from src.infrastructure.database.models.trabajo_model import IncidenciaModel, CasoPruebaModel
from src.interfaces.api.v1.endpoints.serializers import incidencia_to_dict, caso_prueba_to_dict

router = APIRouter()

ANCHO = 495.0  # A4 (595) - márgenes laterales (50+50)

# ------------------------------------------------------------------
# Estilos
# ------------------------------------------------------------------
_estilos = getSampleStyleSheet()

STY_SECCION = ParagraphStyle("SeccionPJ", parent=_estilos["Heading2"], fontSize=10.5,
                             leading=13, spaceBefore=10, spaceAfter=4, textColor=colors.HexColor("#1a3a6b"))
STY_LABEL = ParagraphStyle("LabelPJ", parent=_estilos["Normal"], fontSize=8.5, leading=11)
STY_VALOR = ParagraphStyle("ValorPJ", parent=_estilos["Normal"], fontSize=9, leading=11.5)
STY_CELDA = ParagraphStyle("CeldaPJ", parent=_estilos["Normal"], fontSize=8, leading=10)
STY_CELDA_C = ParagraphStyle("CeldaCPJ", parent=_estilos["Normal"], fontSize=8, leading=10, alignment=TA_CENTER)
STY_FIRMA = ParagraphStyle("FirmaPJ", parent=_estilos["Normal"], fontSize=9, leading=11, alignment=TA_CENTER)
STY_SUPERVISOR = ParagraphStyle("SupervisorPJ", parent=_estilos["Normal"], fontSize=9, leading=11, alignment=TA_CENTER)


def _p(texto: str, estilo=STY_VALOR) -> Paragraph:
    return Paragraph(escape(str(texto or "")).replace("\n", "<br/>"), estilo)


def _si_no(valor: bool) -> str:
    return "Sí" if valor else "No"


def _nombre_archivo(correlativo: str, prefijo: str) -> str:
    limpio = re.sub(r"[^A-Za-z0-9._-]", "-", str(correlativo or ""))
    return f"{prefijo}-{limpio or 'nodisponible'}.pdf"


# ------------------------------------------------------------------
# Header de página (plantilla PJ)
# ------------------------------------------------------------------
def _decorador_pagina(titulo_doc: str):
    def _decorador(canvas, doc):
        canvas.saveState()
        w, h = A4
        canvas.setFillColor(colors.HexColor("#1a3a6b"))
        canvas.setFont("Helvetica-Bold", 14)
        canvas.drawCentredString(w / 2.0, h - 30, "PODER JUDICIAL DEL PERÚ")
        canvas.setFillColor(colors.black)
        canvas.setFont("Helvetica", 11)
        canvas.drawCentredString(w / 2.0, h - 46, "ÁREA DE CALIDAD")
        canvas.setFont("Helvetica-Bold", 12)
        canvas.drawCentredString(w / 2.0, h - 62, titulo_doc)
        canvas.setStrokeColor(colors.HexColor("#1a3a6b"))
        canvas.setLineWidth(1.2)
        canvas.line(40, h - 70, w - 40, h - 70)
        canvas.setFont("Helvetica", 8)
        canvas.drawString(40, 30, "Sistema de Gestión de Calidad - Poder Judicial del Perú")
        canvas.drawRightString(w - 40, 30, f"Página {doc.page}")
        canvas.restoreState()
    return _decorador


# ------------------------------------------------------------------
# Firma (imagen base64 o ruta)
# ------------------------------------------------------------------
def _imagen_firma(valor, max_altura=60):
    """Devuelve un flujo Image de reportlab a partir de base64 (data URI o crudo) o una ruta de archivo."""
    if not valor:
        return None

    datos = None
    m = re.match(r"data:image/(?:png|jpeg|jpg|gif|webp);base64,(.+)", valor, re.S)
    if m:
        try:
            datos = base64.b64decode(m.group(1))
        except Exception:
            datos = None

    if datos is None:
        try:
            if re.fullmatch(r"[A-Za-z0-9+/=\s]+", valor):
                candidato = base64.b64decode(valor)
                cabeceras = (b"\x89PNG", b"\xff\xd8\xff", b"BM", b"GIF8", b"RIFF")
                if any(candidato.startswith(h) for h in cabeceras):
                    datos = candidato
        except Exception:
            datos = None

    if datos is not None:
        bufer = io.BytesIO(datos)
        try:
            lector = ImageReader(bufer)
            iw, ih = lector.getSize()
            bufer.seek(0)
        except Exception:
            return None
        if not ih:
            return None
        alto = min(ih, max_altura)
        ancho = iw * alto / ih
        return RLImage(bufer, width=ancho, height=alto)

    if os.path.exists(str(valor)):
        try:
            lector = ImageReader(str(valor))
            iw, ih = lector.getSize()
        except Exception:
            return None
        if not ih:
            return None
        alto = min(ih, max_altura)
        return RLImage(str(valor), width=iw * alto / ih, height=alto)

    return None


def _flujo_firma(rotulo: str, firma: str) -> list:
    img = _imagen_firma(firma)
    flujo = [Paragraph(rotulo, STY_FIRMA), Spacer(1, 2)]
    if img:
        flujo.append(img)
    else:
        caja = Table([[""]], colWidths=[150], rowHeights=[22 * 2.8346], style=TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#555555")),
        ]))
        caja.hAlign = "CENTER"
        flujo.append(Spacer(1, 22))
        flujo.append(caja)
        flujo.append(Spacer(1, 4))
    flujo.append(Paragraph("_____________________", STY_FIRMA))
    return flujo


# ------------------------------------------------------------------
# Formato de Incidencia
# ------------------------------------------------------------------
def _build_pdf_incidencia(datos: dict) -> bytes:
    bufer = io.BytesIO()
    doc = SimpleDocTemplate(
        bufer, pagesize=A4, topMargin=100, bottomMargin=60, leftMargin=50, rightMargin=50,
        title=f"Formato de Incidencia {datos.get('correlativo')}",
        author="Poder Judicial del Perú",
    )

    filas = [
        ("Nº de Incidencia", datos.get("correlativo")),
        ("Ticket", datos.get("numero_ticket")),
        ("Código", datos.get("codigo")),
        ("Versión", datos.get("version")),
        ("Tipo de Error", datos.get("tipo_error")),
        ("Prioridad", datos.get("prioridad")),
        ("Es bloqueante", _si_no(datos.get("es_bloqueante"))),
        ("Analista", datos.get("analista")),
        ("Proyecto", datos.get("proyecto")),
        ("Base de datos", datos.get("base_datos")),
        ("Motor de BD", datos.get("motor_bd")),
        ("Fecha de asignación", datos.get("fecha_asignacion")),
    ]
    tabla_datos = Table(
        [[Paragraph("<b>Campo</b>", STY_CELDA_C), Paragraph("<b>Detalle</b>", STY_CELDA_C)]] + [
            [Paragraph(k, STY_LABEL), _p(v, STY_VALOR)] for k, v in filas
        ],
        colWidths=[110, ANCHO - 110],
        repeatRows=1,
    )
    tabla_datos.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a3a6b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#999999")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#eef2f8")]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))

    elementos = [
        Paragraph("FORMATO DE INCIDENCIA", STY_SECCION),
        tabla_datos,
        Spacer(1, 8),
        Paragraph("DESCRIPCIÓN DEL ERROR", STY_SECCION),
        _p(datos.get("descripcion"), STY_VALOR),
        Spacer(1, 8),
    ]

    evidencias = datos.get("evidencias") or []
    elementos.append(Paragraph("EVIDENCIAS", STY_SECCION))
    if evidencias:
        filas_ev = [[Paragraph("<b>Nº</b>", STY_CELDA_C), Paragraph("<b>Descripción</b>", STY_CELDA_C),
                     Paragraph("<b>Archivo</b>", STY_CELDA_C)]]
        filas_ev += [
            [Paragraph(str(e.get("correlativo", "")), STY_CELDA_C),
             _p(e.get("descripcion"), STY_CELDA),
             _p(e.get("archivo"), STY_CELDA)]
            for e in evidencias
        ]
        tabla_ev = Table(filas_ev, colWidths=[35, ANCHO - 195, 160], repeatRows=1)
        tabla_ev.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a3a6b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#999999")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ]))
        elementos.append(tabla_ev)
    else:
        elementos.append(_p("Sin evidencias registradas.", STY_VALOR))

    elementos.append(Spacer(1, 12))
    elementos.append(KeepTogether(_flujo_firma("FIRMA DEL ANALISTA", datos.get("firma_analista"))))

    doc.build(elementos, onFirstPage=_decorador_pagina("FORMATO DE INCIDENCIA"),
              onLaterPages=_decorador_pagina("FORMATO DE INCIDENCIA"))
    return bufer.getvalue()


# ------------------------------------------------------------------
# Formato de Caso de Prueba (RA-105)
# ------------------------------------------------------------------
def _build_pdf_caso_prueba(datos: dict) -> bytes:
    bufer = io.BytesIO()
    doc = SimpleDocTemplate(
        bufer, pagesize=A4, topMargin=100, bottomMargin=60, leftMargin=50, rightMargin=50,
        title=f"Formato de Caso de Prueba (RA-105) {datos.get('numero_caso')}",
        author="Poder Judicial del Perú",
    )

    filas = [
        ("Nº de Caso", datos.get("numero_caso")),
        ("Ticket", datos.get("numero_ticket")),
        ("Nº de Requerimiento", datos.get("numero_requerimiento")),
        ("Nº de Acta de Pase", datos.get("numero_acta_pase")),
        ("Ambiente", datos.get("ambiente")),
        ("Analista", datos.get("nombre_analista")),
        ("Tipo de Pase", datos.get("tipo_pase")),
        ("Fecha de Prueba", datos.get("fecha_prueba")),
        ("Campo / Componente / Módulo", datos.get("campo_componente")),
    ]
    tabla_datos = Table(
        [[Paragraph("<b>Campo</b>", STY_CELDA_C), Paragraph("<b>Detalle</b>", STY_CELDA_C)]] + [
            [Paragraph(k, STY_LABEL), _p(v, STY_VALOR)] for k, v in filas
        ],
        colWidths=[110, ANCHO - 110],
        repeatRows=1,
    )
    tabla_datos.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a3a6b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#999999")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#eef2f8")]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))

    elementos = [
        Paragraph("FORMATO DE CASO DE PRUEBA (RA-105)", STY_SECCION),
        tabla_datos,
        Spacer(1, 8),
    ]

    if datos.get("precondiciones"):
        elementos += [
            Paragraph("PRECONDICIONES", STY_SECCION),
            _p(datos.get("precondiciones"), STY_VALOR),
            Spacer(1, 6),
        ]
    if datos.get("datos_prueba"):
        elementos += [
            Paragraph("DATOS DE PRUEBA", STY_SECCION),
            _p(datos.get("datos_prueba"), STY_VALOR),
            Spacer(1, 6),
        ]
    if datos.get("resultado_esperado"):
        elementos += [
            Paragraph("RESULTADO ESPERADO", STY_SECCION),
            _p(datos.get("resultado_esperado"), STY_VALOR),
            Spacer(1, 6),
        ]

    elementos.append(Paragraph("CASOS DE PRUEBA", STY_SECCION))

    casos = datos.get("casos") or []
    if casos:
        def _texto_evidencias(evs):
            lineas = []
            for ev in evs:
                numero = escape(str(ev.get("correlativo", "") or ""))
                archivo = escape(str(ev.get("archivo", "") or "")).replace("\n", " ")
                desc = escape(str(ev.get("descripcion", "") or "")).replace("\n", " ")
                texto = f"Evidencia #{numero}: {archivo}"
                if desc:
                    texto += f" - {desc}"
                lineas.append(texto)
            return "<br/>".join(lineas) if lineas else "Sin evidencias."

        filas_casos = [[Paragraph("<b>Nº</b>", STY_CELDA_C),
                        Paragraph("<b>Descripción del caso</b>", STY_CELDA_C),
                        Paragraph("<b>Severidad</b>", STY_CELDA_C),
                        Paragraph("<b>Evidencias</b>", STY_CELDA_C)]]
        filas_casos += [
            [Paragraph(str(c.get("numero", "")), STY_CELDA_C),
             _p(c.get("descripcion"), STY_CELDA),
             Paragraph(escape(str(c.get("severidad") or "Media")), STY_CELDA_C),
             Paragraph(_texto_evidencias(c.get("evidencias") or []), STY_CELDA)]
            for c in casos
        ]
        tabla_casos = Table(filas_casos, colWidths=[35, ANCHO - 265, 70, 160], repeatRows=1)
        tabla_casos.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a3a6b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#999999")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ]))
        elementos.append(tabla_casos)
    else:
        elementos.append(_p("Sin casos de prueba registrados.", STY_VALOR))

    evidencias_doc = datos.get("evidencias") or []
    if evidencias_doc:
        elementos.append(Paragraph("EVIDENCIAS DEL DOCUMENTO", STY_SECCION))
        filas_ev = [[Paragraph("<b>Nº</b>", STY_CELDA_C), Paragraph("<b>Descripción</b>", STY_CELDA_C),
                     Paragraph("<b>Archivo</b>", STY_CELDA_C)]]
        filas_ev += [
            [Paragraph(str(e.get("correlativo", "")), STY_CELDA_C),
             _p(e.get("descripcion"), STY_CELDA),
             _p(e.get("archivo"), STY_CELDA)]
            for e in evidencias_doc
        ]
        tabla_ev = Table(filas_ev, colWidths=[35, ANCHO - 195, 160], repeatRows=1)
        tabla_ev.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a3a6b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#999999")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ]))
        elementos.append(tabla_ev)

    elementos += [
        Spacer(1, 8),
        Paragraph("RESULTADO DE LA PRUEBA", STY_SECCION),
        Paragraph(escape(str(datos.get("resultado_prueba", "Pendiente"))), STY_VALOR),
        Spacer(1, 6),
        Paragraph("OBSERVACIONES", STY_SECCION),
        _p(datos.get("observaciones"), STY_VALOR),
        Spacer(1, 12),
    ]

    firma_analista = _flujo_firma("FIRMA DEL ANALISTA", datos.get("firma_analista"))
    firma_supervisor = _flujo_firma("FIRMA DEL SUPERVISOR (COORDINADOR)", datos.get("firma_supervisor"))
    tabla_firmas = Table([[firma_analista, firma_supervisor]], colWidths=[ANCHO / 2.0, ANCHO / 2.0])
    tabla_firmas.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elementos.append(tabla_firmas)

    doc.build(elementos, onFirstPage=_decorador_pagina("FORMATO DE CASO DE PRUEBA (RA-105)"),
              onLaterPages=_decorador_pagina("FORMATO DE CASO DE PRUEBA (RA-105)"))
    return bufer.getvalue()


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------

@router.get("/incidencia/{incidencia_id}")
async def descargar_formato_incidencia(
    incidencia_id: UUID,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    inc = (await db.execute(select(IncidenciaModel).where(IncidenciaModel.id == str(incidencia_id)))).scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    datos = incidencia_to_dict(inc)
    pdf = _build_pdf_incidencia(datos)
    filename = _nombre_archivo(datos.get("correlativo"), "incidencia")
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/caso-prueba/{caso_id}")
async def descargar_formato_caso_prueba(
    caso_id: UUID,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    caso = (await db.execute(select(CasoPruebaModel).where(CasoPruebaModel.id == str(caso_id)))).scalar_one_or_none()
    if not caso:
        raise HTTPException(status_code=404, detail="Caso de prueba no encontrado")
    datos = caso_prueba_to_dict(caso)
    pdf = _build_pdf_caso_prueba(datos)
    filename = _nombre_archivo(datos.get("numero_caso") or datos.get("correlativo"), "caso-prueba")
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )