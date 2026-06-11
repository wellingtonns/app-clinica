import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { CrudPanel } from "../components/CrudPanel";
import { PageTopbar } from "../components/PageTopbar";
import {
  AnamnesisRecord,
  ContractRecord,
  FileCategory,
  Patient,
  PatientFileRecord,
  PhotoCategory,
  ProcedurePhoto,
  ProcedureRecord,
  Professional,
  StoredAsset
} from "../types";
import { filesToStoredAssets, isImage, isPdf, triggerDownload } from "../utils/files";
import { formatDate, formatDateTime } from "../utils/format";

type Props = {
  patients: Patient[];
  anamneses: AnamnesisRecord[];
  contracts: ContractRecord[];
  procedures: ProcedureRecord[];
  patientFiles: PatientFileRecord[];
  professionals: Professional[];
  createAnamnesis: (input: Omit<AnamnesisRecord, "id" | "version" | "createdAt" | "updatedAt">) => void;
  updateAnamnesis: (id: string, input: Omit<AnamnesisRecord, "id" | "version" | "createdAt" | "updatedAt">) => void;
  deleteAnamnesis: (id: string) => void;
  createContract: (input: Omit<ContractRecord, "id" | "version" | "uploadedAt">) => void;
  updateContract: (id: string, input: Omit<ContractRecord, "id" | "version" | "uploadedAt">) => void;
  deleteContract: (id: string) => void;
  createProcedure: (input: Omit<ProcedureRecord, "id">) => void;
  updateProcedure: (id: string, input: Omit<ProcedureRecord, "id">) => void;
  deleteProcedure: (id: string) => void;
  createPatientFile: (input: Omit<PatientFileRecord, "id">) => void;
  updatePatientFile: (id: string, input: Omit<PatientFileRecord, "id">) => void;
  deletePatientFile: (id: string) => void;
};

type TabKey = "resumo" | "anamnese" | "contrato" | "procedimentos" | "fotos" | "arquivos";

type AnamnesisForm = Omit<AnamnesisRecord, "id" | "patientId" | "version" | "createdAt" | "updatedAt">;
type ContractForm = {
  contractType: string;
  signedAt: string;
  observations: string;
  file: StoredAsset | null;
};
type ProcedureForm = {
  name: string;
  procedureType: string;
  date: string;
  professionalId: string;
  observations: string;
  photos: ProcedurePhoto[];
};
type FileForm = {
  category: FileCategory;
  description: string;
  assets: StoredAsset[];
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "resumo", label: "Resumo" },
  { key: "anamnese", label: "Anamnese" },
  { key: "contrato", label: "Contrato" },
  { key: "procedimentos", label: "Procedimentos" },
  { key: "fotos", label: "Fotos / Evolução" },
  { key: "arquivos", label: "Arquivos" }
];

const photoCategories: PhotoCategory[] = ["Antes", "Depois", "Durante", "Evolução"];
const fileCategories: FileCategory[] = ["Geral", "Anamnese", "Exame", "Documento"];

function emptyAnamnesisForm(): AnamnesisForm {
  return {
    updatedBy: "Dra. Julia Azevedo",
    healthHistory: "",
    priorDiseases: "",
    surgeries: "",
    treatments: "",
    allergies: "",
    medications: "",
    habits: "",
    mainComplaint: "",
    professionalObservations: "",
    checkboxes: {
      hasPriorDiseases: false,
      hasSurgeries: false,
      isUnderTreatment: false,
      hasAllergies: false,
      usesMedication: false,
      smokes: false,
      drinksAlcohol: false
    },
    attachments: []
  };
}

const emptyContractForm: ContractForm = {
  contractType: "",
  signedAt: "",
  observations: "",
  file: null
};

function emptyProcedureForm(professionalId = ""): ProcedureForm {
  return {
    name: "",
    procedureType: "",
    date: "",
    professionalId,
    observations: "",
    photos: []
  };
}

const emptyFileForm: FileForm = {
  category: "Geral",
  description: "",
  assets: []
};

function AssetPreview({ asset }: { asset: StoredAsset | null }) {
  if (!asset) {
    return <div className="empty-state">Selecione um arquivo para visualizar.</div>;
  }

  if (isImage(asset.mimeType)) {
    return <img className="preview-image" src={asset.dataUrl} alt={asset.fileName} />;
  }

  if (isPdf(asset.mimeType)) {
    return <iframe className="preview-frame" src={asset.dataUrl} title={asset.fileName} />;
  }

  return (
    <div className="empty-state">
      <p>Pré-visualização não disponível para este formato.</p>
      <button className="inline-button" type="button" onClick={() => triggerDownload(asset)}>
        Baixar arquivo
      </button>
    </div>
  );
}

