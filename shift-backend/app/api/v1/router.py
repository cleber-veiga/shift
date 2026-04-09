from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    competitors,
    conglomerates,
    contacts,
    data_sources,
    database_node,
    erps,
    extractions,
    health,
    organizations,
    projects,
    users,
    workspace_players,
    workspaces,
    workspace_schema_catalogs,
    workflows,
    executions,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(erps.router, prefix="/erps", tags=["erps"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(workspace_players.router, prefix="/workspaces", tags=["workspace-players"])
api_router.include_router(workspace_schema_catalogs.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(projects.router, tags=["projects"])
api_router.include_router(data_sources.router, tags=["data-sources"])
api_router.include_router(competitors.router, tags=["competitors"])
api_router.include_router(conglomerates.router, tags=["conglomerates"])
api_router.include_router(contacts.router, tags=["contacts"])
api_router.include_router(extractions.router, tags=["extractions"])
api_router.include_router(workflows.router, tags=["workflows"])
api_router.include_router(executions.router, tags=["executions"])
api_router.include_router(database_node.router, tags=["database-node"])
