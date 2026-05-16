from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.services.auth_service import authenticate_user, create_access_token, register_user

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = register_user(db, email=payload.email, password=payload.password, role=payload.role.value)
    token = create_access_token(user_id=user.id, email=user.email, role=user.role)
    return AuthResponse(token=token, user_id=user.id, role=user.role)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = authenticate_user(db, email=payload.email, password=payload.password)
    token = create_access_token(user_id=user.id, email=user.email, role=user.role)
    return AuthResponse(token=token, user_id=user.id, role=user.role)
