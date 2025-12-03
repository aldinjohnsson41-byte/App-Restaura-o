// components/GruposFamiliares/GrupoForm.tsx
import React from 'react';
import { UsersRound, Eye } from 'lucide-react';
import { GrupoWithCounts, FormState } from '../../types/grupos';
import { Pessoa } from '../../lib/supabase';

interface GrupoFormProps {
  editing: GrupoWithCounts | null;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  pessoas: Pessoa[];
  loading: boolean;
  error: string;
  onSubmit: (e?: React.FormEvent) => void;
  onCancel: () => void;
  onRemoveMembro: (id: string) => void;
  onOpenPessoaFicha: (pessoa: Pessoa) => void;
}

export default function GrupoForm({
  editing,
  form,
  setForm,
  pessoas,
  loading,
  error,
  onSubmit,
  onCancel,
  onRemoveMembro,
  onOpenPessoaFicha
}: GrupoFormProps) {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">
        {editing ? 'Editar Grupo Familiar' : 'Novo Grupo Familiar'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nome do Grupo *
          </label>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Ex: Grupo Alpha"
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Descrição
          </label>
          <textarea
            value={form.descricao}
            onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Informações sobre o grupo..."
          />
        </div>

        {/* Liderança */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Liderança</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Líder 1 */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Líder 1
              </label>
              <select
                value={form.lider_1_id}
                onChange={(e) => setForm(prev => ({ ...prev, lider_1_id: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                {pessoas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome_completo}
                  </option>
                ))}
              </select>
            </div>

            {/* Líder 2 */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Líder 2
              </label>
              <select
                value={form.lider_2_id}
                onChange={(e) => setForm(prev => ({ ...prev, lider_2_id: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                {pessoas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome_completo}
                  </option>
                ))}
              </select>
            </div>

            {/* Co-líder 1 */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Co-líder 1
              </label>
              <select
                value={form.co_lider_1_id}
                onChange={(e) => setForm(prev => ({ ...prev, co_lider_1_id: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                {pessoas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome_completo}
                  </option>
                ))}
              </select>
            </div>

            {/* Co-líder 2 */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Co-líder 2
              </label>
              <select
                value={form.co_lider_2_id}
                onChange={(e) => setForm(prev => ({ ...prev, co_lider_2_id: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                {pessoas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome_completo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Membros */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">
              Membros ({form.membros_ids.length})
            </label>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3">
            {form.membros_ids.map((id) => {
              const pessoa = pessoas.find((x) => x.id === id);
              if (!pessoa) return null;

              return (
                <div
                  key={id}
                  className="flex items-center justify-between border border-slate-200 p-3 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <UsersRound className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {pessoa.nome_completo}
                      </div>
                      {pessoa.telefone && (
                        <div className="text-xs text-slate-500">{pessoa.telefone}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenPessoaFicha(pessoa)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Ficha
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveMembro(id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}

            {form.membros_ids.length === 0 && (
              <div className="text-sm text-slate-500 italic text-center py-4">
                Nenhum membro adicionado. Use o modal de visualização para adicionar membros.
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar Grupo'}
          </button>
        </div>
      </form>
    </div>
  );
}