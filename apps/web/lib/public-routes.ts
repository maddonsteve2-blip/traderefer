export function normalizePathname(pathname: string | null | undefined) {
  const path = (pathname || "/").split(/[?#]/)[0] || "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function isAnonymousSeoPath(pathname: string | null | undefined) {
  if (!pathname) return false;

  const path = normalizePathname(pathname);

  if (path === "/") return true;
  if (path === "/local" || path.startsWith("/local/")) return true;
  if (path === "/top" || path.startsWith("/top/")) return true;
  if (path === "/trades" || path.startsWith("/trades/")) return true;
  if (path === "/categories" || path.startsWith("/categories/")) return true;
  if (path === "/businesses" || path.startsWith("/businesses/")) return true;
  if (path === "/locations" || path.startsWith("/locations/")) return true;
  if (path === "/remove") return true;

  if (path.startsWith("/b/") && !path.endsWith("/refer")) return true;

  return path.endsWith("-near-me") || path.startsWith("/find-a-");
}
