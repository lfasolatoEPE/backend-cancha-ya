// src/utils/db.ts
export function isDuplicateError(err: unknown) {
  const e = err as any;
  // 23505 = PostgreSQL unique violation, ER_DUP_ENTRY = MySQL
  return e?.code === '23505' || e?.code === 'ER_DUP_ENTRY';
}

export function normEmail(e: string) {
  // Limpia espacios y pone todo en minúsculas para evitar duplicados tipo "Lucas@Mail.com" vs "lucas@mail.com"
  return e.trim().toLowerCase();
}
