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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, like, or, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // ============================================
  // User operations (Required for Replit Auth)
  // ============================================
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // ============================================
  // Patient operations
  // ============================================
  getAllPatients(): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
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
  
  getAllAdmissions(): Promise<Admission[]>;
  getActiveAdmissions(): Promise<Admission[]>;
  createAdmission(admission: InsertAdmission): Promise<Admission>;
  updateAdmission(id: string, admission: Partial<InsertAdmission>): Promise<Admission>;

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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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

  // ============================================
  // Patient operations
  // ============================================
  
  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async searchPatients(query: string): Promise<Patient[]> {
    return await db
      .select()
      .from(patients)
      .where(
        or(
          like(patients.firstNameAr, `%${query}%`),
          like(patients.familyNameAr, `%${query}%`),
          like(patients.phone, `%${query}%`),
          like(patients.nationalId, `%${query}%`)
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
    await db.delete(patients).where(eq(patients.id, id));
  }

  // ============================================
  // Appointment operations
  // ============================================
  
  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).orderBy(desc(appointments.appointmentDate));
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.patientId, patientId));
  }

  async getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.doctorId, doctorId));
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
          lte(appointments.appointmentDate, endOfDay)
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
    return updated;
  }

  async deleteAppointment(id: string): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  // ============================================
  // Bed & Admission operations
  // ============================================
  
  async getAllBeds(): Promise<Bed[]> {
    return await db.select().from(beds);
  }

  async getAvailableBeds(): Promise<Bed[]> {
    return await db.select().from(beds).where(eq(beds.status, "available"));
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

  async getAllAdmissions(): Promise<Admission[]> {
    return await db.select().from(admissions).orderBy(desc(admissions.admissionDate));
  }

  async getActiveAdmissions(): Promise<Admission[]> {
    return await db.select().from(admissions).where(eq(admissions.status, "active"));
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

  // ============================================
  // Surgery operations
  // ============================================
  
  async getAllSurgeries(): Promise<Surgery[]> {
    return await db.select().from(surgeries).orderBy(desc(surgeries.surgeryDate));
  }

  async getSurgery(id: string): Promise<Surgery | undefined> {
    const [surgery] = await db.select().from(surgeries).where(eq(surgeries.id, id));
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

  // ============================================
  // Pharmacy operations
  // ============================================
  
  async getAllMedications(): Promise<Medication[]> {
    return await db.select().from(medications);
  }

  async getMedication(id: string): Promise<Medication | undefined> {
    const [medication] = await db.select().from(medications).where(eq(medications.id, id));
    return medication;
  }

  async getMedicationByBarcode(barcode: string): Promise<Medication | undefined> {
    const [medication] = await db.select().from(medications).where(eq(medications.barcode, barcode));
    return medication;
  }

  async getLowStockMedications(): Promise<Medication[]> {
    return await db
      .select()
      .from(medications)
      .where(sql`${medications.stockQuantity} <= ${medications.minStockLevel}`);
  }

  async getExpiringMedications(days: number): Promise<Medication[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return await db
      .select()
      .from(medications)
      .where(lte(medications.expiryDate, futureDate));
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

  async getAllPrescriptions(): Promise<Prescription[]> {
    return await db.select().from(prescriptions).orderBy(desc(prescriptions.prescriptionDate));
  }

  async getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
    return await db.select().from(prescriptions).where(eq(prescriptions.patientId, patientId));
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

  // ============================================
  // Laboratory operations
  // ============================================
  
  async getAllLabTests(): Promise<LabTest[]> {
    return await db.select().from(labTests).orderBy(desc(labTests.requestDate));
  }

  async getLabTest(id: string): Promise<LabTest | undefined> {
    const [labTest] = await db.select().from(labTests).where(eq(labTests.id, id));
    return labTest;
  }

  async getLabTestsByPatient(patientId: string): Promise<LabTest[]> {
    return await db.select().from(labTests).where(eq(labTests.patientId, patientId));
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
    return await db.select().from(radiologyTests).orderBy(desc(radiologyTests.requestDate));
  }

  async getRadiologyTest(id: string): Promise<RadiologyTest | undefined> {
    const [radiologyTest] = await db.select().from(radiologyTests).where(eq(radiologyTests.id, id));
    return radiologyTest;
  }

  async getRadiologyTestsByPatient(patientId: string): Promise<RadiologyTest[]> {
    return await db.select().from(radiologyTests).where(eq(radiologyTests.patientId, patientId));
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
    return await db.select().from(staff);
  }

  async getStaff(id: string): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
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
          lte(attendance.date, endDate)
        )
      );
  }

  async createAttendance(attendanceRecord: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceRecord).returning();
    return newAttendance;
  }

  async getLeavesByStaff(staffId: string): Promise<Leave[]> {
    return await db.select().from(leaves).where(eq(leaves.staffId, staffId));
  }

  async getAllLeaves(): Promise<Leave[]> {
    return await db.select().from(leaves).orderBy(desc(leaves.createdAt));
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
          eq(shifts.shiftDate, date)
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
    return await db.select().from(payroll).where(eq(payroll.staffId, staffId));
  }

  async getAllPayroll(): Promise<Payroll[]> {
    return await db
      .select()
      .from(payroll)
      .orderBy(payroll.year, payroll.month);
  }

  async getPayrollByMonth(month: number, year: number): Promise<Payroll[]> {
    return await db
      .select()
      .from(payroll)
      .where(
        and(
          eq(payroll.month, month),
          eq(payroll.year, year)
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
    return await db.select().from(invoices).orderBy(desc(invoices.invoiceDate));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoicesByPatient(patientId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.patientId, patientId));
  }

  async getOverdueInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.paymentStatus, "overdue"));
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
}

export const storage = new DatabaseStorage();
