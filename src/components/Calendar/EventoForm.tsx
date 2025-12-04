import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { EventoAgenda, EspacoFisico } from '../../types/calendar';
import { formatarData } from '../../utils/calendarUtils';

interface EventoFormProps {
  evento?: EventoAgenda | null;
  onSalvar: (data: any) => Promise<void>;
  onCancelar: () => void;
  loading?: boolean;
}

export default function EventoForm({
  evento,
  onSalvar,
  onCancelar,
  loading = false,
}: EventoFormProps) {
  const [espacos, setEspacos] = useState<EspacoFisico[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    data_evento: formatarData(new Date()),
    hora_inicio: '09:00',
    hora_fim: '10:00',
    dia_inteiro: false,
    local: '',
    espaco_id: '',
    status: 'confirmado' as const,
    observacoes: '',
    participantes_ids: [] as string[],
  });

  useEffect(() => {
    carregarEspacos();
    if (evento) {
      setFormData({
        nome: evento.nome,
        descricao: evento.descricao || '',
        data_evento: evento.data_evento,
        hora_inicio: evento.hora_inicio || '09:00',
        hora_fim: evento.hora_fim || '10:00',
        dia_inteiro: evento.dia_inteiro,
        local: evento.local || '',
        espaco_id: evento.espaco_id || '',
        status: evento.status,
        observacoes: evento.observacoes || '',
        participantes_ids: [],
      });
    }
  }, [evento]);

  const carregarEspacos = async () => {
    const { data } = await supabase
      .from('espacos_fisicos')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (data) setEspacos(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nome.trim()) {
      setError('Nome do evento é obrigatório');
      return;
    }

    if (!formData.dia_inteiro && !formData.hora_inicio) {
      setError('Horário de início é obrigatório');
      return;
    }

    if (!formData.dia_inteiro && !formData.hora_fim) {
      setError('Horário de fim é obrigatório');
      return;
    }

    try {
      setSubmitting(true);
      await onSalvar(formData);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar evento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          {evento ? 'Editar Evento' : 'Novo Evento'}
        </h3>
        <button
          onClick={onCancelar}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <X className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nome do Evento *
          </label>
          <input
            type="text"
            required
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Culto, Reunião, Confraternização..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Descrição
          </label>
          <textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Detalhes do evento..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data do Evento *
            </label>
            <input
              type="date"
              required
              value={formData.data_evento}
              onChange={(e) => setFormData({ ...formData, data_evento: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.dia_inteiro}
                onChange={(e) => setFormData({ ...formData, dia_inteiro: e.target.checked })}
                className="w-4 h-4 border border-slate-300 rounded"
              />
              <span className="text-sm font-medium text-slate-700">Dia inteiro</span>
            </label>
          </div>
        </div>

        {!formData.dia_inteiro && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Horário de Início
              </label>
              <input
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Horário de Fim
              </label>
              <input
                type="time"
                value={formData.hora_fim}
                onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Local
          </label>
          <input
            type="text"
            value={formData.local}
            onChange={(e) => setFormData({ ...formData, local: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descrição do local..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Espaço da Igreja
          </label>
          <select
            value={formData.espaco_id}
            onChange={(e) => setFormData({ ...formData, espaco_id: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione um espaço...</option>
            {espacos.map((espaco) => (
              <option key={espaco.id} value={espaco.id}>
                {espaco.nome} (cap. {espaco.capacidade})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="confirmado">Confirmado</option>
            <option value="pendente">Pendente</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Observações
          </label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Notas adicionais..."
          />
        </div>

        <div className="flex gap-3 justify-end pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {submitting || loading ? 'Salvando...' : 'Salvar Evento'}
          </button>
        </div>
      </form>
    </div>
  );
}
