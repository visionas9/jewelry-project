"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import {
  createProduct,
  updateProduct,
  type CatalogResult,
} from "@/app/admin/products/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { STONES, stoneLabel, type AdminProduct } from "@/lib/catalog";
import { createBrowserSupabase } from "@/lib/supabase-browser";

const FIELD =
  "w-full rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none focus:border-ink";

const BUTTON =
  "rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass disabled:bg-line disabled:text-muted";

export function ProductEditor({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserSupabase());

  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [state, formAction] = useActionState<CatalogResult, FormData>(
    product ? updateProduct.bind(null, product.id) : createProduct,
    null
  );

  useEffect(() => {
    if (state?.ok && !product) router.push("/admin/products");
  }, [state, product, router]);

  async function upload(files: FileList) {
    setUploading(true);
    setUploadError(null);

    const added: string[] = [];

    for (const file of Array.from(files)) {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${Date.now()}-${added.length}.${extension}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: false });

      if (error) {
        setUploading(false);
        setUploadError("Görsel yüklenemedi. Lütfen tekrar deneyin.");
        return;
      }

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      added.push(data.publicUrl);
    }

    setUploading(false);
    setImages((current) => [...current, ...added]);
  }

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      {/* One per line, in the order they should appear. The first is the one
          the grid shows. */}
      <input type="hidden" name="images" value={images.join("\n")} />

      <label className="text-sm">
        <span className="text-muted">Ürün adı</span>
        <input
          name="name"
          required
          defaultValue={product?.name}
          className={`${FIELD} mt-1`}
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-muted">Fiyat (TRY)</span>
          <input
            name="price"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product?.price}
            className={`${FIELD} mt-1`}
          />
        </label>
        <label className="text-sm">
          <span className="text-muted">Stok</span>
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product?.stock ?? 0}
            className={`${FIELD} mt-1`}
          />
        </label>
      </div>

      <label className="text-sm">
        <span className="text-muted">Taş</span>
        {/* A list, not a text field: the database only accepts these six. */}
        <select
          name="stone"
          required
          defaultValue={product?.stone ?? ""}
          className={`${FIELD} mt-1`}
        >
          <option value="" disabled>
            Seçiniz
          </option>
          {STONES.map((stone) => (
            <option key={stone} value={stone}>
              {stoneLabel(stone)}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-muted">Malzeme</span>
          <input
            name="material"
            defaultValue={product?.material}
            placeholder="Örn. Doğal taş, çelik"
            className={`${FIELD} mt-1`}
          />
        </label>
        <label className="text-sm">
          <span className="text-muted">Ölçü</span>
          <input
            name="size"
            defaultValue={product?.size}
            placeholder="Örn. 18 cm"
            className={`${FIELD} mt-1`}
          />
        </label>
      </div>

      <label className="text-sm">
        <span className="text-muted">Açıklama</span>
        <textarea
          name="description"
          rows={5}
          defaultValue={product?.description}
          className={`${FIELD} mt-1 leading-relaxed`}
        />
      </label>

      <div className="text-sm">
        <span className="text-muted">Görseller</span>

        {images.length > 0 ? (
          <ul className="mt-2 grid grid-cols-3 gap-3">
            {images.map((src, index) => (
              <li key={src} className="relative">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-sand">
                  <Image src={src} alt="" fill sizes="33vw" className="object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setImages((current) => current.filter((_, i) => i !== index))
                  }
                  className="mt-1 w-full rounded-full border border-line px-2 py-1 text-xs transition-colors hover:border-ink"
                >
                  Kaldır
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(event) => {
            const files = event.target.files;
            if (files && files.length > 0) upload(files);
          }}
          className="mt-3 text-sm text-muted file:mr-3 file:rounded-full file:border file:border-line file:bg-cream file:px-4 file:py-2 file:text-sm file:text-ink"
        />

        <p role="alert" className={`mt-2 text-sm text-brass ${uploadError ? "" : "sr-only"}`}>
          {uploadError ?? ""}
        </p>
        {uploading ? <p className="mt-2 text-sm text-muted">Yükleniyor…</p> : null}
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`text-sm ${state ? (state.ok ? "text-ink" : "text-brass") : "sr-only"}`}
      >
        {state?.message ?? ""}
      </p>

      <SubmitButton pendingLabel="Kaydediliyor…" className={BUTTON}>
        {product ? "Değişiklikleri kaydet" : "Ürünü ekle"}
      </SubmitButton>
    </form>
  );
}
