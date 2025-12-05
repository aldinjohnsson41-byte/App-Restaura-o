// components/ministerios/Modals.tsx
import React from 'react';
import { X, Save, Calendar, UserPlus, Users } from 'lucide-react';
import { 
  Pessoa, 
  MinistryMemberRow, 
  MemberFormData, 
  ScheduleFormData,
  MemberRole,
  MemberStatus
} from './types';
import { StatusBadge } from './utils';

// ============= MODAL DE MEMBRO =============
interface MemberModalProps {
  show: boolean;
  onClose: () => void;
  onSave: () => void;
  editing: MinistryMemberRow | null;
  formData: MemberFormData;
  setFormData: React.Dispatch<React.SetStateAction<MemberFormData>>;
  allPeople: Pessoa[];
  existingMemberIds: string[];
}

export const MemberModal: React.FC<MemberModalProps> = ({
  show,
  onClose,
  onSave,
  editing,
  formData,
  setFormData,
  allPeople,
  existingMemberIds
}) => {
  if (!show) return null;

  const allowedPeople = allPeople.filter(p => 
    editing ? true : !existingMemberIds.includes(p.id)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="border-b px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              {editing ? 'Editar Membro' : 'Adicionar Membro'}
            </h3>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pessoa *
            </label>
            <select
              value={formData.pessoa_id}
              onChange={(e) => setFormData({ ...formData, pessoa_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!!editing}
            >
              <option value="">Selecione uma pessoa</option>
              {allowedPeople.map(p => (
                <option key={p.id} value={p.id}>{p.nome_completo}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Função
              </label>
              <select
                value={formData.funcao}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  funcao: e.target.value as MemberRole 
                })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="membro">Membro</option>
                <option value="lider">Líder</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  status: e.target.value as MemberStatus 
                })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="afastado">Afastado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data de Entrada
            </label>
            <input
              type="date"
              value={formData.data_entrada}
              onChange={(e) => setFormData({ 
                ...formData, 
                data_entrada: e.target.value 
              })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {editing ? 'Atualizar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============= MODAL DE ESCALA =============
interface ScheduleModalProps {
  show: boolean;
  onClose: () => void;
  onSave: () => void;
  editing: any | null;
  formData: ScheduleFormData;
  setFormData: React.Dispatch<React.SetStateAction<ScheduleFormData>>;
  activeMembers: MinistryMemberRow[];
  selectedMembers: string[];
  toggleMember: (pessoaId: string) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  show,
  onClose,
  onSave,
  editing,
  formData,
  setFormData,
  activeMembers,
  selectedMembers,
  toggleMember
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              {editing ? 'Editar Escala' : 'Nova Escala'}
            </h3>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data da Escala *
            </label>
            <input
              type="date"
              value={formData.data_escala}
              onChange={(e) => setFormData({ 
                ...formData, 
                data_escala: e.target.value 
              })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Horário Início
              </label>
              <input
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  hora_inicio: e.target.value 
                })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Horário Fim
              </label>
              <input
                type="time"
                value={formData.hora_fim}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  hora_fim: e.target.value 
                })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-700">
                Selecionar Membros * ({selectedMembers.length} selecionado
                {selectedMembers.length !== 1 ? 's' : ''})
              </label>
              {activeMembers.length > 0 && (
                <button
                  onClick={() => {
                    if (selectedMembers.length === activeMembers.length) {
                      toggleMember(''); // Signal to clear all
                    } else {
                      activeMembers.forEach(m => {
                        if (!selectedMembers.includes(m.pessoa_id)) {
                          toggleMember(m.pessoa_id);
                        }
                      });
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedMembers.length === activeMembers.length 
                    ? 'Desmarcar Todos' 
                    : 'Selecionar Todos'}
                </button>
              )}
            </div>

            {activeMembers.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <UserPlus className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">Nenhum membro ativo disponível</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-2">
                {activeMembers.map(member => (
                  <label
                    key={member.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                      selectedMembers.includes(member.pessoa_id)
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'bg-white border-2 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.pessoa_id)}
                      onChange={() => toggleMember(member.pessoa_id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">
                        {member.pessoa?.nome_completo || member.pessoa_id}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                        <StatusBadge status={member.funcao || 'membro'} />
                        {member.pessoa?.email && (
                          <span>{member.pessoa.email}</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ 
                ...formData, 
                observacoes: e.target.value 
              })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Informações adicionais..."
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {editing ? 'Salvar Alterações' : 'Criar Escala'}
          </button>
        </div>
      </div>
    </div>
  );
};