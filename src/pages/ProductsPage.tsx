import { FormEvent, useState } from "react";
import { CrudPanel } from "../components/CrudPanel";
import { PageHeader } from "../components/PageHeader";
import { Product } from "../types";

type Props = {
  products: Product[];
  createProduct: (input: Omit<Product, "id">) => void;
  updateProduct: (id: string, input: Omit<Product, "id">) => void;
  deleteProduct: (id: string) => void;
};

const emptyForm: Omit<Product, "id"> = {
  name: "",
  category: "",
  sku: "",
  batch: "",
  expiry: "",
  price: 0,
  stock: 0,
  minimumStock: 0,
  unit: "",
  supplier: "",
  description: ""
};

export function ProductsPage({ products, createProduct, updateProduct, deleteProduct }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.category.trim()) return;
    if (editingId) updateProduct(editingId, form);
    else createProduct(form);
    reset();
  };

  return (
    <>
      <PageHeader
        eyebrow="Cadastro de produtos"
        title="Estoque e catalogo em uma tela separada."
        description="Gerencie produtos com SKU, lote, validade, preco, estoque atual e ponto minimo de reposicao."
        badge={`${products.length} itens`}
      />

      <section className="section page-grid">
        <CrudPanel title={editingId ? "Editar produto" : "Novo produto"} subtitle="Controle de estoque">
          <form className="crud-form" onSubmit={submit}>
            <div className="form-grid form-grid-3">
              <label>
                <span>Nome</span>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </label>
              <label>
                <span>Categoria</span>
                <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
              </label>
              <label>
                <span>SKU</span>
                <input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
              </label>
              <label>
                <span>Lote</span>
                <input value={form.batch} onChange={(event) => setForm({ ...form, batch: event.target.value })} />
              </label>
              <label>
                <span>Validade</span>
                <input value={form.expiry} onChange={(event) => setForm({ ...form, expiry: event.target.value })} />
              </label>
              <label>
                <span>Unidade</span>
                <input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
              </label>
              <label>
                <span>Preco</span>
                <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
              </label>
              <label>
                <span>Estoque atual</span>
                <input type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} />
              </label>
              <label>
                <span>Estoque minimo</span>
                <input type="number" min="0" value={form.minimumStock} onChange={(event) => setForm({ ...form, minimumStock: Number(event.target.value) })} />
              </label>
            </div>
            <label>
              <span>Fornecedor</span>
              <input value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} />
            </label>
            <label>
              <span>Descricao</span>
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} />
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit">
                {editingId ? "Salvar alteracoes" : "Cadastrar produto"}
              </button>
              <button className="ghost-button" type="button" onClick={reset}>
                Limpar
              </button>
            </div>
          </form>
        </CrudPanel>

        <CrudPanel title="Lista de produtos" subtitle="Visao operacional do estoque">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Estoque</th>
                  <th>Lote/validade</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <div className="table-subtitle">{product.supplier}</div>
                    </td>
                    <td>{product.category}</td>
                    <td>
                      {product.stock} {product.unit}
                      <div className="table-subtitle">Min. {product.minimumStock}</div>
                    </td>
                    <td>
                      {product.batch || "-"}
                      <div className="table-subtitle">{product.expiry || "-"}</div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="inline-button" type="button" onClick={() => {
                          setEditingId(product.id);
                          setForm(product);
                        }}>
                          Editar
                        </button>
                        <button className="inline-button danger" type="button" onClick={() => deleteProduct(product.id)}>
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
