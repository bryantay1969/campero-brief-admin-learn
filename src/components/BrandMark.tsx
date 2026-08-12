/** Shared Campero mark used in toolbar, login, and public preview. */
export function BrandMark({
  size = "md",
  className = "",
}: {
  /** sm = 36px (toolbar), md = 40px (login / headers) */
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  return (
    <img
      src="/campero-mark.png"
      alt="Pollo Campero"
      className={`${dim} shrink-0 rounded-xl object-cover shadow-md shadow-orange-200 ${className}`.trim()}
    />
  );
}
