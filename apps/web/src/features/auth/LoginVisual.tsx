// Painel visual do login (padrão do Servioeste Hub, referência login01): foto da Servioeste escurecida e o quadrado
// grande com o "S". Sem o clima do Hub, que não faz sentido aqui.
export function LoginVisual() {
  return (
    <section className="relative hidden flex-1 overflow-hidden rounded-2xl border bg-muted text-white lg:block">
      <img src="/login-servioeste.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[72%_center]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-black/75" />

      <div className="relative flex h-full flex-col justify-end p-10 xl:p-12">
        <div className="flex flex-col items-center text-center">
          <span className="grid size-24 place-items-center rounded-3xl border border-brand/60 bg-black/45 backdrop-blur-md">
            <img src="/favicon.svg" alt="" className="size-12" />
          </span>
          <p className="mt-5 text-2xl font-medium tracking-tight">Servioeste Ponto</p>
          <p className="mt-1 text-white/75">Registro de ponto, jornada e cadastros</p>
        </div>
      </div>
    </section>
  )
}
