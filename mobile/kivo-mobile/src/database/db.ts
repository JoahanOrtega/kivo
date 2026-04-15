import * as SQLite from "expo-sqlite";

/**
 * Nombre único de la base local del MVP.
 * Aquí vivirán catálogos, movimientos y metadatos de sincronización.
 */
const DATABASE_NAME = "kivo_v2.db";

/**
 * Instancia singleton de la base local.
 * Se reutiliza para evitar aperturas repetidas innecesarias.
 */
let databaseInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Devuelve una única instancia de la base local.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databaseInstance) {
    databaseInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  return databaseInstance;
}