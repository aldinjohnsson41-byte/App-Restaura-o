// components/GruposFamiliares/Tabs/EventosTab.tsx
import React, { useState } from 'react';
import { Plus, Calendar, Clock, MapPin, Users, Repeat, Edit, Trash2, X, Save } from 'lucide-react';
import { Pessoa } from '../../../lib/supabase';

interface EventosTabProps {
  eventos: GrupoEvento[];
  membros: Pessoa[];
  grupoId: string;
  onAdd: (evento: EventoForm) => void;
  onUpdate: (id: string, evento: EventoForm) => void;
  onDelete: (id: string) => void;
}

interface GrupoEvento {
  id?: string;
  grupo_id?: string;
  titulo: string;
  tipo: 'reuniao' | 'confraternizacao' | 'culto' | 'estudo' | 'evangelismo' | 'outro';
  descricao?: string | null;
  data_inicio: string;
  data_fim?: string | null;
  local?: string | null;
  endereco?: string | null;
  eh_recorrente: boolean;
  recorrencia_tipo?: 'semanal' | 'quinzenal' | 'mensal' | 'anual' | null;
  recorrencia_dia_semana?: number | null;
  recorrencia_fim?: string | null;
  max_participantes?: number | null;
  requer_confirmacao: boolean;
  responsavel_id?: string | null;
  status?: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
  cor?: string;
}

interface EventoForm {
  titulo: string;
  tipo: string;
  descricao: string;
  data_inicio: string;
  hora_inicio: string;
  local: string;
  endereco: string;
  eh_recorrente: boolean;
  recorrencia_tipo: string;
  recorrencia_dia_semana: number;
  recorrencia_fim: string;
  max_participantes: string;
  requer_confirmacao: boolean;
  responsavel_id: string;
  cor: string;
}

