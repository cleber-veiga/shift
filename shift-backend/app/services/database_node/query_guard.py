from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.schemas.database_node import DatabaseConnectionPolicy, QueryRiskLevel

_SQL_COMMENTS = re.compile(r"(--.*?$|/\*.*?\*/)", re.MULTILINE | re.DOTALL)
_WHITESPACE = re.compile(r"\s+")


@dataclass
class QueryGuardAnalysis:
    normalized_sql: str
    operation: str
    risk_level: QueryRiskLevel
    warnings: list[str] = field(default_factory=list)
    blocked_reason: str | None = None


class QueryGuardViolation(ValueError):
    pass


class QueryGuard:
    def __init__(self, policy: DatabaseConnectionPolicy | None = None):
        self.policy = policy or DatabaseConnectionPolicy()

    def analyze(self, sql: str) -> QueryGuardAnalysis:
        statement = self._normalize(sql)
        operation = self._detect_operation(statement)
        warnings: list[str] = []
        risk = QueryRiskLevel.LOW
        blocked_reason: str | None = None

        if self.policy.block_multi_statement and ";" in statement:
            blocked_reason = "A conexão bloqueia múltiplas instruções SQL na mesma execução."
            risk = QueryRiskLevel.BLOCKED

        if operation == "select":
            if re.search(r"select\s+\*", statement, re.IGNORECASE):
                if self.policy.forbid_select_star:
                    blocked_reason = "A política da conexão bloqueia SELECT * em produção."
                    risk = QueryRiskLevel.BLOCKED
                else:
                    warnings.append("Evite SELECT * para reduzir custo e acoplamento com schema.")
                    risk = QueryRiskLevel.MEDIUM if risk == QueryRiskLevel.LOW else risk
            if self.policy.require_limit_for_select and not re.search(r"\blimit\b|\bfetch\s+first\b|\btop\b", statement, re.IGNORECASE):
                warnings.append("A política recomenda limitar consultas de leitura com LIMIT/TOP/FETCH FIRST.")
                risk = QueryRiskLevel.MEDIUM if risk == QueryRiskLevel.LOW else risk

        if operation in {"update", "delete"} and self.policy.require_where_for_update_delete:
            if not re.search(r"\bwhere\b", statement, re.IGNORECASE):
                blocked_reason = "UPDATE/DELETE sem WHERE foi bloqueado para proteger o banco de destino."
                risk = QueryRiskLevel.BLOCKED

        if operation == "insert" and not self.policy.allow_insert:
            blocked_reason = "A conexão não permite INSERT."
            risk = QueryRiskLevel.BLOCKED
        if operation == "update" and not self.policy.allow_update:
            blocked_reason = "A conexão não permite UPDATE."
            risk = QueryRiskLevel.BLOCKED
        if operation == "delete" and not self.policy.allow_delete:
            blocked_reason = "A conexão não permite DELETE."
            risk = QueryRiskLevel.BLOCKED
        if operation in {"create", "alter", "drop", "truncate"} and not self.policy.allow_ddl:
            blocked_reason = "A conexão não permite operações DDL."
            risk = QueryRiskLevel.BLOCKED
        if operation == "select" and not self.policy.allow_read:
            blocked_reason = "A conexão não permite consultas de leitura."
            risk = QueryRiskLevel.BLOCKED

        if operation in {"insert", "update", "delete"} and risk != QueryRiskLevel.BLOCKED:
            risk = QueryRiskLevel.HIGH
            warnings.append("Operação de escrita detectada; habilite revisão humana quando apropriado.")

        return QueryGuardAnalysis(
            normalized_sql=statement,
            operation=operation,
            risk_level=risk,
            warnings=warnings,
            blocked_reason=blocked_reason,
        )

    def validate(self, sql: str) -> QueryGuardAnalysis:
        analysis = self.analyze(sql)
        if analysis.blocked_reason:
            raise QueryGuardViolation(analysis.blocked_reason)
        return analysis

    def _normalize(self, sql: str) -> str:
        statement = _SQL_COMMENTS.sub(" ", sql or "").strip()
        statement = _WHITESPACE.sub(" ", statement)
        if not statement:
            raise QueryGuardViolation("A consulta SQL nao pode estar vazia.")
        if statement.endswith(";"):
            statement = statement[:-1].strip()
        return statement

    @staticmethod
    def _detect_operation(sql: str) -> str:
        match = re.match(r"^([a-zA-Z]+)", sql)
        if not match:
            return "unknown"
        return match.group(1).lower()
