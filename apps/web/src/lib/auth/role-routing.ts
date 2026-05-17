const clientAuthRoutes = new Set(["/", "/login", "/register"]);
const partnerAuthRoutes = new Set(["/partner", "/partner/login", "/partner/register"]);
const adminAuthRoutes = new Set(["/admin/login"]);

const clientProtectedPrefixes = ["/dashboard", "/bookings", "/favorites", "/profile", "/reviews"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function getRoleDashboard(roles: string[]) {
  if (roles.includes("admin")) return "/admin/dashboard";
  if (roles.includes("partner")) return "/partner/dashboard";
  if (roles.includes("client")) return "/dashboard";
  return "/";
}

export function hasRequiredRole(roles: string[], requiredRole: string) {
  return roles.includes(requiredRole);
}

export function getLoginPathForRole(role: string) {
  if (role === "admin") return "/admin/login";
  if (role === "partner") return "/partner/login";
  return "/login";
}

export function isPublicAuthRoute(pathname: string) {
  return (
    clientAuthRoutes.has(pathname) ||
    partnerAuthRoutes.has(pathname) ||
    adminAuthRoutes.has(pathname)
  );
}

export function getProtectedRoleForPath(pathname: string) {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return adminAuthRoutes.has(pathname) ? null : "admin";
  }

  if (pathname.startsWith("/partner")) {
    return partnerAuthRoutes.has(pathname) ? null : "partner";
  }

  if (matchesPrefix(pathname, clientProtectedPrefixes)) {
    return "client";
  }

  return null;
}

export function sanitizeCallbackUrl(value: string | null, role: string) {
  if (role === "admin") {
    if (!value || !value.startsWith("/admin") || adminAuthRoutes.has(value)) {
      return "/admin/dashboard";
    }

    return value;
  }

  if (role === "partner") {
    if (!value || !value.startsWith("/partner") || partnerAuthRoutes.has(value)) {
      return "/partner/dashboard";
    }

    return value;
  }

  if (!value || !matchesPrefix(value, clientProtectedPrefixes)) {
    return "/dashboard";
  }

  return value;
}
