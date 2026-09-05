// The legal documents, in one place: the footer builds its links from this
// list and /legal/[slug] renders from it, so a new document is one entry here.
//
// Every body below is placeholder text. The headings are the ones each document
// actually has to cover, so filling one in later means replacing paragraphs
// rather than deciding on a structure. `draft` is what keeps a half-written
// document out of Google — drop the flag once the real text lands.

export type LegalSection = {
  heading: string;
  body: readonly string[];
};

export type LegalDocument = {
  slug: string;
  title: string;
  description: string;
  draft?: true;
  sections: readonly LegalSection[];
};

const PENDING = [
  "Bu bölümün metni hazırlanmaktadır.",
] as const;

export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  {
    slug: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi",
    description:
      "Siparişleriniz için geçerli olan mesafeli satış sözleşmesinin koşulları.",
    draft: true,
    sections: [
      { heading: "Taraflar", body: PENDING },
      { heading: "Sözleşmenin Konusu", body: PENDING },
      { heading: "Ürün ve Ödeme Bilgileri", body: PENDING },
      { heading: "Cayma Hakkı", body: PENDING },
      { heading: "Genel Hükümler", body: PENDING },
      { heading: "Yetkili Mahkeme", body: PENDING },
    ],
  },
  {
    slug: "on-bilgilendirme-formu",
    title: "Ön Bilgilendirme Formu",
    description:
      "Sipariş vermeden önce bilmeniz gereken satıcı, ürün ve teslimat bilgileri.",
    draft: true,
    sections: [
      { heading: "Satıcı Bilgileri", body: PENDING },
      { heading: "Ürün Bilgileri", body: PENDING },
      { heading: "Ödeme ve Teslimat", body: PENDING },
      { heading: "Cayma Hakkı", body: PENDING },
      { heading: "Şikâyet ve İtiraz Başvuruları", body: PENDING },
    ],
  },
  {
    slug: "iade-ve-iptal-kosullari",
    title: "İade ve İptal Koşulları",
    description:
      "Siparişinizi nasıl iptal edebileceğiniz ve ürün iadesinin nasıl işlediği.",
    draft: true,
    sections: [
      { heading: "Cayma Hakkı Süresi", body: PENDING },
      { heading: "İade Süreci", body: PENDING },
      { heading: "İade Edilemeyen Ürünler", body: PENDING },
      { heading: "Ücret İadesi", body: PENDING },
    ],
  },
  {
    slug: "teslimat-kosullari",
    title: "Teslimat Koşulları",
    description: "Siparişlerin hazırlanma, kargolanma ve teslim süreleri.",
    draft: true,
    sections: [
      { heading: "Hazırlık Süresi", body: PENDING },
      { heading: "Kargo ve Ücretlendirme", body: PENDING },
      { heading: "Teslimat Süresi", body: PENDING },
      { heading: "Hasarlı Teslimat", body: PENDING },
    ],
  },
  {
    slug: "gizlilik-politikasi",
    title: "Gizlilik Politikası",
    description:
      "Hangi bilgilerinizi topladığımız, ne için kullandığımız ve nasıl sakladığımız.",
    draft: true,
    sections: [
      { heading: "Topladığımız Bilgiler", body: PENDING },
      { heading: "Bilgilerin Kullanım Amacı", body: PENDING },
      { heading: "Üçüncü Taraf Hizmetler", body: PENDING },
      { heading: "Veri Güvenliği", body: PENDING },
      { heading: "İletişim", body: PENDING },
    ],
  },
  {
    slug: "kvkk-aydinlatma-metni",
    title: "KVKK Aydınlatma Metni",
    description:
      "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.",
    draft: true,
    sections: [
      { heading: "Veri Sorumlusu", body: PENDING },
      { heading: "İşlenen Kişisel Verileriniz", body: PENDING },
      { heading: "İşleme Amaçları ve Hukuki Sebebi", body: PENDING },
      { heading: "Verilerin Aktarıldığı Taraflar", body: PENDING },
      { heading: "Kanunun 11. Maddesi Kapsamındaki Haklarınız", body: PENDING },
    ],
  },
  {
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    description:
      "Bu sitede kullanılan çerezler ve bu çerezlerin ne işe yaradığı.",
    draft: true,
    sections: [
      {
        heading: "Çerez Nedir?",
        body: [
          "Çerezler, bir siteyi ziyaret ettiğinizde tarayıcınızda saklanan küçük metin dosyalarıdır. Sitenin sizi ziyaretiniz boyunca hatırlayabilmesini sağlarlar.",
        ],
      },
      {
        heading: "Kullandığımız Çerezler",
        body: [
          "Bu sitede yalnızca zorunlu çerezler kullanılmaktadır. Bunlar oturumunuzu açık tutan ve sepetinizi siz alışverişinizi tamamlayana kadar koruyan çerezlerdir; kapatılmaları hâlinde giriş yapmanız veya sipariş vermeniz mümkün olmaz.",
          "Reklam veya profilleme amacıyla çerez kullanılmamakta, verileriniz reklam ağlarıyla paylaşılmamaktadır. Ziyaret sayıları çerez kullanmayan ve ziyaretçileri tanımlamayan bir ölçüm hizmetiyle toplanmaktadır.",
        ],
      },
      { heading: "Çerez Tercihleriniz", body: PENDING },
      { heading: "Politikadaki Değişiklikler", body: PENDING },
    ],
  },
] as const;

export function findLegalDocument(slug: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((document) => document.slug === slug);
}

export function legalHref(slug: string) {
  return `/legal/${slug}` as const;
}
