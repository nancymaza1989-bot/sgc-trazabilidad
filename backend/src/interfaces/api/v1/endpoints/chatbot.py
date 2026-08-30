"""Módulo Chatbot Inteligente y RAG sobre Documentos Normativos y FAQ.

- GET/POST/PUT/DELETE /chatbot/faq -> Gestión de Preguntas Frecuentes
- GET/POST/PUT/DELETE /chatbot/documentos -> Gestión de Documentos Normativos (RAG)
- POST /chatbot/preguntar -> Motor RAG que consulta FAQ y documentos normativos
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import re
from unicodedata import normalform

from src.core.dependencies import get_current_user
from src.infrastructure.database.connection import get_db
from src.infrastructure.database.models.chatbot_model import FaqModel, DocumentoNormativoModel

router = APIRouter()

# Schemas Pydantic
class FaqRequest(BaseModel):
    pregunta: str
    respuesta: str
    categoria: Optional[str] = "General"
    activo: Optional[bool] = True
    orden: Optional[int] = 0

class DocumentoNormativoRequest(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    contenido: str
    categoria: Optional[str] = "Normativa SGC"
    activo: Optional[bool] = True

class PreguntaRequest(BaseModel):
    pregunta: str


def _normalizar(texto: str) -> set:
    if not texto:
        return set()
    nfkd = normalform('NFKD', texto.lower())
    sin_tildes = "".join([c for c in nfkd if not ord(c) in range(768, 879)])
    palabras = re.findall(r'\b\w{3,}\b', sin_tildes)  # palabras de 3+ letras
    stopwords = {'que', 'como', 'para', 'con', 'las', 'los', 'del', 'una', 'por', 'sobre', 'este', 'esta'}
    return set(p for p in palabras if p not in stopwords)


# ------------------------------------------------------------------
# CRUD FAQ
# ------------------------------------------------------------------
@router.get("/faq")
async def listar_faq(db: AsyncSession = Depends(get_db)):
    res = (await db.execute(select(FaqModel).where(FaqModel.activo == True).order_by(FaqModel.orden))).scalars().all()
    return [{"id": f.id, "pregunta": f.pregunta, "respuesta": f.respuesta, "categoria": f.categoria, "orden": f.orden} for f in res]


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
    return [{"id": d.id, "titulo": d.titulo, "descripcion": d.descripcion, "categoria": d.categoria, "activo": d.activo} for d in res]


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
# Motor RAG / Preguntar
# ------------------------------------------------------------------
@router.post("/preguntar")
async def preguntar_chatbot(payload: PreguntaRequest, db: AsyncSession = Depends(get_db)):
    pregunta_tokens = _normalizar(payload.pregunta)
    if not pregunta_tokens:
        return {
            "respuesta": "Por favor, escribe una pregunta más específica sobre el SGC, casos de prueba, incidencias o normativa del Poder Judicial.",
            "fuentes": []
        }

    # 1. Buscar en FAQ
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
        return {
            "respuesta": mejor_faq.respuesta,
            "fuentes": [{"tipo": "FAQ", "titulo": mejor_faq.pregunta}]
        }

    # 2. RAG sobre Documentos Normativos
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
        # Extraer un extracto relevante del contenido
        contenido_limpio = re.sub(r'\s+', ' ', mejor_doc.contenido)
        extracto = contenido_limpio[:450] + "..." if len(contenido_limpio) > 450 else contenido_limpio
        respuesta = (
            f"Según el documento normativo **{mejor_doc.titulo}** ({mejor_doc.categoria}):\n\n"
            f"{extracto}"
        )
        return {
            "respuesta": respuesta,
            "fuentes": [{"tipo": "Documento Normativo", "titulo": mejor_doc.titulo}]
        }

    # 3. Fallback inteligente
    return {
        "respuesta": "No he encontrado una respuesta exacta en las preguntas frecuentes ni en la normativa del SGC. Puedes consultar al Coordinador de Calidad o revisar los manuales en la sección de Configuración.",
        "fuentes": []
    }
