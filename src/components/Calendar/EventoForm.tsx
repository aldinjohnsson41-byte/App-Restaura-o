import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, Trash2, MapPin, Users, Calendar } from 'lucide-react';

export default function EventoFormMelhorado() {
  const [espacos, setEspacos] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchPessoa, setSearchPessoa] = useState('');
  const [showMap, setShowMap] = useState(false);

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
    status: 'confirmado',
    observacoes: '',
    participantes: []
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    // Simular carregamento de espaços
    setEspacos([
      { id: '1', nome: 'Salão Principal', capacidade: 200, localizacao: 'Térreo' },
      { id: '2', nome: 'Sala de Reuniões', capacidade: 30, localizacao: '1º Andar' },
      { id: '3', nome: 'Auditório', capacidade: 150, localizacao: '2º Andar' }
    ]);

    // Simular carregamento de pessoas
    setPessoas([
      { id: '1', nome_completo: 'João Silva', email: 'joao@email.com', telefone: '(11) 99999-0001' },
      { id: '2', nome_completo: 'Maria Santos', email: 'maria@email.com', telefone: '(11) 99999-0002' },
      { id: '3', nome_completo: 'Pedro Oliveira', email: 'pedro@email.com', telefone: '(11) 99999-0003' },
      { id: '4', nome_completo: 'Ana Costa', email: 'ana@email.com', telefone: '(11) 99999-0004' }
    ]);
  };

  const handleAdicionarParticipante = (pessoa) => {
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
        email: pessoa.email,
        telefone: pessoa.telefone,
        confirmacao: 'pendente'
      }]
    });
    setSearchPessoa('');
  };

  const handleRemoverParticipante = (pessoaId) => {
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
    setShowMap(true);
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
      
      // Aqui você salvaria no banco de dados
      console.log('Salvando evento:', formData);
      
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Evento salvo com sucesso!');
      
      // Reset form
      setFormData({
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
        status: 'confirmado',
        observacoes: '',
        participantes: []
      });
      
    } catch (err) {
      setError(err.message || 'Erro ao salvar evento');
    } finally {
      setSubmitting(false);
    }
  };

  const pessoasFiltradas = pessoas.filter(p => 
    p.nome_completo.toLowerCase().includes(searchPessoa.toLowerCase()) ||
    p.email.toLowerCase().includes(searchPessoa.toLowerCase())
  );

  const calcularDiasEvento = () => {
    if (!formData.multiplos_dias) return 1;
    const inicio = new Date(formData.data_inicio);
    const fim = new Date(formData.data_fim);
    const diffTime = Math.abs(fim - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900">
            Novo Evento
          </h3>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 animate-pulse">
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
                placeholder="Digite o nome ou email..."
              />
            </div>

            {searchPessoa && pessoasFiltradas.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-slate-300 rounded-lg bg-white">
                {pessoasFiltradas.map((pessoa) => (
                  <button
                    key={pessoa.id}
                    type="button"
                    onClick={() => handleAdicionarParticipante(pessoa)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition border-b border-slate-200 last:border-b-0"
                  >
                    <div className="font-medium text-slate-900">{pessoa.nome_completo}</div>
                    <div className="text-sm text-slate-600">{pessoa.email}</div>
                  </button>
                ))}
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
              onClick={() => window.history.back()}
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