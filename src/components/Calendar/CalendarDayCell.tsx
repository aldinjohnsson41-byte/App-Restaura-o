import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, Trash2, MapPin, Users, Calendar, Clock, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

// Mock do supabase
const mockSupabase = {
  from: (table: string) => ({
    select: (fields: string) => ({
      eq: (col: string, val: any) => ({
        order: (field: string) => ({
          data: [
            { id: '1', nome: 'Salão Principal', capacidade: 200, localizacao: 'Térreo' },
            { id: '2', nome: 'Auditório', capacidade: 100, localizacao: '1º Andar' }
          ],
          error: null
        })
      }),
      or: (query: string) => ({
        order: (field: string) => ({
          limit: (n: number) => ({
            data: [
              { id: '1', nome_completo: 'João Silva', email: 'joao@email.com', telefone: '(11) 99999-9999' },
              { id: '2', nome_completo: 'Maria Santos', email: 'maria@email.com', telefone: '(11) 98888-8888' },
              { id: '3', nome_completo: 'Pedro Oliveira', email: 'pedro@email.com', telefone: '(11) 97777-7777' }
            ],
            error: null
          })
        })
      }),
      ilike: (col: string, val: string) => ({
        order: (field: string) => ({
          limit: (n: number) => ({
            data: [
              { id: '1', nome_completo: 'João Silva', email: 'joao@email.com', telefone: '(11) 99999-9999' },
              { id: '2', nome_completo: 'Maria Santos', email: 'maria@email.com', telefone: '(11) 98888-8888' }
            ],
            error: null
          })
        })
      })
    }),
    insert: (data: any) => ({ 
      select: () => ({ 
        single: () => ({ data: { ...data, id: Math.random().toString() }, error: null }) 
      })
    }),
    update: (data: any) => ({
      eq: (col: string, val: any) => ({ 
        select: () => ({ 
          single: () => ({ data: { ...data, id: val }, error: null }) 
        })
      })
    })
  })
};

// Tipos
interface Evento {
  id: string;
  nome: string;
  descricao?: string;
  data_evento: string;
  data_fim?: string;
  hora_inicio?: string;
  hora_fim?: string;
  dia_inteiro: boolean;
  multiplos_dias: boolean;
  endereco_completo?: string;
  espaco_id?: string;
  status: 'confirmado' | 'pendente' | 'cancelado';
  observacoes?: string;
  participantes: any[];
  espaco?: any;
}

interface CalendarDay {
  dia: number;
  ehMes: boolean;
  ehHoje: boolean;
  eventos: Evento[];
  data: string;
}

