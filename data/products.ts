export type Data = {
  name: string;
  slug: string;
  price: number;
  currency: string;
  category: string;
  description: string;
  material: string;
  size: string;
  stock: number;
  images: string[];
};

export const data: Data[] = [
  {
    name: "Rose Quartz Pembe Kuvars Doğal Taş Bileklik",
    slug: "rose-quartz",
    price: 1000,
    currency: "TRY",
    category: "Bilezik / Doğal Taş Bileklik",
    description:
      "Pembe kuvarsın yumuşak pembe tonlarını gold detaylarla buluşturan zarif ve romantik bir tasarım. Günlük kullanımda tek başına veya farklı bilekliklerle kombinlenebilir.",
    material:
      "Pembe kuvars doğal taş boncuklar, gold renk metal bağlantı ve dekoratif geçmeli kapama.",
    size: "17–18 cm",
    stock: 100,
    images: ["/images/rose-quartz-1.jpg"],
  },
  {
    name: "Pearl Leaf İnci Detaylı Doğal Taş Bilezik",
    slug: "pearl-leaf",
    price: 1000,
    currency: "TRY",
    category: "Bilezik",
    description:
      "Doğal taş, inci ve yaprak figürünün bir araya geldiği özgün ve feminen bir tasarım. Organik formları ve gold görünümüyle zarif kombinleri tamamlar.",
    material:
      "Açık renk doğal taş, doğal inci detayı, gold renk metal gövde ve yaprak figürü.",
    size: "Ayarlanabilir / 17–18 cm",
    stock: 100,
    images: [
      "/images/pearl-leaf-1.jpg",
      "/images/pearl-leaf-2.jpg",
      "/images/pearl-leaf-3.jpg",
    ],
  },
  {
    name: "Lapis Blue Lapis Lazuli Doğal Taş Bileklik",
    slug: "lapis-blue",
    price: 1000,
    currency: "TRY",
    category: "Bilezik / Doğal Taş Bileklik",
    description:
      "Lapis lazulinin yoğun mavi tonlarını gold detaylarla tamamlayan dikkat çekici bir tasarım. Güçlü renkleri sade kombinlere belirgin bir dokunuş katar.",
    material:
      "Lapis lazuli doğal taş boncuklar, lacivert doğal taş disk ara parçalar, gold renk metal bağlantılar ve geçmeli kapama.",
    size: "17–18 cm",
    stock: 100,
    images: [
      "/images/lapis-blue-1.jpg",
      "/images/lapis-blue-2.jpg",
      "/images/lapis-blue-3.jpg",
    ],
  },
  {
    name: "Rhodonite Rose Doğal Taş Bileklik",
    slug: "rhodonite-rose",
    price: 1000,
    currency: "TRY",
    category: "Bilezik / Doğal Taş Bileklik",
    description:
      "Pembe kuvarsın açık tonlarıyla rodonitin desenli görünümünü bir araya getiren doğal taş bileklik. Vintage gold detayları tasarıma bohem bir karakter kazandırır.",
    material:
      "Pembe kuvars ve rodonit doğal taş boncuklar, gold renk metal ara parçalar ve dekoratif geometrik kapama.",
    size: "17–18 cm",
    stock: 100,
    images: [
      "/images/rhodonite-rose-1.jpg",
      "/images/rhodonite-rose-2.jpg",
      "/images/rhodonite-rose-3.jpg",
    ],
  },
  {
    name: "Green Sun Yeşil Akik Doğal Taş Bileklik",
    slug: "green-sun",
    price: 1000,
    currency: "TRY",
    category: "Bilezik / Doğal Taş Bileklik",
    description:
      "Canlı yeşil doğal taşların açık renk detaylar ve gold güneş figürüyle buluştuğu enerjik bir tasarım. Özellikle yaz kombinlerine canlı ve özgün bir görünüm kazandırır.",
    material:
      "Yeşil akik ve howlit doğal taş boncuklar, gold renk güneş figürü ve elastik yapı.",
    size: "17–18 cm",
    stock: 100,
    images: [
      "/images/green-sun-1.jpg",
      "/images/green-sun-2.jpg",
      "/images/green-sun-3.jpg",
    ],
  },
  {
    name: "Luna Turmalin Doğal Taş Bileklik",
    slug: "luna-turmalin",
    price: 1000,
    currency: "TRY",
    category: "Bilezik / Doğal Taş Bileklik",
    description:
      "Pembe, yeşil ve koyu tonlardaki doğal taşların gold hilal figürüyle tamamlandığı mistik ve feminen bir tasarım. Doğal renk geçişleri her bilekliğe özgün bir görünüm kazandırır.",
    material:
      "Çok renkli turmalin doğal taş boncuklar, gold renk hilal figürü ve elastik yapı.",
    size: "17–18 cm",
    stock: 100,
    images: ["/images/luna-turmalin-1.jpg", "/images/luna-turmalin-2.jpg"],
  },
];
