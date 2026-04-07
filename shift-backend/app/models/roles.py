from enum import StrEnum


class OrganizationMemberRole(StrEnum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    MEMBER = "MEMBER"
    GUEST = "GUEST"


class WorkspaceMemberRole(StrEnum):
    MANAGER = "MANAGER"
    CONSULTANT = "CONSULTANT"
    CLIENT = "CLIENT"
