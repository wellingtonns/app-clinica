import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useClinicData } from "./hooks/useClinicData";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FinancePage } from "./pages/FinancePage";
import { PatientDetailsPage } from "./pages/PatientDetailsPage";
import { PatientsPage } from "./pages/PatientsPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProfessionalsPage } from "./pages/ProfessionalsPage";
import { SchedulePage } from "./pages/SchedulePage";

function LoadingScreen() {
  return (
    <main className="auth-page">
      <div className="auth-loading">Carregando...</div>
    </main>
  );
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const { user, isCheckingSession } = useAuth();

  if (isCheckingSession) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function ProtectedApp() {
  const { user, isCheckingSession, logout } = useAuth();

  if (isCheckingSession) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    void logout().then(() => {
      window.location.href = "/login";
    });
  };

  return <AuthenticatedRoutes onLogout={handleLogout} />;
}

function AuthenticatedRoutes({ onLogout }: { onLogout: () => void }) {
  const clinicData = useClinicData();

  return (
    <Layout onLogout={onLogout}>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              patients={clinicData.patients}
              professionals={clinicData.professionals}
              appointments={clinicData.appointments}
              anamneses={clinicData.anamneses}
              financialEntries={clinicData.financialEntries}
              updateAppointment={clinicData.updateAppointment}
            />
          }
        />
        <Route
          path="/pacientes"
          element={
            <PatientsPage
              patients={clinicData.patients}
              anamneses={clinicData.anamneses}
              contracts={clinicData.contracts}
              procedures={clinicData.procedures}
              medicalRecords={clinicData.medicalRecords}
              professionals={clinicData.professionals}
              createPatient={clinicData.createPatient}
              updatePatient={clinicData.updatePatient}
              deletePatient={clinicData.deletePatient}
              createAnamnesis={clinicData.createAnamnesis}
              updateAnamnesis={clinicData.updateAnamnesis}
              deleteAnamnesis={clinicData.deleteAnamnesis}
              createContract={clinicData.createContract}
              updateContract={clinicData.updateContract}
              deleteContract={clinicData.deleteContract}
              createProcedure={clinicData.createProcedure}
              updateProcedure={clinicData.updateProcedure}
              deleteProcedure={clinicData.deleteProcedure}
            />
          }
        />
        <Route
          path="/pacientes/:patientId"
          element={
            <PatientDetailsPage
              patients={clinicData.patients}
              anamneses={clinicData.anamneses}
              contracts={clinicData.contracts}
              procedures={clinicData.procedures}
              patientFiles={clinicData.patientFiles}
              professionals={clinicData.professionals}
              medicalRecords={clinicData.medicalRecords}
              isLoadingHistory={clinicData.isLoading}
              historyError={clinicData.loadError}
              createAnamnesis={clinicData.createAnamnesis}
              updateAnamnesis={clinicData.updateAnamnesis}
              deleteAnamnesis={clinicData.deleteAnamnesis}
              createContract={clinicData.createContract}
              updateContract={clinicData.updateContract}
              deleteContract={clinicData.deleteContract}
              createProcedure={clinicData.createProcedure}
              updateProcedure={clinicData.updateProcedure}
              deleteProcedure={clinicData.deleteProcedure}
              createPatientFile={clinicData.createPatientFile}
              updatePatientFile={clinicData.updatePatientFile}
              deletePatientFile={clinicData.deletePatientFile}
            />
          }
        />
        <Route
          path="/agenda"
          element={
            <SchedulePage
              patients={clinicData.patients}
              professionals={clinicData.professionals}
              appointments={clinicData.appointments}
              medicalRecords={clinicData.medicalRecords}
              createAppointment={clinicData.createAppointment}
              updateAppointment={clinicData.updateAppointment}
              deleteAppointment={clinicData.deleteAppointment}
              createMedicalRecord={clinicData.createMedicalRecord}
            />
          }
        />
        <Route
          path="/financeiro"
          element={
            <FinancePage
              patients={clinicData.patients}
              appointments={clinicData.appointments}
              professionals={clinicData.professionals}
              products={clinicData.products}
              financialEntries={clinicData.financialEntries}
              updateFinancialStatus={clinicData.updateFinancialStatus}
              updateFinancialEntry={clinicData.updateFinancialEntry}
            />
          }
        />
        <Route
          path="/produtos"
          element={
            <ProductsPage
              products={clinicData.products}
              createProduct={clinicData.createProduct}
              updateProduct={clinicData.updateProduct}
              deleteProduct={clinicData.deleteProduct}
            />
          }
        />
        <Route
          path="/profissionais"
          element={
            <ProfessionalsPage
              professionals={clinicData.professionals}
              createProfessional={clinicData.createProfessional}
              updateProfessional={clinicData.updateProfessional}
              deleteProfessional={clinicData.deleteProfessional}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthPage mode="login" />
              </PublicRoute>
            }
          />
          <Route
            path="/cadastro"
            element={
              <PublicRoute>
                <AuthPage mode="register" />
              </PublicRoute>
            }
          />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
