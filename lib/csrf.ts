export function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

export function csrfHeader() {
  const csrf = getCookie("jusp_csrf");
  return csrf ? { "x-csrf": csrf } : {};
}