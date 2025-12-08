import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};

export const API_BASE = extra.apiBase;

export function apiUrl(path = "") {
  if (!path.startsWith("/")) path = "/" + path;
  return API_BASE + path;
}
