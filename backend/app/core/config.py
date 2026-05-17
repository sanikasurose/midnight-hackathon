from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://verehire:verehire@db:5432/verehire"
    
    # Authentication
    JWT_SECRET: str = "dev_only_change_me"
    
    # AI Engine (Anthropic Claude)
    ANTHROPIC_API_KEY: str = ""
    
    # Midnight Network Configuration
    MIDNIGHT_RPC_URL: str = "https://rpc.devnet.midnight.network"  # devnet default
    MIDNIGHT_PROOF_SERVER_URL: str = "https://proof-server.devnet.midnight.network"  # Proof server
    MIDNIGHT_CONTRACT_ADDRESS: str = ""  # Set after contract deployment
    MIDNIGHT_NETWORK: str = "devnet"  # devnet | preview | mainnet
    MIDNIGHT_PRIVATE_KEY: str = ""  # Wallet private key for transaction signing
    MIDNIGHT_WALLET_ADDRESS: str = ""  # Derived from private key
    
    # Frontend Configuration
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    
    # File Upload Limits
    MAX_RESUME_SIZE_MB: int = 10
    
    # Midnight Integration Flags
    MIDNIGHT_ENABLED: bool = True
    MIDNIGHT_FALLBACK_MOCK_PROOFS: bool = False  # Use mocked proofs if Midnight fails
    MIDNIGHT_LOG_REQUESTS: bool = True  # Log all contract calls for debugging

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

