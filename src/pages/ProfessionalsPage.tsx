import { FormEvent, useMemo, useState } from "react";
import { CrudPanel } from "../components/CrudPanel";
import { PageTopbar } from "../components/PageTopbar";
import { Professional, RoleName } from "../types";

type Props = {
  professionals: Professional[];
  createProfessional: (input: Omit<Professional, "id">) => void;
  updateProfessional: (id: string, input: Omit<Professional, "id">) => void;
  deleteProfessional: (id: string) => void;
};

const emptyForm: Omit<Professional, "id"> = {
  name: "",
  specialty: "",
  role: "Profissional",
  commissionRate: "",
  nextShift: "",
  phone: "",
  email: "",
  council: "",
  status: "Ativo"
};

const roleOptions: RoleName[] = ["Administrador", "Recepção", "Profissional"];
const statusOptions: Professional["status"][] = ["Ativo", "Férias", "Inativo"];

function getProfessionalStatusClass(status: Professional["status"]) {
  const normalizedStatus = status.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return `status-pill professional-status-${normalizedStatus}`;
}

export function ProfessionalsPage({
  professionals,
  createProfessional,
  updateProfessional,
  deleteProfessional
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState<Professional["status"] | "Todos">("Todos");
  const [form, setForm] = useState(emptyForm);

  const specialties = useMemo(
    () => Array.from(new Set(professionals.map((professional) => professional.specialty).filter(Boolean))).sort(),
    [professionals]
  );

  const filteredProfessionals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return professionals.filter((professional) => {
      const matchesQuery = !normalizedQuery || professional.name.toLowerCase().includes(normalizedQuery);
      const matchesSpecialty = specialtyFilter === "Todas" || professional.specialty === specialtyFilter;
      const matchesStatus = statusFilter === "Todos" || professional.status === statusFilter;

      return matchesQuery && matchesSpecialty && matchesStatus;
    });
  }, [professionals, query, specialtyFilter, statusFilter]);

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const openCreateModal = () => {
    reset();
    setIsModalOpen(true);
  };

  const openEditModal = (professional: Professional) => {
    setEditingId(professional.id);
    setForm(professional);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.specialty.trim()) return;
    if (editingId) updateProfessional(editingId, form);
    else createProfessional(form);
    closeModal();
  };

  return (
    <>
      <PageTopbar
        title="Profissionais"
        subtitle="Cadastro e gerenciamento dos profissionais da clínica"
        action={
          <button className="primary-button prominent-button" type="button" onClick={openCreateModal}>
            Novo profissional
          </button>
        }
      />

      <section className="section">
        <CrudPanel title="Lista de profissionais" subtitle="Visão gerencial dos profissionais da clínica">
          <div className="list-toolbar">
            <div className="list-toolbar-group">
              <label className="toolbar-field">
                <span>Pesquisar por nome</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome do profissional" />
              </label>
              <label className="toolbar-field">
                <span>Especialidade</span>
                <select value={specialtyFilter} onChange={(event) => setSpecialtyFilter(event.target.value)}>
                  <option value="Todas">Todas</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </label>
              <label className="toolbar-field">
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as Professional["status"] | "Todos")}
                >
                  <option value="Todos">Todos</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {professionals.length === 0 ? (
            <div className="empty-state empty-state-featured">
              <div className="empty-state-icon">P</div>
              <p>Nenhum profissional cadastrado</p>
              <button className="primary-button" type="button" onClick={openCreateModal}>
                Cadastrar primeiro profissional
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Especialidade</th>
                    <th>Perfil</th>
                    <th>Contato</th>
                    <th>Status</th>
                    <th>Próximo turno</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfessionals.map((professional) => (
                    <tr key={professional.id}>
                      <td>
                        <strong>{professional.name}</strong>
                        <div className="table-subtitle">{professional.council || "Sem registro informado"}</div>
                      </td>
                      <td>{professional.specialty}</td>
                      <td>{professional.role}</td>
                      <td>
                        {professional.phone || "-"}
                        <div className="table-subtitle">{professional.email || "-"}</div>
                      </td>
                      <td>
                        <span className={getProfessionalStatusClass(professional.status)}>
                          {professional.status}
                        </span>
                      </td>
                      <td>{professional.nextShift || "-"}</td>
                      <td>
                        <div className="row-actions">
                          <button className="inline-button" type="button" onClick={() => openEditModal(professional)}>
                            Editar
                          </button>
                          <button className="inline-button danger" type="button" onClick={() => deleteProfessional(professional.id)}>
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProfessionals.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state">Nenhum profissional encontrado para os filtros selecionados.</div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </CrudPanel>
      </section>

      {isModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="professional-modal-title">
          <div className="modal-shell professional-modal-shell">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Profissionais</span>
                <h3 id="professional-modal-title">{editingId ? "Editar profissional" : "Novo profissional"}</h3>
              </div>
              <button className="ghost-button" type="button" onClick={closeModal}>
                Fechar
              </button>
            </div>

            <form className="crud-form modal-content" onSubmit={submit}>
              <div className="form-grid form-grid-2">
                <label>
                  <span>Nome</span>
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                </label>
                <label>
                  <span>Especialidade</span>
                  <input value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} required />
                </label>
                <label>
                  <span>Perfil</span>
                  <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as RoleName })}>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Professional["status"] })}>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Telefone</span>
                  <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                </label>
                <label>
                  <span>E-mail</span>
                  <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </label>
                <label>
                  <span>Conselho/registro</span>
                  <input value={form.council} onChange={(event) => setForm({ ...form, council: event.target.value })} />
                </label>
                <label>
                  <span>Comissão</span>
                  <input value={form.commissionRate} onChange={(event) => setForm({ ...form, commissionRate: event.target.value })} />
                </label>
              </div>
              <label>
                <span>Próximo turno</span>
                <input value={form.nextShift} onChange={(event) => setForm({ ...form, nextShift: event.target.value })} />
              </label>
              <div className="form-actions modal-footer">
                <button className="ghost-button" type="button" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="primary-button" type="submit">
                  {editingId ? "Salvar alterações" : "Cadastrar profissional"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
