import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Relatorios = () => {
  const [stats, setStats] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodoFiltro, setPeriodoFiltro] = useState(30);

  useEffect(() => {
    fetchData();
  }, [periodoFiltro]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar estatísticas
      const statsResponse = await axios.get(`${API}/relatorios/estatisticas`);
      setStats(statsResponse.data);

      // Buscar resultados
      const resultadosResponse = await axios.get(`${API}/resultados`, {
        params: { dias: periodoFiltro }
      });
      setResultados(resultadosResponse.data);
      
    } catch (err) {
      setError('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = () => {
    if (!resultados.length) return;

    const csvContent = [
      ['Data', 'Horário', '1º Prêmio', '2º Prêmio', '3º Prêmio', '4º Prêmio', '5º Prêmio'],
      ...resultados.map(r => [
        new Date(r.data).toLocaleDateString('pt-BR'),
        r.horario,
        r.milhar_1,
        r.milhar_2,
        r.milhar_3,
        r.milhar_4,
        r.milhar_5
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `resultados_jogo_bicho_${periodoFiltro}dias.csv`;
    link.click();
  };

  const copiarResultados = () => {
    const texto = resultados.map(r => 
      `${new Date(r.data).toLocaleDateString('pt-BR')} ${r.horario}: ${r.milhar_1}`
    ).join('\n');
    
    navigator.clipboard.writeText(texto).then(() => {
      alert('📋 Resultados copiados para a área de transferência!');
    });
  };

  const getFrequenciaDigitos = () => {
    if (!stats?.frequencia_primeiro_digito) return [];
    
    return Object.entries(stats.frequencia_primeiro_digito)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  };

  const getMenosFrequentes = () => {
    if (!stats?.frequencia_primeiro_digito) return [];
    
    return Object.entries(stats.frequencia_primeiro_digito)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <Link 
          to="/" 
          className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
        >
          ← Voltar ao Dashboard
        </Link>
        
        <div className="text-6xl mb-4">📈</div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Relatórios e Análises
        </h1>
        <p className="text-white/80 text-lg">
          Estatísticas detalhadas dos resultados do jogo do bicho
        </p>
      </div>

      {/* Filtros de período */}
      <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">📅 Período de Análise</h2>
        
        <div className="flex flex-wrap gap-3">
          {[7, 15, 30, 60].map(dias => (
            <button
              key={dias}
              onClick={() => setPeriodoFiltro(dias)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                periodoFiltro === dias
                  ? 'bg-green-600 text-white'
                  : 'bg-white/20 text-white/80 hover:bg-white/30'
              }`}
            >
              {dias} dias
            </button>
          ))}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="feedback-error mb-6">
          {error}
        </div>
      )}

      {/* Estatísticas principais */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur border border-green-500/30 rounded-xl p-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <div className="text-3xl font-bold text-white mb-2">
                {stats.total_resultados}
              </div>
              <p className="text-white/80">Resultados Analisados</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur border border-blue-500/30 rounded-xl p-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎯</div>
              <div className="text-3xl font-bold text-white mb-2">
                {Object.keys(stats.frequencia_primeiro_digito || {}).length}
              </div>
              <p className="text-white/80">Dígitos Diferentes</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur border border-purple-500/30 rounded-xl p-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📅</div>
              <div className="text-lg font-bold text-white mb-2">
                {stats.ultimo_resultado 
                  ? new Date(stats.ultimo_resultado.data).toLocaleDateString('pt-BR')
                  : 'N/A'
                }
              </div>
              <p className="text-white/80">Último Resultado</p>
            </div>
          </div>
        </div>
      )}

      {/* Frequência de dígitos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Mais frequentes */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 text-center">
            🔥 Dígitos Mais Frequentes
          </h3>
          
          <div className="space-y-3">
            {getFrequenciaDigitos().map(([digito, freq], index) => (
              <div key={digito} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-yellow-400">#{index + 1}</span>
                  <span className="text-2xl font-mono bg-green-600 text-white px-3 py-1 rounded">
                    {digito}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{freq}x</div>
                  <div className="text-white/60 text-sm">
                    {((freq / stats?.total_resultados) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menos frequentes */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 text-center">
            ❄️ Dígitos Menos Frequentes
          </h3>
          
          <div className="space-y-3">
            {getMenosFrequentes().map(([digito, freq], index) => (
              <div key={digito} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-blue-400">#{index + 1}</span>
                  <span className="text-2xl font-mono bg-blue-600 text-white px-3 py-1 rounded">
                    {digito}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{freq}x</div>
                  <div className="text-white/60 text-sm">
                    {((freq / stats?.total_resultados) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Últimos resultados */}
      <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h3 className="text-xl font-bold text-white mb-4 md:mb-0">
            📋 Últimos Resultados ({periodoFiltro} dias)
          </h3>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={copiarResultados}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              📋 Copiar
            </button>
            <button
              onClick={exportarCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              📊 Exportar CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/30 sticky top-0">
                <tr className="text-white">
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-3 py-2">Horário</th>
                  <th className="px-3 py-2">1º</th>
                  <th className="px-3 py-2">2º</th>
                  <th className="px-3 py-2">3º</th>
                  <th className="px-3 py-2">4º</th>
                  <th className="px-3 py-2">5º</th>
                </tr>
              </thead>
              <tbody>
                {resultados.slice(0, 50).map((resultado, index) => (
                  <tr key={resultado.id || index} className="text-white/80 border-b border-white/10">
                    <td className="px-3 py-2">
                      {new Date(resultado.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold">
                      {resultado.horario}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="bg-green-600 text-white px-2 py-1 rounded font-mono text-xs">
                        {resultado.milhar_1}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded font-mono text-xs">
                        {resultado.milhar_2}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="bg-purple-600 text-white px-2 py-1 rounded font-mono text-xs">
                        {resultado.milhar_3}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="bg-orange-600 text-white px-2 py-1 rounded font-mono text-xs">
                        {resultado.milhar_4}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="bg-red-600 text-white px-2 py-1 rounded font-mono text-xs">
                        {resultado.milhar_5}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {resultados.length > 50 && (
          <p className="text-white/60 text-center mt-4 text-sm">
            Mostrando os primeiros 50 resultados de {resultados.length} total
          </p>
        )}
      </div>

      {/* Informações sobre análise */}
      <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 text-center">
          ℹ️ Como Interpretar as Análises
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white/80">
          <div>
            <h4 className="font-semibold text-white mb-2">🔥 Dígitos Mais Frequentes</h4>
            <p className="text-sm">
              Dígitos que aparecem com maior frequência no 1º prêmio. 
              Podem indicar tendências, mas lembre-se que cada sorteio é independente.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-2">❄️ Dígitos Menos Frequentes</h4>
            <p className="text-sm">
              Dígitos que aparecem com menor frequência. Segundo a lógica do sistema,
              estes são priorizados na geração de palpites.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-2">📊 Exportação CSV</h4>
            <p className="text-sm">
              Baixe os dados em formato CSV para análises mais profundas 
              em planilhas ou outras ferramentas de análise.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-2">📋 Últimos Resultados</h4>
            <p className="text-sm">
              Base de dados usada para gerar os palpites. Os últimos 2 dias 
              têm prioridade, mas analisamos até 30 dias para complemento.
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="feedback-warning mt-8">
        <div className="text-center">
          <p className="font-semibold mb-2">📊 Sobre as Análises</p>
          <p className="text-sm">
            Estas análises são baseadas em dados históricos e servem apenas como referência. 
            O jogo do bicho é um jogo de azar e nenhuma análise garante resultados futuros.
            Use sempre com responsabilidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;