export function PatientDetailsPage({
  patients,
  anamneses,
  contracts,
  procedures,
  patientFiles,
  professionals,
  createAnamnesis,
  updateAnamnesis,
  deleteAnamnesis,
  createContract,
  updateContract,
  deleteContract,
  createProcedure,
  updateProcedure,
  deleteProcedure,
  createPatientFile,
  updatePatientFile,
  deletePatientFile
}: Props) {
  const { patientId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabKey) || "resumo";

  const patient = patients.find((item) => item.id === patientId);

  const patientAnamneses = anamneses
    .filter((item) => item.patientId === patientId)
    .sort((left, right) => right.version - left.version);
  const patientContracts = contracts
    .filter((item) => item.patientId === patientId)
    .sort((left, right) => right.version - left.version);
  const patientProcedures = procedures
    .filter((item) => item.patientId === patientId)
    .sort((left, right) => right.date.localeCompare(left.date));
  const patientGeneralFiles = patientFiles
    .filter((item) => item.patientId === patientId)
    .sort((left, right) => right.file.uploadedAt.localeCompare(left.file.uploadedAt));

  const allProcedurePhotos = patientProcedures.flatMap((procedure) =>
    procedure.photos.map((photo) => ({
      ...photo,
      procedureId: procedure.id,
      procedureName: procedure.name,
      procedureDate: procedure.date
    }))
  );

  const professionalNameById = useMemo(
    () => new Map(professionals.map((item) => [item.id, item.name])),
    [professionals]
  );

  const [anamnesisEditingId, setAnamnesisEditingId] = useState<string | null>(null);
  const [anamnesisForm, setAnamnesisForm] = useState<AnamnesisForm>(emptyAnamnesisForm);
  const [contractEditingId, setContractEditingId] = useState<string | null>(null);
  const [contractForm, setContractForm] = useState<ContractForm>(emptyContractForm);
  const [selectedContractAsset, setSelectedContractAsset] = useState<StoredAsset | null>(patientContracts[0]?.file ?? null);
  const [procedureEditingId, setProcedureEditingId] = useState<string | null>(null);
  const [procedureForm, setProcedureForm] = useState<ProcedureForm>(emptyProcedureForm(professionals[0]?.id ?? ""));
  const [photoUploadMeta, setPhotoUploadMeta] = useState({
    category: "Antes" as PhotoCategory,
    description: "",
    capturedAt: new Date().toISOString().slice(0, 10),
    area: "Geral" as const
  });
  const [fileEditingId, setFileEditingId] = useState<string | null>(null);
  const [fileForm, setFileForm] = useState<FileForm>(emptyFileForm);
  const [photoFilter, setPhotoFilter] = useState<PhotoCategory | "Todas">("Todas");
  const [beforePhotoId, setBeforePhotoId] = useState("");
  const [afterPhotoId, setAfterPhotoId] = useState("");

  if (!patient) {
    return <Navigate to="/pacientes" replace />;
  }

  const latestAnamnesis = patientAnamneses[0] ?? null;
  const latestContract = patientContracts[0] ?? null;
  const filteredPhotos =
    photoFilter === "Todas"
      ? allProcedurePhotos
      : allProcedurePhotos.filter((photo) => photo.category === photoFilter);
  const beforePhotoOptions = allProcedurePhotos.filter((photo) => photo.category === "Antes");
  const afterPhotoOptions = allProcedurePhotos.filter((photo) => photo.category === "Depois");
  const beforePhoto = beforePhotoOptions.find((photo) => photo.id === beforePhotoId) ?? null;
  const afterPhoto = afterPhotoOptions.find((photo) => photo.id === afterPhotoId) ?? null;

  const setTab = (tab: TabKey) => setSearchParams({ tab });

  const resetAnamnesisForm = () => {
    setAnamnesisEditingId(null);
    setAnamnesisForm(emptyAnamnesisForm());
  };

  const resetContractForm = () => {
    setContractEditingId(null);
    setContractForm(emptyContractForm);
  };

  const resetProcedureForm = () => {
    setProcedureEditingId(null);
    setProcedureForm(emptyProcedureForm(professionals[0]?.id ?? ""));
    setPhotoUploadMeta({
      category: "Antes",
      description: "",
      capturedAt: new Date().toISOString().slice(0, 10),
      area: "Geral"
    });
  };

  const resetFileForm = () => {
    setFileEditingId(null);
    setFileForm(emptyFileForm);
  };

  const handleAssetUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    onLoaded: (assets: StoredAsset[]) => void
  ) => {
    const files = event.target.files;
    if (!files?.length) return;
    const assets = await filesToStoredAssets(files);
    onLoaded(assets);
    event.target.value = "";
  };

  const submitAnamnesis = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = { ...anamnesisForm, patientId };
    if (anamnesisEditingId) updateAnamnesis(anamnesisEditingId, payload);
    else createAnamnesis(payload);
    resetAnamnesisForm();
  };

  const submitContract = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contractForm.contractType.trim() || !contractForm.file) return;
    const payload = {
      patientId,
      contractType: contractForm.contractType,
      signedAt: contractForm.signedAt,
      observations: contractForm.observations,
      file: contractForm.file
    };
    if (contractEditingId) updateContract(contractEditingId, payload);
    else createContract(payload);
    setSelectedContractAsset(contractForm.file);
    resetContractForm();
  };

  const submitProcedure = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!procedureForm.name.trim() || !procedureForm.date.trim()) return;
    const payload = { ...procedureForm, patientId };
    if (procedureEditingId) updateProcedure(procedureEditingId, payload);
    else createProcedure(payload);
    resetProcedureForm();
  };

  const submitPatientFiles = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileForm.assets.length) return;
    if (fileEditingId && fileForm.assets[0]) {
      updatePatientFile(fileEditingId, {
        patientId,
        category: fileForm.category,
        description: fileForm.description,
        file: fileForm.assets[0]
      });
    } else {
      fileForm.assets.forEach((asset) => {
        createPatientFile({
          patientId,
          category: fileForm.category,
          description: fileForm.description,
          file: asset
        });
      });
    }
    resetFileForm();
  };

  return (
    <>
      <PageTopbar
        title={patient.fullName}
        subtitle="Central do paciente."
        action={
          <Link className="inline-button link-button" to="/pacientes">
            Voltar para pacientes
          </Link>
        }
      />

      <section className="section">
        <div className="detail-topbar">
          <div className="patient-quick-info">
            <span>{patient.phone}</span>
            <span>{patient.email || "Sem e-mail"}</span>
            <span>{patient.cpf || "CPF não informado"}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="tabs-bar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab-button ${activeTab === tab.key ? "tab-button-active" : ""}`}
              onClick={() => setTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "resumo" ? (
        <section className="section split-grid">
          <CrudPanel title="Resumo do paciente" subtitle="Dados base e atalhos clinicos">
            <div className="summary-grid">
              <div className="summary-card">
                <strong>Data de nascimento</strong>
                <span>{formatDate(patient.birthDate)}</span>
              </div>
              <div className="summary-card">
                <strong>Status</strong>
                <span>{patient.status}</span>
              </div>
              <div className="summary-card">
                <strong>Alergias</strong>
                <span>{patient.allergySummary || "Não informado"}</span>
              </div>
              <div className="summary-card">
                <strong>Restrições</strong>
                <span>{patient.restrictionSummary || "Não informado"}</span>
              </div>
            </div>
            <div className="stack">
              <div className="list-card">
                <strong>Endereço</strong>
                <span>{patient.address || "Não informado"}</span>
              </div>
              <div className="list-card">
                <strong>Observações gerais</strong>
                <span>{patient.generalObservations || "Sem observações."}</span>
              </div>
            </div>
          </CrudPanel>

          <CrudPanel title="Histórico relacionado" subtitle="Visão rápida da central">
            <div className="stack">
              <div className="list-card">
                <strong>Anamneses registradas</strong>
                <span>{patientAnamneses.length} versão(ões)</span>
              </div>
              <div className="list-card">
                <strong>Última atualização de anamnese</strong>
                <span>{latestAnamnesis ? formatDateTime(latestAnamnesis.updatedAt) : "Sem histórico"}</span>
              </div>
              <div className="list-card">
                <strong>Contrato mais recente</strong>
                <span>{latestContract ? `${latestContract.contractType} (${formatDate(latestContract.signedAt)})` : "Sem contrato"}</span>
              </div>
              <div className="list-card">
                <strong>Procedimentos registrados</strong>
                <span>{patientProcedures.length} item(ns)</span>
              </div>
              <div className="list-card">
                <strong>Arquivos gerais</strong>
                <span>{patientGeneralFiles.length} arquivo(s)</span>
              </div>
            </div>
          </CrudPanel>
        </section>
      ) : null}

      {activeTab === "anamnese" ? (
        <section className="section page-grid">
          <CrudPanel title={anamnesisEditingId ? "Editar anamnese" : "Nova anamnese"} subtitle="Ficha completa vinculada ao paciente">
            <form className="crud-form" onSubmit={submitAnamnesis}>
              <div className="form-grid form-grid-2">
                <label>
                  <span>Atualizado por</span>
                  <input
                    value={anamnesisForm.updatedBy}
                    onChange={(event) => setAnamnesisForm({ ...anamnesisForm, updatedBy: event.target.value })}
                  />
                </label>
                <label>
                  <span>Queixa principal / objetivo</span>
                  <input
                    value={anamnesisForm.mainComplaint}
                    onChange={(event) => setAnamnesisForm({ ...anamnesisForm, mainComplaint: event.target.value })}
                  />
                </label>
              </div>
              <label>
                <span>Histórico de saúde</span>
                <textarea
                  rows={3}
                  value={anamnesisForm.healthHistory}
                  onChange={(event) => setAnamnesisForm({ ...anamnesisForm, healthHistory: event.target.value })}
                />
              </label>
              <div className="form-grid form-grid-2">
                <label>
                  <span>Doenças prévias</span>
                  <textarea
                    rows={3}
                    value={anamnesisForm.priorDiseases}
                    onChange={(event) => setAnamnesisForm({ ...anamnesisForm, priorDiseases: event.target.value })}
                  />
                </label>
                <label>
                  <span>Cirurgias</span>
                  <textarea
                    rows={3}
                    value={anamnesisForm.surgeries}
                    onChange={(event) => setAnamnesisForm({ ...anamnesisForm, surgeries: event.target.value })}
                  />
                </label>
                <label>
                  <span>Tratamentos atuais</span>
                  <textarea
                    rows={3}
                    value={anamnesisForm.treatments}
                    onChange={(event) => setAnamnesisForm({ ...anamnesisForm, treatments: event.target.value })}
                  />
                </label>
                <label>
                  <span>Medicamentos em uso</span>
                  <textarea
                    rows={3}
                    value={anamnesisForm.medications}
                    onChange={(event) => setAnamnesisForm({ ...anamnesisForm, medications: event.target.value })}
                  />
                </label>
                <label>
                  <span>Alergias</span>
                  <textarea
                    rows={3}
                    value={anamnesisForm.allergies}
                    onChange={(event) => setAnamnesisForm({ ...anamnesisForm, allergies: event.target.value })}
                  />
                </label>
                <label>
                  <span>Hábitos</span>
                  <textarea
                    rows={3}
                    value={anamnesisForm.habits}
                    onChange={(event) => setAnamnesisForm({ ...anamnesisForm, habits: event.target.value })}
                  />
                </label>
              </div>
              <label>
                <span>Observações do profissional</span>
                <textarea
                  rows={4}
                  value={anamnesisForm.professionalObservations}
                  onChange={(event) =>
                    setAnamnesisForm({ ...anamnesisForm, professionalObservations: event.target.value })
                  }
                />
              </label>

              <div className="checkbox-grid">
                {[
                  ["hasPriorDiseases", "Doenças prévias"],
                  ["hasSurgeries", "Cirurgias"],
                  ["isUnderTreatment", "Em tratamento"],
                  ["hasAllergies", "Possui alergias"],
                  ["usesMedication", "Usa medicação contínua"],
                  ["smokes", "Tabagismo"],
                  ["drinksAlcohol", "Consumo de álcool"]
                ].map(([key, label]) => (
                  <label key={key} className="check-card">
                    <input
                      type="checkbox"
                      checked={anamnesisForm.checkboxes[key as keyof AnamnesisForm["checkboxes"]]}
                      onChange={(event) =>
                        setAnamnesisForm({
                          ...anamnesisForm,
                          checkboxes: {
                            ...anamnesisForm.checkboxes,
                            [key]: event.target.checked
                          }
                        })
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <label>
                <span>Anexos da anamnese</span>
                <input
                  type="file"
                  multiple
                  onChange={(event) =>
                    handleAssetUpload(event, (assets) =>
                      setAnamnesisForm({
                        ...anamnesisForm,
                        attachments: [...anamnesisForm.attachments, ...assets]
                      })
                    )
                  }
                />
              </label>

              {anamnesisForm.attachments.length ? (
                <div className="asset-list">
                  {anamnesisForm.attachments.map((asset) => (
                    <div key={asset.id} className="asset-item">
                      <span>{asset.fileName}</span>
                      <button
                        className="inline-button danger"
                        type="button"
                        onClick={() =>
                          setAnamnesisForm({
                            ...anamnesisForm,
                            attachments: anamnesisForm.attachments.filter((item) => item.id !== asset.id)
                          })
                        }
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {anamnesisEditingId ? "Salvar anamnese" : "Registrar nova versão"}
                </button>
                <button className="ghost-button" type="button" onClick={resetAnamnesisForm}>
                  Limpar
                </button>
              </div>
            </form>
          </CrudPanel>

          <CrudPanel title="Histórico de anamnese" subtitle="Versões, anexos e atualizações">
            <div className="stack">
              {patientAnamneses.map((record) => (
                <article key={record.id} className="history-card">
                  <div className="panel-header">
                    <div>
                      <h4>Versão {record.version}</h4>
                      <p>Atualizado em {formatDateTime(record.updatedAt)} por {record.updatedBy}</p>
                    </div>
                    <div className="row-actions">
                      <button
                        className="inline-button"
                        type="button"
                        onClick={() => {
                          setAnamnesisEditingId(record.id);
                          setAnamnesisForm({
                            updatedBy: record.updatedBy,
                            healthHistory: record.healthHistory,
                            priorDiseases: record.priorDiseases,
                            surgeries: record.surgeries,
                            treatments: record.treatments,
                            allergies: record.allergies,
                            medications: record.medications,
                            habits: record.habits,
                            mainComplaint: record.mainComplaint,
                            professionalObservations: record.professionalObservations,
                            checkboxes: record.checkboxes,
                            attachments: record.attachments
                          });
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="inline-button danger"
                        type="button"
                        onClick={() => {
                          if (!window.confirm("Excluir esta versão da anamnese?")) return;
                          deleteAnamnesis(record.id);
                          if (anamnesisEditingId === record.id) resetAnamnesisForm();
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  <div className="history-grid">
                    <div>
                      <strong>Queixa principal</strong>
                      <p className="summary">{record.mainComplaint || "Não informado"}</p>
                    </div>
                    <div>
                      <strong>Histórico de saúde</strong>
                      <p className="summary">{record.healthHistory || "Não informado"}</p>
                    </div>
                    <div>
                      <strong>Alergias</strong>
                      <p className="summary">{record.allergies || "Não informado"}</p>
                    </div>
                    <div>
                      <strong>Medicamentos</strong>
                      <p className="summary">{record.medications || "Não informado"}</p>
                    </div>
                  </div>
                  <div className="data-list">
                    {record.checkboxes.hasPriorDiseases ? <span>Doenças prévias</span> : null}
                    {record.checkboxes.hasSurgeries ? <span>Cirurgias</span> : null}
                    {record.checkboxes.isUnderTreatment ? <span>Em tratamento</span> : null}
                    {record.checkboxes.hasAllergies ? <span>Possui alergias</span> : null}
                    {record.checkboxes.usesMedication ? <span>Usa medicacao</span> : null}
                    {record.checkboxes.smokes ? <span>Tabagismo</span> : null}
                    {record.checkboxes.drinksAlcohol ? <span>Consumo de álcool</span> : null}
                  </div>
                  {record.attachments.length ? (
                    <div className="asset-list">
                      {record.attachments.map((asset) => (
                        <div key={asset.id} className="asset-item">
                          <span>{asset.fileName}</span>
                          <div className="row-actions">
                            <a className="inline-button link-button" href={asset.dataUrl} target="_blank" rel="noreferrer">
                              Visualizar
                            </a>
                            <button className="inline-button" type="button" onClick={() => triggerDownload(asset)}>
                              Baixar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </CrudPanel>
        </section>
      ) : null}

      {activeTab === "contrato" ? (
        <section className="section page-grid">
          <CrudPanel title={contractEditingId ? "Editar contrato" : "Novo contrato"} subtitle="Envio do contrato assinado">
            <form className="crud-form" onSubmit={submitContract}>
              <div className="form-grid form-grid-2">
                <label>
                  <span>Tipo de contrato</span>
                  <input
                    value={contractForm.contractType}
                    onChange={(event) => setContractForm({ ...contractForm, contractType: event.target.value })}
                  />
                </label>
                <label>
                  <span>Data de assinatura</span>
                  <input
                    type="date"
                    value={contractForm.signedAt}
                    onChange={(event) => setContractForm({ ...contractForm, signedAt: event.target.value })}
                  />
                </label>
              </div>
              <label>
                <span>Observações</span>
                <textarea
                  rows={3}
                  value={contractForm.observations}
                  onChange={(event) => setContractForm({ ...contractForm, observations: event.target.value })}
                />
              </label>
              <label>
                <span>Arquivo assinado (PDF, JPG, PNG)</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(event) =>
                    handleAssetUpload(event, (assets) =>
                      setContractForm({ ...contractForm, file: assets[0] ?? contractForm.file })
                    )
                  }
                />
              </label>
              {contractForm.file ? (
                <div className="asset-item">
                  <span>{contractForm.file.fileName}</span>
                  <button
                    className="inline-button danger"
                    type="button"
                    onClick={() => setContractForm({ ...contractForm, file: null })}
                  >
                    Remover
                  </button>
                </div>
              ) : null}
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {contractEditingId ? "Salvar contrato" : "Enviar contrato"}
                </button>
                <button className="ghost-button" type="button" onClick={resetContractForm}>
                  Limpar
                </button>
              </div>
            </form>
          </CrudPanel>

          <CrudPanel title="Histórico de contratos" subtitle="Pré-visualização, baixar e substituir">
            <div className="stack">
              <div className="preview-card">
                <AssetPreview asset={selectedContractAsset} />
              </div>
              {patientContracts.map((contract) => (
                <article key={contract.id} className="history-card">
                  <div className="panel-header">
                    <div>
                      <h4>{contract.contractType}</h4>
                      <p>Versão {contract.version} | Assinado em {formatDate(contract.signedAt)}</p>
                    </div>
                    <div className="row-actions">
                      <button className="inline-button" type="button" onClick={() => setSelectedContractAsset(contract.file)}>
                        Visualizar
                      </button>
                      <button className="inline-button" type="button" onClick={() => triggerDownload(contract.file)}>
                        Baixar
                      </button>
                      <button
                        className="inline-button"
                        type="button"
                        onClick={() => {
                          setContractEditingId(contract.id);
                          setContractForm({
                            contractType: contract.contractType,
                            signedAt: contract.signedAt,
                            observations: contract.observations,
                            file: contract.file
                          });
                          setSelectedContractAsset(contract.file);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="inline-button danger"
                        type="button"
                        onClick={() => {
                          if (!window.confirm("Excluir esta versão do contrato?")) return;
                          deleteContract(contract.id);
                          if (selectedContractAsset?.id === contract.file.id) {
                            setSelectedContractAsset(patientContracts.find((item) => item.id !== contract.id)?.file ?? null);
                          }
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  <p className="summary">{contract.observations || "Sem observações."}</p>
                </article>
              ))}
            </div>
          </CrudPanel>
        </section>
      ) : null}

      {activeTab === "procedimentos" ? (
        <section className="section page-grid">
          <CrudPanel title={procedureEditingId ? "Editar procedimento" : "Novo procedimento"} subtitle="Registro de evolução do paciente">
            <form className="crud-form" onSubmit={submitProcedure}>
              <div className="form-grid form-grid-2">
                <label>
                  <span>Procedimento realizado</span>
                  <input
                    value={procedureForm.name}
                    onChange={(event) => setProcedureForm({ ...procedureForm, name: event.target.value })}
                  />
                </label>
                <label>
                  <span>Tipo</span>
                  <input
                    value={procedureForm.procedureType}
                    onChange={(event) => setProcedureForm({ ...procedureForm, procedureType: event.target.value })}
                  />
                </label>
                <label>
                  <span>Data</span>
                  <input
                    type="date"
                    value={procedureForm.date}
                    onChange={(event) => setProcedureForm({ ...procedureForm, date: event.target.value })}
                  />
                </label>
                <label>
                  <span>Profissional responsável</span>
                  <select
                    value={procedureForm.professionalId}
                    onChange={(event) => setProcedureForm({ ...procedureForm, professionalId: event.target.value })}
                  >
                    <option value="">Não informado</option>
                    {professionals.map((professional) => (
                      <option key={professional.id} value={professional.id}>
                        {professional.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                <span>Observações</span>
                <textarea
                  rows={4}
                  value={procedureForm.observations}
                  onChange={(event) => setProcedureForm({ ...procedureForm, observations: event.target.value })}
                />
              </label>

              <div className="upload-panel">
                <div className="form-grid form-grid-3">
                  <label>
                    <span>Categoria das fotos</span>
                    <select
                      value={photoUploadMeta.category}
                      onChange={(event) =>
                        setPhotoUploadMeta({ ...photoUploadMeta, category: event.target.value as PhotoCategory })
                      }
                    >
                      {photoCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Data da foto</span>
                    <input
                      type="date"
                      value={photoUploadMeta.capturedAt}
                      onChange={(event) => setPhotoUploadMeta({ ...photoUploadMeta, capturedAt: event.target.value })}
                    />
                  </label>
                  <label>
                    <span>Descrição da foto</span>
                    <input
                      value={photoUploadMeta.description}
                      onChange={(event) => setPhotoUploadMeta({ ...photoUploadMeta, description: event.target.value })}
                    />
                  </label>
                </div>
                <label>
                  <span>Envio múltiplo de fotos</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.svg"
                    multiple
                    onChange={(event) =>
                      handleAssetUpload(event, (assets) =>
                        setProcedureForm({
                          ...procedureForm,
                          photos: [
                            ...procedureForm.photos,
                            ...assets.map((asset) => ({
                              ...asset,
                              category: photoUploadMeta.category,
                              description: photoUploadMeta.description || asset.description,
                              capturedAt: photoUploadMeta.capturedAt,
                              area: photoUploadMeta.area
                            }))
                          ]
                        })
                      )
                    }
                  />
                </label>
                {procedureForm.photos.length ? (
                  <div className="photo-grid compact-photo-grid">
                    {procedureForm.photos.map((photo) => (
                      <div key={photo.id} className="photo-card">
                        <img src={photo.dataUrl} alt={photo.description || photo.fileName} />
                        <strong>{photo.category}</strong>
                        <span>{photo.description || photo.fileName}</span>
                        <button
                          className="inline-button danger"
                          type="button"
                          onClick={() =>
                            setProcedureForm({
                              ...procedureForm,
                              photos: procedureForm.photos.filter((item) => item.id !== photo.id)
                            })
                          }
                        >
                          Excluir foto
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {procedureEditingId ? "Salvar procedimento" : "Registrar procedimento"}
                </button>
                <button className="ghost-button" type="button" onClick={resetProcedureForm}>
                  Limpar
                </button>
              </div>
            </form>
          </CrudPanel>

          <CrudPanel title="Histórico de procedimentos" subtitle="Linha do tempo por paciente">
            <div className="stack">
              {patientProcedures.map((procedure) => (
                <article key={procedure.id} className="history-card">
                  <div className="panel-header">
                    <div>
                      <h4>{procedure.name}</h4>
                      <p>
                        {formatDate(procedure.date)} | {professionalNameById.get(procedure.professionalId) || "Profissional não informado"}
                      </p>
                    </div>
                    <div className="row-actions">
                      <button
                        className="inline-button"
                        type="button"
                        onClick={() => {
                          setProcedureEditingId(procedure.id);
                          setProcedureForm({
                            name: procedure.name,
                            procedureType: procedure.procedureType,
                            date: procedure.date,
                            professionalId: procedure.professionalId,
                            observations: procedure.observations,
                            photos: procedure.photos
                          });
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="inline-button danger"
                        type="button"
                        onClick={() => {
                          if (!window.confirm("Excluir este procedimento?")) return;
                          deleteProcedure(procedure.id);
                          if (procedureEditingId === procedure.id) resetProcedureForm();
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  <p className="summary">{procedure.observations || "Sem observações."}</p>
                  {procedure.photos.length ? (
                    <div className="photo-grid">
                      {procedure.photos.map((photo) => (
                        <div key={photo.id} className="photo-card">
                          <img src={photo.dataUrl} alt={photo.description || photo.fileName} />
                          <strong>{photo.category}</strong>
                          <span>{photo.description || photo.fileName}</span>
                          <small>{formatDate(photo.capturedAt)}</small>
                          <button
                            className="inline-button danger"
                            type="button"
                            onClick={() =>
                              updateProcedure(procedure.id, {
                                patientId,
                                name: procedure.name,
                                procedureType: procedure.procedureType,
                                date: procedure.date,
                                professionalId: procedure.professionalId,
                                observations: procedure.observations,
                                photos: procedure.photos.filter((item) => item.id !== photo.id)
                              })
                            }
                          >
                            Excluir foto
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </CrudPanel>
        </section>
      ) : null}

      {activeTab === "fotos" ? (
        <section className="section page-grid">
          <CrudPanel title="Galeria de evolução" subtitle="Fotos vinculadas ao paciente e aos procedimentos">
            <div className="toolbar">
              <div className="segmented-control">
                <button
                  className={`inline-button ${photoFilter === "Todas" ? "segmented-active" : ""}`}
                  type="button"
                  onClick={() => setPhotoFilter("Todas")}
                >
                  Todas
                </button>
                {photoCategories.map((category) => (
                  <button
                    key={category}
                    className={`inline-button ${photoFilter === category ? "segmented-active" : ""}`}
                    type="button"
                    onClick={() => setPhotoFilter(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <div className="photo-grid">
              {filteredPhotos.map((photo) => (
                <div key={photo.id} className="photo-card">
                  <img src={photo.dataUrl} alt={photo.description || photo.fileName} />
                  <strong>{photo.category}</strong>
                  <span>{photo.description || photo.fileName}</span>
                  <small>
                    {photo.procedureName} | {formatDate(photo.capturedAt)}
                  </small>
                </div>
              ))}
            </div>
          </CrudPanel>

          <CrudPanel title="Comparador Antes x Depois" subtitle="Comparação visual quando disponível">
            <div className="form-grid form-grid-2">
              <label>
                <span>Foto Antes</span>
                <select value={beforePhotoId} onChange={(event) => setBeforePhotoId(event.target.value)}>
                  <option value="">Selecione</option>
                  {beforePhotoOptions.map((photo) => (
                    <option key={photo.id} value={photo.id}>
                      {photo.procedureName} - {formatDate(photo.capturedAt)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Foto Depois</span>
                <select value={afterPhotoId} onChange={(event) => setAfterPhotoId(event.target.value)}>
                  <option value="">Selecione</option>
                  {afterPhotoOptions.map((photo) => (
                    <option key={photo.id} value={photo.id}>
                      {photo.procedureName} - {formatDate(photo.capturedAt)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {beforePhoto && afterPhoto ? (
              <div className="compare-grid">
                <div className="compare-card">
                  <strong>Antes</strong>
                  <img src={beforePhoto.dataUrl} alt={beforePhoto.description || beforePhoto.fileName} />
                  <span>{beforePhoto.description || beforePhoto.fileName}</span>
                </div>
                <div className="compare-card">
                  <strong>Depois</strong>
                  <img src={afterPhoto.dataUrl} alt={afterPhoto.description || afterPhoto.fileName} />
                  <span>{afterPhoto.description || afterPhoto.fileName}</span>
                </div>
              </div>
            ) : (
              <div className="empty-state">Selecione uma foto Antes e uma foto Depois para comparar.</div>
            )}
          </CrudPanel>
        </section>
      ) : null}

      {activeTab === "arquivos" ? (
        <section className="section page-grid">
          <CrudPanel title={fileEditingId ? "Editar arquivo" : "Envio de arquivos"} subtitle="Arquivos gerais do paciente">
            <form className="crud-form" onSubmit={submitPatientFiles}>
              <div className="form-grid form-grid-2">
                <label>
                  <span>Categoria</span>
                  <select value={fileForm.category} onChange={(event) => setFileForm({ ...fileForm, category: event.target.value as FileCategory })}>
                    {fileCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Descrição</span>
                  <input
                    value={fileForm.description}
                    onChange={(event) => setFileForm({ ...fileForm, description: event.target.value })}
                  />
                </label>
              </div>
              <label>
                <span>Selecionar arquivos</span>
                <input
                  type="file"
                  multiple={!fileEditingId}
                  onChange={(event) =>
                    handleAssetUpload(event, (assets) => setFileForm({ ...fileForm, assets }))
                  }
                />
              </label>
              {fileForm.assets.length ? (
                <div className="asset-list">
                  {fileForm.assets.map((asset) => (
                    <div key={asset.id} className="asset-item">
                      <span>{asset.fileName}</span>
                      <button
                        className="inline-button danger"
                        type="button"
                        onClick={() =>
                          setFileForm({
                            ...fileForm,
                            assets: fileForm.assets.filter((item) => item.id !== asset.id)
                          })
                        }
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {fileEditingId ? "Salvar arquivo" : "Enviar arquivo(s)"}
                </button>
                <button className="ghost-button" type="button" onClick={resetFileForm}>
                  Limpar
                </button>
              </div>
            </form>
          </CrudPanel>

          <CrudPanel title="Arquivos do paciente" subtitle="Pré-visualização, baixar e organizar">
            <div className="stack">
              {patientGeneralFiles.map((fileRecord) => (
                <article key={fileRecord.id} className="history-card">
                  <div className="panel-header">
                    <div>
                      <h4>{fileRecord.file.fileName}</h4>
                      <p>
                        {fileRecord.category} | Enviado em {formatDateTime(fileRecord.file.uploadedAt)}
                      </p>
                    </div>
                    <div className="row-actions">
                      <a className="inline-button link-button" href={fileRecord.file.dataUrl} target="_blank" rel="noreferrer">
                        Visualizar
                      </a>
                      <button className="inline-button" type="button" onClick={() => triggerDownload(fileRecord.file)}>
                        Baixar
                      </button>
                      <button
                        className="inline-button"
                        type="button"
                        onClick={() => {
                          setFileEditingId(fileRecord.id);
                          setFileForm({
                            category: fileRecord.category,
                            description: fileRecord.description,
                            assets: [fileRecord.file]
                          });
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="inline-button danger"
                        type="button"
                        onClick={() => {
                          if (!window.confirm("Excluir este arquivo?")) return;
                          deletePatientFile(fileRecord.id);
                          if (fileEditingId === fileRecord.id) resetFileForm();
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  <p className="summary">{fileRecord.description || "Sem descrição."}</p>
                </article>
              ))}
            </div>
          </CrudPanel>
        </section>
      ) : null}
    </>
  );
}
