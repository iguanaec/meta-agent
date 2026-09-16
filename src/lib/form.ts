// Helpers para leer FormData de Server Actions sin castear valores sin
// validar: FormData.get() devuelve `FormDataEntryValue | null` (string | File),
// así que cada campo se narrows aquí, en el borde de entrada, en vez de
// castearse ad-hoc en cada action.

// This is the designated I/O-boundary type guard the anti-slop rule asks
// for: every FormData read in this module narrows through this one function.
function isString(value: FormDataEntryValue | null): value is string {
  // oxlint-disable-next-line anti-slop/no-runtime-typeof
  return typeof value === "string";
}

export function requireString(formData: FormData, field: string): string {
  const value = formData.get(field);
  const trimmed = isString(value) ? value.trim() : "";

  if (trimmed === "") {
    throw new Error(`El campo "${field}" es obligatorio.`);
  }

  return trimmed;
}

export function optionalString(formData: FormData, field: string): string | null {
  const value = formData.get(field);

  if (!isString(value)) return null;
  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

// El límite superior coincide con lo que puede guardar Decimal(12,2) en el
// esquema (10 dígitos enteros + 2 decimales) — evita "22003 numeric field
// overflow" de Postgres y valores no finitos (Infinity, NaN) llegando a Prisma.
const MAX_DECIMAL_12_2 = 9_999_999_999.99;

export function parseMoney(formData: FormData, field: string): number {
  const raw = requireString(formData, field);
  const value = Number(raw);

  if (!Number.isFinite(value) || value < 0 || value > MAX_DECIMAL_12_2) {
    throw new Error(`El campo "${field}" debe ser un monto válido.`);
  }

  return value;
}

export function parseOptionalMoney(formData: FormData, field: string): number | null {
  const raw = optionalString(formData, field);

  if (raw === null) return null;
  const value = Number(raw);

  if (!Number.isFinite(value) || value > MAX_DECIMAL_12_2) {
    throw new Error(`El campo "${field}" debe ser un monto válido.`);
  }

  return value;
}

// Valida que el campo requerido sea uno de los valores permitidos (p. ej. un
// enum de Prisma) y devuelve ese valor ya tipado, sin necesidad de castear.
export function parseEnum<T extends string>(
  formData: FormData,
  field: string,
  allowed: readonly T[]
): T {
  const value = requireString(formData, field);
  const match = allowed.find((option) => option === value);

  if (match === undefined) {
    throw new Error(`Valor inválido para "${field}".`);
  }

  return match;
}
