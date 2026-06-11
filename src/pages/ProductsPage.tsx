import { FormEvent, useState } from "react";
import { CrudPanel } from "../components/CrudPanel";
import { PageTopbar } from "../components/PageTopbar";
import { Product } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

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
  unitCost: 0,
  purchaseDate: "",
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
      <PageTopbar title="Produtos" subtitle="Controle de estoque e produtos." />

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
                <span>Unidade</span>
                <input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
              </label>
              <label>
                <span>Quantidade em estoque</span>
                <input type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} />
              </label>
              <label>
                <span>Custo unitario</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitCost}
                  onChange={(event) => setForm({ ...form, unitCost: Number(event.target.value), price: Number(event.target.value) })}
                />
              </label>
              <label>
                <span>Valor total em estoque</span>
                <input value={formatCurrency(form.stock * form.unitCost)} readOnly />
              </label>
              <label>
                <span>Data da compra</span>
                <input type="date" value={form.purchaseDate} onChange={(event) => setForm({ ...form, purchaseDate: event.target.value })} />
              </label>
            </div>
            <label>
              <span>Fornecedor</span>
              <input value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} />
            </label>
            <label>
              <span>Observacoes</span>
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
                  <th>Custo unitario</th>
                  <th>Total em estoque</th>
                  <th>Compra</th>
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
                    </td>
                    <td>{formatCurrency(product.unitCost)}</td>
                    <td>{formatCurrency(product.stock * product.unitCost)}</td>
                    <td>
                      {product.purchaseDate ? formatDate(product.purchaseDate) : "-"}
                      <div className="table-subtitle">{product.description || "-"}</div>
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
