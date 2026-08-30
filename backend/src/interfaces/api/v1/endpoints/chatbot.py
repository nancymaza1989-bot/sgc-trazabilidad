"""Módulo Chatbot Inteligente y RAG sobre Documentos Normativos y FAQ.

- GET/POST/PUT/DELETE /chatbot/faq -> Gestión de Preguntas Frecuentes
- GET/POST/PUT/DELETE /chatbot/documentos -> Gestión de Documentos Normativos (RAG)
- POST /chatbot/preguntar -> Motor RAG institucional con logging exhaustivo, rutas exactas y derivación inteligente a portales del Poder Judicial / Google.
"""
import logging
import re
import urllib.parse
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from unicodedata import normalize

from src.core.dependencies import get_current_user
from src.infrastructure.database.connection import get_db
from src.infrastructure.database.models.chatbot_model import FaqModel, DocumentoNormativoModel

logger = logging.getLogger("sgc.chatbot")
logging.basicConfig(level=logging.INFO)

router = APIRouter()

# Schemas Pydantic
class FaqRequest(BaseModel):
    pregunta: str
    respuesta: str
    categoria: Optional[str] = "General"
    activo: Optional[bool] = True
    orden: Optional[int] = 0
    url: Optional[str] = None

class DocumentoNormativoRequest(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    contenido: str
    categoria: Optional[str] = "Normativa SGC"
    activo: Optional[bool] = True
    url: Optional[str] = None

class PreguntaRequest(BaseModel):
    pregunta: str


def _normalizar(texto: str) -> set:
    if not texto:
        return set()
    nfkd = normalize('NFKD', texto.lower())
    sin_tildes = "".join([c for c in nfkd if not ord(c) in range(768, 879)])
    palabras = re.findall(r'\b\w{3,}\b', sin_tildes)
    stopwords = {'que', 'como', 'para', 'con', 'las', 'los', 'del', 'una', 'por', 'sobre', 'este', 'esta'}
    return set(p for p in palabras if p not in stopwords)


# ------------------------------------------------------------------
# CRUD FAQ
# ------------------------------------------------------------------
@router.get("/faq")
async def listar_faq(db: AsyncSession = Depends(get_db)):
    res = (await db.execute(select(FaqModel).where(FaqModel.activo == True).order_by(FaqModel.orden))).scalars().all()
    return [{"id": f.id, "pregunta": f.pregunta, "respuesta": f.respuesta, "categoria": f.categoria, "orden": f.orden, "url": f.url} for f in res]


@router.post("/faq", status_code=status.HTTP_201_CREATED)
async def crear_faq(payload: FaqRequest, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    faq = FaqModel(**payload.model_dump())
    db.add(faq)
    await db.commit()
    return {"id": faq.id, "mensaje": "FAQ creada exitosamente"}


@router.put("/faq/{faq_id}")
async def actualizar_faq(faq_id: str, payload: FaqRequest, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    faq = (await db.execute(select(FaqModel).where(FaqModel.id == faq_id))).scalar_one_or_none()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ no encontrada")
    for k, v in payload.model_dump().items():
        setattr(faq, k, v)
    await db.commit()
    return {"mensaje": "FAQ actualizada"}


@router.delete("/faq/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_faq(faq_id: str, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    faq = (await db.execute(select(FaqModel).where(FaqModel.id == faq_id))).scalar_one_or_none()
    if faq:
        await db.delete(faq)
        await db.commit()
    return None


# ------------------------------------------------------------------
# CRUD Documentos Normativos (RAG)
# ------------------------------------------------------------------
@router.get("/documentos")
async def listar_documentos(db: AsyncSession = Depends(get_db)):
    res = (await db.execute(select(DocumentoNormativoModel).order_by(DocumentoNormativoModel.titulo))).scalars().all()
    return [{"id": d.id, "titulo": d.titulo, "descripcion": d.descripcion, "categoria": d.categoria, "activo": d.activo, "url": d.url} for d in res]


@router.post("/documentos", status_code=status.HTTP_201_CREATED)
async def crear_documento(payload: DocumentoNormativoRequest, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    doc = DocumentoNormativoModel(**payload.model_dump())
    db.add(doc)
    await db.commit()
    return {"id": doc.id, "mensaje": "Documento normativo indexado exitosamente"}


@router.put("/documentos/{doc_id}")
async def actualizar_documento(doc_id: str, payload: DocumentoNormativoRequest, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    doc = (await db.execute(select(DocumentoNormativoModel).where(DocumentoNormativoModel.id == doc_id))).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    for k, v in payload.model_dump().items():
        setattr(doc, k, v)
    await db.commit()
    return {"mensaje": "Documento actualizado"}


@router.delete("/documentos/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_documento(doc_id: str, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    doc = (await db.execute(select(DocumentoNormativoModel).where(DocumentoNormativoModel.id == doc_id))).scalar_one_or_none()
    if doc:
        await db.delete(doc)
        await db.commit()
    return None


# ------------------------------------------------------------------
# Motor RAG / Preguntar con Logging y Derivación Exacta
# ------------------------------------------------------------------
@router.post("/preguntar")
async def preguntar_chatbot(payload: PreguntaRequest, db: AsyncSession = Depends(get_db)):
    pregunta_raw = payload.pregunta.strip()
    pregunta_tokens = _normalizar(pregunta_raw)

    logger.info(f"[CHATBOT RAG] Consulta recibida: '{pregunta_raw}' | Tokens normalizados: {pregunta_tokens}")

    if not pregunta_tokens:
        logger.warning(f"[CHATBOT RAG] Consulta sin tokens válidos: '{pregunta_raw}'")
        return {
            "respuesta": "Por favor, escribe una pregunta más específica sobre el SGC, casos de prueba, incidencias o normativa del Poder Judicial.",
            "fuentes": []
        }

    # 1. Buscar en FAQ institucionales
    faqs = (await db.execute(select(FaqModel).where(FaqModel.activo == True))).scalars().all()
    mejor_faq = None
    max_coincidencias_faq = 0
    for faq in faqs:
        faq_tokens = _normalizar(faq.pregunta)
        coincidencias = len(pregunta_tokens.intersection(faq_tokens))
        if coincidencias > max_coincidencias_faq:
            max_coincidencias_faq = coincidencias
            mejor_faq = faq

    if mejor_faq and max_coincidencias_faq >= 1:
        logger.info(f"[CHATBOT RAG] Match FAQ encontrado: '{mejor_faq.pregunta}' (Score: {max_coincidencias_faq})")
        respuesta_texto = mejor_faq.respuesta
        if mejor_faq.url:
            respuesta_texto += f"\n\n🔗 **Acceso directo / Ruta:** [{mejor_faq.url}]({mejor_faq.url})"
        return {
            "respuesta": respuesta_texto,
            "fuentes": [{"tipo": "FAQ Institucional", "titulo": mejor_faq.pregunta, "url": mejor_faq.url}]
        }

    # 2. RAG sobre Documentos Normativos del Poder Judicial / SGC
    documentos = (await db.execute(select(DocumentoNormativoModel).where(DocumentoNormativoModel.activo == True))).scalars().all()
    scored_docs = []
    for doc in documentos:
        doc_texto = f"{doc.titulo} {doc.descripcion or ''} {doc.contenido}".lower()
        doc_tokens = _normalizar(doc_texto)
        score = len(pregunta_tokens.intersection(doc_tokens))
        if score > 0:
            scored_docs.append((score, doc))

    scored_docs.sort(key=lambda x: x[0], reverse=True)

    if scored_docs:
        mejor_score, mejor_doc = scored_docs[0]
        logger.info(f"[CHATBOT RAG] Match Documento Normativo RAG: '{mejor_doc.titulo}' (Score: {mejor_score})")
        contenido_limpio = re.sub(r'\s+', ' ', mejor_doc.contenido)
        extracto = contenido_limpio[:500] + "..." if len(contenido_limpio) > 500 else contenido_limpio
        
        respuesta = (
            f"Según el documento oficial del Poder Judicial **{mejor_doc.titulo}** ({mejor_doc.categoria}):\n\n"
            f"{extracto}"
        )
        if mejor_doc.url:
            respuesta += f"\n\n📁 **Documento / Enlace oficial:** [{mejor_doc.url}]({mejor_doc.url})"

        return {
            "respuesta": respuesta,
            "fuentes": [{"tipo": "Documento Normativo RAG", "titulo": mejor_doc.titulo, "url": mejor_doc.url}]
        }

    # 3. Fallback inteligente con búsqueda exacta en el ecosistema del Poder Judicial y Google
    logger.info(f"[CHATBOT RAG] Sin match interno. Generando derivación oficial con búsqueda en PJ y Google para: '{pregunta_raw}'")
    
    query_encoded = urllib.parse.quote(f"site:pj.gob.pe {pregunta_raw}")
    google_url = f"https://www.google.com/search?q={query_encoded}"
    
    respuesta_fallback = (
        f"No se ha encontrado un registro interno exacto en la base de conocimiento del SGC para: *\"{pregunta_raw}\"*.\n\n"
        f"Para garantizar que obtengas la información oficial exacta del **Poder Judicial del Perú**, puedes acceder al motor de búsqueda institucional o consultar directamente el portal oficial:\n\n"
        f"🔍 **Búsqueda oficial en el Poder Judicial (Google / PJ):**\n"
        f"[{google_url}]({google_url})\n\n"
        f"🌐 **Portal Institucional del Poder Judicial:**\n"
        f"[https://www.pj.gob.pe](https://www.pj.gob.pe)"
    )

    return {
        "respuesta": respuesta_fallback,
        "fuentes": [
            {"tipo": "Búsqueda Oficial Poder Judicial", "titulo": f"Buscar '{pregunta_raw}' en pj.gob.pe", "url": google_url},
            {"tipo": "Portal Institucional", "titulo": "Poder Judicial del Perú", "url": "https://www.pj.gob.pe"}
        ]
    }
