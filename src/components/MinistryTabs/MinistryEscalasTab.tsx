// components/MinistryTabs/MinistryMembrosTab.tsx
import React, { useState, useEffect } from 'react';
import { Plus, X, Eye, Trash2, Search, UserCog } from 'lucide-react';
import { Pessoa } from '../../lib/supabase';
import { StatusBadge } from '../StatusBadge';

interface MinistryMembrosTabProps {
  membros: any[];
  todasPessoas: Pessoa[];
  ministryId: string;
  onAddMember: (pessoa: Pessoa, funcao: 'membro' | 'lider') => void;
  onRemoveMember: (membro: any) => void;
  onUpdateRole: (membro: any, funcao: 'membro' | 'lider') => void;
  onUpdateStatus: (membro: any, status: 'ativo' | 'inativo' | 'afastado') => void;
  formatDate: (date?: string | null) => string;
}

export default function MinistryMembrosTab({
  membros,
  todasPessoas,
  ministryId,
  onAddMember,
  onRemoveMember,
  onUpdateRole,
  onUpdateStatus,
  formatDate
}: MinistryMembrosTabProps) {
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Pessoa[]>([]);

  // IDs das pessoas que já são membros
  const membroIds = membros.map(m => m.pessoa_id);

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults(
        todasPessoas.filter(p => !membroIds.includes(p.id))
      );
      return;
    }

    const query = searchTerm.toLowerCase();
    setSearchResults(
      todasPessoas.filter(
        p =>
          !membroIds.includes(p.id) &&
          (p.nome_completo || '').toLowerCase().includes(query)
      )
    );
  }, [searchTerm, todasPessoas, membroIds]);

  const handleAddMember = (pessoa: Pessoa, funcao: 'membro' | 'lider') => {
    onAddMember(pessoa, funcao);
    setShowAddPanel(false);
    setSearchTerm('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Membros Atuais */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-slate-900">
            Membros ({membros.length})
          </h4>
          <button
            onClick={() => setShowAddPanel(!showAddPanel)}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>

        <div className="max-h-[500px] overflow-auto border border-slate-200 rounded-lg">
          {membros.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <p className="italic">Nenhum membro neste ministério</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {membros.map((membro) => (
                <div
                  key={membro.id}
                  className="p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">
                        {membro.pessoa?.nome_completo || 'Nome não disponível'}
                      </div>
                      {membro.pessoa?.telefone && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {membro.pessoa.telefone}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Remover ${membro.pessoa?.nome_completo}?`)) {
                          onRemoveMember(membro);
                        }
                      }}
                      title="Remover do ministério"
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={membro.funcao} />
                    <StatusBadge status={membro.status} />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Entrada: {formatDate(membro.data_entrada)}</span>
                    {membro.data_saida && (
                      <span>• Saída: {formatDate(membro.data_saida)}</span>
                    )}
                  </div>

                  {/* Ações rápidas */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <select
                      value={membro.funcao}
                      onChange={(e) =>
                        onUpdateRole(membro, e.target.value as 'membro' | 'lider')
                      }
                      className="text-xs px-2 py-1 border border-slate-300 rounded"
                    >
                      <option value="membro">Membro</option>
                      <option value="lider">Líder</option>
                    </select>

                    <select
                      value={membro.status}
                      onChange={(e) =>
                        onUpdateStatus(
                          membro,
                          e.target.value as 'ativo' | 'inativo' | 'afastado'
                        )
                      }
                      className="text-xs px-2 py-1 border border-slate-300 rounded"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="afastado">Afastado</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Painel de Adição */}
      <div>
        {showAddPanel ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">Adicionar Membro</h4>
              <button
                onClick={() => {
                  setShowAddPanel(false);
                  setSearchTerm('');
                }}
                className="p-2 hover:bg-slate-100 rounded transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Resultados */}
            <div className="max-h-[420px] overflow-auto border border-slate-200 rounded-lg">
              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  <p className="italic">
                    {searchTerm
                      ? 'Nenhuma pessoa encontrada'
                      : 'Todas as pessoas já são membros'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {searchResults.map((pessoa) => (
                    <div
                      key={pessoa.id}
                      className="p-4 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">
                            {pessoa.nome_completo}
                          </div>
                          {pessoa.telefone && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {pessoa.telefone}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddMember(pessoa, 'membro')}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                          >
                            Membro
                          </button>
                          <button
                            onClick={() => handleAddMember(pessoa, 'lider')}
                            className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm"
                          >
                            Líder
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full border-2 border-dashed border-slate-200 rounded-lg p-8">
            <div className="text-center text-slate-500">
              <Plus className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm italic">
                Clique em "Adicionar" para
                <br />
                buscar e adicionar membros
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}