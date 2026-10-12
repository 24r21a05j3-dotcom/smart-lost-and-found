export const CATEGORIES = ["Electronics", "Documents", "Bags", "Clothing", "Accessories", "Other"];
export const todayLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
