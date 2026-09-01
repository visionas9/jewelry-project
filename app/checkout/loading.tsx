// Shown the instant somebody navigates here, instead of leaving the page they
// came from on screen while this one loads. That lingering is what made signing
// in look like it had failed: the sign-in form stayed up, emptied, until the
// checkout form arrived.
export default function Loading() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-20">
      <div aria-hidden="true" className="animate-pulse">
        <div className="h-9 w-2/3 rounded-full bg-sand" />
        <div className="mt-4 h-4 w-full max-w-md rounded-full bg-sand" />
        <div className="mt-8 h-6 w-64 rounded-full bg-sand" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="h-96 rounded-2xl bg-sand" />
          <div className="h-64 rounded-2xl bg-sand" />
        </div>
      </div>
      <span className="sr-only">Sipariş sayfası yükleniyor</span>
    </section>
  );
}
