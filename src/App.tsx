import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useClinicData } from "./hooks/useClinicData";
import { DashboardPage } from "./pages/DashboardPage";
import { FinancePage } from "./pages/FinancePage";
import { PatientDetailsPage } from "./pages/PatientDetailsPage";
import { PatientsPage } from "./pages/PatientsPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProfessionalsPage } from "./pages/ProfessionalsPage";
import { SchedulePage } from "./pages/SchedulePage";

function App() {
  const clinicData = useClinicData();

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                patients={clinicData.patients}
                professionals={clinicData.professionals}
                appointments={clinicData.appointments}
                financialEntries={clinicData.financialEntries}
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
                createAppointment={clinicData.createAppointment}
                updateAppointment={clinicData.updateAppointment}
                deleteAppointment={clinicData.deleteAppointment}
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
    </BrowserRouter>
  );
}

export default App;
