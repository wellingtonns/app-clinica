import { safeRedisDel, safeRedisGet, safeRedisSet } from "./redis.js";

const cachePrefix = "steticsoft:clinic";

const scopeTtlSeconds = {
  dashboard: 60,
  patients: 60,
  appointments: 60,
  products: 60,
  professionals: 60,
  procedures: 60,
  finance: 60,
  medicalRecords: 30,
  full: 30
};

const resourceScopes = {
  patients: ["patients", "dashboard", "appointments", "finance", "medicalRecords", "full"],
  appointments: ["appointments", "dashboard", "patients", "finance", "medicalRecords", "full"],
  products: ["products", "dashboard", "finance", "full"],
  professionals: ["professionals", "appointments", "dashboard", "full"],
  procedures: ["procedures", "appointments", "finance", "dashboard", "patients", "full"],
  patientFiles: ["patients", "medicalRecords", "dashboard", "full"],
  anamneses: ["patients", "medicalRecords", "dashboard", "full"],
  contracts: ["patients", "medicalRecords", "dashboard", "full"],
  medicalRecords: ["medicalRecords", "patients", "appointments", "dashboard", "full"],
  financialEntries: ["finance", "dashboard", "full"],
  finance: ["finance", "dashboard", "full"],
  all: ["dashboard", "patients", "appointments", "products", "professionals", "procedures", "finance", "medicalRecords", "full"]
};

function sanitizeCachePart(value) {
  return encodeURIComponent(String(value ?? "default"));
}

export function normalizeClinicScope(scope) {
  return scope === "all" ? "full" : scope || "full";
}

export function getClinicCacheKey(clinicId, scope) {
  return `${cachePrefix}:${sanitizeCachePart(clinicId)}:${normalizeClinicScope(scope)}`;
}

export function getClinicCacheTtl(scope) {
  if (String(scope).startsWith("patient-detail:")) return 30;
  return scopeTtlSeconds[normalizeClinicScope(scope)] ?? 30;
}

export async function getClinicCache(clinicId, scope) {
  return safeRedisGet(getClinicCacheKey(clinicId, scope));
}

export async function setClinicCache(clinicId, scope, data, ttlSeconds = getClinicCacheTtl(scope)) {
  await safeRedisSet(getClinicCacheKey(clinicId, scope), data, ttlSeconds);
}

export async function invalidateClinicCache(clinicId, resource, extraData = {}) {
  const scopes = new Set(resourceScopes[resource] ?? ["dashboard", "full", resource, "patients", "appointments", "finance"]);

  if (extraData.patientId) {
    scopes.add(`patient-detail:${extraData.patientId}`);
  }

  await safeRedisDel(Array.from(scopes).map((scope) => getClinicCacheKey(clinicId, scope)));
}
