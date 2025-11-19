// Storage implementation - following javascript_database and javascript_log_in_with_replit integrations
import {
  users,
  type User,
  type UpsertUser,
  patients,
  type Patient,
  type InsertPatient,
  appointments,
  type Appointment,
  type InsertAppointment,
  beds,
  type Bed,
  type InsertBed,
  admissions,
  type Admission,
  type InsertAdmission,
  surgeries,
  type Surgery,
  type InsertSurgery,
  medications,
  type Medication,
  type InsertMedication,
  prescriptions,
  type Prescription,
  type InsertPrescription,
  labTests,
  type LabTest,
  type InsertLabTest,
  radiologyTests,
  type RadiologyTest,
  type InsertRadiologyTest,
  staff,
  type Staff,
  type InsertStaff,
  attendance,
  type Attendance,
  type InsertAttendance,
  leaves,
  type Leave,
  type InsertLeave,
  shifts,
  type Shift,
  type InsertShift,
  payroll,
  type Payroll,
  type InsertPayroll,
  invoices,
  type Invoice,
  type InsertInvoice,
  auditLogs,
  type AuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, like, or, sql, isNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // ============================================
  // User operations (Required for Replit Auth)
  // ============================================
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  updateUserRole(id: string, role: string): Promise<void>;
  deleteUser(id: string): Promise<void>;

  // ============================================
  // Patient operations
  // ============================================
  getAllPatients(): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientWithDetails(id: string): Promise<any>;
  searchPatients(query: string): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient>;
  deletePatient(id: string): Promise<void>;

  // ============================================
  // Appointment operations
  // ============================================
  getAllAppointments(): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointmentsByPatient(patientId: string): Promise<Appointment[]>;
  getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]>;
  getAppointmentsByDate(date: Date): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;

  // ============================================
  // Bed & Admission operations
  // ============================================
  getAllBeds(): Promise<Bed[]>;
  getAvailableBeds(): Promise<Bed[]>;
  createBed(bed: InsertBed): Promise<Bed>;
  updateBed(id: string, bed: Partial<InsertBed>): Promise<Bed>;
  deleteBed(id: string): Promise<void>;
  
  getAllAdmissions(): Promise<Admission[]>;
  getActiveAdmissions(): Promise<Admission[]>;
  createAdmission(admission: InsertAdmission): Promise<Admission>;
  updateAdmission(id: string, admission: Partial<InsertAdmission>): Promise<Admission>;
  deleteAdmission(id: string): Promise<void>;

  // ============================================
  // Surgery operations
  // ============================================
  getAllSurgeries(): Promise<Surgery[]>;
  getSurgery(id: string): Promise<Surgery | undefined>;
  createSurgery(surgery: InsertSurgery): Promise<Surgery>;
  updateSurgery(id: string, surgery: Partial<InsertSurgery>): Promise<Surgery>;

  // ============================================
  // Pharmacy operations
  // ============================================
  getAllMedications(): Promise<Medication[]>;
  getMedication(id: string): Promise<Medication | undefined>;
  getMedicationByBarcode(barcode: string): Promise<Medication | undefined>;
  getLowStockMedications(): Promise<Medication[]>;
  getExpiringMedications(days: number): Promise<Medication[]>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: string, medication: Partial<InsertMedication>): Promise<Medication>;
  
  getAllPrescriptions(): Promise<Prescription[]>;
  getPrescriptionsByPatient(patientId: string): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: string, prescription: Partial<InsertPrescription>): Promise<Prescription>;

  // ============================================
  // Laboratory operations
  // ============================================
  getAllLabTests(): Promise<LabTest[]>;
  getLabTest(id: string): Promise<LabTest | undefined>;
  getLabTestsByPatient(patientId: string): Promise<LabTest[]>;
  createLabTest(labTest: InsertLabTest): Promise<LabTest>;
  updateLabTest(id: string, labTest: Partial<InsertLabTest>): Promise<LabTest>;

  // ============================================
  // Radiology operations
  // ============================================
  getAllRadiologyTests(): Promise<RadiologyTest[]>;
  getRadiologyTest(id: string): Promise<RadiologyTest | undefined>;
  getRadiologyTestsByPatient(patientId: string): Promise<RadiologyTest[]>;
  createRadiologyTest(radiologyTest: InsertRadiologyTest): Promise<RadiologyTest>;
  updateRadiologyTest(id: string, radiologyTest: Partial<InsertRadiologyTest>): Promise<RadiologyTest>;

  // ============================================
  // Staff & HR operations
  // ============================================
  getAllStaff(): Promise<Staff[]>;
  getStaff(id: string): Promise<Staff | undefined>;
  createStaff(staffMember: InsertStaff): Promise<Staff>;
  updateStaff(id: string, staffMember: Partial<InsertStaff>): Promise<Staff>;
  
  getAttendanceByStaff(staffId: string, startDate: Date, endDate: Date): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  
  getLeavesByStaff(staffId: string): Promise<Leave[]>;
  getAllLeaves(): Promise<Leave[]>;
  createLeave(leave: InsertLeave): Promise<Leave>;
  updateLeave(id: string, leave: Partial<InsertLeave>): Promise<Leave>;
  
  getShiftsByStaff(staffId: string, date: Date): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;

  // ============================================
  // Payroll operations
  // ============================================
  getPayrollByStaff(staffId: string): Promise<Payroll[]>;
  getAllPayroll(): Promise<Payroll[]>;
  getPayrollByMonth(month: number, year: number): Promise<Payroll[]>;
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  updatePayroll(id: string, payroll: Partial<InsertPayroll>): Promise<Payroll>;

  // ============================================
  // Billing & Invoice operations
  // ============================================
  getAllInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoicesByPatient(patientId: string): Promise<Invoice[]>;
  getOverdueInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
}

