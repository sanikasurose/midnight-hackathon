from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://verehire:verehire@db:5432/verehire"
    JWT_SECRET: str = "dev_only_change_me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ANTHROPIC_API_KEY: str = ""
    MIDNIGHT_RPC_URL: str = ""
    MIDNIGHT_CONTRACT_ADDRESS: str = ""
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"
    MAX_RESUME_SIZE_MB: int = 10
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
