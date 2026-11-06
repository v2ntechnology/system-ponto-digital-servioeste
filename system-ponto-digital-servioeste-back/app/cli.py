"""Comandos de administração no servidor (fora do painel).

    python -m app.cli create-admin --email admin@empresa.com.br --nome "Nome" --cpf 00000000000
    python -m app.cli reset-mfa --email admin@empresa.com.br

A senha é pedida no terminal (não aparece na tela nem no histórico). reset-mfa é o procedimento de recuperação
quando o único administrador perde o celular do app autenticador (spec, casos de borda).
"""
import argparse
import asyncio
import getpass
import sys

from sqlalchemy import select

from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models import Sessao, Usuario
from app.services import audit
from app.services.cpf import cpf_valido, so_digitos


async def create_admin(email: str, nome: str, cpf: str) -> None:
    cpf = so_digitos(cpf)
    if not cpf_valido(cpf):
        sys.exit("CPF inválido.")
    senha = getpass.getpass("Senha (mínimo 10 caracteres): ")
    if len(senha) < 10 or senha != getpass.getpass("Repita a senha: "):
        sys.exit("As senhas não conferem ou têm menos de 10 caracteres.")
    async with SessionLocal() as db:
        if (await db.execute(select(Usuario).where(Usuario.email == email.lower()))).scalar_one_or_none():
            sys.exit("Já existe um usuário com este e-mail.")
        u = Usuario(email=email.lower(), nome=nome, cpf=cpf, senha_hash=hash_password(senha), perfil="administrador")
        db.add(u)
        await db.flush()
        await audit.registrar(db, "usuario.criar", usuario_id=None, objeto_tipo="usuario", objeto_id=u.id,
                              detalhes={"perfil": "administrador", "origem": "cli"})
        await db.commit()
    print(f"Administrador {email} criado. No primeiro acesso, ele configura o app autenticador.")


async def reset_mfa(email: str) -> None:
    async with SessionLocal() as db:
        u = (await db.execute(select(Usuario).where(Usuario.email == email.lower()))).scalar_one_or_none()
        if not u:
            sys.exit("Usuário não encontrado.")
        u.mfa_segredo_cifrado = u.mfa_segredo_pendente_cifrado = u.mfa_ultimo_passo = None
        await db.execute(Sessao.__table__.delete().where(Sessao.usuario_id == u.id))
        await audit.registrar(db, "mfa.redefinido", objeto_tipo="usuario", objeto_id=u.id, detalhes={"origem": "cli"})
        await db.commit()
    print(f"Segundo fator de {email} redefinido. No próximo acesso, um QR code novo será mostrado.")


def main() -> None:
    p = argparse.ArgumentParser(prog="python -m app.cli")
    sub = p.add_subparsers(dest="comando", required=True)
    a = sub.add_parser("create-admin")
    a.add_argument("--email", required=True)
    a.add_argument("--nome", required=True)
    a.add_argument("--cpf", required=True)
    r = sub.add_parser("reset-mfa")
    r.add_argument("--email", required=True)
    args = p.parse_args()
    if args.comando == "create-admin":
        asyncio.run(create_admin(args.email, args.nome, args.cpf))
    else:
        asyncio.run(reset_mfa(args.email))


if __name__ == "__main__":
    main()
