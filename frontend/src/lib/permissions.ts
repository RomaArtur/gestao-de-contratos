export function canWrite(role?: string) {
  return role === "ADMIN" || role === "CORRETOR";
}
