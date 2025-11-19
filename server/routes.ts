// API Routes - Complete Hospital Management System
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requirePermission, requireRole } from "./middleware/rbac";
import { logCreate, logUpdate, logDelete } from "./audit";
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
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/users', isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const { insertUserSchema } = await import("@shared/schema");
      const validatedData = insertUserSchema.parse(req.body);
      
      const newUser = await storage.createUser(validatedData);
      
      await logCreate(req.user.claims.sub, "users", newUser.id, newUser);
      
      res.status(201).json(newUser);
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user", error: error.message });
    }
  });

  app.put('/api/users/:id', isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const { insertUserSchema } = await import("@shared/schema");
      const validatedData = insertUserSchema.partial().parse(req.body);

      const oldUser = await storage.getUser(req.params.id);
      const updatedUser = await storage.updateUser(req.params.id, validatedData);
      
      if (oldUser) {
        await logUpdate(req.user.claims.sub, "users", req.params.id, oldUser, updatedUser);
      }
      
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message === "User not found") {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(500).json({ message: "Failed to update user", error: error.message });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      if (req.user.id === req.params.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const user = await storage.getUser(req.params.id);
      if (user) {
        await storage.deleteUser(req.params.id);
        await logDelete(req.user.claims.sub, "users", req.params.id, user);
      } else {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      if (error.message === "User not found") {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(500).json({ message: "Failed to delete user", error: error.message });
    }
  });

  app.put('/api/users/:id/role', isAuthenticated, requireRole("admin"), async (req: any, res) => {
    try {
      const { role } = req.body;
      const validRoles = ["admin", "doctor", "nurse", "pharmacist", "lab_tech", "radiology_tech", "receptionist"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      await storage.updateUserRole(req.params.id, role);
      res.json({ success: true, message: "Role updated successfully" });
    } catch (error: any) {
      console.error("Error updating user role:", error);
      if (error.message === "User not found") {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(500).json({ message: error.message || "Failed to update user role" });
    }
  });

  app.get("/api/users/doctors", isAuthenticated, requirePermission("appointments", "read"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const doctors = users.filter(u => u.role === "doctor");
      res.json(doctors);
    } catch (error: any) {
      console.error("Error fetching doctors:", error);
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  // ============================================
  // Appointment routes
  // ============================================
  
  app.get('/api/appointments', isAuthenticated, requirePermission("appointments", "read"), async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get('/api/appointments/:id', isAuthenticated, requirePermission("appointments", "read"), async (req, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error: any) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.get('/api/appointments/patient/:patientId', isAuthenticated, requirePermission("appointments", "read"), async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsByPatient(req.params.patientId);
      res.json(appointments);
    } catch (error: any) {
      console.error("Error fetching patient appointments:", error);
      res.status(500).json({ message: "Failed to fetch patient appointments" });
    }
  });

  app.get('/api/appointments/doctor/:doctorId', isAuthenticated, requirePermission("appointments", "read"), async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsByDoctor(req.params.doctorId);
      res.json(appointments);
    } catch (error: any) {
      console.error("Error fetching doctor appointments:", error);
      res.status(500).json({ message: "Failed to fetch doctor appointments" });
    }
  });

  app.post('/api/appointments', isAuthenticated, requirePermission("appointments", "create"), async (req: any, res) => {
    try {
      const { insertAppointmentSchema } = await import("@shared/schema");
      const validatedData = insertAppointmentSchema.parse(req.body);
      
      const appointment = await storage.createAppointment({
        ...validatedData,
        createdBy: req.user.id,
      });
      
      await logCreate(req.user.claims.sub, "appointments", appointment.id, appointment);
      
      res.status(201).json(appointment);
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appointment", error: error.message });
    }
  });

  app.put('/api/appointments/:id', isAuthenticated, requirePermission("appointments", "update"), async (req: any, res) => {
    try {
      const { insertAppointmentSchema } = await import("@shared/schema");
      const validatedData = insertAppointmentSchema.partial().parse(req.body);
      
      const oldAppointment = await storage.getAppointment(req.params.id);
      const appointment = await storage.updateAppointment(req.params.id, validatedData);
      
      if (oldAppointment) {
        await logUpdate(req.user.claims.sub, "appointments", req.params.id, oldAppointment, appointment);
      }
      
      res.json(appointment);
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      if (error.message === "Appointment not found") {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.status(500).json({ message: "Failed to update appointment", error: error.message });
    }
  });

  app.put('/api/appointments/:id/status', isAuthenticated, requirePermission("appointments", "update"), async (req: any, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ["scheduled", "confirmed", "completed", "cancelled", "no_show"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const appointment = await storage.updateAppointment(req.params.id, { status });
      res.json(appointment);
    } catch (error: any) {
      console.error("Error updating appointment status:", error);
      if (error.message === "Appointment not found") {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.status(500).json({ message: "Failed to update appointment status", error: error.message });
    }
  });

  app.delete('/api/appointments/:id', isAuthenticated, requirePermission("appointments", "delete"), async (req: any, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (appointment) {
        await storage.deleteAppointment(req.params.id);
        await logDelete(req.user.claims.sub, "appointments", req.params.id, appointment);
        res.json({ success: true, message: "Appointment deleted successfully" });
      } else {
        return res.status(404).json({ message: "Appointment not found" });
      }
    } catch (error: any) {
      console.error("Error deleting appointment:", error);
      if (error.message === "Appointment not found") {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.status(500).json({ message: "Failed to delete appointment", error: error.message });
    }
  });

  // ============================================
  // Patient routes
  // ============================================
  app.get("/api/patients", isAuthenticated, requirePermission("patients", "read"), async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id/details", isAuthenticated, requirePermission("patients", "read"), async (req, res) => {
    try {
      const { id } = req.params;
      const patientDetails = await storage.getPatientWithDetails(id);
      if (!patientDetails) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patientDetails);
    } catch (error) {
      console.error("Error fetching patient details:", error);
      res.status(500).json({ message: "Failed to fetch patient details" });
    }
  });

  app.get("/api/patients/search", isAuthenticated, requirePermission("patients", "read"), async (req, res) => {
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

  app.get("/api/patients/:id", isAuthenticated, requirePermission("patients", "read"), async (req, res) => {
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

  app.post("/api/patients", isAuthenticated, requirePermission("patients", "create"), async (req: any, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient({
        ...validatedData,
        createdBy: req.user.claims.sub,
      });
      
      await logCreate(req.user.claims.sub, "patients", patient.id, patient);
      
      res.status(201).json(patient);
    } catch (error: any) {
      console.error("Error creating patient:", error);
      res.status(400).json({ message: error.message || "Failed to create patient" });
    }
  });

  app.put("/api/patients/:id", isAuthenticated, requirePermission("patients", "update"), async (req: any, res) => {
    try {
      const validatedData = insertPatientSchema.partial().parse(req.body);
      const oldPatient = await storage.getPatient(req.params.id);
      const patient = await storage.updatePatient(req.params.id, validatedData);
      
      if (oldPatient) {
        await logUpdate(req.user.claims.sub, "patients", req.params.id, oldPatient, patient);
      }
      
      res.json(patient);
    } catch (error: any) {
      console.error("Error updating patient:", error);
      res.status(400).json({ message: error.message || "Failed to update patient" });
    }
  });

  app.delete("/api/patients/:id", isAuthenticated, requirePermission("patients", "delete"), async (req: any, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (patient) {
        await storage.deletePatient(req.params.id);
        await logDelete(req.user.claims.sub, "patients", req.params.id, patient);
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Patient not found" });
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // ============================================
  // Appointment routes
  // ============================================
  app.get("/api/appointments", isAuthenticated, requirePermission("appointments", "read"), async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/patient/:patientId", isAuthenticated, requirePermission("appointments", "read"), async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsByPatient(req.params.patientId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/doctor/:doctorId", isAuthenticated, requirePermission("appointments", "read"), async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsByDoctor(req.params.doctorId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", isAuthenticated, requirePermission("appointments", "create"), async (req: any, res) => {
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

  app.put("/api/appointments/:id", isAuthenticated, requirePermission("appointments", "update"), async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(req.params.id, validatedData);
      res.json(appointment);
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      res.status(400).json({ message: error.message || "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", isAuthenticated, requirePermission("appointments", "delete"), async (req, res) => {
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
  app.get("/api/beds", isAuthenticated, requirePermission("admissions", "read"), async (req, res) => {
    try {
      const beds = await storage.getAllBeds();
      res.json(beds);
    } catch (error) {
      console.error("Error fetching beds:", error);
      res.status(500).json({ message: "Failed to fetch beds" });
    }
  });

  app.get("/api/beds/available", isAuthenticated, requirePermission("admissions", "read"), async (req, res) => {
    try {
      const beds = await storage.getAvailableBeds();
      res.json(beds);
    } catch (error) {
      console.error("Error fetching available beds:", error);
      res.status(500).json({ message: "Failed to fetch available beds" });
    }
  });

  app.post("/api/beds", isAuthenticated, requirePermission("beds", "create"), async (req, res) => {
    try {
      const validatedData = insertBedSchema.parse(req.body);
      const bed = await storage.createBed(validatedData);
      res.status(201).json(bed);
    } catch (error: any) {
      console.error("Error creating bed:", error);
      res.status(400).json({ message: error.message || "Failed to create bed" });
    }
  });

  app.put("/api/beds/:id", isAuthenticated, requirePermission("beds", "update"), async (req, res) => {
    try {
      const validatedData = insertBedSchema.partial().parse(req.body);
      const bed = await storage.updateBed(req.params.id, validatedData);
      res.json(bed);
    } catch (error: any) {
      console.error("Error updating bed:", error);
      res.status(400).json({ message: error.message || "Failed to update bed" });
    }
  });

  app.delete("/api/beds/:id", isAuthenticated, requirePermission("beds", "delete"), async (req, res) => {
    try {
      await storage.deleteBed(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting bed:", error);
      res.status(400).json({ message: error.message || "Failed to delete bed" });
    }
  });

  app.get("/api/admissions", isAuthenticated, requirePermission("admissions", "read"), async (req, res) => {
    try {
      const admissions = await storage.getAllAdmissions();
      res.json(admissions);
    } catch (error) {
      console.error("Error fetching admissions:", error);
      res.status(500).json({ message: "Failed to fetch admissions" });
    }
  });

  app.post("/api/admissions", isAuthenticated, requirePermission("admissions", "create"), async (req: any, res) => {
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

  app.put("/api/admissions/:id", isAuthenticated, requirePermission("admissions", "update"), async (req, res) => {
    try {
      const validatedData = insertAdmissionSchema.partial().parse(req.body);
      const admission = await storage.updateAdmission(req.params.id, validatedData);
      res.json(admission);
    } catch (error: any) {
      console.error("Error updating admission:", error);
      res.status(400).json({ message: error.message || "Failed to update admission" });
    }
  });

  app.delete("/api/admissions/:id", isAuthenticated, requirePermission("admissions", "delete"), async (req, res) => {
    try {
      await storage.deleteAdmission(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting admission:", error);
      res.status(400).json({ message: error.message || "Failed to delete admission" });
    }
  });

  // ============================================
  // Surgery routes
  // ============================================
  app.get("/api/surgeries", isAuthenticated, requirePermission("surgeries", "read"), async (req, res) => {
    try {
      const surgeries = await storage.getAllSurgeries();
      res.json(surgeries);
    } catch (error) {
      console.error("Error fetching surgeries:", error);
      res.status(500).json({ message: "Failed to fetch surgeries" });
    }
  });

  app.post("/api/surgeries", isAuthenticated, requirePermission("surgeries", "create"), async (req: any, res) => {
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

  app.put("/api/surgeries/:id", isAuthenticated, requirePermission("surgeries", "update"), async (req, res) => {
    try {
      const validatedData = insertSurgerySchema.partial().parse(req.body);
      const surgery = await storage.updateSurgery(req.params.id, validatedData);
      res.json(surgery);
    } catch (error: any) {
      console.error("Error updating surgery:", error);
      res.status(400).json({ message: error.message || "Failed to update surgery" });
    }
  });

  app.delete("/api/surgeries/:id", isAuthenticated, requirePermission("surgeries", "delete"), async (req, res) => {
    try {
      await storage.deleteSurgery(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting surgery:", error);
      if (error.message === "Surgery not found") {
        res.status(404).json({ message: "Surgery not found" });
      } else {
        res.status(500).json({ message: "Failed to delete surgery" });
      }
    }
  });

  // ============================================
  // Pharmacy routes
  // ============================================
  app.get("/api/medications", isAuthenticated, requirePermission("medications", "read"), async (req, res) => {
    try {
      const medications = await storage.getAllMedications();
      res.json(medications);
    } catch (error) {
      console.error("Error fetching medications:", error);
      res.status(500).json({ message: "Failed to fetch medications" });
    }
  });

  app.get("/api/medications/low-stock", isAuthenticated, requirePermission("medications", "read"), async (req, res) => {
    try {
      const medications = await storage.getLowStockMedications();
      res.json(medications);
    } catch (error) {
      console.error("Error fetching low stock medications:", error);
      res.status(500).json({ message: "Failed to fetch low stock medications" });
    }
  });

  app.get("/api/medications/expiring", isAuthenticated, requirePermission("medications", "read"), async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const medications = await storage.getExpiringMedications(days);
      res.json(medications);
    } catch (error) {
      console.error("Error fetching expiring medications:", error);
      res.status(500).json({ message: "Failed to fetch expiring medications" });
    }
  });

  app.post("/api/medications", isAuthenticated, requirePermission("medications", "create"), async (req, res) => {
    try {
      const validatedData = insertMedicationSchema.parse(req.body);
      const medication = await storage.createMedication(validatedData);
      res.status(201).json(medication);
    } catch (error: any) {
      console.error("Error creating medication:", error);
      res.status(400).json({ message: error.message || "Failed to create medication" });
    }
  });

  app.put("/api/medications/:id", isAuthenticated, requirePermission("medications", "update"), async (req, res) => {
    try {
      const validatedData = insertMedicationSchema.partial().parse(req.body);
      const medication = await storage.updateMedication(req.params.id, validatedData);
      res.json(medication);
    } catch (error: any) {
      console.error("Error updating medication:", error);
      res.status(400).json({ message: error.message || "Failed to update medication" });
    }
  });

  app.delete("/api/medications/:id", isAuthenticated, requirePermission("medications", "delete"), async (req, res) => {
    try {
      await storage.deleteMedication(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting medication:", error);
      if (error.message === "Medication not found") {
        res.status(404).json({ message: "Medication not found" });
      } else {
        res.status(500).json({ message: "Failed to delete medication" });
      }
    }
  });

  app.get("/api/prescriptions", isAuthenticated, requirePermission("prescriptions", "read"), async (req, res) => {
    try {
      const prescriptions = await storage.getAllPrescriptions();
      res.json(prescriptions);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.get("/api/prescriptions/patient/:patientId", isAuthenticated, requirePermission("prescriptions", "read"), async (req, res) => {
    try {
      const prescriptions = await storage.getPrescriptionsByPatient(req.params.patientId);
      res.json(prescriptions);
    } catch (error) {
      console.error("Error fetching patient prescriptions:", error);
      res.status(500).json({ message: "Failed to fetch patient prescriptions" });
    }
  });

  app.post("/api/prescriptions", isAuthenticated, requirePermission("prescriptions", "create"), async (req, res) => {
    try {
      const validatedData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(validatedData);
      res.status(201).json(prescription);
    } catch (error: any) {
      console.error("Error creating prescription:", error);
      res.status(400).json({ message: error.message || "Failed to create prescription" });
    }
  });

  app.put("/api/prescriptions/:id", isAuthenticated, requirePermission("prescriptions", "update"), async (req, res) => {
    try {
      const validatedData = insertPrescriptionSchema.partial().parse(req.body);
      const prescription = await storage.updatePrescription(req.params.id, validatedData);
      res.json(prescription);
    } catch (error: any) {
      console.error("Error updating prescription:", error);
      res.status(400).json({ message: error.message || "Failed to update prescription" });
    }
  });

  app.delete("/api/prescriptions/:id", isAuthenticated, requirePermission("prescriptions", "delete"), async (req, res) => {
    try {
      await storage.deletePrescription(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting prescription:", error);
      if (error.message === "Prescription not found") {
        res.status(404).json({ message: "Prescription not found" });
      } else {
        res.status(500).json({ message: "Failed to delete prescription" });
      }
    }
  });

  // ============================================
  // Laboratory routes
  // ============================================
  app.get("/api/lab-tests", isAuthenticated, requirePermission("labTests", "read"), async (req, res) => {
    try {
      const labTests = await storage.getAllLabTests();
      res.json(labTests);
    } catch (error) {
      console.error("Error fetching lab tests:", error);
      res.status(500).json({ message: "Failed to fetch lab tests" });
    }
  });

  app.post("/api/lab-tests", isAuthenticated, requirePermission("labTests", "create"), async (req, res) => {
    try {
      const validatedData = insertLabTestSchema.parse(req.body);
      const labTest = await storage.createLabTest(validatedData);
      res.status(201).json(labTest);
    } catch (error: any) {
      console.error("Error creating lab test:", error);
      res.status(400).json({ message: error.message || "Failed to create lab test" });
    }
  });

  app.put("/api/lab-tests/:id", isAuthenticated, requirePermission("labTests", "update"), async (req, res) => {
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
  app.get("/api/radiology-tests", isAuthenticated, requirePermission("radiologyTests", "read"), async (req, res) => {
    try {
      const radiologyTests = await storage.getAllRadiologyTests();
      res.json(radiologyTests);
    } catch (error) {
      console.error("Error fetching radiology tests:", error);
      res.status(500).json({ message: "Failed to fetch radiology tests" });
    }
  });

  app.post("/api/radiology-tests", isAuthenticated, requirePermission("radiologyTests", "create"), async (req, res) => {
    try {
      const validatedData = insertRadiologyTestSchema.parse(req.body);
      const radiologyTest = await storage.createRadiologyTest(validatedData);
      res.status(201).json(radiologyTest);
    } catch (error: any) {
      console.error("Error creating radiology test:", error);
      res.status(400).json({ message: error.message || "Failed to create radiology test" });
    }
  });

  app.put("/api/radiology-tests/:id", isAuthenticated, requirePermission("radiologyTests", "update"), async (req, res) => {
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
  app.get("/api/staff", isAuthenticated, requirePermission("staff", "read"), async (req, res) => {
    try {
      const staff = await storage.getAllStaff();
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", isAuthenticated, requirePermission("staff", "create"), async (req, res) => {
    try {
      const validatedData = insertStaffSchema.parse(req.body);
      const staffMember = await storage.createStaff(validatedData);
      res.status(201).json(staffMember);
    } catch (error: any) {
      console.error("Error creating staff:", error);
      res.status(400).json({ message: error.message || "Failed to create staff" });
    }
  });

  app.put("/api/staff/:id", isAuthenticated, requirePermission("staff", "update"), async (req, res) => {
    try {
      const validatedData = insertStaffSchema.partial().parse(req.body);
      const staffMember = await storage.updateStaff(req.params.id, validatedData);
      res.json(staffMember);
    } catch (error: any) {
      console.error("Error updating staff:", error);
      res.status(400).json({ message: error.message || "Failed to update staff" });
    }
  });

  app.get("/api/leaves", isAuthenticated, requirePermission("staff", "read"), async (req, res) => {
    try {
      const leaves = await storage.getAllLeaves();
      res.json(leaves);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      res.status(500).json({ message: "Failed to fetch leaves" });
    }
  });

  app.post("/api/leaves", isAuthenticated, requirePermission("staff", "create"), async (req, res) => {
    try {
      const validatedData = insertLeaveSchema.parse(req.body);
      const leave = await storage.createLeave(validatedData);
      res.status(201).json(leave);
    } catch (error: any) {
      console.error("Error creating leave:", error);
      res.status(400).json({ message: error.message || "Failed to create leave" });
    }
  });

  app.put("/api/leaves/:id", isAuthenticated, requirePermission("staff", "update"), async (req, res) => {
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
  app.get("/api/payroll", isAuthenticated, requirePermission("payroll", "read"), async (req, res) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      if (month && year) {
        const payroll = await storage.getPayrollByMonth(month, year);
        res.json(payroll);
      } else {
        const allPayroll = await storage.getAllPayroll();
        res.json(allPayroll);
      }
    } catch (error) {
      console.error("Error fetching payroll:", error);
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  app.post("/api/payroll", isAuthenticated, requirePermission("payroll", "create"), async (req, res) => {
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
  app.get("/api/invoices", isAuthenticated, requirePermission("invoices", "read"), async (req, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/overdue", isAuthenticated, requirePermission("invoices", "read"), async (req, res) => {
    try {
      const invoices = await storage.getOverdueInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching overdue invoices:", error);
      res.status(500).json({ message: "Failed to fetch overdue invoices" });
    }
  });

  app.post("/api/invoices", isAuthenticated, requirePermission("invoices", "create"), async (req: any, res) => {
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

  app.put("/api/invoices/:id", isAuthenticated, requirePermission("invoices", "update"), async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, validatedData);
      res.json(invoice);
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      res.status(400).json({ message: error.message || "Failed to update invoice" });
    }
  });

  // ============================================
  // Audit Logs routes (Admin only)
  // ============================================
  app.get("/api/audit-logs", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const auditLogs = await storage.getAllAuditLogs();
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/audit-logs/user/:userId", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const auditLogs = await storage.getAuditLogsByUser(req.params.userId);
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching user audit logs:", error);
      res.status(500).json({ message: "Failed to fetch user audit logs" });
    }
  });

  app.get("/api/audit-logs/table/:tableName", isAuthenticated, requireRole("admin"), async (req, res) => {
    try {
      const auditLogs = await storage.getAuditLogsByTable(req.params.tableName);
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching table audit logs:", error);
      res.status(500).json({ message: "Failed to fetch table audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
