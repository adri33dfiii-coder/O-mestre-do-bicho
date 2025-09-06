import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Palpites = () => {
  const { modalidade } = useParams();
  const [palpites, setPalpites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTexto, setShowTexto] = useState(false);

  // Configuração das modalidades
  const modalidadeConfig = {
    milhar: {
      titulo: 'Milhar (ABCD)',
      emoji: '🎯',
      descricao: 'Análise completa dos 4 dígitos baseada no 1º dígito dos últimos resultados',
      color: 'from-green-600 to-green-700'
    },
    centena: {
      titulo: 'Centena (BCD)',
      emoji: '🎲',
      descricao: 'Permutação inteligente dos últimos 3 dígitos',
      color: 'from-blue-600 to-blue-700'
    },
    dezena: {
      titulo: 'Dezena (CD)',
      emoji: '🔢',
      descricao: 'Permutação simples dos últimos 2 dígitos',
      color: 'from-purple-600 to-purple-700'
    },
    grupo: {
      titulo: 'Grupos/Bichos',
      emoji: '🐯',
      descricao: 'Mapeamento para os 25 animais clássicos',
      color: 'from-orange-600 to-orange-700'
    }
  };

  const config = modalidadeConfig[modalidade] || modalidadeConfig.milhar;

  useEffect(() => {
    // Limpar estados ao trocar de modalidade
    setPalpites([]);
    setError('');
    setSuccess('');
    setShowTexto(false);
  }, [modalidade]);

  const gerarPalpites = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post(`${API}/palpites/gerar`, null, {
        params: { modalidade }
      });

      setPalpites(response.data.palpites || []);
      
      if (response.data.palpites?.length > 0) {
        setSuccess(`✅ ${response.data.quantidade} palpites gerados com sucesso para ${config.titulo}!`);
      } else {
        setError('❌ Nenhum palpite foi gerado. Verifique se há resultados suficientes para análise.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao gerar palpites. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copiarTexto = () => {
    const texto = palpites.join(', ');
    navigator.clipboard.writeText(texto).then(() => {
      alert('📋 Palpites copiados para a área de transferência!');
    });
  };

  const renderPalpites = () => {
    if (modalidade === 'grupo') {
      // Para grupos/bichos, mostrar de forma especial
      return (
        <div className="space-y-4">
          {palpites.map((grupo, index) => (
            <div key={index} className="bicho-card p-6">
              <div className="text-center">
                <div className="bicho-emoji mb-4">🐯</div>
                <h3 className="text-2xl font-bold text-white mb-2">{grupo}</h3>
                <p className="text-white/80">Grupo baseado na análise dos últimos dígitos</p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Para outras modalidades, mostrar em grid
    return (
      <div className="numeros-grid">
        {palpites.map((numero, index) => (
          <div key={index} className="numero-item">
            {numero}
          </div>
        ))}
      </div>
    );
  };

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
        
        <div className="text-6xl mb-4">{config.emoji}</div>
        <h1 className="text-4xl font-bold text-white mb-4">
          {config.titulo}
        </h1>
        <p className="text-white/80 text-lg max-w-2xl mx-auto">
          {config.descricao}
        </p>
      </div>

      {/* Botão de gerar */}
      <div className="text-center mb-8">
        <button
          onClick={gerarPalpites}
          disabled={loading}
          className="palpite-button text-xl px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              Gerando palpites...
            </div>
          ) : (
            <>
              {config.emoji} Gerar Palpites {config.titulo}
            </>
          )}
        </button>
      </div>

      {/* Mensagens de feedback */}
      {error && (
        <div className="feedback-error mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="feedback-success mb-6">
          {success}
        </div>
      )}

      {/* Resultados */}
      {palpites.length > 0 && (
        <div className="space-y-6">
          {/* Controles */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setShowTexto(!showTexto)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              {showTexto ? '📊 Ver Grid' : '📝 Ver Texto'}
            </button>
            
            <button
              onClick={copiarTexto}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              📋 Copiar Todos
            </button>
          </div>

          {/* Visualização */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold text-white">
                📊 {palpites.length} Palpites Gerados
              </h2>
            </div>

            {showTexto ? (
              <div className="texto-copiavel">
                {palpites.join(', ')}
              </div>
            ) : (
              renderPalpites()
            )}
          </div>
        </div>
      )}

      {/* Informações sobre a modalidade */}
      <div className="mt-12 bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 text-center">
          ℹ️ Como Funciona {config.titulo}
        </h3>
        
        <div className="text-white/80 space-y-3">
          {modalidade === 'milhar' && (
            <div>
              <p><strong>📈 Análise do 1º Dígito:</strong> Identifica dígitos ausentes ou menos frequentes nos últimos resultados</p>
              <p><strong>🔢 Combinação:</strong> Combina os prefixos escolhidos com uma base de centenas otimizada</p>
              <p><strong>🔍 Filtro:</strong> Remove milhares com 3+ dígitos iguais, permitindo até 2 repetições</p>
            </div>
          )}
          
          {modalidade === 'centena' && (
            <div>
              <p><strong>🎯 Base:</strong> Usa os últimos 3 dígitos (BCD) do resultado mais recente</p>
              <p><strong>🔄 Permutação:</strong> Gera todas as combinações possíveis sem repetição</p>
              <p><strong>🔍 Filtro:</strong> Remove combinações com 3+ dígitos iguais</p>
            </div>
          )}
          
          {modalidade === 'dezena' && (
            <div>
              <p><strong>🎯 Base:</strong> Usa os últimos 2 dígitos (CD) do resultado mais recente</p>
              <p><strong>🔄 Permutação:</strong> Gera permutação simples (CD e DC)</p>
              <p><strong>✅ Sem Filtro:</strong> Todas as combinações são válidas</p>
            </div>
          )}
          
          {modalidade === 'grupo' && (
            <div>
              <p><strong>🐯 Mapeamento:</strong> Identifica o grupo/bicho baseado nos últimos 2 dígitos</p>
              <p><strong>📊 25 Grupos:</strong> Do AVESTRUZ (01-04) até a VACA (97-00)</p>
              <p><strong>🎯 Precisão:</strong> Mapeamento direto conforme tabela oficial</p>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="feedback-warning mt-8">
        <div className="text-center">
          <p className="font-semibold mb-2">⚠️ Lembre-se</p>
          <p className="text-sm">
            Nada é 100% confiável no jogo do bicho. Use os palpites como referência 
            e sempre pratique uma gestão responsável para cada nova aposta.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Palpites;