export default function EventosTab({ eventos, membros, grupoId, onAdd, onUpdate, onDelete }: EventosTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventoForm>({
    titulo: '',
    tipo: 'reuniao',
    descricao: '',
    data_inicio: '',
    hora_inicio: '19:00',
    local: '',
    endereco: '',
    eh_recorrente: false,
    recorrencia_tipo: 'semanal',
    recorrencia_dia_semana: 2,
    recorrencia_fim: '',
    max_participantes: '',
    requer_confirmacao: false,
    responsavel_id: '',
    cor: '#3b82f6'
  });

  const tiposEvento = [
    { value: 'reuniao', label: 'Reunião', icon: '👥', color: '#3b82f6' },
    { value: 'confraternizacao', label: 'Confraternização', icon: '🎉', color: '#10b981' },
    { value: 'culto', label: 'Culto', icon: '🙏', color: '#8b5cf6' },
    { value: 'estudo', label: 'Estudo Bíblico', icon: '📖', color: '#f59e0b' },
    { value: 'evangelismo', label: 'Evangelismo', icon: '✝️', color: '#ec4899' },
    { value: 'outro', label: 'Outro', icon: '📅', color: '#64748b' }
  ];

  const diasSemana = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' }
  ];

  const handleOpenForm = (evento?: GrupoEvento) => {
    if (evento) {
      const dataInicio = new Date(evento.data_inicio);
      setEditingId(evento.id || null);
      setForm({
        titulo: evento.titulo,
        tipo: evento.tipo,
        descricao: evento.descricao || '',
        data_inicio: dataInicio.toISOString().split('T')[0],
        hora_inicio: dataInicio.toTimeString().slice(0, 5),
        local: evento.local || '',
        endereco: evento.endereco || '',
        eh_recorrente: evento.eh_recorrente,
        recorrencia_tipo: evento.recorrencia_tipo || 'semanal',
        recorrencia_dia_semana: evento.recorrencia_dia_semana || 2,
        recorrencia_fim: evento.recorrencia_fim || '',
        max_participantes: evento.max_participantes?.toString() || '',
        requer_confirmacao: evento.requer_confirmacao,
        responsavel_id: evento.responsavel_id || '',
        cor: evento.cor || '#3b82f6'
      });
    } else {
      setEditingId(null);
      setForm({
        titulo: '',
        tipo: 'reuniao',
        descricao: '',
        data_inicio: '',
        hora_inicio: '19:00',
        local: '',
        endereco: '',
        eh_recorrente: false,
        recorrencia_tipo: 'semanal',
        recorrencia_dia_semana: 2,
        recorrencia_fim: '',
        max_participantes: '',
        requer_confirmacao: false,
        responsavel_id: '',
        cor: '#3b82f6'
      });
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.titulo) {
      alert('Título é obrigatório');
      return;
    }

    // Se não for recorrente, data é obrigatória
    if (!form.eh_recorrente && !form.data_inicio) {
      alert('Data é obrigatória para eventos não recorrentes');
      return;
    }

    if (editingId) {
      onUpdate(editingId, form);
    } else {
      onAdd(form);
    }
    setShowForm(false);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecorrenciaLabel = (evento: GrupoEvento) => {
    if (!evento.eh_recorrente) return null;
    const tipo = evento.recorrencia_tipo;
    const dia = diasSemana.find(d => d.value === evento.recorrencia_dia_semana)?.label;
    
    if (tipo === 'semanal' && dia) return `Toda ${dia}`;
    if (tipo === 'quinzenal' && dia) return `A cada 2 ${dia}s`;
    if (tipo === 'mensal') return 'Mensal';
    if (tipo === 'anual') return 'Anual';
    return 'Recorrente';
  };

  const getTipoInfo = (tipo: string) => {
    return tiposEvento.find(t => t.value === tipo) || tiposEvento[0];
  };

  return (
    <div className="space-y-6">
      {/* Header com botão */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-slate-900">Eventos e Reuniões</h4>
          <p className="text-sm text-slate-600">Gerencie reuniões semanais e eventos especiais</p>
        </div>
        {!showForm && (
          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Novo Evento
          </button>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white border-2 border-indigo-300 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-semibold text-slate-900">
              {editingId ? 'Editar Evento' : 'Novo Evento'}
            </h5>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recorrência primeiro (para definir se data é obrigatória) */}
            <div className="bg-slate-50 rounded-lg p-4 border">
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={form.eh_recorrente}
                  onChange={(e) => setForm(prev => ({ ...prev, eh_recorrente: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <Repeat className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-700">Evento Recorrente</span>
              </label>

              {form.eh_recorrente && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Repetir
                    </label>
                    <select
                      value={form.recorrencia_tipo}
                      onChange={(e) => setForm(prev => ({ ...prev, recorrencia_tipo: e.target.value }))}
                      className="w-full px-2 py-1.5 border rounded text-sm"
                    >
                      <option value="semanal">Semanalmente</option>
                      <option value="quinzenal">Quinzenalmente</option>
                      <option value="mensal">Mensalmente</option>
                      <option value="anual">Anualmente</option>
                    </select>
                  </div>

                  {(form.recorrencia_tipo === 'semanal' || form.recorrencia_tipo === 'quinzenal') && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Dia da semana
                      </label>
                      <select
                        value={form.recorrencia_dia_semana}
                        onChange={(e) => setForm(prev => ({ ...prev, recorrencia_dia_semana: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1.5 border rounded text-sm"
                      >
                        {diasSemana.map(dia => (
                          <option key={dia.value} value={dia.value}>{dia.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Termina em (opcional)
                    </label>
                    <input
                      type="date"
                      value={form.recorrencia_fim}
                      onChange={(e) => setForm(prev => ({ ...prev, recorrencia_fim: e.target.value }))}
                      className="w-full px-2 py-1.5 border rounded text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Título */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Reunião Semanal"
                  required
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo *
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => {
                    const tipoSelecionado = tiposEvento.find(t => t.value === e.target.value);
                    setForm(prev => ({ ...prev, tipo: e.target.value, cor: tipoSelecionado?.color || prev.cor }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {tiposEvento.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.icon} {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Responsável
                </label>
                <select
                  value={form.responsavel_id}
                  onChange={(e) => setForm(prev => ({ ...prev, responsavel_id: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Nenhum</option>
                  {membros.map(m => (
                    <option key={m.id} value={m.id}>{m.nome_completo}</option>
                  ))}
                </select>
              </div>

              {/* Data - Obrigatória apenas se NÃO for recorrente */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data {!form.eh_recorrente && '*'}
                  {form.eh_recorrente && (
                    <span className="text-xs text-slate-500 ml-2">(opcional para eventos recorrentes)</span>
                  )}
                </label>
                <input
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => setForm(prev => ({ ...prev, data_inicio: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required={!form.eh_recorrente}
                />
              </div>

              {/* Hora */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hora
                </label>
                <input
                  type="time"
                  value={form.hora_inicio}
                  onChange={(e) => setForm(prev => ({ ...prev, hora_inicio: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Local */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Local
                </label>
                <input
                  type="text"
                  value={form.local}
                  onChange={(e) => setForm(prev => ({ ...prev, local: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Casa do líder"
                />
              </div>

              {/* Máximo de Participantes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Máx. Participantes
                </label>
                <input
                  type="number"
                  value={form.max_participantes}
                  onChange={(e) => setForm(prev => ({ ...prev, max_participantes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ilimitado"
                />
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Detalhes sobre o evento..."
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Salvar' : 'Criar Evento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Eventos */}
      <div className="space-y-3">
        {eventos.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium mb-2">Nenhum evento cadastrado</p>
            <p className="text-sm text-slate-500">Crie reuniões semanais ou eventos especiais</p>
          </div>
        ) : (
          eventos.map((evento) => {
            const tipoInfo = getTipoInfo(evento.tipo);
            const recorrenciaLabel = getRecorrenciaLabel(evento);
            
            return (
              <div
                key={evento.id}
                className="bg-white border-2 border-slate-200 rounded-lg p-4 hover:shadow-md transition"
                style={{ borderLeftColor: evento.cor, borderLeftWidth: '4px' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{tipoInfo.icon}</span>
                      <div>
                        <h5 className="font-semibold text-slate-900">{evento.titulo}</h5>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${evento.cor}20`, color: evento.cor }}
                        >
                          {tipoInfo.label}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm text-slate-600">
                      {evento.data_inicio && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDateTime(evento.data_inicio)}</span>
                        </div>
                      )}
                      
                      {evento.local && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{evento.local}</span>
                        </div>
                      )}
                      
                      {evento.max_participantes && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Até {evento.max_participantes} pessoas</span>
                        </div>
                      )}
                      
                      {recorrenciaLabel && (
                        <div className="flex items-center gap-2">
                          <Repeat className="w-4 h-4 text-indigo-600" />
                          <span className="text-indigo-600 font-medium">{recorrenciaLabel}</span>
                        </div>
                      )}
                    </div>

                    {evento.descricao && (
                      <p className="text-sm text-slate-600 mt-3 pl-6 border-l-2 border-slate-200">
                        {evento.descricao}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenForm(evento)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir evento "${evento.titulo}"?`)) {
                          onDelete(evento.id!);
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}