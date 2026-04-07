from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.conglomerate import Conglomerate
from app.models.contact import Contact
from app.models.establishment import Establishment
from app.models.organization_member import OrganizationMember
from app.models.roles import OrganizationMemberRole, WorkspaceMemberRole
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.schemas.contact import ContactCreate, ContactRead, ContactUpdate

router = APIRouter()


async def get_org_member(
    db: AsyncSession,
    organization_id: UUID,
    user_id: UUID,
) -> OrganizationMember | None:
    return await db.scalar(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
        )
    )


async def get_workspace_member(
    db: AsyncSession,
    workspace_id: UUID,
    user_id: UUID,
) -> WorkspaceMember | None:
    return await db.scalar(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )


def can_write_contact(
    workspace_member: WorkspaceMember | None,
    org_member: OrganizationMember | None,
) -> bool:
    return (
        workspace_member is not None and workspace_member.role == WorkspaceMemberRole.MANAGER
    ) or (
        org_member is not None and org_member.role in {OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER}
    )


@router.post("/workspaces/{workspace_id}/contacts", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
async def create_contact(
    workspace_id: UUID,
    payload: ContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Contact:
    workspace = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace_id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not can_write_contact(workspace_member, org_member):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    conglomerate = await db.scalar(select(Conglomerate).where(Conglomerate.id == payload.conglomerate_id))
    if not conglomerate or conglomerate.organization_id != workspace.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conglomerate must belong to the same organization as the workspace.",
        )

    establishment_id = payload.establishment_id
    if establishment_id is not None:
        establishment = await db.scalar(select(Establishment).where(Establishment.id == establishment_id))
        if not establishment or establishment.conglomerate_id != conglomerate.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Establishment must belong to the selected conglomerate.",
            )

    contact = Contact(
        workspace_id=workspace_id,
        conglomerate_id=payload.conglomerate_id,
        establishment_id=establishment_id,
        name=payload.name.strip(),
        cpf=payload.cpf,
        whatsapp=payload.whatsapp,
        email=payload.email.lower().strip(),
        job_title=payload.job_title.strip(),
        is_primary=payload.is_primary,
        notes=payload.notes,
    )

    if payload.is_primary:
        await db.execute(
            update(Contact)
            .where(
                Contact.workspace_id == workspace_id,
                Contact.conglomerate_id == payload.conglomerate_id,
                Contact.is_primary.is_(True),
            )
            .values(is_primary=False)
        )

    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


@router.get("/workspaces/{workspace_id}/contacts", response_model=list[ContactRead])
async def list_contacts(
    workspace_id: UUID,
    conglomerate_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Contact]:
    workspace = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace_id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not workspace_member and not org_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    query = select(Contact).where(Contact.workspace_id == workspace_id)
    if conglomerate_id is not None:
        query = query.where(Contact.conglomerate_id == conglomerate_id)

    contacts = await db.scalars(query.order_by(Contact.created_at.desc()))
    return list(contacts)


@router.put("/contacts/{contact_id}", response_model=ContactRead)
async def update_contact(
    contact_id: UUID,
    payload: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Contact:
    contact = await db.scalar(select(Contact).where(Contact.id == contact_id))
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found.")

    workspace = await db.scalar(select(Workspace).where(Workspace.id == contact.workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not can_write_contact(workspace_member, org_member):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    conglomerate = await db.scalar(select(Conglomerate).where(Conglomerate.id == payload.conglomerate_id))
    if not conglomerate or conglomerate.organization_id != workspace.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conglomerate must belong to the same organization as the workspace.",
        )

    establishment_id = payload.establishment_id
    if establishment_id is not None:
        establishment = await db.scalar(select(Establishment).where(Establishment.id == establishment_id))
        if not establishment or establishment.conglomerate_id != conglomerate.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Establishment must belong to the selected conglomerate.",
            )

    if payload.is_primary:
        await db.execute(
            update(Contact)
            .where(
                Contact.workspace_id == contact.workspace_id,
                Contact.conglomerate_id == payload.conglomerate_id,
                Contact.id != contact.id,
                Contact.is_primary.is_(True),
            )
            .values(is_primary=False)
        )

    contact.conglomerate_id = payload.conglomerate_id
    contact.establishment_id = establishment_id
    contact.name = payload.name.strip()
    contact.cpf = payload.cpf
    contact.whatsapp = payload.whatsapp
    contact.email = payload.email.lower().strip()
    contact.job_title = payload.job_title.strip()
    contact.is_primary = payload.is_primary
    contact.notes = payload.notes

    await db.commit()
    await db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    contact = await db.scalar(select(Contact).where(Contact.id == contact_id))
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found.")

    workspace = await db.scalar(select(Workspace).where(Workspace.id == contact.workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not can_write_contact(workspace_member, org_member):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    await db.delete(contact)
    await db.commit()
