from __future__ import annotations

from dataclasses import dataclass
from typing import Any, TypedDict

from fastapi import HTTPException

from app.models.data_source import DataSource, DataSourceType
from app.schemas.database_node import (
    DatabaseAssistantRequest,
    DatabaseAssistantResponse,
    DatabaseConnectionPolicy,
    DatabaseQueryMode,
    QueryRiskLevel,
)
from app.services.database_node.query_guard import QueryGuard, QueryGuardAnalysis, QueryGuardViolation
from app.services.database_node.sql_builder import build_select_sql
from app.services.schema_introspection import (
    SchemaIntrospectionResult,
    introspect_schema_from_config,
    introspect_schema_from_data_source,
)


class SqlAssistantState(TypedDict, total=False):
    dialect: str
    policy: dict[str, Any]
    user_prompt: str
    current_sql: str
    schema_context: dict[str, Any]
    draft_sql: str
    review_notes: str
    final_sql: str
    explanation: str
    warnings: list[str]
    risk_level: str
    message: str


@dataclass(slots=True)
class SchemaContextEnvelope:
    dialect: str
    policy: DatabaseConnectionPolicy
    tables: list[dict[str, Any]]
    raw: dict[str, Any]


class LangGraphDatabaseAssistant:
    """Copiloto SQL orientado a schema para o nó de banco.

    A implementação usa LangGraph quando disponível e cai para um fluxo determinístico
    quando as dependências opcionais ainda não estiverem instaladas no ambiente.
    """

    def __init__(self, *, model_name: str = "gpt-4.1-mini", temperature: float = 0.0):
        self.model_name = model_name
        self.temperature = temperature

    async def run(
        self,
        *,
        payload: DatabaseAssistantRequest,
        target: Any,
        dialect: str,
        policy: DatabaseConnectionPolicy,
    ) -> DatabaseAssistantResponse:
        schema_context = await self._collect_schema_context(target=target, dialect=dialect, policy=policy, max_tables=payload.max_schema_tables)
        initial_sql = self._resolve_initial_sql(payload)

        try:
            graph_response = await self._run_langgraph(
                payload=payload,
                schema_context=schema_context,
                initial_sql=initial_sql,
            )
        except Exception as exc:  # pragma: no cover - fallback operacional
            graph_response = self._fallback_response(
                payload=payload,
                schema_context=schema_context,
                initial_sql=initial_sql,
                fallback_reason=str(exc),
            )

        guard = QueryGuard(policy)
        analysis = guard.analyze(graph_response["suggested_sql"] or initial_sql)

        if analysis.risk_level == QueryRiskLevel.BLOCKED:
            return DatabaseAssistantResponse(
                success=False,
                message="A IA produziu uma consulta bloqueada pelas políticas da conexão.",
                suggested_sql=analysis.normalized_sql,
                suggested_mode=payload.mode,
                explanation=graph_response.get("explanation"),
                risk_level=analysis.risk_level,
                warnings=list(dict.fromkeys([*graph_response.get("warnings", []), *analysis.warnings])),
                schema_context=schema_context.raw,
            )

        return DatabaseAssistantResponse(
            success=True,
            message=graph_response.get("message") or "Sugestão SQL gerada com contexto de schema.",
            suggested_sql=analysis.normalized_sql,
            suggested_mode=graph_response.get("suggested_mode") or payload.mode,
            explanation=graph_response.get("explanation"),
            risk_level=analysis.risk_level,
            warnings=list(dict.fromkeys([*graph_response.get("warnings", []), *analysis.warnings])),
            schema_context=schema_context.raw,
        )

    async def _collect_schema_context(
        self,
        *,
        target: Any,
        dialect: str,
        policy: DatabaseConnectionPolicy,
        max_tables: int,
    ) -> SchemaContextEnvelope:
        if isinstance(target, DataSource):
            result = await introspect_schema_from_data_source(target, max_rows=20000)
        elif hasattr(target, "source_type") and hasattr(target, "connection_config"):
            result = await introspect_schema_from_config(
                source_type=target.source_type,
                connection_config=target.connection_config or {},
                secret_config=getattr(target, "secret_config", None) or {},
                max_rows=20000,
            )
        else:
            raise HTTPException(status_code=400, detail="Não foi possível introspectar o binding informado para a IA do nó de banco.")

        return self._schema_result_to_context(result=result, dialect=dialect, policy=policy, max_tables=max_tables)

    def _schema_result_to_context(
        self,
        *,
        result: SchemaIntrospectionResult,
        dialect: str,
        policy: DatabaseConnectionPolicy,
        max_tables: int,
    ) -> SchemaContextEnvelope:
        if not result.success or not result.tables:
            return SchemaContextEnvelope(
                dialect=dialect,
                policy=policy,
                tables=[],
                raw={
                    "dialect": dialect,
                    "policy": policy.model_dump(mode="json"),
                    "success": False,
                    "message": result.message,
                    "tables": [],
                },
            )

        tables_payload: list[dict[str, Any]] = []
        for table in result.tables[:max_tables]:
            tables_payload.append(
                {
                    "schema_name": table.schema_name,
                    "table_name": table.table_name,
                    "columns": [
                        {
                            "name": column.column_name,
                            "data_type": column.data_type,
                            "nullable": column.is_nullable,
                        }
                        for column in table.columns[:80]
                    ],
                }
            )

        return SchemaContextEnvelope(
            dialect=dialect,
            policy=policy,
            tables=tables_payload,
            raw={
                "dialect": dialect,
                "policy": policy.model_dump(mode="json"),
                "success": True,
                "message": result.message,
                "tables": tables_payload,
                "table_count": len(tables_payload),
                "truncated": len(result.tables) > len(tables_payload),
            },
        )

    def _resolve_initial_sql(self, payload: DatabaseAssistantRequest) -> str:
        if payload.current_sql and payload.current_sql.strip():
            return payload.current_sql.strip()
        if payload.mode in {DatabaseQueryMode.MANUAL_SELECT, DatabaseQueryMode.VISUAL_BUILDER} and payload.manual_select:
            return build_select_sql(payload.manual_select)
        return "SELECT * FROM sua_tabela LIMIT 100"

    async def _run_langgraph(
        self,
        *,
        payload: DatabaseAssistantRequest,
        schema_context: SchemaContextEnvelope,
        initial_sql: str,
    ) -> dict[str, Any]:
        from langchain_core.messages import HumanMessage, SystemMessage
        from langchain_openai import ChatOpenAI
        from langgraph.graph import END, START, StateGraph

        llm = ChatOpenAI(model=self.model_name, temperature=self.temperature)

        system_prompt = self._build_system_prompt(schema_context)
        policy_guard = QueryGuard(schema_context.policy)

        async def generate_sql(state: SqlAssistantState) -> SqlAssistantState:
            message = HumanMessage(
                content=(
                    "Tarefa: gerar ou revisar SQL para um nó de banco de uma plataforma ETL.\n"
                    f"Pedido do usuário: {state['user_prompt']}\n"
                    f"Modo atual: {payload.mode.value}\n"
                    f"SQL atual: {state['current_sql']}\n"
                    "Retorne JSON com as chaves: draft_sql, explanation, warnings.\n"
                    "As warnings devem ser uma lista curta.\n"
                    "Respeite estritamente o schema fornecido e as políticas."
                )
            )
            response = await llm.ainvoke([SystemMessage(content=system_prompt), message])
            parsed = self._extract_json_like(response.content)
            draft_sql = str(parsed.get("draft_sql") or state["current_sql"] or initial_sql).strip()
            explanation = str(parsed.get("explanation") or "SQL gerado com contexto de schema.").strip()
            warnings = parsed.get("warnings") if isinstance(parsed.get("warnings"), list) else []
            return {
                "draft_sql": draft_sql,
                "explanation": explanation,
                "warnings": [str(item) for item in warnings],
            }

        async def review_sql(state: SqlAssistantState) -> SqlAssistantState:
            analysis = policy_guard.analyze(state["draft_sql"])
            review_notes = []
            if analysis.warnings:
                review_notes.extend(analysis.warnings)
            if analysis.risk_level in {QueryRiskLevel.HIGH, QueryRiskLevel.BLOCKED}:
                review_notes.append("A consulta exige redução de risco antes de uso operacional.")

            final_sql = analysis.normalized_sql
            if analysis.operation == "select" and "limit" not in analysis.normalized_sql.lower():
                final_sql = f"{analysis.normalized_sql} LIMIT {min(schema_context.policy.max_rows_read, 200)}"
                analysis = policy_guard.analyze(final_sql)

            return {
                "final_sql": final_sql,
                "review_notes": " ".join(review_notes).strip(),
                "risk_level": analysis.risk_level.value,
                "warnings": list(dict.fromkeys([*state.get("warnings", []), *analysis.warnings])),
            }

        async def finalize(state: SqlAssistantState) -> SqlAssistantState:
            explanation = state.get("explanation") or "Consulta preparada pela IA."
            if state.get("review_notes"):
                explanation = f"{explanation}\n\nRevisão automática: {state['review_notes']}"
            return {
                "message": "Sugestão SQL gerada via LangGraph com revisão automática por políticas.",
                "suggested_sql": state.get("final_sql") or state.get("draft_sql") or initial_sql,
                "explanation": explanation,
                "warnings": state.get("warnings", []),
                "suggested_mode": payload.mode,
            }

        graph = StateGraph(SqlAssistantState)
        graph.add_node("generate_sql", generate_sql)
        graph.add_node("review_sql", review_sql)
        graph.add_node("finalize", finalize)
        graph.add_edge(START, "generate_sql")
        graph.add_edge("generate_sql", "review_sql")
        graph.add_edge("review_sql", "finalize")
        graph.add_edge("finalize", END)

        app = graph.compile()
        result = await app.ainvoke(
            {
                "dialect": schema_context.dialect,
                "policy": schema_context.policy.model_dump(mode="json"),
                "user_prompt": payload.user_prompt,
                "current_sql": initial_sql,
                "schema_context": schema_context.raw,
            }
        )
        return {
            "message": result.get("message"),
            "suggested_sql": result.get("suggested_sql") or result.get("final_sql") or initial_sql,
            "suggested_mode": result.get("suggested_mode") or payload.mode,
            "explanation": result.get("explanation"),
            "warnings": result.get("warnings", []),
        }

    def _build_system_prompt(self, schema_context: SchemaContextEnvelope) -> str:
        table_descriptions = []
        for table in schema_context.tables[:40]:
            columns = ", ".join(
                f"{col['name']}:{col['data_type']}" for col in table.get("columns", [])[:20]
            )
            prefix = f"{table['schema_name']}." if table.get("schema_name") else ""
            table_descriptions.append(f"- {prefix}{table['table_name']} ({columns})")

        tables_text = "\n".join(table_descriptions) if table_descriptions else "- schema indisponível"
        policy = schema_context.policy
        return (
            "Você é um copiloto SQL de uma plataforma ETL.\n"
            f"Dialeto preferencial: {schema_context.dialect}.\n"
            "Objetivos:\n"
            "1. Sugerir SQL correto e conservador.\n"
            "2. Priorizar performance e segurança operacional.\n"
            "3. Nunca inventar tabelas ou colunas fora do schema fornecido.\n"
            "4. Preferir consultas limitadas, com WHERE e colunas explícitas.\n"
            "Políticas ativas:\n"
            f"- allow_read={policy.allow_read}\n"
            f"- allow_insert={policy.allow_insert}\n"
            f"- allow_update={policy.allow_update}\n"
            f"- allow_delete={policy.allow_delete}\n"
            f"- allow_ddl={policy.allow_ddl}\n"
            f"- require_where_for_update_delete={policy.require_where_for_update_delete}\n"
            f"- require_limit_for_select={policy.require_limit_for_select}\n"
            f"- max_rows_read={policy.max_rows_read}\n"
            "Schema disponível:\n"
            f"{tables_text}\n"
            "Se o pedido estiver ambíguo, devolva a melhor hipótese segura possível."
        )

    def _fallback_response(
        self,
        *,
        payload: DatabaseAssistantRequest,
        schema_context: SchemaContextEnvelope,
        initial_sql: str,
        fallback_reason: str,
    ) -> dict[str, Any]:
        warnings = [
            "Fluxo de IA executado em modo fallback determinístico.",
            f"Motivo do fallback: {fallback_reason}",
        ]
        sql = initial_sql
        guard = QueryGuard(schema_context.policy)
        analysis = guard.analyze(sql)
        if analysis.operation == "select" and schema_context.policy.require_limit_for_select and "limit" not in sql.lower():
            sql = f"{analysis.normalized_sql} LIMIT {min(schema_context.policy.max_rows_read, 200)}"
            analysis = guard.analyze(sql)
        return {
            "message": "Sugestão gerada em modo fallback enquanto o stack LangChain/LangGraph não estiver disponível.",
            "suggested_sql": analysis.normalized_sql,
            "suggested_mode": payload.mode,
            "explanation": "A resposta foi montada sem LLM, preservando o SQL atual e aplicando políticas automáticas.",
            "warnings": list(dict.fromkeys([*warnings, *analysis.warnings])),
        }

    def _extract_json_like(self, content: Any) -> dict[str, Any]:
        if isinstance(content, dict):
            return content
        text = str(content or "").strip()
        if not text:
            return {}
        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:].strip()
        try:
            import json

            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
        return {"draft_sql": text}


async def generate_database_assistant_response(
    *,
    payload: DatabaseAssistantRequest,
    target: Any,
    dialect: str,
    policy: DatabaseConnectionPolicy,
) -> DatabaseAssistantResponse:
    assistant = LangGraphDatabaseAssistant()
    return await assistant.run(payload=payload, target=target, dialect=dialect, policy=policy)
