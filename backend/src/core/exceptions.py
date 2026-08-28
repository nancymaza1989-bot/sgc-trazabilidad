class SGCCustomException(Exception):
    def __init__(self, message: str, code: str = "SGC-000", status_code: int = 500):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)

class EntidadNoEncontradaException(SGCCustomException):
    def __init__(self, entity_name: str, entity_id: str):
        super().__init__(
            message=f"{entity_name} con ID {entity_id} no encontrada",
            code="SGC-404",
            status_code=404
        )

class TransicionEstadoInvalidaException(SGCCustomException):
    def __init__(self, from_state: str, to_state: str):
        super().__init__(
            message=f"Transición de {from_state} a {to_state} no permitida",
            code="SGC-400",
            status_code=400
        )

class AutenticacionFallidaException(SGCCustomException):
    def __init__(self):
        super().__init__("Credenciales inválidas", code="SGC-401", status_code=401)