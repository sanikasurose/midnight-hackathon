from fastapi import APIRouter

from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest) -> AuthResponse:
    # TODO: create user, hash password, issue JWT
    return AuthResponse(token="TODO", user_id=0)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    # TODO: verify credentials, issue JWT
    return AuthResponse(token="TODO", user_id=0)

