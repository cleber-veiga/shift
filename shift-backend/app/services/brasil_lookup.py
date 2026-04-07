import asyncio
from typing import Any

import requests

from app.schemas.contact import only_digits


class LookupServiceError(Exception):
    pass


def _normalize_cnpj(cnpj: str) -> str:
    normalized = only_digits(cnpj)
    if len(normalized) != 14:
        raise ValueError("CNPJ must have 14 digits.")
    return normalized


def _normalize_cep(cep: str) -> str:
    normalized = only_digits(cep)
    if len(normalized) != 8:
        raise ValueError("CEP must have 8 digits.")
    return normalized


def _fetch_company_by_cnpj_sync(cnpj: str) -> dict[str, Any] | None:
    normalized_cnpj = _normalize_cnpj(cnpj)
    url = f"https://brasilapi.com.br/api/cnpj/v1/{normalized_cnpj}"

    try:
        response = requests.get(url, timeout=10)
    except requests.RequestException as exc:
        raise LookupServiceError("Failed to reach CNPJ lookup service.") from exc

    if response.status_code == 404:
        return None
    if response.status_code >= 400:
        raise LookupServiceError("CNPJ lookup service returned an error.")

    try:
        payload = response.json()
    except ValueError as exc:
        raise LookupServiceError("Invalid response from CNPJ lookup service.") from exc
    if not isinstance(payload, dict):
        raise LookupServiceError("Invalid response from CNPJ lookup service.")

    # Return the full provider payload so the frontend can decide what to use.
    payload["cnpj_consultado"] = normalized_cnpj
    return payload


def _fetch_address_by_cep_sync(cep: str) -> dict[str, Any] | None:
    normalized_cep = _normalize_cep(cep)
    url = f"https://viacep.com.br/ws/{normalized_cep}/json/"

    try:
        response = requests.get(url, timeout=10)
    except requests.RequestException as exc:
        raise LookupServiceError("Failed to reach CEP lookup service.") from exc

    if response.status_code == 404:
        return None
    if response.status_code >= 400:
        raise LookupServiceError("CEP lookup service returned an error.")

    try:
        payload = response.json()
    except ValueError as exc:
        raise LookupServiceError("Invalid response from CEP lookup service.") from exc
    if payload.get("erro"):
        return None

    return {
        "cep": normalized_cep,
        "street": payload.get("logradouro"),
        "neighborhood": payload.get("bairro"),
        "city": payload.get("localidade"),
        "state": payload.get("uf"),
        "complement": payload.get("complemento"),
    }


async def fetch_company_by_cnpj(cnpj: str) -> dict[str, Any] | None:
    return await asyncio.to_thread(_fetch_company_by_cnpj_sync, cnpj)


async def fetch_address_by_cep(cep: str) -> dict[str, Any] | None:
    return await asyncio.to_thread(_fetch_address_by_cep_sync, cep)
