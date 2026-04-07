# Shift Backend

Python backend with:

- FastAPI for APIs
- PostgreSQL as primary database
- Async SQLAlchemy (`asyncpg`)
- Alembic migrations (versioned)
- Auth module with JWT + refresh token rotation + Google login

## 1. Requirements

- Python 3.11+
- PostgreSQL 14+

## 2. Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Update `.env` with your `DATABASE_URL` and JWT secret.

Minimum auth settings in `.env`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/shift
JWT_SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
```

Optional (only for Google login):

```env
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
CORS_ALLOW_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 3. Run migrations

```bash
alembic upgrade head
```

## 4. Run API

```bash
uvicorn app.main:app --reload
```

## 5. Auth endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## 6. Other endpoints

- `GET /`
- `GET /api/v1/health`
- `GET /api/v1/users/me`
- `GET /api/v1/users` (requires bearer token)
- `POST /api/v1/organizations`
- `GET /api/v1/organizations`
- `POST /api/v1/organizations/{organization_id}/members`
- `GET /api/v1/organizations/{organization_id}/members`
- `POST /api/v1/workspaces`
- `GET /api/v1/workspaces/organization/{organization_id}`
- `POST /api/v1/workspaces/{workspace_id}/members`
- `GET /api/v1/workspaces/{workspace_id}/members`
- `POST /api/v1/organizations/{organization_id}/conglomerates`
- `GET /api/v1/organizations/{organization_id}/conglomerates`
- `POST /api/v1/organizations/{organization_id}/competitors`
- `GET /api/v1/organizations/{organization_id}/competitors`
- `POST /api/v1/conglomerates/{conglomerate_id}/establishments`
- `GET /api/v1/conglomerates/{conglomerate_id}/establishments`
- `POST /api/v1/workspaces/{workspace_id}/contacts`
- `GET /api/v1/workspaces/{workspace_id}/contacts`
- `POST /api/v1/workspaces/{workspace_id}/projects`
- `GET /api/v1/workspaces/{workspace_id}/projects`
- `POST /api/v1/projects/{project_id}/data-sources`
- `GET /api/v1/projects/{project_id}/data-sources`
- `POST /api/v1/data-sources/{data_source_id}/test-connection`
- `POST /api/v1/data-sources/{data_source_id}/query`

Project creation payload requires:
- `name`
- `competitor_id`
- `conglomerate_id`
- `start_date`
- `end_date`

Data source creation payload requires:
- `name`
- `source_type` (`POSTGRESQL`, `MYSQL`, `SQLSERVER`, `ORACLE`, `FIREBIRD`, `SQLITE`, `SNOWFLAKE`, `CSV`, `XLSX`)
- `database` object for database source types
- `file` object for `CSV`/`XLSX`

Connection test:
- Uses the stored source settings and credentials.
- Supports per-type test for all database engines above.
- For `CSV`/`XLSX`, validates file reachability (`file_path`) or presence of `storage_key`.
- For Firebird, you can set `database.client_library_path` (e.g. `C:\\Program Files\\Firebird\\Firebird_2_5\\bin\\fbclient.dll`).

SQL execution:
- Endpoint: `POST /api/v1/data-sources/{data_source_id}/query`
- Request body:
  - `sql` (single statement)
  - `max_rows` (default `1000`, max `5000`)
- Returns JSON with `columns`, `rows`, `rowcount`, `latency_ms` and `truncated`.

## 7. Migrations workflow

```bash
alembic revision --autogenerate -m "describe_change"
alembic upgrade head
```