// Componente: Modal de Visualização do Dia Expandido
function DayViewModal({ dia, onClose, onEditEvento }: { dia: CalendarDay; onClose: () => void; onEditEvento: (e: Evento) => void }) {
  const eventosOrdenados = [...dia.eventos].sort((a, b) => {
    if (a.dia_inteiro && !b.dia_inteiro) return -1;
    if (!a.dia_inteiro && b.dia_inteiro) return 1;
    if (!a.hora_inicio || !b.hora_inicio) return 0;
    return a.hora_inicio.localeCompare(b.hora_inicio);
  });

  const obterCoresStatus = (status: string) => {
    const cores = {
      confirmado: 'bg-green-100 text-green-800 border-green-300',
      pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      cancelado: 'bg-red-100 text-red-800 border-red-300'
    };
    return cores[status as keyof typeof cores] || 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const calcularPosicaoHorario = (hora: string) => {
    const [h, m] = hora.split(':').map(Number);
    const minutos = h * 60 + m;
    const inicioTrabalho = 6 * 60; // 6:00
    const fimTrabalho = 22 * 60; // 22:00
    const totalMinutos = fimTrabalho - inicioTrabalho;
    return ((minutos - inicioTrabalho) / totalMinutos) * 100;
  };

  const calcularAlturaEvento = (inicio: string, fim: string) => {
    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fim.split(':').map(Number);
    const minutosInicio = hi * 60 + mi;
    const minutosFim = hf * 60 + mf;
    const duracao = minutosFim - minutosInicio;
    const totalMinutos = (22 - 6) * 60;
    return (duracao / totalMinutos) * 100;
  };

  const formatarDataCompleta = (dataStr: string) => {
    const data = new Date(dataStr + 'T12:00:00');
    return data.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const eventosDiaInteiro = eventosOrdenados.filter(e => e.dia_inteiro);
  const eventosHorario = eventosOrdenados.filter(e => !e.dia_inteiro);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-1 capitalize">
                {formatarDataCompleta(dia.data)}
              </h3>
              <p className="text-blue-100">
                {dia.eventos.length} evento(s) programado(s)
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Eventos de Dia Inteiro */}
          {eventosDiaInteiro.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Eventos de Dia Inteiro
              </h4>
              <div className="space-y-2">
                {eventosDiaInteiro.map((evento) => (
                  <div
                    key={evento.id}
                    onClick={() => onEditEvento(evento)}
                    className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition ${obterCoresStatus(evento.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-bold text-lg mb-1">{evento.nome}</h5>
                        {evento.descricao && (
                          <p className="text-sm opacity-80 line-clamp-2">{evento.descricao}</p>
                        )}
                        {evento.espaco && (
                          <div className="flex items-center gap-1 mt-2 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{evento.espaco.nome}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded bg-white/50">
                        {evento.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline de Horários */}
          {eventosHorario.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Timeline de Horários
              </h4>
              <div className="relative bg-slate-50 rounded-lg p-4 border border-slate-200">
                {/* Grid de Horários */}
                <div className="relative" style={{ height: '800px' }}>
                  {/* Linhas de hora */}
                  {Array.from({ length: 17 }, (_, i) => i + 6).map((hora) => (
                    <div
                      key={hora}
                      className="absolute left-0 right-0 border-t border-slate-300"
                      style={{ top: `${((hora - 6) / 16) * 100}%` }}
                    >
                      <span className="absolute -left-2 -top-3 text-xs text-slate-500 bg-slate-50 px-1">
                        {String(hora).padStart(2, '0')}:00
                      </span>
                    </div>
                  ))}

                  {/* Eventos posicionados */}
                  <div className="absolute left-16 right-0 top-0 bottom-0">
                    {eventosHorario.map((evento, idx) => (
                      <div
                        key={evento.id}
                        onClick={() => onEditEvento(evento)}
                        className={`absolute left-0 right-0 rounded-lg border-2 p-3 cursor-pointer hover:shadow-lg transition-all ${obterCoresStatus(evento.status)}`}
                        style={{
                          top: `${calcularPosicaoHorario(evento.hora_inicio || '09:00')}%`,
                          height: `${calcularAlturaEvento(evento.hora_inicio || '09:00', evento.hora_fim || '10:00')}%`,
                          minHeight: '60px',
                          zIndex: 10 + idx
                        }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-bold">
                              {evento.hora_inicio?.substring(0, 5)} - {evento.hora_fim?.substring(0, 5)}
                            </span>
                          </div>
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/50">
                            {evento.status}
                          </span>
                        </div>
                        <h5 className="font-bold mb-1">{evento.nome}</h5>
                        {evento.descricao && (
                          <p className="text-xs opacity-80 line-clamp-2">{evento.descricao}</p>
                        )}
                        {evento.espaco && (
                          <div className="flex items-center gap-1 mt-1 text-xs">
                            <MapPin className="w-3 h-3" />
                            <span>{evento.espaco.nome}</span>
                          </div>
                        )}
                        {evento.participantes?.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs">
                            <Users className="w-3 h-3" />
                            <span>{evento.participantes.length} participante(s)</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {dia.eventos.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Nenhum evento programado para este dia</p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente: Célula do Calendário Melhorada
function CalendarDayCellMelhorado({ 
  dia, 
  onSelectEvento, 
  onClickDia 
}: { 
  dia: CalendarDay; 
  onSelectEvento: (e: Evento) => void;
  onClickDia: (dia: CalendarDay) => void;
}) {
  const [showPreview, setShowPreview] = useState(false);

  const eventosOrdenados = [...dia.eventos].sort((a, b) => {
    if (a.dia_inteiro && !b.dia_inteiro) return -1;
    if (!a.dia_inteiro && b.dia_inteiro) return 1;
    if (!a.hora_inicio || !b.hora_inicio) return 0;
    return a.hora_inicio.localeCompare(b.hora_inicio);
  });

  const maxVisible = 2;
  const eventosVisiveis = eventosOrdenados.slice(0, maxVisible);
  const eventosRestantes = eventosOrdenados.length - maxVisible;

  const obterCoresStatus = (status: string) => {
    const cores = {
      confirmado: 'bg-green-100 text-green-800 border-green-300',
      pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      cancelado: 'bg-red-100 text-red-800 border-red-300'
    };
    return cores[status as keyof typeof cores] || 'bg-blue-100 text-blue-800 border-blue-300';
  };

  return (
    <div
      className={`min-h-32 border border-slate-200 p-2 transition-all hover:shadow-md ${
        !dia.ehMes ? 'bg-slate-50' : 'bg-white'
      } ${dia.ehHoje ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : ''} relative cursor-pointer`}
      onClick={() => onClickDia(dia)}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={`font-semibold text-sm ${
            dia.ehMes ? 'text-slate-900' : 'text-slate-400'
          } ${dia.ehHoje ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : ''}`}
        >
          {dia.dia}
        </span>
        {dia.eventos.length > 0 && (
          <span className="text-xs bg-slate-700 text-white rounded-full px-2 py-0.5">
            {dia.eventos.length}
          </span>
        )}
      </div>

      <div className="space-y-1">
        {eventosVisiveis.map((evento) => (
          <button
            key={evento.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectEvento(evento);
            }}
            className={`w-full text-left text-xs px-2 py-1 rounded hover:opacity-80 transition truncate border ${obterCoresStatus(evento.status)}`}
            title={`${evento.nome}${evento.hora_inicio ? ` - ${evento.hora_inicio.substring(0, 5)}` : ''}`}
          >
            <div className="flex items-center gap-1">
              {!evento.dia_inteiro && evento.hora_inicio && (
                <Clock className="w-3 h-3 flex-shrink-0" />
              )}
              <span className="truncate">
                {evento.dia_inteiro ? '📅 ' : `${evento.hora_inicio?.substring(0, 5)} `}
                {evento.nome}
              </span>
            </div>
          </button>
        ))}

        {eventosRestantes > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClickDia(dia);
            }}
            className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition flex items-center justify-between font-medium"
          >
            <span>+{eventosRestantes} mais</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// Componente: Formulário de Evento (CORRIGIDO)
function EventoFormCorrigido({ 
  evento, 
  onSalvar, 
  onCancelar 
}: { 
  evento?: Evento | null; 
  onSalvar: (data: any) => void; 
  onCancelar: () => void;
}) {
  const [espacos, setEspacos] = useState<any[]>([]);
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchPessoa, setSearchPessoa] = useState<string>('');
  const [loadingPessoas, setLoadingPessoas] = useState(false);

  const [formData, setFormData] = useState<any>({
    nome: evento?.nome || '',
    descricao: evento?.descricao || '',
    data_inicio: evento?.data_evento || new Date().toISOString().split('T')[0],
    data_fim: evento?.data_fim || new Date().toISOString().split('T')[0],
    hora_inicio: evento?.hora_inicio || '09:00',
    hora_fim: evento?.hora_fim || '10:00',
    dia_inteiro: evento?.dia_inteiro || false,
    multiplos_dias: evento?.multiplos_dias || false,
    endereco_completo: evento?.endereco_completo || '',
    espaco_id: evento?.espaco_id || '',
    status: evento?.status || 'confirmado',
    observacoes: evento?.observacoes || '',
    participantes: evento?.participantes || []
  });

  useEffect(() => {
    carregarEspacos();
  }, []);

  // Atualizar formData quando evento mudar (FIX PRINCIPAL)
  useEffect(() => {
    if (evento) {
      setFormData({
        nome: evento.nome || '',
        descricao: evento.descricao || '',
        data_inicio: evento.data_evento || new Date().toISOString().split('T')[0],
        data_fim: evento.data_fim || new Date().toISOString().split('T')[0],
        hora_inicio: evento.hora_inicio || '09:00',
        hora_fim: evento.hora_fim || '10:00',
        dia_inteiro: evento.dia_inteiro || false,
        multiplos_dias: evento.multiplos_dias || false,
        endereco_completo: evento.endereco_completo || '',
        espaco_id: evento.espaco_id || '',
        status: evento.status || 'confirmado',
        observacoes: evento.observacoes || '',
        participantes: evento.participantes || []
      });
    }
  }, [evento]);

  // Buscar pessoas com debounce (FIX BUSCA)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchPessoa.length >= 2) {
        buscarPessoas(searchPessoa);
      } else {
        setPessoas([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchPessoa]);

  const carregarEspacos = async () => {
    try {
      const { data, error } = await mockSupabase
        .from('espacos_fisicos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setEspacos(data || []);
    } catch (err) {
      console.error('Erro ao carregar espaços:', err);
    }
  };

  const buscarPessoas = async (termo: string) => {
    if (!termo || termo.length < 2) {
      setPessoas([]);
      return;
    }

    setLoadingPessoas(true);
    try {
      // Busca correta como no GrupoViewModal
      const termoLike = `%${termo}%`;
      const { data, error } = await mockSupabase
        .from('pessoas')
        .select('id, nome_completo, email, telefone')
        .or(`nome_completo.ilike.${termoLike},email.ilike.${termoLike}`)
        .order('nome_completo')
        .limit(20);

      if (error) throw error;
      setPessoas(data || []);
    } catch (err) {
      console.error('Erro ao buscar pessoas:', err);
      setPessoas([]);
    } finally {
      setLoadingPessoas(false);
    }
  };

  const handleAdicionarParticipante = (pessoa: any) => {
    if (formData.participantes.find((p: any) => p.id === pessoa.id)) {
      setError('Esta pessoa já foi adicionada');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setFormData((prev: any) => ({
      ...prev,
      participantes: [
        ...prev.participantes,
        {
          id: pessoa.id,
          nome_completo: pessoa.nome_completo,
          email: pessoa.email || '',
          telefone: pessoa.telefone || '',
          confirmacao: 'pendente'
        }
      ]
    }));

    setSearchPessoa('');
    setPessoas([]);
  };

  const handleRemoverParticipante = (pessoaId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      participantes: prev.participantes.filter((p: any) => p.id !== pessoaId)
    }));
  };

  const handleSubmit = async () => {
    setError('');

    if (!formData.nome.trim()) {
      setError('Nome do evento é obrigatório');
      return;
    }

    if (formData.multiplos_dias && formData.data_inicio > formData.data_fim) {
      setError('Data de início deve ser anterior à data de fim');
      return;
    }

    if (!formData.dia_inteiro && formData.hora_inicio >= formData.hora_fim) {
      setError('Horário de início deve ser anterior ao horário de fim');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        id: evento?.id,
        nome: formData.nome,
        descricao: formData.descricao,
        data_evento: formData.data_inicio,
        data_fim: formData.multiplos_dias ? formData.data_fim : formData.data_inicio,
        hora_inicio: formData.dia_inteiro ? null : formData.hora_inicio,
        hora_fim: formData.dia_inteiro ? null : formData.hora_fim,
        dia_inteiro: formData.dia_inteiro,
        multiplos_dias: formData.multiplos_dias,
        endereco_completo: formData.endereco_completo,
        espaco_id: formData.espaco_id || null,
        status: formData.status,
        observacoes: formData.observacoes,
        participantes: formData.participantes
      };

      await onSalvar(payload);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar evento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900">
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

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-lg border-b pb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Informações Básicas
            </h4>

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
          </div>

          {/* Datas e Horários */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Datas e Horários
            </h4>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dia_inteiro}
                  onChange={(e) => setFormData({ ...formData, dia_inteiro: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Dia inteiro</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.multiplos_dias}
                  onChange={(e) => setFormData({ ...formData, multiplos_dias: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Múltiplos dias</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data de {formData.multiplos_dias ? 'Início' : 'Evento'} *
                </label>
                <input
                  type="date"
                  required
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {formData.multiplos_dias && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Data de Término *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {!formData.dia_inteiro && (
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
            )}
          </div>

          {/* Local e Espaço */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Local e Espaço
            </h4>

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
                    {espaco.nome} - Cap. {espaco.capacidade} ({espaco.localizacao})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Endereço Completo
              </label>
              <input
                type="text"
                value={formData.endereco_completo}
                onChange={(e) => setFormData({ ...formData, endereco_completo: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Rua, número, bairro, cidade, estado..."
              />
            </div>
          </div>

          {/* Participantes */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Participantes ({formData.participantes.length})
            </h4>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Buscar e Adicionar Pessoas
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchPessoa}
                  onChange={(e) => setSearchPessoa(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite pelo menos 2 caracteres para buscar..."
                />
                {loadingPessoas && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>

            {searchPessoa.length >= 2 && pessoas.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-slate-300 rounded-lg bg-white shadow-lg">
                {pessoas.map((pessoa) => {
                  const jaAdicionado = formData.participantes.find((p: any) => p.id === pessoa.id);
                  return (
                    <button
                      key={pessoa.id}
                      type="button"
                      onClick={() => handleAdicionarParticipante(pessoa)}
                      disabled={jaAdicionado}
                      className={`w-full text-left px-4 py-3 transition border-b border-slate-200 last:border-b-0 ${
                        jaAdicionado
                          ? 'bg-slate-100 cursor-not-allowed opacity-60'
                          : 'hover:bg-blue-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900">{pessoa.nome_completo}</div>
                          {pessoa.email && (
                            <div className="text-sm text-slate-600">{pessoa.email}</div>
                          )}
                        </div>
                        {jaAdicionado && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            ✓ Adicionado
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {searchPessoa.length >= 2 && !loadingPessoas && pessoas.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-2">
                Nenhuma pessoa encontrada
              </p>
            )}

            {formData.participantes.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-slate-700">Participantes Adicionados:</h5>
                {formData.participantes.map((participante: any) => (
                  <div
                    key={participante.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{participante.nome_completo}</div>
                      {participante.email && (
                        <div className="text-sm text-slate-600">{participante.email}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoverParticipante(participante.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status e Observações */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Notas adicionais sobre o evento..."
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancelar}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Salvando...' : 'Salvar Evento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente: Demo Principal
export default function CalendarDemo() {
  const [selectedDayModal, setSelectedDayModal] = useState<CalendarDay | null>(null);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Mock de eventos
  const eventosDemo: Evento[] = [
    {
      id: '1',
      nome: 'Culto de Celebração',
      descricao: 'Culto dominical de celebração',
      data_evento: '2025-01-15',
      hora_inicio: '10:00',
      hora_fim: '12:00',
      dia_inteiro: false,
      multiplos_dias: false,
      status: 'confirmado',
      participantes: [],
      espaco: { id: '1', nome: 'Salão Principal' }
    },
    {
      id: '2',
      nome: 'Reunião de Oração',
      descricao: 'Reunião semanal de oração',
      data_evento: '2025-01-15',
      hora_inicio: '19:00',
      hora_fim: '21:00',
      dia_inteiro: false,
      multiplos_dias: false,
      status: 'confirmado',
      participantes: [],
      espaco: { id: '2', nome: 'Auditório' }
    },
    {
      id: '3',
      nome: 'Conferência Anual',
      data_evento: '2025-01-15',
      dia_inteiro: true,
      multiplos_dias: false,
      status: 'pendente',
      participantes: []
    }
  ];

  const dias: CalendarDay[] = Array.from({ length: 35 }, (_, i) => ({
    dia: (i % 31) + 1,
    ehMes: i >= 5 && i < 30,
    ehHoje: i === 15,
    eventos: i === 15 ? eventosDemo : [],
    data: `2025-01-${String((i % 31) + 1).padStart(2, '0')}`
  }));

  const handleSalvarEvento = async (data: any) => {
    console.log('Salvando evento:', data);
    alert(`Evento ${data.id ? 'atualizado' : 'criado'} com sucesso!`);
    setShowForm(false);
    setEditingEvento(null);
  };

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Calendário da Igreja</h1>
            <p className="text-slate-600">Sistema melhorado de gerenciamento de eventos</p>
          </div>
          <button
            onClick={() => {
              setEditingEvento(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Evento
          </button>
        </div>

        {!showForm ? (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
              <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
                  <div key={dia} className="p-4 text-center font-semibold text-slate-700 text-sm">
                    {dia}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {dias.map((dia, idx) => (
                  <CalendarDayCellMelhorado
                    key={idx}
                    dia={dia}
                    onSelectEvento={(e) => {
                      setEditingEvento(e);
                      setShowForm(true);
                    }}
                    onClickDia={(d) => setSelectedDayModal(d)}
                  />
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Melhorias Implementadas</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Edição de eventos corrigida - dados carregam corretamente no formulário</li>
                <li>✅ Busca de pessoas funcional com integração ao Supabase</li>
                <li>✅ Visual melhorado com indicador de quantidade de eventos</li>
                <li>✅ Modal de dia expandido com timeline de horários</li>
                <li>✅ Visualização clara de sobreposição de eventos</li>
                <li>✅ Clique no dia abre modal com todos eventos e horários</li>
              </ul>
            </div>
          </>
        ) : (
          <EventoFormCorrigido
            evento={editingEvento}
            onSalvar={handleSalvarEvento}
            onCancelar={() => {
              setShowForm(false);
              setEditingEvento(null);
            }}
          />
        )}

        {selectedDayModal && (
          <DayViewModal
            dia={selectedDayModal}
            onClose={() => setSelectedDayModal(null)}
            onEditEvento={(e) => {
              setSelectedDayModal(null);
              setEditingEvento(e);
              setShowForm(true);
            }}
          />
        )}
      </div>
    </div>
  );
}