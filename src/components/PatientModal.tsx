import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  AnamnesisRecord,
  BodyArea,
  ContractRecord,
  Patient,
  PhotoCategory,
  ProcedurePhoto,
  ProcedureRecord,
  Professional,
  StoredAsset
} from "../types";
import { createGeneratedContractAsset } from "../utils/contractPdf";
import { filesToStoredAssets, isImage, isPdf, triggerDownload } from "../utils/files";
import { formatDate, formatDateTime } from "../utils/format";

type PatientInput = Omit<Patient, "id" | "createdAt" | "updatedAt">;
type AnamnesisInput = Omit<AnamnesisRecord, "id" | "version" | "createdAt" | "updatedAt">;
type ContractInput = Omit<ContractRecord, "id" | "version" | "uploadedAt">;
type ProcedureInput = Omit<ProcedureRecord, "id">;
type TabKey = "dados" | "anamnese" | "contrato" | "fotos";

type Props = {
  isOpen: boolean;
  mode: "create" | "edit";
  patient: Patient | null;
  professionals: Professional[];
  anamneses: AnamnesisRecord[];
  contracts: ContractRecord[];
  procedures: ProcedureRecord[];
  onClose: () => void;
  createPatient: (input: PatientInput) => string;
  updatePatient: (id: string, input: PatientInput) => void;
  createAnamnesis: (input: AnamnesisInput) => void;
  updateAnamnesis: (id: string, input: AnamnesisInput) => void;
  deleteAnamnesis: (id: string) => void;
  createContract: (input: ContractInput) => void;
  updateContract: (id: string, input: ContractInput) => void;
  deleteContract: (id: string) => void;
  createProcedure: (input: ProcedureInput) => void;
  updateProcedure: (id: string, input: ProcedureInput) => void;
  deleteProcedure: (id: string) => void;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "dados", label: "Dados do Paciente" },
  { key: "anamnese", label: "Anamnese" },
  { key: "contrato", label: "Contrato" },
  { key: "fotos", label: "Fotos do Paciente" }
];

const photoCategories: PhotoCategory[] = ["Antes", "Depois", "Durante", "Evolução"];
const bodyAreas: BodyArea[] = ["Rosto", "Costas", "Barriga", "Pernas", "Braços", "Glúteos", "Geral"];

const emptyAsset: StoredAsset = {
  id: "",
  fileName: "",
  mimeType: "",
  dataUrl: "",
  uploadedAt: "",
  description: ""
};

const emptyPatientForm: PatientInput = {
  fullName: "",
  birthDate: "",
  cpf: "",
  phone: "",
  email: "",
  address: "",
  generalObservations: "",
  allergySummary: "",
  restrictionSummary: "",
  status: "Ativo"
};

