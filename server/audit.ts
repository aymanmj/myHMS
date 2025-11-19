import { db } from "./db";
import { auditLogs } from "../shared/schema";

interface AuditLogParams {
  userId: string;
  action: "create" | "update" | "delete";
  tableName: string;
  recordId: string;
  oldData?: any;
  newData?: any;
}

export async function logAudit({
  userId,
  action,
  tableName,
  recordId,
  oldData,
  newData,
}: AuditLogParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      tableName,
      recordId,
      oldData: oldData || null,
      newData: newData || null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
}

export async function logCreate(
  userId: string,
  tableName: string,
  recordId: string,
  data: any
): Promise<void> {
  await logAudit({
    userId,
    action: "create",
    tableName,
    recordId,
    newData: data,
  });
}

export async function logUpdate(
  userId: string,
  tableName: string,
  recordId: string,
  oldData: any,
  newData: any
): Promise<void> {
  await logAudit({
    userId,
    action: "update",
    tableName,
    recordId,
    oldData,
    newData,
  });
}

export async function logDelete(
  userId: string,
  tableName: string,
  recordId: string,
  data: any
): Promise<void> {
  await logAudit({
    userId,
    action: "delete",
    tableName,
    recordId,
    oldData: data,
  });
}
