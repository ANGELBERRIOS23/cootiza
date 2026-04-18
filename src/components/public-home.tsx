"use client";

import Image from "next/image";
import Link from "next/link";
import { appConfig } from "@/lib/config";
import type { LandingVariant } from "@/lib/landing";

type PublicHomeProps = {
  variant?: LandingVariant;
};

export function PublicHome({ variant = "default" }: PublicHomeProps) {
  const isCooitza = variant === "cooitza";
  const whatsappLink = `https://wa.me/${appConfig.whatsappNumber}?text=${encodeURIComponent(
    isCooitza
      ? "Hola, quiero conocer los paquetes exclusivos Cooitza x Viajexmundo."
      : "Hola, quiero mas informacion de paquetes.",
  )}`;

  return (
    <main className={isCooitza ? "min-h-screen bg-[#FFF8CB] text-[#12386A]" : "min-h-screen bg-[#0f172a] text-white"}>
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/hero-wing.svg" alt="" fill className="object-cover opacity-85" sizes="100vw" priority />
          {isCooitza ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-[#FFF8CBf0] via-[#FFE86Fef] to-[#FFD400f0]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,#0B4EA255_0%,transparent_46%),radial-gradient(circle_at_86%_14%,#14498A33_0%,transparent_40%)]" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-[#0f172ab3] via-[#243b5acc] to-[#0f172af2]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#93C5FD3d_0%,transparent_45%),radial-gradient(circle_at_80%_15%,#DBEAFE2f_0%,transparent_40%)]" />
            </>
          )}
        </div>

        <Image
          src="/plane-icon.svg"
          alt=""
          width={84}
          height={84}
          className={`plane-bounce pointer-events-none absolute left-0 top-0 z-10 will-change-transform ${isCooitza ? "opacity-70" : "opacity-90"}`}
        />
        <Image
          src="/plane-icon.svg"
          alt=""
          width={110}
          height={110}
          className={`plane-bounce-alt pointer-events-none absolute left-0 top-0 z-10 will-change-transform ${isCooitza ? "opacity-60" : "opacity-80"}`}
        />

        <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-between px-5 pb-10 pt-6 sm:px-8 sm:pt-8">
          {isCooitza ? (
            <>
              <header className="rounded-2xl border border-[#0B4EA244] bg-white/70 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <div className="relative h-14 w-40 sm:h-18 sm:w-52">
                    <Image src="/COOITZA-LOGO-WEB-1.png" alt="Cooitza" fill className="object-contain object-left" sizes="208px" />
                  </div>
                  <span className="text-lg font-black text-[#0B4EA2] sm:text-xl">x</span>
                  <div className="relative h-10 w-34 sm:h-14 sm:w-44">
                    <Image src={appConfig.agencyLogoUrl} alt={appConfig.agencyName} fill className="object-contain object-right" sizes="176px" />
                  </div>
                </div>
              </header>

              <div className="mx-auto w-full max-w-5xl py-10 text-center sm:py-14">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-[#0B4EA2] sm:text-sm">
                  Cooitza x Viajexmundo
                </p>
                <h1 className="text-5xl font-black uppercase leading-[0.87] text-[#0B4EA2] drop-shadow-[0_6px_0_rgba(255,255,255,0.55)] sm:text-7xl md:text-8xl">
                  Viajes
                  <br />
                  con respaldo
                </h1>
                <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-[#1B3F73] sm:text-2xl">
                  Beneficios exclusivos para asociados Cooitzá: paquetes personalizados, asesoría completa y acompañamiento de inicio a fin.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/paquetes"
                    className="rounded-2xl bg-[#0B4EA2] px-7 py-4 text-base font-extrabold uppercase tracking-wide text-white shadow-[0_18px_36px_-16px_rgba(11,78,162,0.65)] transition hover:translate-y-[-1px] hover:bg-[#0a438c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B4EA2]"
                  >
                    Explorar beneficios
                  </Link>
                  <Link
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border-2 border-[#0B4EA2] bg-white px-7 py-4 text-base font-extrabold uppercase tracking-wide text-[#0B4EA2] transition hover:bg-[#f0f6ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B4EA2]"
                  >
                    Hablar por WhatsApp
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#0B4EA22e] bg-white/80 px-5 py-4 text-center backdrop-blur">
                  <p className="text-base font-black text-[#0B4EA2] sm:text-lg">Tarifas especiales</p>
                  <p className="mt-1 text-sm text-[#2f466b]">Opciones priorizadas para cooperativistas.</p>
                </div>
                <div className="rounded-xl border border-[#0B4EA22e] bg-white/80 px-5 py-4 text-center backdrop-blur">
                  <p className="text-base font-black text-[#0B4EA2] sm:text-lg">Asesoria cercana</p>
                  <p className="mt-1 text-sm text-[#2f466b]">Equipo experto antes, durante y despues del viaje.</p>
                </div>
                <div className="rounded-xl border border-[#0B4EA22e] bg-white/80 px-5 py-4 text-center backdrop-blur">
                  <p className="text-base font-black text-[#0B4EA2] sm:text-lg">Compra con confianza</p>
                  <p className="mt-1 text-sm text-[#2f466b]">Proceso claro y acompañamiento permanente.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <header className="flex items-center justify-between rounded-2xl border border-white/20 bg-black/20 px-4 py-3 backdrop-blur-md">
                <div className="relative h-20 w-72 sm:h-24 sm:w-80">
                  <Image src={appConfig.agencyLogoUrl} alt={appConfig.agencyName} fill className="object-contain" sizes="320px" />
                </div>
                <Link
                  href="/paquetes"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-[#3C4F66] transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Ver paquetes
                </Link>
              </header>

              <div className="mx-auto w-full max-w-4xl py-8 text-center sm:py-12">
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-slate-200">Viajexmundo</p>
                <h1 className="text-5xl font-black uppercase leading-[0.9] drop-shadow-2xl sm:text-7xl md:text-8xl">
                  Viaja
                  <br />
                  Confiado
                </h1>
                <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-100 sm:text-2xl">
                  Paquetes disenados a medida, asesoria experta y experiencias memorables desde el primer contacto.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/paquetes"
                    className="rounded-2xl bg-[#ef4444] px-7 py-4 text-base font-extrabold uppercase tracking-wide text-white shadow-[0_20px_40px_-15px_rgba(239,68,68,0.6)] transition hover:translate-y-[-1px] hover:bg-[#dc2626] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Viajemos! (toca aqui)
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/20 bg-black/25 px-5 py-4 text-center backdrop-blur">
                  <p className="text-lg font-extrabold sm:text-xl">No esperes el momento perfecto, crea el viaje perfecto.</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-black/25 px-5 py-4 text-center backdrop-blur">
                  <p className="text-lg font-extrabold sm:text-xl">Viajar te cambia el mapa y tambien la forma de ver tu vida.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
