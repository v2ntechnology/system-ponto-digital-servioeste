"""CPF e CNPJ: dígitos verificadores e máscara (mesma regra do front-end, src/lib/cpf.ts e cnpj.ts)."""
import re


def so_digitos(valor: str) -> str:
    return re.sub(r"\D", "", valor or "")


def _dv_cpf(base: str) -> int:
    soma = sum(int(d) * (len(base) + 1 - i) for i, d in enumerate(base))
    resto = (soma * 10) % 11
    return 0 if resto == 10 else resto


def cpf_valido(valor: str) -> bool:
    cpf = so_digitos(valor)
    if len(cpf) != 11 or len(set(cpf)) == 1:
        return False
    d1 = _dv_cpf(cpf[:9])
    return cpf[9:] == f"{d1}{_dv_cpf(cpf[:9] + str(d1))}"


def _dv_cnpj(base: str) -> int:
    pesos = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] if len(base) == 12 else [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    resto = sum(int(d) * p for d, p in zip(base, pesos, strict=True)) % 11
    return 0 if resto < 2 else 11 - resto


def cnpj_valido(valor: str) -> bool:
    cnpj = so_digitos(valor)
    if len(cnpj) != 14 or len(set(cnpj)) == 1:
        return False
    d1 = _dv_cnpj(cnpj[:12])
    return cnpj[12:] == f"{d1}{_dv_cnpj(cnpj[:12] + str(d1))}"


TAMANHO = {"cnpj": 14, "cpf": 11, "caepf": 14, "cno": 12}


def identificador_valido(tipo: str, valor: str) -> bool:
    d = so_digitos(valor)
    if tipo == "cnpj":
        return cnpj_valido(d)
    if tipo == "cpf":
        return cpf_valido(d)
    return len(d) == TAMANHO.get(tipo, -1)


def mascarar(cpf: str) -> str:
    d = so_digitos(cpf)
    return f"***.{d[3:6]}.{d[6:9]}-**" if len(d) == 11 else "***.***.***-**"
