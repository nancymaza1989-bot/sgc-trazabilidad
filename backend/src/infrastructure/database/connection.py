from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from src.core.config import DATABASE_URL

if "sqlite" in DATABASE_URL:
    async_database_url = DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///")
else:
    async_database_url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    async_database_url,
    echo=False,
    pool_pre_ping=True,
    **({"pool_size": 20, "max_overflow": 40} if "sqlite" not in DATABASE_URL else {})
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


async def _sembrar_usuarios():
    # Crear los 3 roles por defecto si la tabla está vacía (para que el login
    # funcione desde el primer arranque, sustituyendo al diccionario hardcodeado).
    from sqlalchemy import select, func as safunc
    from src.infrastructure.database.models.usuario_model import UsuarioModel
    from src.core.security import hash_password

    async with AsyncSessionLocal() as session:
        total = (await session.execute(safunc.count(UsuarioModel.id))).scalar()
        if total and total > 0:
            return
        por_defecto = [
            ("Administrador SGC", "admin@poderjudicial.gob.pe", "Admin2024Secure", "administrador", "Calidad"),
            ("Coordinador de Calidad", "coordinador@poderjudicial.gob.pe", "Coord2024Secure", "coordinador", "Calidad"),
            ("Analista de Calidad", "analista@poderjudicial.gob.pe", "Analista2024Secure", "analista", "Calidad"),
        ]
        for nombre, email, passw, rol, area in por_defecto:
            session.add(UsuarioModel(
                nombre=nombre, email=email,
                password_hash=hash_password(passw), rol=rol, area=area, estado="Activo",
            ))
        await session.commit()


async def _aplicar_migraciones():
    """Alteras DDL idempotentes para tablas ya existentes.

    ``Base.metadata.create_all`` solo crea tablas NUEVAS; no añade columnas a las
    ya creadas en producción. Aquí aplicamos ``ALTER TABLE ... ADD COLUMN IF NOT
    EXISTS`` (postgres) de forma re-ejecutable para incorporar campos nuevos
    (RA-105 avanzado) sin necesidad de una migración completa de Alembic.
    """
    if "sqlite" in DATABASE_URL:
        return
    alteraciones = [
        # Criticidad/severidad por caso de prueba (ítem dentro del RA-105)
        "ALTER TABLE casos_prueba_items ADD COLUMN IF NOT EXISTS severidad VARCHAR(50) NOT NULL DEFAULT 'Media'",
        # Campos adicionales de la plantilla RA-105 (encabezado/conclusión)
        "ALTER TABLE casos_prueba ADD COLUMN IF NOT EXISTS numero_requerimiento VARCHAR(100)",
        "ALTER TABLE casos_prueba ADD COLUMN IF NOT EXISTS ambiente VARCHAR(100)",
        "ALTER TABLE casos_prueba ADD COLUMN IF NOT EXISTS precondiciones TEXT",
        "ALTER TABLE casos_prueba ADD COLUMN IF NOT EXISTS datos_prueba TEXT",
        "ALTER TABLE casos_prueba ADD COLUMN IF NOT EXISTS resultado_esperado TEXT",
        # Ampliar columna archivo en evidencias a TEXT para admitir data-URIs de imágenes grandes (screenshots)
        "ALTER TABLE evidencias_caso ALTER COLUMN archivo TYPE TEXT",
        "ALTER TABLE evidencias_caso_item ALTER COLUMN archivo TYPE TEXT",
        "ALTER TABLE evidencias_incidencia ALTER COLUMN archivo TYPE TEXT",
    ]
    async with engine.begin() as conn:
        for ddl in alteraciones:
            try:
                await conn.execute(text(ddl))
            except Exception:  # No bloquear el arranque si una columna ya existe o la tabla no existe
                pass


async def _sembrar_chatbot_datos():
    from sqlalchemy import select, func as safunc
    from src.infrastructure.database.models.chatbot_model import FaqModel, DocumentoNormativoModel
    async with AsyncSessionLocal() as session:
        total_faq = (await session.execute(safunc.count(FaqModel.id))).scalar()
        if not total_faq or total_faq == 0:
            faqs = [
                ("¿Cómo registro una incidencia?", "Para registrar una incidencia, ingresa al módulo 'Incidencias' como Analista, selecciona el trabajo y la evaluación asignada, y haz clic en 'Nueva Incidencia'. Rellena los campos y añade evidencias con captura de pantalla o pegándolas directamente (Ctrl+V).", "Incidencias", 1),
                ("¿Cómo genero el reporte Excel RA-105?", "Dirígete al módulo 'Reportes', selecciona el periodo (Diario, Semanal o Mensual) y haz clic en 'Exportar Excel RA-105'. Se descargará el archivo con las 13 columnas normadas.", "Reportes", 2),
                ("¿Cómo adjunto imágenes de evidencia?", "En los módulos de Casos de Prueba e Incidencias, cuentas con el campo de evidencia donde puedes hacer clic para subir un archivo o simplemente hacer clic y presionar Ctrl+V para pegar la captura de pantalla directamente.", "Evidencias", 3),
                ("¿Qué roles existen en el SGC?", "El sistema cuenta con 3 roles principales: Administrador (gestión total y usuarios), Coordinador de Calidad (asignación de trabajos, dashboard y control) y Analista de Calidad (ejecución de pruebas, casos y registro de hallazgos e incidencias).", "General", 4),
            ]
            for p, r, c, o in faqs:
                session.add(FaqModel(pregunta=p, respuesta=r, categoria=c, orden=o))

        total_doc = (await session.execute(safunc.count(DocumentoNormativoModel.id))).scalar()
        if not total_doc or total_doc == 0:
            docs = [
                ("Guía de Gestión de Calidad SGC - Poder Judicial", "Normativa interna para la ejecución de pruebas y control de calidad de software en el Poder Judicial del Perú.", "El Sistema de Gestión de Calidad (SGC) del Poder Judicial establece los lineamientos obligatorios para la recepción, análisis, ejecución de pruebas funcionales y de integración, registro de incidencias bajo formato RA-105, y emisión de informes técnicos con firmas digitales o de aprobación por parte del Coordinador de Calidad.", "Normativa SGC"),
                ("Estándar ISO/IEC 25010 en Evaluaciones", "Criterios de calidad de producto software aplicados en las evaluaciones del SGC.", "Las evaluaciones consideran las características de adecuación funcional, fiabilidad, compatibilidad, usabilidad, mantenibilidad y seguridad definidas en el estándar internacional ISO/IEC 25010, permitiendo calificar los trabajos con severidades Baja, Media, Alta o Crítica.", "Calidad ISO"),
            ]
            for t, d, c, cat in docs:
                session.add(DocumentoNormativoModel(titulo=t, descripcion=d, contenido=c, categoria=cat))
            await session.commit()


async def init_db():
    async with engine.begin() as conn:
        # Crea cualquier tabla nueva (incluida la tabla puente asignacion_trabajos)
        # si no existe todavía. No se modifica "trabajos" para evitar locks en prod.
        await conn.run_sync(Base.metadata.create_all)
    await _aplicar_migraciones()
    await _sembrar_usuarios()
    await _sembrar_chatbot_datos()


