import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  date,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// Session & Authentication (Required for Replit Auth - javascript_log_in_with_replit integration)
// ============================================

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("receptionist"), // admin, doctor, nurse, pharmacist, lab_tech, radiology_tech, receptionist
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ============================================
// Enums
// ============================================

export const genderEnum = pgEnum("gender", ["male", "female"]);
export const maritalStatusEnum = pgEnum("marital_status", ["single", "married", "divorced", "widowed"]);
export const bedStatusEnum = pgEnum("bed_status", ["available", "occupied", "maintenance"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["scheduled", "confirmed", "completed", "cancelled", "no_show"]);
export const surgeryStatusEnum = pgEnum("surgery_status", ["scheduled", "in_progress", "completed", "cancelled"]);
export const prescriptionStatusEnum = pgEnum("prescription_status", ["pending", "dispensed", "cancelled"]);
export const labTestStatusEnum = pgEnum("lab_test_status", ["pending", "in_progress", "completed", "cancelled"]);
export const radiologyStatusEnum = pgEnum("radiology_status", ["pending", "in_progress", "completed", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "transfer", "insurance"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "partial", "overdue"]);
export const leaveTypeEnum = pgEnum("leave_type", ["annual", "sick", "emergency"]);
export const leaveStatusEnum = pgEnum("leave_status", ["pending", "approved", "rejected"]);

// ============================================
// Patients & Medical Records
// ============================================

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // رباعي الاسم - Quadruple Name
  firstNameAr: varchar("first_name_ar").notNull(),
  fatherNameAr: varchar("father_name_ar").notNull(),
  grandFatherNameAr: varchar("grand_father_name_ar").notNull(),
  familyNameAr: varchar("family_name_ar").notNull(),
  
  firstNameEn: varchar("first_name_en"),
  fatherNameEn: varchar("father_name_en"),
  grandFatherNameEn: varchar("grand_father_name_en"),
  familyNameEn: varchar("family_name_en"),
  
  // Personal Information
  dateOfBirth: date("date_of_birth").notNull(),
  gender: genderEnum("gender").notNull(),
  nationality: varchar("nationality").notNull(),
  maritalStatus: maritalStatusEnum("marital_status"),
  
  // Contact Information
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  address: text("address"),
  city: varchar("city"),
  
  // Official Documents - الوثائق الرسمية
  nationalId: varchar("national_id").unique(),
  familyBookNumber: varchar("family_book_number"),
  familySheetNumber: varchar("family_sheet_number"),
  registrationNumber: varchar("registration_number"),
  
  // ID Card - البطاقة الشخصية
  idCardNumber: varchar("id_card_number"),
  idCardIssueDate: date("id_card_issue_date"),
  idCardExpiryDate: date("id_card_expiry_date"),
  idCardImageUrl: varchar("id_card_image_url"),
  
  // Passport - جواز السفر
  passportNumber: varchar("passport_number"),
  passportIssueDate: date("passport_issue_date"),
  passportExpiryDate: date("passport_expiry_date"),
  passportImageUrl: varchar("passport_image_url"),
  
  // Medical History
  bloodType: varchar("blood_type"),
  allergies: text("allergies").array().default(sql`ARRAY[]::text[]`),
  chronicDiseases: text("chronic_diseases").array().default(sql`ARRAY[]::text[]`),
  familyMedicalHistory: text("family_medical_history"),
  previousSurgeries: text("previous_surgeries").array().default(sql`ARRAY[]::text[]`),
  
  // Photo
  photoUrl: varchar("photo_url"),
  
  // Metadata
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPatientSchema = createInsertSchema(patients, {
  allergies: z.array(z.string()).nullable().optional().default([]),
  chronicDiseases: z.array(z.string()).nullable().optional().default([]),
  previousSurgeries: z.array(z.string()).nullable().optional().default([]),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

// ============================================
// Appointments - المواعيد
// ============================================

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").notNull().default(30), // in minutes
  
  specialty: varchar("specialty").notNull(),
  reason: text("reason"),
  notes: text("notes"),
  
  status: appointmentStatusEnum("status").notNull().default("scheduled"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// ============================================
// Beds & Admissions - الأسرة والتنويم
// ============================================

export const beds = pgTable("beds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  bedNumber: varchar("bed_number").notNull().unique(),
  ward: varchar("ward").notNull(),
  floor: varchar("floor"),
  roomNumber: varchar("room_number"),
  
  status: bedStatusEnum("status").notNull().default("available"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBedSchema = createInsertSchema(beds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBed = z.infer<typeof insertBedSchema>;
export type Bed = typeof beds.$inferSelect;

export const admissions = pgTable("admissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  bedId: varchar("bed_id").references(() => beds.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  
  admissionDate: timestamp("admission_date").notNull(),
  dischargeDate: timestamp("discharge_date"),
  
  reason: text("reason").notNull(),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  notes: text("notes"),
  
  status: varchar("status").notNull().default("active"), // active, discharged
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdmissionSchema = createInsertSchema(admissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAdmission = z.infer<typeof insertAdmissionSchema>;
export type Admission = typeof admissions.$inferSelect;

// ============================================
// Surgeries - العمليات الجراحية
// ============================================

export const surgeries = pgTable("surgeries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  surgeonId: varchar("surgeon_id").notNull().references(() => users.id),
  
  surgeryDate: timestamp("surgery_date").notNull(),
  operatingRoom: varchar("operating_room").notNull(),
  
  surgeryType: varchar("surgery_type").notNull(),
  description: text("description"),
  
  // فريق العملية - Surgery Team
  assistantSurgeons: varchar("assistant_surgeons").array(), // surgeon IDs
  anesthesiologist: varchar("anesthesiologist").references(() => users.id),
  nurses: varchar("nurses").array(), // nurse IDs
  
  // Post-operation report
  complications: text("complications"),
  postOpNotes: text("post_op_notes"),
  
  status: surgeryStatusEnum("status").notNull().default("scheduled"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSurgerySchema = createInsertSchema(surgeries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSurgery = z.infer<typeof insertSurgerySchema>;
export type Surgery = typeof surgeries.$inferSelect;

// ============================================
// Pharmacy - الصيدلية
// ============================================

export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: varchar("name").notNull(),
  genericName: varchar("generic_name"),
  barcode: varchar("barcode").unique(),
  
  category: varchar("category"),
  manufacturer: varchar("manufacturer"),
  
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  minStockLevel: integer("min_stock_level").notNull().default(10),
  
  expiryDate: date("expiry_date"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medications.$inferSelect;

export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  
  prescriptionDate: timestamp("prescription_date").notNull().defaultNow(),
  
  medications: jsonb("medications").notNull(), // Array of {medicationId, dosage, frequency, duration}
  instructions: text("instructions"),
  
  status: prescriptionStatusEnum("status").notNull().default("pending"),
  dispensedBy: varchar("dispensed_by").references(() => users.id),
  dispensedAt: timestamp("dispensed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptions.$inferSelect;

// ============================================
// Laboratory - المعامل
// ============================================

export const labTests = pgTable("lab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  
  testType: varchar("test_type").notNull(), // blood, urine, stool, microbiology
  testName: varchar("test_name").notNull(),
  
  requestDate: timestamp("request_date").notNull().defaultNow(),
  sampleCollectedAt: timestamp("sample_collected_at"),
  
  results: jsonb("results"),
  resultNotes: text("result_notes"),
  
  status: labTestStatusEnum("status").notNull().default("pending"),
  performedBy: varchar("performed_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLabTestSchema = createInsertSchema(labTests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLabTest = z.infer<typeof insertLabTestSchema>;
export type LabTest = typeof labTests.$inferSelect;

// ============================================
// Radiology - الأشعة
// ============================================

export const radiologyTests = pgTable("radiology_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  doctorId: varchar("doctor_id").notNull().references(() => users.id),
  
  testType: varchar("test_type").notNull(), // x-ray, ct, mri, ultrasound, mammography
  bodyPart: varchar("body_part").notNull(),
  
  requestDate: timestamp("request_date").notNull().defaultNow(),
  
  images: varchar("images").array(), // Array of image URLs from object storage
  report: text("report"),
  findings: text("findings"),
  
  status: radiologyStatusEnum("status").notNull().default("pending"),
  performedBy: varchar("performed_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRadiologyTestSchema = createInsertSchema(radiologyTests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRadiologyTest = z.infer<typeof insertRadiologyTestSchema>;
export type RadiologyTest = typeof radiologyTests.$inferSelect;

// ============================================
// Staff & HR - الموارد البشرية
// ============================================

export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").unique().references(() => users.id),
  
  // رباعي الاسم - Quadruple Name (same as patients)
  firstNameAr: varchar("first_name_ar").notNull(),
  fatherNameAr: varchar("father_name_ar").notNull(),
  grandFatherNameAr: varchar("grand_father_name_ar").notNull(),
  familyNameAr: varchar("family_name_ar").notNull(),
  
  firstNameEn: varchar("first_name_en"),
  fatherNameEn: varchar("father_name_en"),
  grandFatherNameEn: varchar("grand_father_name_en"),
  familyNameEn: varchar("family_name_en"),
  
  // Personal Information
  dateOfBirth: date("date_of_birth").notNull(),
  gender: genderEnum("gender").notNull(),
  nationality: varchar("nationality").notNull(),
  
  // Contact Information
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  address: text("address"),
  
  // Official Documents (same as patients)
  nationalId: varchar("national_id").unique(),
  idCardNumber: varchar("id_card_number"),
  idCardIssueDate: date("id_card_issue_date"),
  idCardExpiryDate: date("id_card_expiry_date"),
  passportNumber: varchar("passport_number"),
  
  // Employment Information
  position: varchar("position").notNull(),
  department: varchar("department").notNull(),
  specialty: varchar("specialty"),
  hireDate: date("hire_date").notNull(),
  
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
  
  photoUrl: varchar("photo_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  staffId: varchar("staff_id").notNull().references(() => staff.id),
  
  date: date("date").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export const leaves = pgTable("leaves", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  staffId: varchar("staff_id").notNull().references(() => staff.id),
  
  leaveType: leaveTypeEnum("leave_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  
  reason: text("reason"),
  
  status: leaveStatusEnum("status").notNull().default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeaveSchema = createInsertSchema(leaves).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLeave = z.infer<typeof insertLeaveSchema>;
export type Leave = typeof leaves.$inferSelect;

export const shifts = pgTable("shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  staffId: varchar("staff_id").notNull().references(() => staff.id),
  
  shiftDate: date("shift_date").notNull(),
  startTime: varchar("start_time").notNull(), // HH:MM format
  endTime: varchar("end_time").notNull(),
  
  shiftType: varchar("shift_type").notNull(), // morning, evening, night
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
});

export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shifts.$inferSelect;

// ============================================
// Payroll - الرواتب
// ============================================

export const payroll = pgTable("payroll", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  staffId: varchar("staff_id").notNull().references(() => staff.id),
  
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  
  baseSalary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
  shiftAllowance: decimal("shift_allowance", { precision: 10, scale: 2 }).default("0"),
  bonuses: decimal("bonuses", { precision: 10, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default("0"),
  insurance: decimal("insurance", { precision: 10, scale: 2 }).default("0"),
  
  totalSalary: decimal("total_salary", { precision: 10, scale: 2 }).notNull(),
  
  paidAt: timestamp("paid_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPayrollSchema = createInsertSchema(payroll).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = typeof payroll.$inferSelect;

// ============================================
// Billing & Invoices - الفواتير والمحاسبة
// ============================================

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  
  invoiceDate: timestamp("invoice_date").notNull().defaultNow(),
  
  // Services breakdown
  services: jsonb("services").notNull(), // Array of {type, description, amount}
  
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  
  paymentMethod: paymentMethodEnum("payment_method"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  
  notes: text("notes"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// ============================================
// Relations
// ============================================

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
  admissions: many(admissions),
  surgeries: many(surgeries),
  prescriptions: many(prescriptions),
  labTests: many(labTests),
  radiologyTests: many(radiologyTests),
  invoices: many(invoices),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [appointments.doctorId],
    references: [users.id],
  }),
}));

export const admissionsRelations = relations(admissions, ({ one }) => ({
  patient: one(patients, {
    fields: [admissions.patientId],
    references: [patients.id],
  }),
  bed: one(beds, {
    fields: [admissions.bedId],
    references: [beds.id],
  }),
  doctor: one(users, {
    fields: [admissions.doctorId],
    references: [users.id],
  }),
}));

export const surgeriesRelations = relations(surgeries, ({ one }) => ({
  patient: one(patients, {
    fields: [surgeries.patientId],
    references: [patients.id],
  }),
  surgeon: one(users, {
    fields: [surgeries.surgeonId],
    references: [users.id],
  }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [prescriptions.doctorId],
    references: [users.id],
  }),
}));

export const labTestsRelations = relations(labTests, ({ one }) => ({
  patient: one(patients, {
    fields: [labTests.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [labTests.doctorId],
    references: [users.id],
  }),
}));

export const radiologyTestsRelations = relations(radiologyTests, ({ one }) => ({
  patient: one(patients, {
    fields: [radiologyTests.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [radiologyTests.doctorId],
    references: [users.id],
  }),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(users, {
    fields: [staff.userId],
    references: [users.id],
  }),
  attendance: many(attendance),
  leaves: many(leaves),
  shifts: many(shifts),
  payroll: many(payroll),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  patient: one(patients, {
    fields: [invoices.patientId],
    references: [patients.id],
  }),
}));
