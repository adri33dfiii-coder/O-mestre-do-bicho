#!/usr/bin/env python3
"""
Script para popular dados de teste no MongoDB
"""
import asyncio
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import sys

# Adicionar diretório pai ao path
sys.path.append(str(Path(__file__).parent))

from server import ResultadoJogo

# Configuração MongoDB
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "mestre_do_bicho"

async def populate_test_data():
    """Adiciona dados de teste para desenvolvimento"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Resultados de exemplo dos últimos dias
    resultados_teste = []
    
    horarios = ["PPT", "PTM", "PT", "PTV", "PTN", "COR"]
    base_date = datetime.utcnow() - timedelta(days=5)
    
    # Adicionar resultados dos últimos 10 dias
    for i in range(10):
        data_atual = base_date + timedelta(days=i)
        
        for j, horario in enumerate(horarios):
            # Gerar milhares aleatórios mas consistentes
            milhar_1 = f"{(1234 + i*100 + j*10) % 10000:04d}"
            milhar_2 = f"{(2345 + i*100 + j*10) % 10000:04d}"
            milhar_3 = f"{(3456 + i*100 + j*10) % 10000:04d}"
            milhar_4 = f"{(4567 + i*100 + j*10) % 10000:04d}"
            milhar_5 = f"{(5678 + i*100 + j*10) % 10000:04d}"
            
            resultado = ResultadoJogo(
                data=data_atual,
                horario=horario,
                milhar_1=milhar_1,
                milhar_2=milhar_2,
                milhar_3=milhar_3,
                milhar_4=milhar_4,
                milhar_5=milhar_5
            )
            
            resultados_teste.append(resultado.dict())
    
    # Verificar se já existem dados
    count = await db.resultados.count_documents({})
    print(f"Documentos existentes: {count}")
    
    if count == 0:
        # Inserir dados de teste
        await db.resultados.insert_many(resultados_teste)
        print(f"✅ Inseridos {len(resultados_teste)} resultados de teste")
    else:
        print("ℹ️ Dados já existem no banco")
    
    # Verificar dados inseridos
    total = await db.resultados.count_documents({})
    print(f"📊 Total de resultados no banco: {total}")
    
    # Mostrar alguns exemplos
    cursor = db.resultados.find().sort("data", -1).limit(5)
    print("\n🎯 Últimos 5 resultados:")
    async for doc in cursor:
        data_format = doc['data'].strftime('%d/%m/%Y')
        print(f"  {data_format} {doc['horario']}: {doc['milhar_1']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_test_data())