import Link from "next/link";

export const metadata = { title: "Aviso de privacidad — Cooitza" };

export default function PrivacidadPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-10 text-slate-700">
      <Link href="/" className="text-sm font-medium text-brand-600 hover:underline">← Volver</Link>
      <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Aviso de privacidad</h1>
      <p className="mt-2 text-sm text-slate-500">Portal de Promotores · Cooitza × Viajexmundo</p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed">
        <section>
          <h2 className="font-bold text-slate-800">Qué datos recopilamos</h2>
          <p>Cuando un promotor registra a un cliente interesado, recopilamos el nombre, teléfono y, opcionalmente, el correo del cliente, junto con el paquete de interés. Estos datos se usan únicamente para que un asesor de Viajexmundo dé seguimiento a la solicitud de viaje.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800">Cómo los usamos y protegemos</h2>
          <p>Los datos se transmiten de forma cifrada (HTTPS) y se almacenan con controles de acceso estrictos: cada promotor solo ve a los clientes que él mismo registró, y solo el personal autorizado de la agencia accede a la información para gestionar el viaje. No vendemos ni compartimos los datos con terceros ajenos al servicio.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800">Consentimiento</h2>
          <p>Al registrar a un cliente, el promotor confirma que cuenta con la autorización de esa persona para compartir sus datos de contacto con Viajexmundo con el fin de recibir asesoría de viaje.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800">Tus derechos</h2>
          <p>El cliente puede solicitar el acceso, la corrección o la eliminación de sus datos escribiendo a Viajexmundo. Atenderemos la solicitud conforme a la ley aplicable.</p>
        </section>
      </div>
    </main>
  );
}
