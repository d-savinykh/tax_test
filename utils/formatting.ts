
export const fmt = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });

export const parseNum = (v: string | number | null | undefined): number => {
  if (v === undefined || v === null || v === "") return 0;
  const cleanedString = String(v).replace(/[\s\u00A0]/g, "").replace(",", ".");
  const number = Number(cleanedString);
  return isNaN(number) ? 0 : number;
};