function emptyAnamnesisForm(): AnamnesisInput {
  return {
    patientId: "",
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

function emptyContractForm(): ContractInput {
  return {
    patientId: "",
    contractType: "",
    signedAt: "",
    observations: "",
    file: emptyAsset
  };
}

function emptyProcedureForm(professionalId = ""): ProcedureInput {
  return {
    patientId: "",
    name: "",
    procedureType: "",
    date: "",
    professionalId,
    observations: "",
    photos: []
  };
}

function ContractPreview({
  asset,
  zoom,
  emptyLabel
}: {
  asset: StoredAsset;
  zoom: number;
  emptyLabel: string;
}) {
  if (!asset.dataUrl) return <div className="empty-state">{emptyLabel}</div>;

  if (isPdf(asset.mimeType)) {
    return (
      <iframe
        className="preview-frame"
        src={`${asset.dataUrl}#toolbar=1&navpanes=0&zoom=${zoom}`}
        title={asset.fileName}
      />
    );
  }

  if (isImage(asset.mimeType)) {
    return (
      <div className="image-preview-shell">
        <img
          className="preview-image preview-image-contained"
          src={asset.dataUrl}
          alt={asset.description || asset.fileName}
          style={{ transform: `scale(${zoom / 100})` }}
        />
      </div>
    );
  }

  return <div className="empty-state">Formato sem pré-visualização embutida.</div>;
}

function AssetViewerModal({
  asset,
  title,
  zoom,
  onZoomChange,
  onClose
}: {
  asset: StoredAsset | null;
  title: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onClose: () => void;
}) {
  if (!asset) return null;

  return (
    <div className="viewer-overlay" role="dialog" aria-modal="true">
      <div className="viewer-shell viewer-shell-large">
        <div className="viewer-header">
          <div>
            <p className="eyebrow">Visualização</p>
            <h3>{title}</h3>
          </div>
          <div className="row-actions">
            <label className="toolbar-field zoom-field">
              <span>Zoom</span>
              <select value={zoom} onChange={(event) => onZoomChange(Number(event.target.value))}>
                {[75, 100, 125, 150, 200].map((value) => (
                  <option key={value} value={value}>
                    {value}%
                  </option>
                ))}
              </select>
            </label>
            <button className="ghost-button" type="button" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
        <div className="viewer-body">
          <ContractPreview asset={asset} zoom={zoom} emptyLabel="Arquivo indisponível." />
        </div>
      </div>
    </div>
  );
}

function PhotoLightbox({
  photos,
  index,
  onClose,
  onPrevious,
  onNext,
  onDelete
}: {
  photos: ProcedurePhoto[];
  index: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onDelete: (photoId: string) => void;
}) {
  const photo = photos[index];
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    setZoom(100);
  }, [index]);

  if (!photo) return null;

  return (
    <div className="viewer-overlay" role="dialog" aria-modal="true">
      <div className="viewer-shell">
        <div className="viewer-header">
          <div>
            <p className="eyebrow">{photo.category} | {photo.area ?? "Geral"}</p>
            <h3>{photo.description || photo.fileName}</h3>
            <p>{formatDate(photo.capturedAt)}</p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="viewer-controls">
          <button className="inline-button" type="button" onClick={onPrevious} disabled={photos.length <= 1}>
            Anterior
          </button>
          <label className="toolbar-field zoom-field">
            <span>Zoom</span>
            <select value={zoom} onChange={(event) => setZoom(Number(event.target.value))}>
              {[75, 100, 125, 150, 200].map((value) => (
                <option key={value} value={value}>
                  {value}%
                </option>
              ))}
            </select>
          </label>
          <button className="inline-button" type="button" onClick={onNext} disabled={photos.length <= 1}>
            Próxima
          </button>
          <button className="inline-button" type="button" onClick={() => triggerDownload(photo)}>
            Baixar
          </button>
          <button className="inline-button danger" type="button" onClick={() => onDelete(photo.id)}>
            Excluir
          </button>
        </div>
        <div className="viewer-body">
          <div className="image-preview-shell image-preview-shell-dark">
            <img
              className="preview-image preview-image-contained"
              src={photo.dataUrl}
              alt={photo.description || photo.fileName}
              style={{ transform: `scale(${zoom / 100})` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function groupPhotosByArea(photos: ProcedurePhoto[]) {
  return bodyAreas.reduce<Record<BodyArea, ProcedurePhoto[]>>(
    (accumulator, area) => ({
      ...accumulator,
      [area]: photos.filter((photo) => (photo.area ?? "Geral") === area)
    }),
    {
      Rosto: [],
      Costas: [],
      Barriga: [],
      Pernas: [],
      Braços: [],
      Glúteos: [],
      Geral: []
    }
  );
}

export function PatientModal({
  isOpen,
  mode,
  patient,
  professionals,
  anamneses,
  contracts,
  procedures,
  onClose,
  createPatient,
  updatePatient,
  createAnamnesis,
  updateAnamnesis,
  deleteAnamnesis,
  createContract,
  updateContract,
  deleteContract,
  createProcedure,
  updateProcedure,
  deleteProcedure: _deleteProcedure
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("dados");
  const [patientId, setPatientId] = useState<string | null>(patient?.id ?? null);
  const [error, setError] = useState("");
  const [patientForm, setPatientForm] = useState<PatientInput>(emptyPatientForm);
  const [anamnesisForm, setAnamnesisForm] = useState<AnamnesisInput>(emptyAnamnesisForm);
  const [contractForm, setContractForm] = useState<ContractInput>(emptyContractForm);
  const [procedureForm, setProcedureForm] = useState<ProcedureInput>(emptyProcedureForm(professionals[0]?.id ?? ""));
  const [editingAnamnesisId, setEditingAnamnesisId] = useState<string | null>(null);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null);
  const [photoMeta, setPhotoMeta] = useState({
    category: "Antes" as PhotoCategory,
    area: "Geral" as BodyArea,
    description: "",
    capturedAt: new Date().toISOString().slice(0, 10)
  });
  const [viewerAsset, setViewerAsset] = useState<StoredAsset | null>(null);
  const [viewerTitle, setViewerTitle] = useState("");
  const [contractZoom, setContractZoom] = useState(100);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [generatedContract, setGeneratedContract] = useState<StoredAsset | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("dados");
    setError("");
    setPatientId(patient?.id ?? null);
    setViewerAsset(null);
    setSelectedPhotoIndex(null);
    setGeneratedContract(null);
    setContractZoom(100);
    setPhotoMeta({
      category: "Antes",
      area: "Geral",
      description: "",
      capturedAt: new Date().toISOString().slice(0, 10)
    });
    setPatientForm(
      patient
        ? {
            fullName: patient.fullName,
            birthDate: patient.birthDate,
            cpf: patient.cpf,
            phone: patient.phone,
            email: patient.email,
            address: patient.address,
            generalObservations: patient.generalObservations,
            allergySummary: patient.allergySummary,
            restrictionSummary: patient.restrictionSummary,
            status: patient.status
          }
        : emptyPatientForm
    );
    setAnamnesisForm({
      ...emptyAnamnesisForm(),
      patientId: patient?.id ?? ""
    });
    setContractForm({
      ...emptyContractForm(),
      patientId: patient?.id ?? ""
    });
    setProcedureForm({
      ...emptyProcedureForm(professionals[0]?.id ?? ""),
      patientId: patient?.id ?? ""
    });
    setEditingAnamnesisId(null);
    setEditingContractId(null);
    setEditingProcedureId(null);
  }, [isOpen, patient, professionals]);

  const patientAnamneses = useMemo(
    () => anamneses.filter((item) => item.patientId === patientId).sort((a, b) => b.version - a.version),
    [anamneses, patientId]
  );
  const patientContracts = useMemo(
    () => contracts.filter((item) => item.patientId === patientId).sort((a, b) => b.version - a.version),
    [contracts, patientId]
  );
  const patientProcedures = useMemo(
    () => procedures.filter((item) => item.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date)),
    [patientId, procedures]
  );
  const currentPatientSnapshot = useMemo<Patient | null>(() => {
    if (!patientId) return null;
    return {
      id: patientId,
      createdAt: patient?.createdAt ?? new Date().toISOString(),
      updatedAt: patient?.updatedAt ?? new Date().toISOString(),
      ...patientForm
    };
  }, [patient, patientForm, patientId]);
  const latestAnamnesis = patientAnamneses[0];
  const latestProcedure = editingProcedureId
    ? patientProcedures.find((procedure) => procedure.id === editingProcedureId) ?? patientProcedures[0]
    : patientProcedures[0];
  const allPhotos = useMemo(
    () =>
      patientProcedures.flatMap((procedure) =>
        procedure.photos.map((photo) => ({
          ...photo,
          area: photo.area ?? "Geral",
          description: photo.description || procedure.name
        }))
      ),
    [patientProcedures]
  );
  const currentProcedurePhotoGroups = useMemo(
    () => groupPhotosByArea(procedureForm.photos.map((photo) => ({ ...photo, area: photo.area ?? "Geral" }))),
    [procedureForm.photos]
  );
  const savedPhotosByArea = useMemo(
    () =>
      bodyAreas.reduce<Record<BodyArea, Array<{ photo: ProcedurePhoto; procedureName: string; procedureDate: string }>>>(
        (accumulator, area) => ({
          ...accumulator,
          [area]: patientProcedures.flatMap((procedure) =>
            procedure.photos
              .filter((photo) => (photo.area ?? "Geral") === area)
              .map((photo) => ({
                photo: { ...photo, area: photo.area ?? "Geral" },
                procedureName: procedure.name,
                procedureDate: procedure.date
              }))
          )
        }),
        {
          Rosto: [],
          Costas: [],
          Barriga: [],
          Pernas: [],
          Braços: [],
          Glúteos: [],
          Geral: []
        }
      ),
    [patientProcedures]
  );

  if (!isOpen) return null;

  const tabsUnlocked = patientId !== null;

  const resetAnamnesis = () => {
    setEditingAnamnesisId(null);
    setAnamnesisForm({ ...emptyAnamnesisForm(), patientId: patientId ?? "" });
  };

  const resetContract = () => {
    setEditingContractId(null);
    setContractForm({ ...emptyContractForm(), patientId: patientId ?? "" });
  };

  const resetProcedure = () => {
    setEditingProcedureId(null);
    setProcedureForm({ ...emptyProcedureForm(professionals[0]?.id ?? ""), patientId: patientId ?? "" });
  };

  const openAssetViewer = (asset: StoredAsset, title: string) => {
    setViewerAsset(asset);
    setViewerTitle(title);
    setContractZoom(100);
  };

  const savePatient = (goNext: boolean) => {
    if (!patientForm.fullName.trim() || !patientForm.phone.trim()) {
      setError("Nome completo e telefone são obrigatórios.");
      return false;
    }

    if (patientId) {
      updatePatient(patientId, patientForm);
    } else {
      const id = createPatient(patientForm);
      setPatientId(id);
      setAnamnesisForm((current) => ({ ...current, patientId: id }));
      setContractForm((current) => ({ ...current, patientId: id }));
      setProcedureForm((current) => ({ ...current, patientId: id }));
    }

    setError("");
    if (goNext) setActiveTab("anamnese");
    return true;
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, onLoaded: (assets: StoredAsset[]) => void) => {
    const files = event.target.files;
    if (!files?.length) return;
    const assets = await filesToStoredAssets(files);
    onLoaded(assets);
    event.target.value = "";
  };

  const saveAnamnesis = (goNext: boolean) => {
    if (!patientId) return false;
    const payload = { ...anamnesisForm, patientId };
    if (editingAnamnesisId) updateAnamnesis(editingAnamnesisId, payload);
    else createAnamnesis(payload);
    resetAnamnesis();
    setError("");
    if (goNext) setActiveTab("contrato");
    return true;
  };

  const saveContract = (goNext: boolean) => {
    if (!patientId) return false;

    const hasAnyContractData =
      contractForm.contractType.trim() ||
      contractForm.signedAt.trim() ||
      contractForm.observations.trim() ||
      contractForm.file.dataUrl;

    if (!hasAnyContractData) {
      setError("");
      if (goNext) setActiveTab("fotos");
      return true;
    }

    if (!contractForm.file.dataUrl) {
      setError("Envie o arquivo assinado para salvar esta versão do contrato.");
      return false;
    }

    const payload = {
      ...contractForm,
      patientId,
      contractType: contractForm.contractType.trim() || "Contrato assinado",
      signedAt: contractForm.signedAt || new Date().toISOString().slice(0, 10)
    };

    if (editingContractId) updateContract(editingContractId, payload);
    else createContract(payload);

    resetContract();
    setError("");
    if (goNext) setActiveTab("fotos");
    return true;
  };

  const saveProcedure = () => {
    const isEmpty =
      !procedureForm.name.trim() &&
      !procedureForm.procedureType.trim() &&
      !procedureForm.date.trim() &&
      !procedureForm.observations.trim() &&
      !procedureForm.photos.length;

    if (isEmpty) {
      setError("");
      return true;
    }

    if (!patientId || !procedureForm.name.trim()) {
      setError("Informe pelo menos o nome do procedimento.");
      return false;
    }

    const payload = {
      ...procedureForm,
      patientId,
      date: procedureForm.date || new Date().toISOString().slice(0, 10)
    };

    if (editingProcedureId) updateProcedure(editingProcedureId, payload);
    else createProcedure(payload);

    resetProcedure();
    setError("");
    return true;
  };

  const removePhotoFromCurrentForm = (photoId: string) => {
    setProcedureForm((current) => ({
      ...current,
      photos: current.photos.filter((photo) => photo.id !== photoId)
    }));
    if (selectedPhotoIndex !== null) setSelectedPhotoIndex(null);
  };

  const removePhotoFromSavedProcedure = (photoId: string) => {
    const owningProcedure = patientProcedures.find((procedure) => procedure.photos.some((photo) => photo.id === photoId));
    if (!owningProcedure) return;
    updateProcedure(owningProcedure.id, {
      patientId: owningProcedure.patientId,
      name: owningProcedure.name,
      procedureType: owningProcedure.procedureType,
      date: owningProcedure.date,
      professionalId: owningProcedure.professionalId,
      observations: owningProcedure.observations,
      photos: owningProcedure.photos.filter((photo) => photo.id !== photoId)
    });
    setSelectedPhotoIndex(null);
  };

  const generateContract = () => {
    if (!currentPatientSnapshot) {
      setError("Salve os dados do paciente antes de gerar o contrato.");
      return;
    }
    const asset = createGeneratedContractAsset(currentPatientSnapshot, latestAnamnesis, latestProcedure);
    setGeneratedContract(asset);
    setError("");
    openAssetViewer(asset, "Contrato gerado automaticamente");
  };

  const printGeneratedContract = () => {
    if (!generatedContract) {
      setError("Gere o contrato antes de imprimir.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1024,height=768");
    if (!printWindow) {
      setError("Não foi possível abrir a janela de impressão.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${generatedContract.fileName}</title>
          <style>
            html, body { margin: 0; height: 100%; }
            iframe { border: 0; width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <iframe src="${generatedContract.dataUrl}#toolbar=0"></iframe>
          <script>
            window.onload = function () {
              window.focus();
              setTimeout(function () { window.print(); }, 400);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const viewerPhotos = editingProcedureId ? procedureForm.photos : allPhotos;

  return (
    <>
      <div className="modal-overlay" role="dialog" aria-modal="true">
        <div className="modal-shell">
          <div className="modal-header">
            <div>
              <p className="eyebrow">Pacientes</p>
              <h3>{mode === "create" ? "Adicionar Paciente" : `Editar ${patient?.fullName ?? "Paciente"}`}</h3>
            </div>
            <button className="ghost-button" type="button" onClick={onClose}>
              Fechar
            </button>
          </div>

          <div className="modal-tabs">
            {tabs.map((tab, index) => {
              const locked = index > 0 && !tabsUnlocked;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`tab-button ${activeTab === tab.key ? "tab-button-active" : ""}`}
                  onClick={() => {
                    if (locked) return;
                    setActiveTab(tab.key);
                  }}
                  disabled={locked}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="modal-content">
            {activeTab === "dados" ? (
              <div className="crud-form">
                <div className="form-grid form-grid-2">
                  <label>
                    <span>Nome completo</span>
                    <input value={patientForm.fullName} onChange={(event) => setPatientForm({ ...patientForm, fullName: event.target.value })} />
                  </label>
                  <label>
                    <span>Data de nascimento</span>
                    <input type="date" value={patientForm.birthDate} onChange={(event) => setPatientForm({ ...patientForm, birthDate: event.target.value })} />
                  </label>
                  <label>
                    <span>CPF</span>
                    <input value={patientForm.cpf} onChange={(event) => setPatientForm({ ...patientForm, cpf: event.target.value })} />
                  </label>
                  <label>
                    <span>Telefone</span>
                    <input value={patientForm.phone} onChange={(event) => setPatientForm({ ...patientForm, phone: event.target.value })} />
                  </label>
                  <label>
                    <span>E-mail</span>
                    <input type="email" value={patientForm.email} onChange={(event) => setPatientForm({ ...patientForm, email: event.target.value })} />
                  </label>
                  <label>
                    <span>Status</span>
                    <select value={patientForm.status} onChange={(event) => setPatientForm({ ...patientForm, status: event.target.value as Patient["status"] })}>
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </label>
                </div>
                <label>
                  <span>Endereço</span>
                  <input value={patientForm.address} onChange={(event) => setPatientForm({ ...patientForm, address: event.target.value })} />
                </label>
                <div className="form-grid form-grid-2">
                  <label>
                    <span>Alergias</span>
                    <input value={patientForm.allergySummary} onChange={(event) => setPatientForm({ ...patientForm, allergySummary: event.target.value })} />
                  </label>
                  <label>
                    <span>Restrições</span>
                    <input value={patientForm.restrictionSummary} onChange={(event) => setPatientForm({ ...patientForm, restrictionSummary: event.target.value })} />
                  </label>
                </div>
                <label>
                  <span>Observações gerais</span>
                  <textarea rows={4} value={patientForm.generalObservations} onChange={(event) => setPatientForm({ ...patientForm, generalObservations: event.target.value })} />
                </label>
              </div>
            ) : null}

            {activeTab === "anamnese" ? (
              <div className="crud-form">
                <div className="form-grid form-grid-2">
                  <label>
                    <span>Última atualização por</span>
                    <input value={anamnesisForm.updatedBy} onChange={(event) => setAnamnesisForm({ ...anamnesisForm, updatedBy: event.target.value })} />
                  </label>
                  <label>
                    <span>Objetivo / queixa principal</span>
                    <input value={anamnesisForm.mainComplaint} onChange={(event) => setAnamnesisForm({ ...anamnesisForm, mainComplaint: event.target.value })} />
                  </label>
                </div>
                <label>
                  <span>Histórico de saúde</span>
                  <textarea rows={3} value={anamnesisForm.healthHistory} onChange={(event) => setAnamnesisForm({ ...anamnesisForm, healthHistory: event.target.value })} />
                </label>
                <div className="form-grid form-grid-2">
                  <label>
                    <span>Doenças prévias</span>
                    <textarea rows={3} value={anamnesisForm.priorDiseases} onChange={(event) => setAnamnesisForm({ ...anamnesisForm, priorDiseases: event.target.value })} />
                  </label>
                  <label>
                    <span>Cirurgias</span>
                    <textarea rows={3} value={anamnesisForm.surgeries} onChange={(event) => setAnamnesisForm({ ...anamnesisForm, surgeries: event.target.value })} />
                  </label>
                  <label>
                    <span>Tratamentos</span>
                    <textarea rows={3} value={anamnesisForm.treatments} onChange={(event) => setAnamnesisForm({ ...anamnesisForm, treatments: event.target.value })} />
                  </label>
                  <label>
                    <span>Medicamentos em uso</span>
                    <textarea rows={3} value={anamnesisForm.medications} onChange={(event) => setAnamnesisForm({ ...anamnesisForm, medications: event.target.value })} />
                  </label>
                  <label>
                    <span>Alergias</span>
                    <textarea rows={3} value={anamnesisForm.allergies} onChange={(event) => setAnamnesisForm({ ...anamnesisForm, allergies: event.target.value })} />
                  </label>
                  <label>
                    <span>Hábitos</span>
                    <textarea rows={3} value={anamnesisForm.habits} onChange={(event) => setAnamnesisForm({ ...anamnesisForm, habits: event.target.value })} />
                  </label>
                </div>
                <label>
                  <span>Observações do profissional</span>
                  <textarea rows={3} value={anamnesisForm.professionalObservations} onChange={(event) => setAnamnesisForm({ ...anamnesisForm, professionalObservations: event.target.value })} />
                </label>
                <div className="checkbox-grid">
                  {[
                    ["hasPriorDiseases", "Doenças prévias"],
                    ["hasSurgeries", "Cirurgias"],
                    ["isUnderTreatment", "Em tratamento"],
                    ["hasAllergies", "Possui alergias"],
                    ["usesMedication", "Usa medicacao"],
                    ["smokes", "Tabagismo"],
                    ["drinksAlcohol", "Alcool"]
                  ].map(([key, label]) => (
                    <label key={key} className="check-card">
                      <input
                        type="checkbox"
                        checked={anamnesisForm.checkboxes[key as keyof typeof anamnesisForm.checkboxes]}
                        onChange={(event) =>
                          setAnamnesisForm({
                            ...anamnesisForm,
                            checkboxes: { ...anamnesisForm.checkboxes, [key]: event.target.checked }
                          })
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                <label>
                  <span>Anexar exames / arquivos</span>
                  <input
                    type="file"
                    multiple
                    onChange={(event) =>
                      handleUpload(event, (assets) =>
                        setAnamnesisForm({ ...anamnesisForm, attachments: [...anamnesisForm.attachments, ...assets] })
                      )
                    }
                  />
                </label>
                {anamnesisForm.attachments.length ? (
                  <div className="asset-list">
                    {anamnesisForm.attachments.map((asset) => (
                      <div key={asset.id} className="asset-item">
                        <span>{asset.fileName}</span>
                        <div className="row-actions">
                          <button className="inline-button" type="button" onClick={() => openAssetViewer(asset, asset.fileName)}>
                            Ver
                          </button>
                          <button className="inline-button danger" type="button" onClick={() => setAnamnesisForm({ ...anamnesisForm, attachments: anamnesisForm.attachments.filter((item) => item.id !== asset.id) })}>
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="stack modal-history">
                  {patientAnamneses.map((record) => (
                    <article key={record.id} className="history-card">
                      <div className="panel-header">
                        <div>
                          <h4>Versão {record.version}</h4>
                          <p>{formatDateTime(record.updatedAt)} | {record.updatedBy}</p>
                        </div>
                        <div className="row-actions">
                          <button className="inline-button" type="button" onClick={() => {
                            setEditingAnamnesisId(record.id);
                            setAnamnesisForm({
                              patientId: record.patientId,
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
                          }}>
                            Editar
                          </button>
                          <button className="inline-button danger" type="button" onClick={() => deleteAnamnesis(record.id)}>
                            Excluir
                          </button>
                        </div>
                      </div>
                      <p className="summary">{record.mainComplaint || "Sem queixa principal informada."}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "contrato" ? (
              <div className="crud-form">
                <div className="history-card">
                  <div className="panel-header">
                    <div>
                      <h4>Geração automática</h4>
                      <p>Monte o contrato com base na ficha do paciente e na anamnese antes de imprimir.</p>
                    </div>
                    <div className="row-actions">
                      <button className="inline-button" type="button" onClick={generateContract}>
                        Gerar Contrato
                      </button>
                      <button className="inline-button" type="button" onClick={printGeneratedContract} disabled={!generatedContract}>
                        Imprimir Contrato
                      </button>
                      <button className="primary-button" type="button" onClick={() => generatedContract && triggerDownload(generatedContract)} disabled={!generatedContract}>
                        Baixar PDF
                      </button>
                    </div>
                  </div>
                  {generatedContract ? (
                    <div className="stack">
                      <div className="row-actions">
                        <button className="inline-button" type="button" onClick={() => openAssetViewer(generatedContract, "Contrato gerado automaticamente")}>
                          Ver
                        </button>
                        <button className="inline-button" type="button" onClick={printGeneratedContract}>
                          Imprimir
                        </button>
                        <button className="inline-button" type="button" onClick={() => triggerDownload(generatedContract)}>
                          Baixar PDF
                        </button>
                      </div>
                      <ContractPreview asset={generatedContract} zoom={contractZoom} emptyLabel="Gere o contrato para visualizar." />
                    </div>
                  ) : (
                    <div className="empty-state">Gere o contrato para visualizar, imprimir e baixar o PDF.</div>
                  )}
                </div>

                <div className="history-card">
                  <div className="panel-header">
                    <div>
                      <h4>Envio do contrato assinado</h4>
                      <p>O envio do arquivo assinado é opcional e pode ser feito depois da impressão.</p>
                    </div>
                  </div>
                  <div className="form-grid form-grid-2">
                    <label>
                      <span>Tipo de contrato</span>
                      <input value={contractForm.contractType} onChange={(event) => setContractForm({ ...contractForm, contractType: event.target.value })} />
                    </label>
                    <label>
                      <span>Data de assinatura</span>
                      <input type="date" value={contractForm.signedAt} onChange={(event) => setContractForm({ ...contractForm, signedAt: event.target.value })} />
                    </label>
                  </div>
                  <label>
                    <span>Observações</span>
                    <textarea rows={3} value={contractForm.observations} onChange={(event) => setContractForm({ ...contractForm, observations: event.target.value })} />
                  </label>
                  <label>
                    <span>Enviar PDF/JPG/PNG</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => handleUpload(event, (assets) => setContractForm({ ...contractForm, file: assets[0] ?? contractForm.file }))} />
                  </label>
                  <div className="contract-preview-card">
                    <div className="panel-header">
                      <div>
                        <h4>Pré-visualização do arquivo enviado</h4>
                        <p>{contractForm.file.fileName || "Nenhum arquivo selecionado."}</p>
                      </div>
                      {contractForm.file.dataUrl ? (
                        <label className="toolbar-field zoom-field">
                          <span>Zoom</span>
                          <select value={contractZoom} onChange={(event) => setContractZoom(Number(event.target.value))}>
                            {[75, 100, 125, 150, 200].map((value) => (
                              <option key={value} value={value}>
                                {value}%
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </div>
                    <ContractPreview asset={contractForm.file} zoom={contractZoom} emptyLabel="Anexe um contrato assinado para visualizar aqui." />
                    {contractForm.file.dataUrl ? (
                      <div className="row-actions">
                        <button className="inline-button" type="button" onClick={() => openAssetViewer(contractForm.file, contractForm.file.fileName)}>
                          Ver
                        </button>
                        <button className="inline-button" type="button" onClick={() => triggerDownload(contractForm.file)}>
                          Baixar
                        </button>
                        <button className="inline-button" type="button" onClick={() => document.getElementById("contract-upload-input")?.click()}>
                          Substituir
                        </button>
                        <button className="inline-button danger" type="button" onClick={() => setContractForm({ ...contractForm, file: emptyAsset })}>
                          Remover
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <input
                    id="contract-upload-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden-input"
                    onChange={(event) => handleUpload(event, (assets) => setContractForm({ ...contractForm, file: assets[0] ?? contractForm.file }))}
                  />
                </div>

                <div className="stack modal-history">
                  {patientContracts.map((contract) => (
                    <article key={contract.id} className="history-card">
                      <div className="panel-header">
                        <div>
                          <h4>{contract.contractType}</h4>
                          <p>Versão {contract.version} | {formatDate(contract.signedAt)}</p>
                        </div>
                        <div className="row-actions">
                          <button className="inline-button" type="button" onClick={() => openAssetViewer(contract.file, contract.file.fileName)}>
                            Ver
                          </button>
                          <button className="inline-button" type="button" onClick={() => triggerDownload(contract.file)}>
                            Baixar
                          </button>
                          <button className="inline-button" type="button" onClick={() => {
                            setEditingContractId(contract.id);
                            setContractForm({
                              patientId: contract.patientId,
                              contractType: contract.contractType,
                              signedAt: contract.signedAt,
                              observations: contract.observations,
                              file: contract.file
                            });
                            setActiveTab("contrato");
                          }}>
                            Substituir
                          </button>
                          <button className="inline-button danger" type="button" onClick={() => deleteContract(contract.id)}>
                            Remover
                          </button>
                        </div>
                      </div>
                      <p className="summary">{contract.observations || "Sem observações."}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "fotos" ? (
              <div className="crud-form">
                <div className="form-grid form-grid-2">
                  <label>
                    <span>Procedimento / contexto</span>
                    <input value={procedureForm.name} onChange={(event) => setProcedureForm({ ...procedureForm, name: event.target.value })} />
                  </label>
                  <label>
                    <span>Tipo</span>
                    <input value={procedureForm.procedureType} onChange={(event) => setProcedureForm({ ...procedureForm, procedureType: event.target.value })} />
                  </label>
                  <label>
                    <span>Data</span>
                    <input type="date" value={procedureForm.date} onChange={(event) => setProcedureForm({ ...procedureForm, date: event.target.value })} />
                  </label>
                  <label>
                    <span>Profissional</span>
                    <select value={procedureForm.professionalId} onChange={(event) => setProcedureForm({ ...procedureForm, professionalId: event.target.value })}>
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
                  <textarea rows={3} value={procedureForm.observations} onChange={(event) => setProcedureForm({ ...procedureForm, observations: event.target.value })} />
                </label>
                <div className="form-grid form-grid-3">
                  <label>
                    <span>Categoria</span>
                    <select value={photoMeta.category} onChange={(event) => setPhotoMeta({ ...photoMeta, category: event.target.value as PhotoCategory })}>
                      {photoCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Área corporal</span>
                    <select value={photoMeta.area} onChange={(event) => setPhotoMeta({ ...photoMeta, area: event.target.value as BodyArea })}>
                      {bodyAreas.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Data da foto</span>
                    <input type="date" value={photoMeta.capturedAt} onChange={(event) => setPhotoMeta({ ...photoMeta, capturedAt: event.target.value })} />
                  </label>
                </div>
                <label>
                  <span>Descrição</span>
                  <input value={photoMeta.description} onChange={(event) => setPhotoMeta({ ...photoMeta, description: event.target.value })} />
                </label>
                <label>
                  <span>Envio múltiplo</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.svg"
                    multiple
                    onChange={(event) =>
                      handleUpload(event, (assets) =>
                        setProcedureForm({
                          ...procedureForm,
                          photos: [
                            ...procedureForm.photos,
                            ...assets.map((asset) => ({
                              ...asset,
                              category: photoMeta.category,
                              area: photoMeta.area,
                              description: photoMeta.description || asset.description,
                              capturedAt: photoMeta.capturedAt
                            }))
                          ]
                        })
                      )
                    }
                  />
                </label>
                {procedureForm.photos.length ? (
                  <div className="stack">
                    <div className="photo-section-header">
                      <div>
                        <h4>{procedureForm.name || "Procedimento em edição"}</h4>
                        <p>As fotos abaixo ficam separadas por área corporal para facilitar a evolução de cada procedimento.</p>
                      </div>
                    </div>
                    {bodyAreas.map((area) =>
                      currentProcedurePhotoGroups[area].length ? (
                        <section key={area} className="photo-area-section">
                          <div className="panel-header">
                            <div>
                              <h4>{area}</h4>
                              <p>{currentProcedurePhotoGroups[area].length} foto(s)</p>
                            </div>
                          </div>
                          <div className="photo-grid compact-photo-grid">
                            {currentProcedurePhotoGroups[area].map((photo) => (
                              <div key={photo.id} className="photo-card">
                                <button className="photo-button" type="button" onClick={() => setSelectedPhotoIndex(procedureForm.photos.findIndex((item) => item.id === photo.id))}>
                                  <img src={photo.dataUrl} alt={photo.description || photo.fileName} />
                                </button>
                                <strong>{photo.category}</strong>
                                <span>{photo.description || photo.fileName}</span>
                                <small>{photo.area}</small>
                                <div className="row-actions">
                                  <button className="inline-button" type="button" onClick={() => setSelectedPhotoIndex(procedureForm.photos.findIndex((item) => item.id === photo.id))}>
                                    Ver
                                  </button>
                                  <button className="inline-button" type="button" onClick={() => triggerDownload(photo)}>
                                    Baixar
                                  </button>
                                  <button className="inline-button danger" type="button" onClick={() => removePhotoFromCurrentForm(photo.id)}>
                                    Excluir
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      ) : null
                    )}
                  </div>
                ) : null}
                <div className="stack modal-history">
                  <article className="history-card">
                    <div className="panel-header">
                      <div>
                        <h4>Galeria separada por área corporal</h4>
                        <p>As fotos salvas ficam agrupadas em títulos como Rosto, Costas, Pernas e demais áreas.</p>
                      </div>
                    </div>
                    <div className="stack">
                      {bodyAreas.map((area) => {
                        const areaPhotos = savedPhotosByArea[area];
                        if (!areaPhotos.length) return null;

                        return (
                          <section key={area} className="photo-area-section">
                            <div className="panel-header">
                              <div>
                                <h3>{area}</h3>
                                <p>{areaPhotos.length} foto(s) nesta área</p>
                              </div>
                            </div>
                            <div className="photo-grid compact-photo-grid">
                              {areaPhotos.map(({ photo, procedureName, procedureDate }) => (
                                <div key={photo.id} className="photo-card">
                                  <button className="photo-button" type="button" onClick={() => setSelectedPhotoIndex(allPhotos.findIndex((item) => item.id === photo.id))}>
                                    <img src={photo.dataUrl} alt={photo.description || photo.fileName} />
                                  </button>
                                  <strong>{procedureName}</strong>
                                  <span>{photo.category} | {formatDate(procedureDate)}</span>
                                  <small>{photo.description || photo.fileName}</small>
                                  <div className="row-actions">
                                    <button
                                      className="inline-button"
                                      type="button"
                                      onClick={() => {
                                        const procedure = patientProcedures.find((item) => item.photos.some((itemPhoto) => itemPhoto.id === photo.id));
                                        if (!procedure) return;
                                        setEditingProcedureId(procedure.id);
                                        setProcedureForm({
                                          patientId: procedure.patientId,
                                          name: procedure.name,
                                          procedureType: procedure.procedureType,
                                          date: procedure.date,
                                          professionalId: procedure.professionalId,
                                          observations: procedure.observations,
                                          photos: procedure.photos
                                        });
                                      }}
                                    >
                                      Editar procedimento
                                    </button>
                                    <button className="inline-button" type="button" onClick={() => setSelectedPhotoIndex(allPhotos.findIndex((item) => item.id === photo.id))}>
                                      Ver
                                    </button>
                                    <button className="inline-button" type="button" onClick={() => triggerDownload(photo)}>
                                      Baixar
                                    </button>
                                    <button className="inline-button danger" type="button" onClick={() => removePhotoFromSavedProcedure(photo.id)}>
                                      Excluir
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  </article>
                </div>
              </div>
            ) : null}
          </div>

          <div className="modal-footer">
            <div className="row-actions">
              {activeTab !== "dados" ? (
                <button className="ghost-button" type="button" onClick={() => setActiveTab(tabs[tabs.findIndex((tab) => tab.key === activeTab) - 1].key)}>
                  Voltar
                </button>
              ) : null}
              <button className="ghost-button" type="button" onClick={onClose}>
                Cancelar
              </button>
            </div>
            <div className="row-actions">
              {activeTab === "dados" ? (
                <>
                  <button className="inline-button" type="button" onClick={() => savePatient(false)}>
                    Salvar
                  </button>
                  <button className="primary-button" type="button" onClick={() => savePatient(true)}>
                    Salvar e continuar
                  </button>
                </>
              ) : null}
              {activeTab === "anamnese" ? (
                <>
                  <button className="inline-button" type="button" onClick={() => saveAnamnesis(false)}>
                    Salvar
                  </button>
                  <button className="primary-button" type="button" onClick={() => saveAnamnesis(true)}>
                    Salvar e continuar
                  </button>
                </>
              ) : null}
              {activeTab === "contrato" ? (
                <>
                  <button className="inline-button" type="button" onClick={() => saveContract(false)}>
                    Salvar
                  </button>
                  <button className="primary-button" type="button" onClick={() => saveContract(true)}>
                    Salvar e continuar
                  </button>
                </>
              ) : null}
              {activeTab === "fotos" ? (
                <>
                  <button className="inline-button" type="button" onClick={saveProcedure}>
                    Salvar
                  </button>
                  <button className="primary-button" type="button" onClick={() => { if (saveProcedure()) onClose(); }}>
                    Finalizar
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <AssetViewerModal
        asset={viewerAsset}
        title={viewerTitle}
        zoom={contractZoom}
        onZoomChange={setContractZoom}
        onClose={() => setViewerAsset(null)}
      />

      {selectedPhotoIndex !== null && viewerPhotos[selectedPhotoIndex] ? (
        <PhotoLightbox
          photos={viewerPhotos}
          index={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
          onPrevious={() => setSelectedPhotoIndex((current) => (current === null ? 0 : (current - 1 + viewerPhotos.length) % viewerPhotos.length))}
          onNext={() => setSelectedPhotoIndex((current) => (current === null ? 0 : (current + 1) % viewerPhotos.length))}
          onDelete={(photoId) => {
            if (editingProcedureId) removePhotoFromCurrentForm(photoId);
            else removePhotoFromSavedProcedure(photoId);
          }}
        />
      ) : null}
    </>
  );
}
