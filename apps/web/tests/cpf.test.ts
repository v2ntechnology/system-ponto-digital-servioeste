import { describe, expect, it } from "vitest"

import { digitosVerificadores, formatarCpf, mascararCpf, validarCpf } from "@/lib/cpf"

describe("CPF", () => {
  it("aceita CPF com dígitos verificadores corretos, com ou sem pontuação", () => {
    expect(validarCpf("52998224725")).toBe(true)
    expect(validarCpf("529.982.247-25")).toBe(true)
  })

  it("recusa dígito errado, tamanho errado e sequências repetidas", () => {
    expect(validarCpf("52998224724")).toBe(false)
    expect(validarCpf("5299822472")).toBe(false)
    expect(validarCpf("11111111111")).toBe(false)
    expect(validarCpf("")).toBe(false)
  })

  it("calcula os dígitos verificadores", () => {
    expect(digitosVerificadores("529982247")).toBe("25")
  })

  it("formata durante a digitação", () => {
    expect(formatarCpf("529")).toBe("529")
    expect(formatarCpf("5299822")).toBe("529.982.2")
    expect(formatarCpf("52998224725")).toBe("529.982.247-25")
  })

  it("mascara mostrando só os dígitos do meio", () => {
    expect(mascararCpf("52998224725")).toBe("***.982.247-**")
  })
})
