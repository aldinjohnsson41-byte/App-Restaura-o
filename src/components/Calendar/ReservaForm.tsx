import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Calendar, Clock, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { EspacoFisico, ReservaFormData } from '../../types/calendar';
import { formatarDataBR, formatarHora } from '../../utils/calendarUtils';

interface ReservaFormComponentProps {
  onSalvar: (data: ReservaFormData) => Promise<void>;
  onCancelar: () => void;
  loading?: boolean;
}

export default function ReservaForm({
  onSalvar,
  onCancelar,
  loading = false,
}: ReservaFormComponentProps) {
  const [espacos, setEspacos] = useState<EspacoFisico[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [disponibilidade, setDisponibilidade] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    espaco_id: '',
    data_reserva: new Date().toISOString().split('T')[0],
    hora_inicio: '09:00',
    hora_fim: '12:00',
    responsavel_nome: '',
    responsavel_email: '',
    responsavel_telefone: '',
    status: 'confirmada' as const,
    valor_locacao: '',
    observacoes: '',
  });

  useEffect(() => {
    carregarEspacos();
  }, []);

  const carregarEspacos = async () => {
    const { data } = await supabase
      .from('espacos_fisicos')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (data) setEspacos(data);
  };

  const carregarDisponibilidade = async (espacoId: string, data: string) => {
    if (!espacoId || !data) return;

    const diaSemana = new Date(`${data}T00:00:00`).getDay();

    const { data: disponibilidadeData } = await supabase
      .from('disponibilidade_espacos')
      .select('*')
      .eq('espaco_id', espacoId)
      .eq('dia_semana', diaSemana)
      .eq('disponivel', true);

    if (disponibilidadeData) {
      setDisponibilidade(disponibilidadeData);
    }
  };

  const verificarDisponiblidade = async (): Promise<boolean> => {
    const { data: conflitos } = await supabase
      .from('eventos_agenda')
      .select('id, nome, hora_inicio, hora_fim')
      .eq('espaco_id', formData.espaco_id)
      .eq('data_evento', formData.data_reserva)
      .eq('status', 'confirmado');

    if (conflitos && conflitos.length > 0) {
      const temSobreposicao = conflitos.some((e: any) => {
        if (!e.hora_inicio || !e.hora_fim) return false;
        return !(e.hora_fim <= formData.hora_inicio || e.hora_inicio >= formData.hora_fim);
      });

      if (temSobreposicao) {
        setError('Existe um evento confirmado neste horário');
        return false;
      }
    }

    const { data: reservas } = await supabase
      .from('reservas_espacos')
      .select('id, responsavel_nome, hora_inicio, hora_fim')
      .eq('espaco_id', formData.espaco_id)
      .eq('data_reserva', formData.data_reserva)
      .eq('status', 'confirmada');

    if (reservas && reservas.length > 0) {
      const temSobreposicao = reservas.some((r: any) => {
        return !(r.hora_fim <= formData.hora_inicio || r.hora_inicio >= formData.hora_fim);
      });

      if (temSobreposicao) {
        setError('Este espaço já está reservado neste horário');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.responsavel_nome.trim()) {
      setError('Nome do responsável é obrigatório');
      return;
    }

    if (!formData.espaco_id) {
      setError('Selecione um espaço');
      return;
    }

    if (formData.hora_inicio >= formData.hora_fim) {
      setError('Horário de início deve ser menor que horário de fim');
      return;
    }

    try {
      setSubmitting(true);

      const disponivel = await verificarDisponiblidade();
      if (!disponivel) {
        return;
      }

      await onSalvar(formData);
      setFormData({
        espaco_id: '',
        data_reserva: new Date().toISOString().split('T')[0],
        hora_inicio: '09:00',
        hora_fim: '12:00',
        responsavel_nome: '',
        responsavel_email: '',
        responsavel_telefone: '',
        status: 'confirmada',
        valor_locacao: '',
        observacoes: '',
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const espacoSelecionado = espacos.find((e) => e.id === formData.espaco_id);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Nova Reserva de Espaço
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Espaço *
            </label>
            <select
              required
              value={formData.espaco_id}
              onChange={(e) => {
                setFormData({ ...formData, espaco_id: e.target.value });
                carregarDisponibilidade(e.target.value, formData.data_reserva);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um espaço...</option>
              {espacos.map((espaco) => (
                <option key={espaco.id} value={espaco.id}>
                  {espaco.nome} (cap. {espaco.capacidade || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data da Reserva *
            </label>
            <input
              type="date"
              required
              value={formData.data_reserva}
              onChange={(e) => {
                setFormData({ ...formData, data_reserva: e.target.value });
                carregarDisponibilidade(formData.espaco_id, e.target.value);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {espacoSelecionado && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
            <strong>{espacoSelecionado.nome}</strong>
            {espacoSelecionado.descricao && <p>{espacoSelecionado.descricao}</p>}
            {espacoSelecionado.equipamentos && (
              <p className="text-xs mt-1">
                Equipamentos: {espacoSelecionado.equipamentos.join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Horário de Início *
            </label>
            <input
              type="time"
              required
              value={formData.hora_inicio}
              onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Horário de Fim *
            </label>
            <input
              type="time"
              required
              value={formData.hora_fim}
              onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {disponibilidade.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            <strong>Disponibilidade:</strong>
            {disponibilidade.map((d, idx) => (
              <div key={idx}>
                {formatarHora(d.hora_inicio)} às {formatarHora(d.hora_fim)}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome do Responsável *
            </label>
            <input
              type="text"
              required
              value={formData.responsavel_nome}
              onChange={(e) => setFormData({ ...formData, responsavel_nome: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: João Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.responsavel_email}
              onChange={(e) => setFormData({ ...formData, responsavel_email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="email@exemplo.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.responsavel_telefone}
              onChange={(e) => setFormData({ ...formData, responsavel_telefone: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Valor da Locação (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.valor_locacao}
              onChange={(e) => setFormData({ ...formData, valor_locacao: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0,00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Observações
          </label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Informações adicionais sobre a reserva..."
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
            {submitting || loading ? 'Salvando...' : 'Confirmar Reserva'}
          </button>
        </div>
      </form>
    </div>
  );
}
