from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://verehire:verehire@db:5432/verehire"
    
    # Authentication
    JWT_SECRET: str = "dev_only_change_me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    GEMINI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    
    # Midnight Network Configuration
    MIDNIGHT_RPC_URL: str = "https://rpc.devnet.midnight.network"  # devnet default
    MIDNIGHT_PROOF_SERVER_URL: str = "https://proof-server.devnet.midnight.network"  # Proof server
    MIDNIGHT_CONTRACT_ADDRESS: str = ""  # Set after contract deployment
    MIDNIGHT_NETWORK: str = "devnet"  # devnet | preview | mainnet
    MIDNIGHT_PRIVATE_KEY: str = ""  # Wallet private key for transaction signing
    MIDNIGHT_WALLET_ADDRESS: str = ""  # Derived from private key
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    
    # File Upload Limits
    MAX_RESUME_SIZE_MB: int = 10
    
    # Midnight Integration Flags
    MIDNIGHT_ENABLED: bool = True
    MIDNIGHT_FALLBACK_MOCK_PROOFS: bool = False  # Use mocked proofs if Midnight fails
    MIDNIGHT_LOG_REQUESTS: bool = True  # Log all contract calls for debugging

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    def __init__(self, **values):
        super().__init__(**values)
        import os
        # If we are running locally (outside Docker) but DATABASE_URL points to the docker host 'db',
        # automatically fall back to SQLite to ensure a seamless local development experience.
        is_docker = os.path.exists('/.dockerenv')
        if not is_docker and "@db" in self.DATABASE_URL:
            self.DATABASE_URL = "sqlite:///./verehire.db"


settings = Settings()


