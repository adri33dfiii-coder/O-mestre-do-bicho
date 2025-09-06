import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modalidades disponíveis
  const modalidades = [
    {
      id: 'milhar',
      titulo: 'Milhar (ABCD)',
      emoji: '🎯',
      descricao: 'Análise completa dos 4 dígitos',
      detalhes: 'Baseado na análise do 1º dígito dos últimos resultados',
      color: 'from-green-600 to-green-700'
    },
    {
      id: 'centena',
      titulo: 'Centena (BCD)',
      emoji: '🎲',
      descricao: 'Permutação dos últimos 3 dígitos',
      detalhes: 'Combinações inteligentes dos dígitos finais',
      color: 'from-blue-600 to-blue-700'
    },
    {
      id: 'dezena',
      titulo: 'Dezena (CD)',
      emoji: '🔢',
      descricao: 'Permutação dos últimos 2 dígitos',
      detalhes: 'Análise focada nos dígitos finais',
      color: 'from-purple-600 to-purple-700'
    },
    {
      id: 'grupo',
      titulo: 'Grupos/Bichos',
      emoji: '🐯',
      descricao: 'Os 25 animais clássicos',
      detalhes: 'Mapeamento baseado nos últimos dígitos',
      color: 'from-orange-600 to-orange-700'
    }
  ];

  // Horários dos sorteios
  const horarios = [
    { nome: 'PPT', horario: '09:30', emoji: '🌅' },
    { nome: 'PTM', horario: '11:20', emoji: '☀️' },
    { nome: 'PT', horario: '14:20', emoji: '🌞' },
    { nome: 'PTV', horario: '16:20', emoji: '🌤️' },
    { nome: 'PTN', horario: '18:20', emoji: '🌆' },
    { nome: 'COR', horario: '21:20', emoji: '🌙' }
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/relatorios/estatisticas`);
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProximoSorteio = () => {
    const agora = new Date();
    const horaAtual = agora.getHours() * 100 + agora.getMinutes();
    
    const horariosSorteio = [
      { nome: 'PPT', hora: 930 },
      { nome: 'PTM', hora: 1120 },
      { nome: 'PT', hora: 1420 },
      { nome: 'PTV', hora: 1620 },
      { nome: 'PTN', hora: 1820 },
      { nome: 'COR', hora: 2120 }
    ];

    for (const sorteio of horariosSorteio) {
      if (horaAtual < sorteio.hora) {
        return sorteio.nome;
      }
    }
    
    return 'PPT'; // Próximo dia
  };

  const proximoSorteio = getProximoSorteio();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header de boas-vindas */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4 animate-float">🎯</div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Bem-vindo, {user?.username}!
        </h1>
        <p className="text-white/80 text-lg max-w-2xl mx-auto">
          Gere palpites inteligentes baseados na análise dos últimos resultados.
          Escolha sua modalidade favorita e boa sorte! 🍀
        </p>
      </div>

      {/* Próximo sorteio */}
      <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur border border-yellow-500/30 rounded-xl p-6 mb-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            ⏰ Próximo Sorteio: {proximoSorteio}
          </h2>
          <p className="text-white/80">
            {horarios.find(h => h.nome === proximoSorteio)?.emoji} às {horarios.find(h => h.nome === proximoSorteio)?.horario}
          </p>
        </div>
      </div>

      {/* Grid de modalidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {modalidades.map((modalidade) => (
          <Link
            key={modalidade.id}
            to={`/palpites/${modalidade.id}`}
            className="modalidade-card group"
          >
            <div className="text-center">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                {modalidade.emoji}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {modalidade.titulo}
              </h3>
              <p className="text-white/80 text-sm mb-3">
                {modalidade.descricao}
              </p>
              <p className="text-white/60 text-xs">
                {modalidade.detalhes}
              </p>
              
              <div className={`mt-4 bg-gradient-to-r ${modalidade.color} text-white px-4 py-2 rounded-lg font-semibold group-hover:shadow-lg transition-all`}>
                Gerar Palpites
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Estatísticas rápidas */}
      {loading ? (
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80">Carregando estatísticas...</p>
          </div>
        </div>
      ) : stats ? (
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            📊 Estatísticas dos Últimos 30 Dias
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {stats.total_resultados}
              </div>
              <p className="text-white/80">Resultados Analisados</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {Object.keys(stats.frequencia_primeiro_digito || {}).length}
              </div>
              <p className="text-white/80">Dígitos Diferentes</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {stats.ultimo_resultado ? new Date(stats.ultimo_resultado.data).toLocaleDateString('pt-BR') : '-'}
              </div>
              <p className="text-white/80">Último Resultado</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Horários dos sorteios */}
      <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          🕐 Horários dos Sorteios
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {horarios.map((item) => (
            <div 
              key={item.nome}
              className={`text-center p-4 rounded-lg transition-all ${
                item.nome === proximoSorteio 
                  ? 'bg-green-600/20 border border-green-500/30 animate-pulse-glow' 
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className="text-2xl mb-2">{item.emoji}</div>
              <div className="text-white font-bold">{item.nome}</div>
              <div className="text-white/80 text-sm">{item.horario}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Links rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/historico"
          className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all"
        >
          <div className="text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">Histórico</h3>
            <p className="text-white/80">Veja seus palpites anteriores</p>
          </div>
        </Link>
        
        <Link
          to="/relatorios"
          className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all"
        >
          <div className="text-center">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-white mb-2">Relatórios</h3>
            <p className="text-white/80">Análises e estatísticas detalhadas</p>
          </div>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="feedback-warning mt-8">
        <div className="text-center">
          <p className="font-semibold mb-2">⚠️ Aviso Importante</p>
          <p className="text-sm">
            Lembre-se: nada é 100% confiável no jogo do bicho. 
            Use os palpites como referência e sempre gerencie suas apostas com responsabilidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;