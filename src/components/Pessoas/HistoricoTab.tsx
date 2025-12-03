import { useState, useEffect } from 'react';
import { supabase, HistoricoPessoa } from '../../lib/supabase';
import { Clock } from 'lucide-react';

interface HistoricoTabProps {
  pessoaId: string;
}

export default function HistoricoTab({ pessoaId }: HistoricoTabProps) {
  const [historico, setHistorico] = useState<HistoricoPessoa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistorico();
  }, [pessoaId]);

  const loadHistorico = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('historico_pessoas')
      .select('*')
      .eq('pessoa_id', pessoaId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setHistorico(data);
    }
    setLoading(false);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Histórico de Alterações</h3>

      <div className="space-y-4">
        {historico.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">Nenhum histórico registrado</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

            {historico.map((item, index) => (
              <div key={item.id} className="relative pl-12 pb-8">
                <div className="absolute left-2 w-4 h-4 bg-slate-600 rounded-full border-4 border-white" />

                <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-900">{item.acao}</h4>
                    <span className="text-xs text-slate-500">
                      {formatarData(item.created_at)}
                    </span>
                  </div>

                  {item.detalhes && Object.keys(item.detalhes).length > 0 && (
                    <div className="mt-3 p-3 bg-slate-50 rounded text-sm">
                      <pre className="text-slate-700 whitespace-pre-wrap">
                        {JSON.stringify(item.detalhes, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
