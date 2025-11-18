// API Routes - Complete Hospital Management System
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertPatientSchema,
  insertAppointmentSchema,
  insertBedSchema,
  insertAdmissionSchema,
  insertSurgerySchema,
  insertMedicationSchema,
  insertPrescriptionSchema,
  insertLabTestSchema,
  insertRadiologyTestSchema,
  insertStaffSchema,
  insertAttendanceSchema,
  insertLeaveSchema,
  insertShiftSchema,
  insertPayrollSchema,
  insertInvoiceSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // ============================================
  // Auth routes
  // ============================================
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============================================
  // Patient routes
  // ============================================
  app.get("/api/patients", isAuthenticated, async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/search", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      const patients = await storage.searchPatients(query);
      res.json(patients);
    } catch (error) {
      console.error("Error searching patients:", error);
      res.status(500).json({ message: "Failed to search patients" });
    }
  });

  app.get("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient({
        ...validatedData,
        createdBy: req.user.claims.sub,
      });
      res.status(201).json(patient);
    } catch (error: any) {
      console.error("Error creating patient:", error);
      res.status(400).json({ message: error.message || "Failed to create patient" });
    }
  });

  app.put("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(req.params.id, validatedData);
      res.json(patient);
    } catch (error: any) {
      console.error("Error updating patient:", error);
      res.status(400).json({ message: error.message || "Failed to update patient" });
    }
  });

  app.delete("/api/patients/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deletePatient(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting patient:", error);
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // ============================================
  // Appointment routes
  // ============================================
  app.get("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/patient/:patientId", isAuthenticated, async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsByPatient(req.params.patientId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/doctor/:doctorId", isAuthenticated, async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsByDoctor(req.params.doctorId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment({
        ...validatedData,
        createdBy: req.user.claims.sub,
      });
      res.status(201).json(appointment);
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      res.status(400).json({ message: error.message || "Failed to create appointment" });
    }
  });

  app.put("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(req.params.id, validatedData);
      res.json(appointment);
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      res.status(400).json({ message: error.message || "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteAppointment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // ============================================
  // Bed & Admission routes
  // ============================================
  app.get("/api/beds", isAuthenticated, async (req, res) => {
    try {
      const beds = await storage.getAllBeds();
      res.json(beds);
    } catch (error) {
      console.error("Error fetching beds:", error);
      res.status(500).json({ message: "Failed to fetch beds" });
    }
  });

  app.get("/api/beds/available", isAuthenticated, async (req, res) => {
    try {
      const beds = await storage.getAvailableBeds();
      res.json(beds);
    } catch (error) {
      console.error("Error fetching available beds:", error);
      res.status(500).json({ message: "Failed to fetch available beds" });
    }
  });

  app.post("/api/beds", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertBedSchema.parse(req.body);
      const bed = await storage.createBed(validatedData);
      res.status(201).json(bed);
    } catch (error: any) {
      console.error("Error creating bed:", error);
      res.status(400).json({ message: error.message || "Failed to create bed" });
    }
  });

  app.put("/api/beds/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertBedSchema.partial().parse(req.body);
      const bed = await storage.updateBed(req.params.id, validatedData);
      res.json(bed);
    } catch (error: any) {
      console.error("Error updating bed:", error);
      res.status(400).json({ message: error.message || "Failed to update bed" });
    }
  });

  app.get("/api/admissions", isAuthenticated, async (req, res) => {
    try {
      const admissions = await storage.getAllAdmissions();
      res.json(admissions);
    } catch (error) {
      console.error("Error fetching admissions:", error);
      res.status(500).json({ message: "Failed to fetch admissions" });
    }
  });

  app.post("/api/admissions", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertAdmissionSchema.parse(req.body);
      const admission = await storage.createAdmission({
        ...validatedData,
        createdBy: req.user.claims.sub,
      });
      res.status(201).json(admission);
    } catch (error: any) {
      console.error("Error creating admission:", error);
      res.status(400).json({ message: error.message || "Failed to create admission" });
    }
  });

  app.put("/api/admissions/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAdmissionSchema.partial().parse(req.body);
      const admission = await storage.updateAdmission(req.params.id, validatedData);
      res.json(admission);
    } catch (error: any) {
      console.error("Error updating admission:", error);
      res.status(400).json({ message: error.message || "Failed to update admission" });
    }
  });

  // ============================================
  // Surgery routes
  // ============================================
  app.get("/api/surgeries", isAuthenticated, async (req, res) => {
    try {
      const surgeries = await storage.getAllSurgeries();
      res.json(surgeries);
    } catch (error) {
      console.error("Error fetching surgeries:", error);
      res.status(500).json({ message: "Failed to fetch surgeries" });
    }
  });

  app.post("/api/surgeries", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertSurgerySchema.parse(req.body);
      const surgery = await storage.createSurgery({
        ...validatedData,
        createdBy: req.user.claims.sub,
      });
      res.status(201).json(surgery);
    } catch (error: any) {
      console.error("Error creating surgery:", error);
      res.status(400).json({ message: error.message || "Failed to create surgery" });
    }
  });

  app.put("/api/surgeries/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSurgerySchema.partial().parse(req.body);
      const surgery = await storage.updateSurgery(req.params.id, validatedData);
      res.json(surgery);
    } catch (error: any) {
      console.error("Error updating surgery:", error);
      res.status(400).json({ message: error.message || "Failed to update surgery" });
    }
  });

  // ============================================
  // Pharmacy routes
  // ============================================
  app.get("/api/medications", isAuthenticated, async (req, res) => {
    try {
      const medications = await storage.getAllMedications();
      res.json(medications);
    } catch (error) {
      console.error("Error fetching medications:", error);
      res.status(500).json({ message: "Failed to fetch medications" });
    }
  });

  app.get("/api/medications/low-stock", isAuthenticated, async (req, res) => {
    try {
      const medications = await storage.getLowStockMedications();
      res.json(medications);
    } catch (error) {
      console.error("Error fetching low stock medications:", error);
      res.status(500).json({ message: "Failed to fetch low stock medications" });
    }
  });

  app.get("/api/medications/expiring", isAuthenticated, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const medications = await storage.getExpiringMedications(days);
      res.json(medications);
    } catch (error) {
      console.error("Error fetching expiring medications:", error);
      res.status(500).json({ message: "Failed to fetch expiring medications" });
    }
  });

  app.post("/api/medications", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMedicationSchema.parse(req.body);
      const medication = await storage.createMedication(validatedData);
      res.status(201).json(medication);
    } catch (error: any) {
      console.error("Error creating medication:", error);
      res.status(400).json({ message: error.message || "Failed to create medication" });
    }
  });

  app.put("/api/medications/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMedicationSchema.partial().parse(req.body);
      const medication = await storage.updateMedication(req.params.id, validatedData);
      res.json(medication);
    } catch (error: any) {
      console.error("Error updating medication:", error);
      res.status(400).json({ message: error.message || "Failed to update medication" });
    }
  });

  app.get("/api/prescriptions", isAuthenticated, async (req, res) => {
    try {
      const prescriptions = await storage.getAllPrescriptions();
      res.json(prescriptions);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.post("/api/prescriptions", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(validatedData);
      res.status(201).json(prescription);
    } catch (error: any) {
      console.error("Error creating prescription:", error);
      res.status(400).json({ message: error.message || "Failed to create prescription" });
    }
  });

  app.put("/api/prescriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPrescriptionSchema.partial().parse(req.body);
      const prescription = await storage.updatePrescription(req.params.id, validatedData);
      res.json(prescription);
    } catch (error: any) {
      console.error("Error updating prescription:", error);
      res.status(400).json({ message: error.message || "Failed to update prescription" });
    }
  });

  // ============================================
  // Laboratory routes
  // ============================================
  app.get("/api/lab-tests", isAuthenticated, async (req, res) => {
    try {
      const labTests = await storage.getAllLabTests();
      res.json(labTests);
    } catch (error) {
      console.error("Error fetching lab tests:", error);
      res.status(500).json({ message: "Failed to fetch lab tests" });
    }
  });

  app.post("/api/lab-tests", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLabTestSchema.parse(req.body);
      const labTest = await storage.createLabTest(validatedData);
      res.status(201).json(labTest);
    } catch (error: any) {
      console.error("Error creating lab test:", error);
      res.status(400).json({ message: error.message || "Failed to create lab test" });
    }
  });

  app.put("/api/lab-tests/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLabTestSchema.partial().parse(req.body);
      const labTest = await storage.updateLabTest(req.params.id, validatedData);
      res.json(labTest);
    } catch (error: any) {
      console.error("Error updating lab test:", error);
      res.status(400).json({ message: error.message || "Failed to update lab test" });
    }
  });

  // ============================================
  // Radiology routes
  // ============================================
  app.get("/api/radiology-tests", isAuthenticated, async (req, res) => {
    try {
      const radiologyTests = await storage.getAllRadiologyTests();
      res.json(radiologyTests);
    } catch (error) {
      console.error("Error fetching radiology tests:", error);
      res.status(500).json({ message: "Failed to fetch radiology tests" });
    }
  });

  app.post("/api/radiology-tests", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertRadiologyTestSchema.parse(req.body);
      const radiologyTest = await storage.createRadiologyTest(validatedData);
      res.status(201).json(radiologyTest);
    } catch (error: any) {
      console.error("Error creating radiology test:", error);
      res.status(400).json({ message: error.message || "Failed to create radiology test" });
    }
  });

  app.put("/api/radiology-tests/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertRadiologyTestSchema.partial().parse(req.body);
      const radiologyTest = await storage.updateRadiologyTest(req.params.id, validatedData);
      res.json(radiologyTest);
    } catch (error: any) {
      console.error("Error updating radiology test:", error);
      res.status(400).json({ message: error.message || "Failed to update radiology test" });
    }
  });

  // ============================================
  // Staff & HR routes
  // ============================================
  app.get("/api/staff", isAuthenticated, async (req, res) => {
    try {
      const staff = await storage.getAllStaff();
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertStaffSchema.parse(req.body);
      const staffMember = await storage.createStaff(validatedData);
      res.status(201).json(staffMember);
    } catch (error: any) {
      console.error("Error creating staff:", error);
      res.status(400).json({ message: error.message || "Failed to create staff" });
    }
  });

  app.put("/api/staff/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertStaffSchema.partial().parse(req.body);
      const staffMember = await storage.updateStaff(req.params.id, validatedData);
      res.json(staffMember);
    } catch (error: any) {
      console.error("Error updating staff:", error);
      res.status(400).json({ message: error.message || "Failed to update staff" });
    }
  });

  app.get("/api/leaves", isAuthenticated, async (req, res) => {
    try {
      const leaves = await storage.getAllLeaves();
      res.json(leaves);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      res.status(500).json({ message: "Failed to fetch leaves" });
    }
  });

  app.post("/api/leaves", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLeaveSchema.parse(req.body);
      const leave = await storage.createLeave(validatedData);
      res.status(201).json(leave);
    } catch (error: any) {
      console.error("Error creating leave:", error);
      res.status(400).json({ message: error.message || "Failed to create leave" });
    }
  });

  app.put("/api/leaves/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLeaveSchema.partial().parse(req.body);
      const leave = await storage.updateLeave(req.params.id, validatedData);
      res.json(leave);
    } catch (error: any) {
      console.error("Error updating leave:", error);
      res.status(400).json({ message: error.message || "Failed to update leave" });
    }
  });

  // ============================================
  // Payroll routes
  // ============================================
  app.get("/api/payroll", isAuthenticated, async (req, res) => {
    try {
      const month = parseInt(req.query.month as string);
      const year = parseInt(req.query.year as string);
      
      if (month && year) {
        const payroll = await storage.getPayrollByMonth(month, year);
        res.json(payroll);
      } else {
        res.status(400).json({ message: "Month and year required" });
      }
    } catch (error) {
      console.error("Error fetching payroll:", error);
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  app.post("/api/payroll", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPayrollSchema.parse(req.body);
      const payroll = await storage.createPayroll(validatedData);
      res.status(201).json(payroll);
    } catch (error: any) {
      console.error("Error creating payroll:", error);
      res.status(400).json({ message: error.message || "Failed to create payroll" });
    }
  });

  // ============================================
  // Billing & Invoice routes
  // ============================================
  app.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/overdue", isAuthenticated, async (req, res) => {
    try {
      const invoices = await storage.getOverdueInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching overdue invoices:", error);
      res.status(500).json({ message: "Failed to fetch overdue invoices" });
    }
  });

  app.post("/api/invoices", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice({
        ...validatedData,
        createdBy: req.user.claims.sub,
      });
      res.status(201).json(invoice);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ message: error.message || "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, validatedData);
      res.json(invoice);
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      res.status(400).json({ message: error.message || "Failed to update invoice" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
