// components/GruposFamiliares/Tabs/OcorrenciasTab.tsx
import React, { useState } from 'react';
import { Trash2, Calendar, User } from 'lucide-react';
import { Pessoa } from '../../../lib/supabase';

interface OcorrenciasTabProps {
  ocorrencias: GrupoOcorrencia[];
  membros: Pessoa[];
  pessoas: Pessoa[];
  onAdd: (form: OcorrenciaForm) => void;
  onDelete: (id: string) => void;
}

interface GrupoOcorrencia {
  id?: string;
  grupo_id?: string;
  tipo: string;
  data_ocorrencia: string;
  pessoa_id?: string | null;
  descricao?: string | null;
  created_at?: string;
}

interface OcorrenciaForm {
  tipo: string;
  pessoa_id: string;
  data: string;
  descricao: string;
}

export default function OcorrenciasTab({
  ocorrencias = [],
  membros = [],
  pessoas = [],
  onAdd,
  onDelete
}: OcorrenciasTabProps) {
  
  const [form, setForm] = useState<OcorrenciaForm>({
    tipo: '',
    pessoa_id: '',
    data: '',
    descricao: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tipo || !form.data) {
      alert('Tipo e data são obrigatórios');
      return;
    }
    onAdd(form);
    setForm({ tipo: '', pessoa_id: '', data: '', descricao: '' });
  };

  const pessoaNome = (id?: string | null) => {
    if (!id) return '—';
    return pessoas.find(p => p.id === id)?.nome_completo || '—';
  };

  // Tipos sugeridos
  const tiposSugeridos = [
    'Visita',
    'Culto',
    'Reunião',
    'Aniversário',
    'Batismo',
    'Casamento',
    'Óbito',
    'Mudança',
    'Afastamento',
    'Retorno',
    'Evangelismo',
    'Estudo Bíblico',
    'Oração',
    'Jejum',
    'Outros'
  ];

  return (
    <div className="space-y-6">
      {/* Formulário */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-4">Nova Ocorrência do Grupo</h4>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tipo *
            </label>
            <input
              type="text"
              value={form.tipo}
              onChange={(e) => setForm(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              placeholder="Ex: Visita, Culto..."
              list="tipos-sugestoes"
              required
            />
            <datalist id="tipos-sugestoes">
              {tiposSugeridos.map((tipo) => (
                <option key={tipo} value={tipo} />
              ))}
            </datalist>
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Data *
            </label>
            <input
              type="date"
              value={form.data}
              onChange={(e) => setForm(prev => ({ ...prev, data: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              required
            />
          </div>

          {/* Membro */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Membro (opcional)
            </label>
            <select
              value={form.pessoa_id}
              onChange={(e) => setForm(prev => ({ ...prev, pessoa_id: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="">Nenhum</option>
              {membros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome_completo}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição + Botão */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Descrição
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                placeholder="Detalhes..."
              />
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm whitespace-nowrap font-medium"
              >
                Adicionar
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Lista de Ocorrências */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-4">
          Histórico de Ocorrências ({ocorrencias.length})
        </h4>
        
        {ocorrencias.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 italic">Nenhuma ocorrência registrada</p>
            <p className="text-xs text-slate-400 mt-2">
              Registre cultos, reuniões, visitas e outros eventos do grupo
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {ocorrencias.map((ocorrencia) => (
              <div
                key={ocorrencia.id}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        {ocorrencia.tipo}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(ocorrencia.data_ocorrencia).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {ocorrencia.pessoa_id && (
                      <div className="text-sm text-slate-600 flex items-center gap-1 mb-1">
                        <User className="w-3 h-3" />
                        <span className="font-medium">Membro:</span>
                        {pessoaNome(ocorrencia.pessoa_id)}
                      </div>
                    )}

                    {ocorrencia.descricao && (
                      <div className="text-sm text-slate-700 mt-2 pl-4 border-l-2 border-orange-200">
                        {ocorrencia.descricao}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (confirm('Remover esta ocorrência?')) {
                        onDelete(ocorrencia.id!);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    title="Remover ocorrência"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}