import { useMemo, useState } from "react";
import { CrudPanel } from "../components/CrudPanel";
import { PageTopbar } from "../components/PageTopbar";
import { PatientModal } from "../components/PatientModal";
import {
  AnamnesisRecord,
  ContractRecord,
  MedicalRecord,
  Patient,
  ProcedureRecord,
  Professional
} from "../types";
import { formatDateTime } from "../utils/format";

type Props = {
  patients: Patient[];
  anamneses: AnamnesisRecord[];
  contracts: ContractRecord[];
  procedures: ProcedureRecord[];
  medicalRecords: MedicalRecord[];
  professionals: Professional[];
  createPatient: (input: Omit<Patient, "id" | "createdAt" | "updatedAt">) => string;
  updatePatient: (id: string, input: Omit<Patient, "id" | "createdAt" | "updatedAt">) => void;
  deletePatient: (id: string) => void;
  createAnamnesis: (input: Omit<AnamnesisRecord, "id" | "version" | "createdAt" | "updatedAt">) => void;
  updateAnamnesis: (id: string, input: Omit<AnamnesisRecord, "id" | "version" | "createdAt" | "updatedAt">) => void;
  deleteAnamnesis: (id: string) => void;
  createContract: (input: Omit<ContractRecord, "id" | "version" | "uploadedAt">) => void;
  updateContract: (id: string, input: Omit<ContractRecord, "id" | "version" | "uploadedAt">) => void;
  deleteContract: (id: string) => void;
  createProcedure: (input: Omit<ProcedureRecord, "id">) => void;
  updateProcedure: (id: string, input: Omit<ProcedureRecord, "id">) => void;
  deleteProcedure: (id: string) => void;
};

type SortKey = "name" | "createdAt" | "lastAttendance";

const PAGE_SIZE = 6;

export function PatientsPage({
  patients,
  anamneses,
  contracts,
  procedures,
  medicalRecords,
  professionals,
  createPatient,
  updatePatient,
  deletePatient,
  createAnamnesis,
  updateAnamnesis,
  deleteAnamnesis,
  createContract,
  updateContract,
  deleteContract,
  createProcedure,
  updateProcedure,
  deleteProcedure
}: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | Patient["status"]>("Todos");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const attendanceDatesByPatient = [...procedures, ...medicalRecords].reduce<Record<string, string>>((accumulator, record) => {
    const previous = accumulator[record.patientId];
    if (!previous || record.date > previous) accumulator[record.patientId] = record.date;
    return accumulator;
  }, {});

  const filteredPatients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = patients
      .filter((patient) => {
        const matchesQuery =
          !normalized ||
          patient.fullName.toLowerCase().includes(normalized) ||
          patient.phone.toLowerCase().includes(normalized) ||
          patient.cpf.toLowerCase().includes(normalized);
        const matchesStatus = statusFilter === "Todos" || patient.status === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((left, right) => {
        if (sortBy === "name") return left.fullName.localeCompare(right.fullName);
        if (sortBy === "createdAt") return right.createdAt.localeCompare(left.createdAt);
        return (attendanceDatesByPatient[right.id] || "").localeCompare(attendanceDatesByPatient[left.id] || "");
      });

    return result;
  }, [patients, attendanceDatesByPatient, query, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? null;

  const closeModal = () => {
    setSelectedPatientId(null);
    setModalMode("create");
  };

  return (
    <>
      <PageTopbar
        title="Pacientes"
        subtitle="Cadastro e gerenciamento de pacientes."
        action={
          <button
            className="primary-button prominent-button"
            type="button"
            onClick={() => {
              setModalMode("create");
              setSelectedPatientId("new");
            }}
          >
            Novo paciente
          </button>
        }
      />

      <section className="section">
        <CrudPanel title="Pacientes" subtitle="Base cadastrada da clínica">
          <div className="list-toolbar">
            <div className="list-toolbar-group">
              <label className="toolbar-field">
                <span>Buscar</span>
                <input
                  placeholder="Nome, telefone ou CPF"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
              <label className="toolbar-field">
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as "Todos" | Patient["status"]);
                    setPage(1);
                  }}
                >
                  <option value="Todos">Todos</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </label>
              <label className="toolbar-field">
                <span>Ordenar por</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)}>
                  <option value="name">Nome</option>
                  <option value="createdAt">Data de cadastro</option>
                  <option value="lastAttendance">Último atendimento</option>
                </select>
              </label>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th>Última atualização</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <strong>{patient.fullName}</strong>
                      <div className="table-subtitle">{patient.cpf || "CPF opcional não informado"}</div>
                    </td>
                    <td>{patient.phone}</td>
                    <td>{patient.status}</td>
                    <td>{formatDateTime(patient.updatedAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="inline-button"
                          type="button"
                          onClick={() => {
                            setModalMode("edit");
                            setSelectedPatientId(patient.id);
                          }}
                        >
                          Visualizar/Editar
                        </button>
                        <button
                          className="inline-button"
                          type="button"
                          onClick={() =>
                            updatePatient(patient.id, {
                              fullName: patient.fullName,
                              birthDate: patient.birthDate,
                              cpf: patient.cpf,
                              phone: patient.phone,
                              email: patient.email,
                              address: patient.address,
                              generalObservations: patient.generalObservations,
                              allergySummary: patient.allergySummary,
                              restrictionSummary: patient.restrictionSummary,
                              status: patient.status === "Ativo" ? "Inativo" : "Ativo"
                            })
                          }
                        >
                          {patient.status === "Ativo" ? "Inativar" : "Ativar"}
                        </button>
                        <button
                          className="inline-button danger"
                          type="button"
                          onClick={() => {
                            if (!window.confirm(`Excluir o paciente ${patient.fullName}?`)) return;
                            deletePatient(patient.id);
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <span>
              Exibindo {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredPatients.length)} de {filteredPatients.length}
            </span>
            <div className="row-actions">
              <button className="ghost-button" type="button" onClick={() => setPage(Math.max(1, currentPage - 1))}>
                Anterior
              </button>
              <span className="page-indicator">
                Página {currentPage} de {totalPages}
              </span>
              <button className="ghost-button" type="button" onClick={() => setPage(Math.min(totalPages, currentPage + 1))}>
                Próxima
              </button>
            </div>
          </div>
        </CrudPanel>
      </section>

      <PatientModal
        isOpen={selectedPatientId !== null}
        mode={modalMode}
        patient={selectedPatientId === "new" ? null : selectedPatient}
        professionals={professionals}
        anamneses={anamneses}
        contracts={contracts}
        procedures={procedures}
        medicalRecords={medicalRecords}
        onClose={closeModal}
        createPatient={createPatient}
        updatePatient={updatePatient}
        createAnamnesis={createAnamnesis}
        updateAnamnesis={updateAnamnesis}
        deleteAnamnesis={deleteAnamnesis}
        createContract={createContract}
        updateContract={updateContract}
        deleteContract={deleteContract}
        createProcedure={createProcedure}
        updateProcedure={updateProcedure}
        deleteProcedure={deleteProcedure}
      />
    </>
  );
}
