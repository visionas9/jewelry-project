// Turkey's 81 provinces, in plate-number order. The shop ships inside Turkey
// only, so the checkout offers these and nothing else.
//
// supabase/migrations/0015_turkey_only_delivery.sql holds the same list, so the
// database refuses what the form would. A test keeps the two in step.
export const PROVINCES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya",
  "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu",
  "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır",
  "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep",
  "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul",
  "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli",
  "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla",
  "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt",
  "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa",
  "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
  "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova",
  "Karabük", "Kilis", "Osmaniye", "Düzce",
] as const;

// Alphabetical the Turkish way, for the dropdown: Ç after C, İ after I.
export const PROVINCES_SORTED = [...PROVINCES].sort((a, b) =>
  a.localeCompare(b, "tr")
);

const PROVINCE_SET: ReadonlySet<string> = new Set(PROVINCES);

export function isProvince(value: string): boolean {
  return PROVINCE_SET.has(value);
}

// Digits only, then an optional 0090 / 90 / 0 in front of ten digits that
// start 2–5: landlines are 2–4, mobiles 5. The database checks the same shape.
export function isTurkishPhone(value: string): boolean {
  return /^(0090|90|0)?[2-5]\d{9}$/.test(value.replace(/\D/g, ""));
}
