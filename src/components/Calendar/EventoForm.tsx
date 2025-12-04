import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Trash2, MapPin, Users, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { EventoAgenda, EspacoFisico } from '../../types/calendar';

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
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchPessoa, setSearchPessoa] = useState('');
  const [loadingPessoas, setLoadingPessoas] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: new Date().toISOString().split('T')[0],
    hora_inicio: '09:00',
    hora_fim: '10:00',
    dia_inteiro: false,
    multiplos_dias: false,
    local: '',
    endereco_completo: '',
    espaco_id: '',
    status: 'confirmado' as const,
    observacoes: '',
    participantes: [] as any[]
  });

  // ✅ Carregar dados do evento ao editar
  useEffect(() => {
    carregarEspacos();
    
    if (evento) {
      console.log('📝 Carregando evento para edição:', evento);
      setFormData({
        nome: evento.nome,
        descricao: evento.descricao || '',
        data_inicio: evento.data_evento,
        data_fim: evento.data_fim || evento.data_evento,
        hora_inicio: evento.hora_inicio || '09:00',
        hora_fim: evento.hora_fim || '10:00',
        dia_inteiro: evento.dia_inteiro,
        multiplos_dias: !!evento.data_fim && evento.data_fim !== evento.data_evento,
        local: evento.local || '',
        endereco_completo: evento.endereco_completo || '',
        espaco_id: evento.espaco_id || '',
        status: evento.status,
        observacoes: evento.observacoes || '',
        participantes: evento.participantes?.map(p => ({
          id: p.pessoa_id || p.pessoa?.id,
          nome_completo: p.pessoa?.nome_completo || '',
          email: p.pessoa?.email || p.email_enviado_para || '',
          telefone: p.pessoa?.telefone || '',
          confirmacao: p.confirmacao_presenca
        })) || []
      });
    }
  }, [evento]);

  useEffect(() => {
    if (searchPessoa.length >= 2) {
      buscarPessoas(searchPessoa);
    } else {
      setPessoas([]);
    }
  }, [searchPessoa]);

  const carregarEspacos = async () => {
    try {
      const { data, error } = await supabase
        .from('espacos_fisicos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      if (data) setEspacos(data);
    } catch (err) {
      console.error('❌ Erro ao carregar espaços:', err);
    }
  };

  const buscarPessoas = async (termo: string) => {
    if (!termo || termo.length < 2) {
      setPessoas([]);
      return;
    }

    try {
      setLoadingPessoas(true);
      
      // ✅ Sintaxe correta do .or() sem aspas extras
      const { data, error } = await supabase
        .from('pessoas')
        .select('id, nome_completo, email, telefone, whatsapp')
        .or(`nome_completo.ilike.%${termo}%,email.ilike.%${termo}%`)
        .order('nome_completo')
        .limit(20);

      if (error) {
        console.error('❌ Erro na busca:', error);
        setPessoas([]);
        return;
      }

      if (data) {
        console.log('✅ Pessoas encontradas:', data.length);
        setPessoas(data);
      } else {
        setPessoas([]);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar pessoas:', err);
      setPessoas([]);
    } finally {
      setLoadingPessoas(false);
    }
  };

  const handleAdicionarParticipante = (pessoa: any) => {
    if (formData.participantes.find(p => p.id === pessoa.id)) {
      setError('Esta pessoa já foi adicionada');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setFormData({
      ...formData,
      participantes: [...formData.participantes, {
        id: pessoa.id,
        nome_completo: pessoa.nome_completo,
        email: pessoa.email || '',
        telefone: pessoa.telefone || pessoa.whatsapp || '',
        confirmacao: 'pendente'
      }]
    });
    setSearchPessoa('');
    setPessoas([]);
  };

  const handleRemoverParticipante = (pessoaId: string) => {
    setFormData({
      ...formData,
      participantes: formData.participantes.filter(p => p.id !== pessoaId)
    });
  };

  const handleLocalizarMapa = () => {
    if (!formData.endereco_completo) {
      setError('Digite o endereço completo para localizar no mapa');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const enderecoEncoded = encodeURIComponent(formData.endereco_completo);
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${enderecoEncoded}`;
    window.open(mapUrl, '_blank');
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
      
      // ✅ Preparar dados corretamente
      const eventoData = {
        nome: formData.nome,
        descricao: formData.descricao,
        data_evento: formData.data_inicio,
        data_fim: formData.multiplos_dias ? formData.data_fim : null,
        multiplos_dias: formData.multiplos_dias,
        hora_inicio: formData.dia_inteiro ? null : formData.hora_inicio,
        hora_fim: formData.dia_inteiro ? null : formData.hora_fim,
        dia_inteiro: formData.dia_inteiro,
        local: formData.local,
        endereco_completo: formData.endereco_completo,
        espaco_id: formData.espaco_id || null,
        status: formData.status,
        observacoes: formData.observacoes,
        // ✅ Array de IDs dos participantes
        participantes_ids: formData.participantes.map(p => p.id)
      };
      
      console.log('💾 Salvando evento:', eventoData);
      
      // ✅ Chamar função passada por props
      await onSalvar(eventoData);
      
    } catch (err: any) {
      console.error('❌ Erro:', err);
      setError(err.message || 'Erro ao salvar evento');
    } finally {
      setSubmitting(false);
    }
  };

  const calcularDiasEvento = () => {
    if (!formData.multiplos_dias) return 1;
    const inicio = new Date(formData.data_inicio);
    const fim = new Date(formData.data_fim);
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
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
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
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
            <h4 className="font-semibold text-slate-900">Datas e Horários</h4>
            
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dia_inteiro}
                  onChange={(e) => setFormData({ ...formData, dia_inteiro: e.target.checked })}
                  className="w-4 h-4 border border-slate-300 rounded"
                />
                <span className="text-sm font-medium text-slate-700">Dia inteiro</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.multiplos_dias}
                  onChange={(e) => setFormData({ ...formData, multiplos_dias: e.target.checked })}
                  className="w-4 h-4 border border-slate-300 rounded"
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

            {formData.multiplos_dias && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                <strong>Duração:</strong> {calcularDiasEvento()} dias
              </div>
            )}

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
                Local (descrição)
              </label>
              <input
                type="text"
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Salão Principal, Auditório..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Endereço Completo
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.endereco_completo}
                  onChange={(e) => setFormData({ ...formData, endereco_completo: e.target.value })}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Rua, número, bairro, cidade, estado..."
                />
                <button
                  type="button"
                  onClick={handleLocalizarMapa}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Ver Mapa
                </button>
              </div>
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
              <input
                type="text"
                value={searchPessoa}
                onChange={(e) => setSearchPessoa(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite pelo menos 2 caracteres para buscar..."
              />
              {loadingPessoas && (
                <p className="text-sm text-slate-500 mt-2">Buscando...</p>
              )}
            </div>

            {searchPessoa.length >= 2 && pessoas.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-slate-300 rounded-lg bg-white shadow-lg">
                {pessoas.map((pessoa) => {
                  const jaAdicionado = formData.participantes.find(p => p.id === pessoa.id);
                  return (
                    <button
                      key={pessoa.id}
                      type="button"
                      onClick={() => handleAdicionarParticipante(pessoa)}
                      disabled={!!jaAdicionado}
                      className={`w-full text-left px-4 py-3 transition border-b border-slate-200 last:border-b-0 ${
                        jaAdicionado 
                          ? 'bg-slate-100 cursor-not-allowed opacity-60' 
                          : 'hover:bg-blue-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900">{pessoa.nome_completo}</div>
                          <div className="text-sm text-slate-600">{pessoa.email}</div>
                          {pessoa.telefone && (
                            <div className="text-xs text-slate-500">{pessoa.telefone}</div>
                          )}
                        </div>
                        {jaAdicionado && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Adicionado
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {searchPessoa.length >= 2 && !loadingPessoas && pessoas.length === 0 && (
              <div className="p-4 text-center text-slate-500 text-sm bg-slate-50 rounded-lg border border-slate-200">
                Nenhuma pessoa encontrada
              </div>
            )}

            {searchPessoa.length > 0 && searchPessoa.length < 2 && (
              <div className="p-2 text-xs text-slate-500">
                Digite pelo menos 2 caracteres para buscar
              </div>
            )}

            {formData.participantes.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-slate-700">Participantes Adicionados:</h5>
                {formData.participantes.map((participante) => (
                  <div
                    key={participante.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{participante.nome_completo}</div>
                      <div className="text-sm text-slate-600">{participante.email}</div>
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
              disabled={submitting || loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {submitting || loading ? 'Salvando...' : 'Salvar Evento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}