import { FormEvent, useState } from "react";
import { CrudPanel } from "../components/CrudPanel";
import { PageHeader } from "../components/PageHeader";
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

const roleOptions: RoleName[] = ["Administrador", "Recepcao", "Profissional"];

export function ProfessionalsPage({
  professionals,
  createProfessional,
  updateProfessional,
  deleteProfessional
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.specialty.trim()) return;
    if (editingId) updateProfessional(editingId, form);
    else createProfessional(form);
    reset();
  };

  return (
    <>
      <PageHeader
        eyebrow="Cadastro de profissionais"
        title="Controle de equipe com perfil, comissao e dados de contato."
        description="Gerencie profissionais e recepcao em um modulo dedicado, com CRUD completo e base pronta para agenda individual."
        badge={`${professionals.length} perfis`}
      />

      <section className="section page-grid">
        <CrudPanel title={editingId ? "Editar profissional" : "Novo profissional"} subtitle="Equipe da clinica">
          <form className="crud-form" onSubmit={submit}>
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
                  <option value="Ativo">Ativo</option>
                  <option value="Ferias">Ferias</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </label>
              <label>
                <span>Telefone</span>
                <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
              <label>
                <span>Conselho/registro</span>
                <input value={form.council} onChange={(event) => setForm({ ...form, council: event.target.value })} />
              </label>
              <label>
                <span>Comissao</span>
                <input value={form.commissionRate} onChange={(event) => setForm({ ...form, commissionRate: event.target.value })} />
              </label>
            </div>
            <label>
              <span>Proximo turno</span>
              <input value={form.nextShift} onChange={(event) => setForm({ ...form, nextShift: event.target.value })} />
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit">
                {editingId ? "Salvar alteracoes" : "Cadastrar profissional"}
              </button>
              <button className="ghost-button" type="button" onClick={reset}>
                Limpar
              </button>
            </div>
          </form>
        </CrudPanel>

        <CrudPanel title="Lista de profissionais" subtitle="Acompanhamento da equipe">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Profissional</th>
                  <th>Perfil</th>
                  <th>Contato</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {professionals.map((professional) => (
                  <tr key={professional.id}>
                    <td>
                      <strong>{professional.name}</strong>
                      <div className="table-subtitle">{professional.specialty}</div>
                    </td>
                    <td>{professional.role}</td>
                    <td>
                      {professional.phone}
                      <div className="table-subtitle">{professional.email}</div>
                    </td>
                    <td>{professional.status}</td>
                    <td>
                      <div className="row-actions">
                        <button className="inline-button" type="button" onClick={() => {
                          setEditingId(professional.id);
                          setForm(professional);
                        }}>
                          Editar
                        </button>
                        <button className="inline-button danger" type="button" onClick={() => deleteProfessional(professional.id)}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CrudPanel>
      </section>
    </>
  );
}
