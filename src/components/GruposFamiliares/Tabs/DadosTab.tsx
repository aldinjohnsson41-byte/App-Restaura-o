// components/GruposFamiliares/Tabs/DadosTab.tsx
import React, { useState } from 'react';
import { Edit, X, Save } from 'lucide-react';
import { GrupoWithCounts, LeadershipField } from '../../../types/grupos';
import { Pessoa } from '../../../lib/supabase';

interface DadosTabProps {
  grupo: GrupoWithCounts;
  membros: Pessoa[];
  onChangeLeadership: (field: LeadershipField, pessoaId: string, data: string, observacao: string) => void;
  pessoaNomeById: (id?: string | null) => string;
}

interface LeadershipChange {
  field: LeadershipField;
  label: string;
  currentId: string | null;
}

export default function DadosTab({ 
  grupo, 
  membros, 
  onChangeLeadership, 
  pessoaNomeById 
}: DadosTabProps) {
  
  const [showModal, setShowModal] = useState(false);
  const [changingLeadership, setChangingLeadership] = useState<LeadershipChange | null>(null);
  const [newLeaderId, setNewLeaderId] = useState('');
  const [changeDate, setChangeDate] = useState(new Date().toISOString().split('T')[0]);
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const leadershipFields: { label: string; field: LeadershipField }[] = [
    { label: 'Líder 1', field: 'lider_1_id' },
    { label: 'Líder 2', field: 'lider_2_id' },
    { label: 'Co-líder 1', field: 'co_lider_1_id' },
    { label: 'Co-líder 2', field: 'co_lider_2_id' }
  ];

  const openChangeModal = (field: LeadershipField, label: string) => {
    const currentId = (grupo as any)[field] || null;
    setChangingLeadership({ field, label, currentId });
    setNewLeaderId(currentId || '');
    setChangeDate(new Date().toISOString().split('T')[0]);
    setObservacao('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setChangingLeadership(null);
    setNewLeaderId('');
    setObservacao('');
  };

  const handleSubmitChange = async () => {
    if (!changingLeadership) return;
    
    if (!changeDate) {
      alert('Data da alteração é obrigatória');
      return;
    }

    setLoading(true);
    try {
      await onChangeLeadership(
        changingLeadership.field,
        newLeaderId,
        changeDate,
        observacao
      );
      
      // Mostrar feedback de sucesso
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      closeModal();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast de Sucesso */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-[70] animate-in slide-in-from-top">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <div className="p-1 bg-white/20 rounded-full">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">Liderança alterada com sucesso!</div>
              <div className="text-sm text-green-100">Registro adicionado ao histórico</div>
            </div>
          </div>
        </div>
      )}

      {/* Descrição */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Descrição</h4>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-slate-700">
            {(grupo as any).descricao || (
              <span className="text-slate-400 italic">Nenhuma descrição cadastrada</span>
            )}
          </p>
        </div>
      </div>

      {/* Liderança */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Liderança</h4>
        <div className="space-y-3">
          {leadershipFields.map(({ label, field }) => {
            const currentId = (grupo as any)[field];
            const currentName = pessoaNomeById(currentId);
            
            return (
              <div 
                key={field}
                className="bg-white rounded-lg p-4 border border-slate-200 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 mb-1">{label}</div>
                    <div className="font-medium text-slate-900">
                      {currentName}
                    </div>
                  </div>

                  <button
                    onClick={() => openChangeModal(field, label)}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Alterar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estatísticas */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Estatísticas</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-xs text-orange-700 mb-1">Total de Membros</div>
            <div className="text-2xl font-bold text-orange-900">
              {grupo.membros_count || 0}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-xs text-blue-700 mb-1">Líderes</div>
            <div className="text-2xl font-bold text-blue-900">
              {[
                (grupo as any).lider_1_id,
                (grupo as any).lider_2_id
              ].filter(Boolean).length}
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-xs text-purple-700 mb-1">Co-líderes</div>
            <div className="text-2xl font-bold text-purple-900">
              {[
                (grupo as any).co_lider_1_id,
                (grupo as any).co_lider_2_id
              ].filter(Boolean).length}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Alteração de Liderança */}
      {showModal && changingLeadership && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Alterar {changingLeadership.label}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Liderança Atual */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="text-xs text-slate-600 mb-1">Atual</div>
                <div className="font-medium text-slate-900">
                  {pessoaNomeById(changingLeadership.currentId)}
                </div>
              </div>

              {/* Nova Liderança */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nova Liderança *
                </label>
                <select
                  value={newLeaderId}
                  onChange={(e) => setNewLeaderId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">-- Remover liderança --</option>
                  {membros.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome_completo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data da Alteração */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data da Alteração *
                </label>
                <input
                  type="date"
                  value={changeDate}
                  onChange={(e) => setChangeDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Observação */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Observação
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Motivo da alteração, contexto, etc..."
                />
              </div>

              {/* Resumo da Alteração */}
              {newLeaderId !== changingLeadership.currentId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs text-blue-700 font-medium mb-1">
                    Resumo da Alteração:
                  </div>
                  <div className="text-sm text-blue-900">
                    {changingLeadership.currentId ? (
                      <>
                        <span className="font-medium">{pessoaNomeById(changingLeadership.currentId)}</span>
                        {' → '}
                        <span className="font-medium">
                          {newLeaderId ? pessoaNomeById(newLeaderId) : 'Sem liderança'}
                        </span>
                      </>
                    ) : (
                      <>
                        Definir <span className="font-medium">{pessoaNomeById(newLeaderId)}</span> como {changingLeadership.label}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={closeModal}
                disabled={loading}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitChange}
                disabled={loading || !changeDate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Confirmar Alteração'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}