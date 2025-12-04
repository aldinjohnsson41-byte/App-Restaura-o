interface EventoFormProps {
  evento?: any;
  onSalvar: (data: any) => Promise<void>;
  onCancelar: () => void;
  loading?: boolean;
}

export default function EventoFormMelhorado({ evento, onSalvar, onCancelar, loading: externalLoading }: EventoFormProps) {
  const [espacos, setEspacos] = useState<any[]>([]);
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchPessoa, setSearchPessoa] = useState<string>('');
  const [loadingPessoas, setLoadingPessoas] = useState<boolean>(false);

  const [formData, setFormData] = useState<any>({
    nome: evento?.nome || '',
    descricao: evento?.descricao || '',
    data_inicio: evento?.data_evento || new Date().toISOString().split('T')[0],
    data_fim: evento?.data_fim || evento?.data_evento || new Date().toISOString().split('T')[0],
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