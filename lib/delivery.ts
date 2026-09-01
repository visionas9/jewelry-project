// What a parcel needs to reach somebody, and whether it is there.
//
// Pure and framework-free: the checkout action calls it, and the tests call it
// without a browser or a database in the way.

export const DELIVERY_FIELDS = [
  "fullName",
  "phone",
  "city",
  "district",
  "address",
] as const;

export type DeliveryField = (typeof DELIVERY_FIELDS)[number];

export const DELIVERY_LABELS: Record<DeliveryField, string> = {
  fullName: "Ad soyad",
  phone: "Telefon",
  city: "İl",
  district: "İlçe",
  address: "Adres",
};

// Every problem at once, keyed by field. Reporting the first one only means
// filling a form in, being sent back, and finding a second complaint waiting.
export function validateDelivery(
  values: Record<DeliveryField, string>
): Partial<Record<DeliveryField, string>> {
  const errors: Partial<Record<DeliveryField, string>> = {};

  for (const field of DELIVERY_FIELDS) {
    if (values[field].trim() === "") {
      errors[field] = `${DELIVERY_LABELS[field]} alanını doldurun.`;
    }
  }

  // Turkish numbers are ten digits after the leading zero, and people write
  // them with spaces, dashes and brackets. The digits are what matter.
  if (!errors.phone && values.phone.replace(/\D/g, "").length < 10) {
    errors.phone = "Telefon numaranızı kontrol edin.";
  }

  return errors;
}
