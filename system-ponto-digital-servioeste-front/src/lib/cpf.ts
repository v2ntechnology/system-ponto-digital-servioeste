// CPF: validação pelos dígitos verificadores, formatação e máscara (Princípio V: mostrar o mínimo).

export const somenteDigitos = (v: string) => v.replace(/\D/g, "")

function digito(base: string) {
  let soma = 0
  for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i)
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

/** Calcula os dois dígitos verificadores de 9 dígitos. */
export const digitosVerificadores = (nove: string) => {
  const d1 = digito(nove)
  return `${d1}${digito(nove + d1)}`
}

export function validarCpf(valor: string) {
  const cpf = somenteDigitos(valor)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  return cpf.slice(9) === digitosVerificadores(cpf.slice(0, 9))
}

/** "12345678909" → "123.456.789-09" (aceita digitação parcial). */
export function formatarCpf(valor: string) {
  const d = somenteDigitos(valor).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2")
}

/** "12345678909" → "***.456.789-**" */
export function mascararCpf(valor: string) {
  const d = somenteDigitos(valor)
  if (d.length !== 11) return "***.***.***-**"
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`
}