export class DatabaseStorage implements IStorage {
  // ============================================
  // User operations (Required for Replit Auth)
  // ============================================
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.id, id), isNull(users.deletedAt)));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(isNull(users.deletedAt));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (userData.email) {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.email,
          set: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            role: userData.role,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } else {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    }
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<void> {
    const result = await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    if (result.length === 0) {
      throw new Error("User not found");
    }
  }

  async deleteUser(id: string): Promise<void> {
    const result = await db.update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error("User not found");
    }
  }

  // ============================================
  // Patient operations
  // ============================================
  
  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients).where(isNull(patients.deletedAt)).orderBy(desc(patients.createdAt));
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(and(eq(patients.id, id), isNull(patients.deletedAt)));
    return patient;
  }

  async getPatientWithDetails(id: string): Promise<any> {
    const patient = await this.getPatient(id);
    if (!patient) return undefined;

    const [
      patientAppointments,
      patientPrescriptions,
      patientAdmissions,
      patientSurgeries,
      patientLabTests,
      patientRadiologyTests,
      patientInvoices
    ] = await Promise.all([
      db.select().from(appointments).where(and(eq(appointments.patientId, id), isNull(appointments.deletedAt))).orderBy(desc(appointments.appointmentDate)),
      db.select().from(prescriptions).where(and(eq(prescriptions.patientId, id), isNull(prescriptions.deletedAt))).orderBy(desc(prescriptions.prescriptionDate)),
      db.select().from(admissions).where(and(eq(admissions.patientId, id), isNull(admissions.deletedAt))).orderBy(desc(admissions.admissionDate)),
      db.select().from(surgeries).where(and(eq(surgeries.patientId, id), isNull(surgeries.deletedAt))).orderBy(desc(surgeries.surgeryDate)),
      db.select().from(labTests).where(and(eq(labTests.patientId, id), isNull(labTests.deletedAt))).orderBy(desc(labTests.requestDate)),
      db.select().from(radiologyTests).where(and(eq(radiologyTests.patientId, id), isNull(radiologyTests.deletedAt))).orderBy(desc(radiologyTests.requestDate)),
      db.select().from(invoices).where(and(eq(invoices.patientId, id), isNull(invoices.deletedAt))).orderBy(desc(invoices.invoiceDate))
    ]);

    return {
      ...patient,
      appointments: patientAppointments,
      prescriptions: patientPrescriptions,
      admissions: patientAdmissions,
      surgeries: patientSurgeries,
      labTests: patientLabTests,
      radiologyTests: patientRadiologyTests,
      invoices: patientInvoices
    };
  }

  async searchPatients(query: string): Promise<Patient[]> {
    return await db
      .select()
      .from(patients)
      .where(
        and(
          or(
            like(patients.firstNameAr, `%${query}%`),
            like(patients.familyNameAr, `%${query}%`),
            like(patients.phone, `%${query}%`),
            like(patients.nationalId, `%${query}%`)
          ),
          isNull(patients.deletedAt)
        )
      );
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [newPatient] = await db.insert(patients).values(patient).returning();
    return newPatient;
  }

  async updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient> {
    const [updated] = await db
      .update(patients)
      .set({ ...patient, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return updated;
  }

  async deletePatient(id: string): Promise<void> {
    const result = await db.update(patients)
      .set({ deletedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error("Patient not found");
    }
  }

  // ============================================
  // Appointment operations
  // ============================================
  
  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).where(isNull(appointments.deletedAt)).orderBy(desc(appointments.appointmentDate));
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(and(eq(appointments.id, id), isNull(appointments.deletedAt)));
    return appointment;
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(and(eq(appointments.patientId, patientId), isNull(appointments.deletedAt)));
  }

  async getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(and(eq(appointments.doctorId, doctorId), isNull(appointments.deletedAt)));
  }

  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db
      .select()
      .from(appointments)
      .where(
        and(
          gte(appointments.appointmentDate, startOfDay),
          lte(appointments.appointmentDate, endOfDay),
          isNull(appointments.deletedAt)
        )
      );
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [updated] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    
    if (!updated) {
      throw new Error("Appointment not found");
    }
    return updated;
  }

  async deleteAppointment(id: string): Promise<void> {
    const result = await db.update(appointments)
      .set({ deletedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error("Appointment not found");
    }
  }

  // ============================================
  // Bed & Admission operations
  // ============================================
  
  async getAllBeds(): Promise<Bed[]> {
    return await db.select().from(beds).where(isNull(beds.deletedAt));
  }

  async getAvailableBeds(): Promise<Bed[]> {
    return await db.select().from(beds).where(and(eq(beds.status, "available"), isNull(beds.deletedAt)));
  }

  async createBed(bed: InsertBed): Promise<Bed> {
    const [newBed] = await db.insert(beds).values(bed).returning();
    return newBed;
  }

  async updateBed(id: string, bed: Partial<InsertBed>): Promise<Bed> {
    const [updated] = await db
      .update(beds)
      .set({ ...bed, updatedAt: new Date() })
      .where(eq(beds.id, id))
      .returning();
    return updated;
  }

  async deleteBed(id: string): Promise<void> {
    const result = await db.update(beds)
      .set({ deletedAt: new Date() })
      .where(eq(beds.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error("Bed not found");
    }
  }

  async getAllAdmissions(): Promise<Admission[]> {
    return await db.select().from(admissions).where(isNull(admissions.deletedAt)).orderBy(desc(admissions.admissionDate));
  }

  async getActiveAdmissions(): Promise<Admission[]> {
    return await db.select().from(admissions).where(and(eq(admissions.status, "active"), isNull(admissions.deletedAt)));
  }

  async createAdmission(admission: InsertAdmission): Promise<Admission> {
    const [newAdmission] = await db.insert(admissions).values(admission).returning();
    return newAdmission;
  }

  async updateAdmission(id: string, admission: Partial<InsertAdmission>): Promise<Admission> {
    const [updated] = await db
      .update(admissions)
      .set({ ...admission, updatedAt: new Date() })
      .where(eq(admissions.id, id))
      .returning();
    return updated;
  }

  async deleteAdmission(id: string): Promise<void> {
    const result = await db.update(admissions)
      .set({ deletedAt: new Date() })
      .where(eq(admissions.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error("Admission not found");
    }
  }

  // ============================================
  // Surgery operations
  // ============================================
  
  async getAllSurgeries(): Promise<Surgery[]> {
    return await db.select().from(surgeries).where(isNull(surgeries.deletedAt)).orderBy(desc(surgeries.surgeryDate));
  }

  async getSurgery(id: string): Promise<Surgery | undefined> {
    const [surgery] = await db.select().from(surgeries).where(and(eq(surgeries.id, id), isNull(surgeries.deletedAt)));
    return surgery;
  }

  async createSurgery(surgery: InsertSurgery): Promise<Surgery> {
    const [newSurgery] = await db.insert(surgeries).values(surgery).returning();
    return newSurgery;
  }

  async updateSurgery(id: string, surgery: Partial<InsertSurgery>): Promise<Surgery> {
    const [updated] = await db
      .update(surgeries)
      .set({ ...surgery, updatedAt: new Date() })
      .where(eq(surgeries.id, id))
      .returning();
    return updated;
  }

  async deleteSurgery(id: string): Promise<void> {
    const result = await db.update(surgeries)
      .set({ deletedAt: new Date() })
      .where(eq(surgeries.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error("Surgery not found");
    }
  }

  // ============================================
  // Pharmacy operations
  // ============================================
  
  async getAllMedications(): Promise<Medication[]> {
    return await db.select().from(medications).where(isNull(medications.deletedAt));
  }

  async getMedication(id: string): Promise<Medication | undefined> {
    const [medication] = await db.select().from(medications).where(and(eq(medications.id, id), isNull(medications.deletedAt)));
    return medication;
  }

  async getMedicationByBarcode(barcode: string): Promise<Medication | undefined> {
    const [medication] = await db.select().from(medications).where(and(eq(medications.barcode, barcode), isNull(medications.deletedAt)));
    return medication;
  }

  async getLowStockMedications(): Promise<Medication[]> {
    return await db
      .select()
      .from(medications)
      .where(and(
        sql`${medications.stockQuantity} <= ${medications.minStockLevel}`,
        isNull(medications.deletedAt)
      ));
  }

  async getExpiringMedications(days: number): Promise<Medication[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return await db
      .select()
      .from(medications)
      .where(and(
        lte(medications.expiryDate, futureDate),
        isNull(medications.deletedAt)
      ));
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const [newMedication] = await db.insert(medications).values(medication).returning();
    return newMedication;
  }

  async updateMedication(id: string, medication: Partial<InsertMedication>): Promise<Medication> {
    const [updated] = await db
      .update(medications)
      .set({ ...medication, updatedAt: new Date() })
      .where(eq(medications.id, id))
      .returning();
    return updated;
  }

  async deleteMedication(id: string): Promise<void> {
    const result = await db.update(medications)
      .set({ deletedAt: new Date() })
      .where(eq(medications.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error("Medication not found");
    }
  }

  async getAllPrescriptions(): Promise<Prescription[]> {
    return await db.select().from(prescriptions).where(isNull(prescriptions.deletedAt)).orderBy(desc(prescriptions.prescriptionDate));
  }

  async getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
    return await db.select().from(prescriptions).where(and(eq(prescriptions.patientId, patientId), isNull(prescriptions.deletedAt)));
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const [newPrescription] = await db.insert(prescriptions).values(prescription).returning();
    return newPrescription;
  }

  async updatePrescription(id: string, prescription: Partial<InsertPrescription>): Promise<Prescription> {
    const [updated] = await db
      .update(prescriptions)
      .set({ ...prescription, updatedAt: new Date() })
      .where(eq(prescriptions.id, id))
      .returning();
    return updated;
  }

  async deletePrescription(id: string): Promise<void> {
    const result = await db.update(prescriptions)
      .set({ deletedAt: new Date() })
      .where(eq(prescriptions.id, id))
      .returning();
    if (result.length === 0) {
      throw new Error("Prescription not found");
    }
  }

  // ============================================
  // Laboratory operations
  // ============================================
  
  async getAllLabTests(): Promise<LabTest[]> {
    return await db.select().from(labTests).where(isNull(labTests.deletedAt)).orderBy(desc(labTests.requestDate));
  }

  async getLabTest(id: string): Promise<LabTest | undefined> {
    const [labTest] = await db.select().from(labTests).where(and(eq(labTests.id, id), isNull(labTests.deletedAt)));
    return labTest;
  }

  async getLabTestsByPatient(patientId: string): Promise<LabTest[]> {
    return await db.select().from(labTests).where(and(eq(labTests.patientId, patientId), isNull(labTests.deletedAt)));
  }

  async createLabTest(labTest: InsertLabTest): Promise<LabTest> {
    const [newLabTest] = await db.insert(labTests).values(labTest).returning();
    return newLabTest;
  }

  async updateLabTest(id: string, labTest: Partial<InsertLabTest>): Promise<LabTest> {
    const [updated] = await db
      .update(labTests)
      .set({ ...labTest, updatedAt: new Date() })
      .where(eq(labTests.id, id))
      .returning();
    return updated;
  }

  // ============================================
  // Radiology operations
  // ============================================
  
  async getAllRadiologyTests(): Promise<RadiologyTest[]> {
    return await db.select().from(radiologyTests).where(isNull(radiologyTests.deletedAt)).orderBy(desc(radiologyTests.requestDate));
  }

  async getRadiologyTest(id: string): Promise<RadiologyTest | undefined> {
    const [radiologyTest] = await db.select().from(radiologyTests).where(and(eq(radiologyTests.id, id), isNull(radiologyTests.deletedAt)));
    return radiologyTest;
  }

  async getRadiologyTestsByPatient(patientId: string): Promise<RadiologyTest[]> {
    return await db.select().from(radiologyTests).where(and(eq(radiologyTests.patientId, patientId), isNull(radiologyTests.deletedAt)));
  }

  async createRadiologyTest(radiologyTest: InsertRadiologyTest): Promise<RadiologyTest> {
    const [newRadiologyTest] = await db.insert(radiologyTests).values(radiologyTest).returning();
    return newRadiologyTest;
  }

  async updateRadiologyTest(id: string, radiologyTest: Partial<InsertRadiologyTest>): Promise<RadiologyTest> {
    const [updated] = await db
      .update(radiologyTests)
      .set({ ...radiologyTest, updatedAt: new Date() })
      .where(eq(radiologyTests.id, id))
      .returning();
    return updated;
  }

  // ============================================
  // Staff & HR operations
  // ============================================
  
  async getAllStaff(): Promise<Staff[]> {
    return await db.select().from(staff).where(isNull(staff.deletedAt));
  }

  async getStaff(id: string): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(and(eq(staff.id, id), isNull(staff.deletedAt)));
    return staffMember;
  }

  async createStaff(staffMember: InsertStaff): Promise<Staff> {
    const [newStaff] = await db.insert(staff).values(staffMember).returning();
    return newStaff;
  }

  async updateStaff(id: string, staffMember: Partial<InsertStaff>): Promise<Staff> {
    const [updated] = await db
      .update(staff)
      .set({ ...staffMember, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();
    return updated;
  }

  async getAttendanceByStaff(staffId: string, startDate: Date, endDate: Date): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.staffId, staffId),
          gte(attendance.date, startDate),
          lte(attendance.date, endDate),
          isNull(attendance.deletedAt)
        )
      );
  }

  async createAttendance(attendanceRecord: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceRecord).returning();
    return newAttendance;
  }

  async getLeavesByStaff(staffId: string): Promise<Leave[]> {
    return await db.select().from(leaves).where(and(eq(leaves.staffId, staffId), isNull(leaves.deletedAt)));
  }

  async getAllLeaves(): Promise<Leave[]> {
    return await db.select().from(leaves).where(isNull(leaves.deletedAt)).orderBy(desc(leaves.createdAt));
  }

  async createLeave(leave: InsertLeave): Promise<Leave> {
    const [newLeave] = await db.insert(leaves).values(leave).returning();
    return newLeave;
  }

  async updateLeave(id: string, leave: Partial<InsertLeave>): Promise<Leave> {
    const [updated] = await db
      .update(leaves)
      .set({ ...leave, updatedAt: new Date() })
      .where(eq(leaves.id, id))
      .returning();
    return updated;
  }

  async getShiftsByStaff(staffId: string, date: Date): Promise<Shift[]> {
    return await db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.staffId, staffId),
          eq(shifts.shiftDate, date),
          isNull(shifts.deletedAt)
        )
      );
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    const [newShift] = await db.insert(shifts).values(shift).returning();
    return newShift;
  }

  // ============================================
  // Payroll operations
  // ============================================
  
  async getPayrollByStaff(staffId: string): Promise<Payroll[]> {
    return await db.select().from(payroll).where(and(eq(payroll.staffId, staffId), isNull(payroll.deletedAt)));
  }

  async getAllPayroll(): Promise<Payroll[]> {
    return await db
      .select()
      .from(payroll)
      .where(isNull(payroll.deletedAt))
      .orderBy(payroll.year, payroll.month);
  }

  async getPayrollByMonth(month: number, year: number): Promise<Payroll[]> {
    return await db
      .select()
      .from(payroll)
      .where(
        and(
          eq(payroll.month, month),
          eq(payroll.year, year),
          isNull(payroll.deletedAt)
        )
      );
  }

  async createPayroll(payrollRecord: InsertPayroll): Promise<Payroll> {
    const [newPayroll] = await db.insert(payroll).values(payrollRecord).returning();
    return newPayroll;
  }

  async updatePayroll(id: string, payrollRecord: Partial<InsertPayroll>): Promise<Payroll> {
    const [updated] = await db
      .update(payroll)
      .set({ ...payrollRecord, updatedAt: new Date() })
      .where(eq(payroll.id, id))
      .returning();
    return updated;
  }

  // ============================================
  // Billing & Invoice operations
  // ============================================
  
  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).where(isNull(invoices.deletedAt)).orderBy(desc(invoices.invoiceDate));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(and(eq(invoices.id, id), isNull(invoices.deletedAt)));
    return invoice;
  }

  async getInvoicesByPatient(patientId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(and(eq(invoices.patientId, patientId), isNull(invoices.deletedAt)));
  }

  async getOverdueInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).where(and(eq(invoices.paymentStatus, "overdue"), isNull(invoices.deletedAt)));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updated] = await db
      .update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  // ============================================
  // Audit Logs operations
  // ============================================
  
  async getAllAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(1000);
  }

  async getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt));
  }

  async getAuditLogsByTable(tableName: string): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).where(eq(auditLogs.tableName, tableName)).orderBy(desc(auditLogs.createdAt));
  }

  async getAuditLogsByRecord(tableName: string, recordId: string): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).where(
      and(eq(auditLogs.tableName, tableName), eq(auditLogs.recordId, recordId))
    ).orderBy(desc(auditLogs.createdAt));
  }
}

export const storage = new DatabaseStorage();
