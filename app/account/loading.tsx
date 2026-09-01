export default function Loading() {
  return (
    <section className="mx-auto max-w-md px-5 py-14 md:px-8 md:py-20">
      <div aria-hidden="true" className="animate-pulse">
        <div className="h-9 w-40 rounded-full bg-sand" />
        <div className="mt-6 h-4 w-2/3 rounded-full bg-sand" />
        <div className="mt-8 h-48 w-full rounded-2xl bg-sand" />
        <div className="mt-6 h-40 w-full rounded-2xl bg-sand" />
      </div>
      <span className="sr-only">Hesap sayfası yükleniyor</span>
    </section>
  );
}
