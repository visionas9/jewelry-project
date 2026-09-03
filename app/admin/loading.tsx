export default function Loading() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-10 md:px-8 md:py-14">
      <div aria-hidden="true" className="animate-pulse">
        <div className="h-9 w-1/2 rounded-full bg-sand" />
        <div className="mt-6 h-9 w-full rounded-full bg-sand" />
        <div className="mt-6 flex flex-col gap-3">
          <div className="h-24 w-full rounded-2xl bg-sand" />
          <div className="h-24 w-full rounded-2xl bg-sand" />
          <div className="h-24 w-full rounded-2xl bg-sand" />
        </div>
      </div>
      <span className="sr-only">Siparişler yükleniyor</span>
    </section>
  );
}
