import { Users, BookOpen, UsersRound, Settings, Calendar } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const modules = [
    {
      id: 'pessoas',
      title: 'Pessoas',
      description: 'Cadastro e gestão de membros',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'ministerios',
      title: 'Ministérios',
      description: 'Gerenciar ministérios da igreja',
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'grupos',
      title: 'Grupos Familiares',
      description: 'Gerenciar células e grupos',
      icon: UsersRound,
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 'agenda',
      title: 'Agenda',
      description: 'Eventos e reservas de espaços',
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'cargos',
      title: 'Cargos',
      description: 'Gerenciar cargos da igreja',
      icon: Settings,
      color: 'from-slate-500 to-slate-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Sistema de Gestão de Igreja
        </h1>
        <p className="text-slate-600">
          Selecione um módulo para começar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              onClick={() => onNavigate(module.id)}
              className="group relative bg-white rounded-2xl shadow-sm border-2 border-slate-200 hover:border-transparent hover:shadow-xl transition-all duration-300 p-8 text-left overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-slate-100 group-hover:bg-white/20 transition-colors mb-4">
                  <Icon className="w-8 h-8 text-slate-700 group-hover:text-white transition-colors" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-white transition-colors mb-2">
                  {module.title}
                </h3>

                <p className="text-sm text-slate-600 group-hover:text-white/90 transition-colors">
                  {module.description}
                </p>
              </div>

              <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-full h-full text-slate-900 group-hover:text-white" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="text-3xl font-bold text-blue-900 mb-1">0</div>
          <div className="text-sm text-blue-700">Membros Cadastrados</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="text-3xl font-bold text-green-900 mb-1">0</div>
          <div className="text-sm text-green-700">Ministérios Ativos</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="text-3xl font-bold text-orange-900 mb-1">0</div>
          <div className="text-sm text-orange-700">Grupos Familiares</div>
        </div>
      </div>
    </div>
  );
}
