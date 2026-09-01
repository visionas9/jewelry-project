export default function Loading() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-14 md:px-8 md:py-20">
      <div aria-hidden="true" className="animate-pulse">
        <div className="h-9 w-2/3 rounded-full bg-sand" />
        <div className="mt-5 h-4 w-full rounded-full bg-sand" />
        <div className="mt-8 h-56 w-full rounded-2xl bg-sand" />
        <div className="mt-6 h-40 w-full rounded-2xl bg-sand" />
      </div>
      <span className="sr-only">Sipariş yükleniyor</span>
    </section>
  );
}
