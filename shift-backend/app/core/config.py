import os
from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine.url import make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(Path(__file__).parent.parent.parent, ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    PROJECT_NAME: str = "Shift Backend"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = ""

    SQLALCHEMY_ECHO: bool = False

    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "shift-backend"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_REQUESTS_TIMEOUT_SECONDS: int = 10
    CORS_ALLOW_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("GOOGLE_CLIENT_ID", mode="before")
    @classmethod
    def normalize_google_client_id(cls, value: object) -> str | None:
        if value is None:
            return None
        if isinstance(value, str) and not value.strip():
            return None
        if isinstance(value, str):
            return value.strip()
        return str(value)

    @field_validator("CORS_ALLOW_ORIGINS", mode="before")
    @classmethod
    def normalize_cors_origins(cls, value: object) -> list[str]:
        if value is None:
            return []
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return [str(value).strip()]

    @staticmethod
    def _is_local_host(host: str | None) -> bool:
        return host in {None, "localhost", "127.0.0.1"}

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # Se já for asyncpg, retornar direto para evitar erros de transformação
        if self.DATABASE_URL.startswith("postgresql+asyncpg"):
            return self.DATABASE_URL
            
        url = make_url(self.DATABASE_URL)

        if url.drivername in {"postgresql", "postgresql+psycopg"}:
            url = url.set(drivername="postgresql+asyncpg")

        query = dict(url.query)
        if not self._is_local_host(url.host):
            if "ssl" not in query:
                query["ssl"] = query.get("sslmode", "require")
        query.pop("sslmode", None)
        query.pop("channel_binding", None)

        return str(url.set(query=query))

    @property
    def SQLALCHEMY_DATABASE_URI_SYNC(self) -> str:
        url = make_url(self.DATABASE_URL)

        if url.drivername.endswith("+asyncpg"):
            url = url.set(drivername=url.drivername.replace("+asyncpg", "+psycopg"))
        elif url.drivername == "postgresql":
            url = url.set(drivername="postgresql+psycopg")

        query = dict(url.query)
        if not self._is_local_host(url.host):
            if "sslmode" not in query:
                query["sslmode"] = query.get("ssl", "require")
        query.pop("ssl", None)

        return str(url.set(query=query))


settings = Settings()
