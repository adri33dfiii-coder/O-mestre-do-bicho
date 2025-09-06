from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import hashlib
import requests
from bs4 import BeautifulSoup
import schedule
import threading
import time
from collections import Counter
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'mestre-do-bicho-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="O Mestre do Bicho API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# GRUPOS/BICHOS MAPPING
GRUPOS_BICHOS = {
    1: {"nome": "AVESTRUZ", "numeros": [1, 2, 3, 4]},
    2: {"nome": "ÁGUIA", "numeros": [5, 6, 7, 8]},
    3: {"nome": "BURRO", "numeros": [9, 10, 11, 12]},
    4: {"nome": "BORBOLETA", "numeros": [13, 14, 15, 16]},
    5: {"nome": "CACHORRO", "numeros": [17, 18, 19, 20]},
    6: {"nome": "CABRA", "numeros": [21, 22, 23, 24]},
    7: {"nome": "CARNEIRO", "numeros": [25, 26, 27, 28]},
    8: {"nome": "CAMELO", "numeros": [29, 30, 31, 32]},
    9: {"nome": "COBRA", "numeros": [33, 34, 35, 36]},
    10: {"nome": "COELHO", "numeros": [37, 38, 39, 40]},
    11: {"nome": "CAVALO", "numeros": [41, 42, 43, 44]},
    12: {"nome": "ELEFANTE", "numeros": [45, 46, 47, 48]},
    13: {"nome": "GALO", "numeros": [49, 50, 51, 52]},
    14: {"nome": "GATO", "numeros": [53, 54, 55, 56]},
    15: {"nome": "JACARÉ", "numeros": [57, 58, 59, 60]},
    16: {"nome": "LEÃO", "numeros": [61, 62, 63, 64]},
    17: {"nome": "MACACO", "numeros": [65, 66, 67, 68]},
    18: {"nome": "PORCO", "numeros": [69, 70, 71, 72]},
    19: {"nome": "PAVÃO", "numeros": [73, 74, 75, 76]},
    20: {"nome": "PERU", "numeros": [77, 78, 79, 80]},
    21: {"nome": "TOURO", "numeros": [81, 82, 83, 84]},
    22: {"nome": "TIGRE", "numeros": [85, 86, 87, 88]},
    23: {"nome": "URSO", "numeros": [89, 90, 91, 92]},
    24: {"nome": "VEADO", "numeros": [93, 94, 95, 96]},
    25: {"nome": "VACA", "numeros": [97, 98, 99, 0]}
}

# HORÁRIOS DOS SORTEIOS
HORARIOS_SORTEIOS = {
    "PPT": "09:30",
    "PTM": "11:20", 
    "PT": "14:20",
    "PTV": "16:20",
    "PTN": "18:20",
    "COR": "21:20"
}

# ===================
# MODELS
# ===================

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    nivel: str = "comum"  # comum ou admin
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserCreate(BaseModel):
    username: str
    password: str
    nivel: str = "comum"

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    nivel: str
    created_at: datetime
    is_active: bool

class ResultadoJogo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    data: datetime
    horario: str  # PPT, PTM, PT, PTV, PTN, COR
    milhar_1: str  # 1º prêmio (ABCD)
    milhar_2: str  # 2º prêmio
    milhar_3: str  # 3º prêmio
    milhar_4: str  # 4º prêmio
    milhar_5: str  # 5º prêmio
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Palpite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    modalidade: str  # milhar, centena, dezena, grupo
    numeros: List[str]
    data_geracao: datetime = Field(default_factory=datetime.utcnow)
    data_sorteio: datetime
    horario_sorteio: str
    acertou: Optional[bool] = None
    resultado_conferido: bool = False

class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    acao: str
    detalhes: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ===================
# AUTH FUNCTIONS
# ===================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.nivel != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado - apenas administradores")
    return current_user

# ===================
# WEB SCRAPING FUNCTIONS
# ===================

def extrair_resultados_ojogo():
    """Extrae resultados do site www.ojogodobicho.com"""
    try:
        url = "https://www.ojogodobicho.com"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Esta é uma estrutura básica - será ajustada conforme a estrutura real do site
        resultados = []
        
        # Procurar por elementos que contenham os resultados
        # (Esta lógica será refinada após analisar a estrutura real do site)
        
        return resultados
        
    except Exception as e:
        logging.error(f"Erro ao extrair resultados: {e}")
        return []

async def salvar_resultado(resultado: ResultadoJogo):
    """Salva resultado no banco de dados"""
    try:
        # Verificar se já existe
        existing = await db.resultados.find_one({
            "data": resultado.data,
            "horario": resultado.horario
        })
        
        if not existing:
            await db.resultados.insert_one(resultado.dict())
            logging.info(f"Resultado salvo: {resultado.horario} - {resultado.data}")
    except Exception as e:
        logging.error(f"Erro ao salvar resultado: {e}")

# ===================
# ANÁLISE E PALPITES
# ===================

async def get_ultimos_resultados(dias: int = 30):
    """Busca últimos resultados"""
    data_limite = datetime.utcnow() - timedelta(days=dias)
    
    cursor = db.resultados.find({
        "data": {"$gte": data_limite}
    }).sort("data", -1)
    
    resultados = []
    async for doc in cursor:
        resultados.append(ResultadoJogo(**doc))
    
    return resultados

def analisar_frequencia_digitos(resultados: List[ResultadoJogo], posicao: str = "primeiro"):
    """Analisa frequência de dígitos"""
    digitos = []
    
    for resultado in resultados:
        milhar = resultado.milhar_1  # 1º prêmio
        if posicao == "primeiro" and len(milhar) >= 1:
            digitos.append(milhar[0])
        elif posicao == "todos":
            digitos.extend(list(milhar))
    
    counter = Counter(digitos)
    return counter

def gerar_palpites_milhar(resultados: List[ResultadoJogo]) -> List[str]:
    """Gera palpites para milhar (ABCD)"""
    if not resultados:
        return []
    
    # Analisar primeiro dígito dos últimos resultados
    freq_primeiro = analisar_frequencia_digitos(resultados, "primeiro")
    
    # Identificar dígitos ausentes ou menos frequentes
    todos_digitos = set("0123456789")
    presentes = set(freq_primeiro.keys())
    ausentes = todos_digitos - presentes
    
    # Escolher dígitos para prefixo
    if len(ausentes) == 1:
        prefixos = list(ausentes) + [min(freq_primeiro, key=freq_primeiro.get)]
    elif len(ausentes) > 1:
        prefixos = list(ausentes)[:2]
    else:
        # Todos presentes, pegar os 2 menos frequentes
        prefixos = [k for k, v in sorted(freq_primeiro.items(), key=lambda x: x[1])[:2]]
    
    # Base de centenas para combinar (exemplo)
    base_centenas = ["000", "001", "010", "011", "100", "101", "110", "111", "123", "234", "345", "456", "567", "678", "789", "890"]
    
    palpites = []
    for prefixo in prefixos:
        for centena in base_centenas:
            milhar = prefixo + centena
            
            # Filtro: remover milhares com 3+ dígitos iguais
            if len(set(milhar)) >= 2:  # Permitir até 2 dígitos iguais
                counter_digits = Counter(milhar)
                if max(counter_digits.values()) <= 2:
                    palpites.append(milhar)
    
    return sorted(list(set(palpites)))

def gerar_palpites_centena(milhar_base: str) -> List[str]:
    """Gera palpites para centena (BCD) - permutação dos últimos 3 dígitos"""
    if len(milhar_base) < 4:
        return []
    
    from itertools import permutations
    
    ultimos_3 = milhar_base[-3:]  # BCD
    perms = set([''.join(p) for p in permutations(ultimos_3)])
    
    # Filtrar centenas com 3+ dígitos iguais
    palpites_filtrados = []
    for centena in perms:
        counter_digits = Counter(centena)
        if max(counter_digits.values()) <= 2:
            palpites_filtrados.append(centena)
    
    return sorted(palpites_filtrados)

def gerar_palpites_dezena(milhar_base: str) -> List[str]:
    """Gera palpites para dezena (CD) - permutação dos últimos 2 dígitos"""
    if len(milhar_base) < 4:
        return []
    
    ultimos_2 = milhar_base[-2:]  # CD
    
    # Permutação simples: CD e DC
    dezenas = [ultimos_2, ultimos_2[::-1]]
    
    return sorted(list(set(dezenas)))

def gerar_palpites_grupos(milhar_base: str) -> List[Dict[str, Any]]:
    """Gera palpites para grupos/bichos baseado nos últimos 2 dígitos"""
    if len(milhar_base) < 4:
        return []
    
    ultimos_2 = milhar_base[-2:]  # CD
    numero = int(ultimos_2) if ultimos_2 != "00" else 100
    
    # Encontrar grupo correspondente
    grupo_id = None
    for gid, dados in GRUPOS_BICHOS.items():
        if numero in dados["numeros"] or (numero == 100 and 0 in dados["numeros"]):
            grupo_id = gid
            break
    
    if grupo_id:
        grupo_data = GRUPOS_BICHOS[grupo_id]
        return [{
            "grupo_id": grupo_id,
            "nome": grupo_data["nome"],
            "numeros": grupo_data["numeros"],
            "dezena_base": ultimos_2
        }]
    
    return []

# ===================
# API ROUTES - AUTH
# ===================

@api_router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    # Verificar se usuário já existe
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    # Criar usuário
    user = User(
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        nivel=user_data.nivel
    )
    
    await db.users.insert_one(user.dict())
    
    return UserResponse(**user.dict())

@api_router.post("/login")
async def login_user(login_data: UserLogin):
    user_doc = await db.users.find_one({"username": login_data.username})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    user = User(**user_doc)
    
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Usuário inativo")
    
    # Registrar login
    audit = AuditLog(
        user_id=user.id,
        acao="login",
        detalhes={"ip": "unknown", "user_agent": "unknown"}
    )
    await db.audit_logs.insert_one(audit.dict())
    
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user.dict())
    }

@api_router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.dict())

# ===================
# API ROUTES - RESULTADOS
# ===================

@api_router.get("/resultados")
async def get_resultados(dias: int = 30, current_user: User = Depends(get_current_user)):
    resultados = await get_ultimos_resultados(dias)
    return [r.dict() for r in resultados]

@api_router.post("/resultados/atualizar")
async def atualizar_resultados(admin_user: User = Depends(get_admin_user)):
    """Atualizar resultados manualmente (apenas admin)"""
    try:
        resultados = extrair_resultados_ojogo()
        
        for resultado_data in resultados:
            resultado = ResultadoJogo(**resultado_data)
            await salvar_resultado(resultado)
        
        # Registrar ação
        audit = AuditLog(
            user_id=admin_user.id,
            acao="atualizar_resultados",
            detalhes={"quantidade": len(resultados)}
        )
        await db.audit_logs.insert_one(audit.dict())
        
        return {"message": f"Atualizados {len(resultados)} resultados"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar: {str(e)}")

# ===================
# API ROUTES - PALPITES
# ===================

@api_router.post("/palpites/gerar")
async def gerar_palpites(modalidade: str, current_user: User = Depends(get_current_user)):
    """Gera palpites para uma modalidade específica"""
    
    if modalidade not in ["milhar", "centena", "dezena", "grupo"]:
        raise HTTPException(status_code=400, detail="Modalidade inválida")
    
    # Buscar últimos resultados (prioridade 2 dias)
    resultados_2dias = await get_ultimos_resultados(2)
    
    if not resultados_2dias:
        raise HTTPException(status_code=400, detail="Nenhum resultado encontrado para análise")
    
    # Usar o último resultado como base
    ultimo_resultado = resultados_2dias[0]
    milhar_base = ultimo_resultado.milhar_1
    
    palpites_gerados = []
    
    if modalidade == "milhar":
        palpites_gerados = gerar_palpites_milhar(resultados_2dias)
    elif modalidade == "centena":
        palpites_gerados = gerar_palpites_centena(milhar_base)
    elif modalidade == "dezena":
        palpites_gerados = gerar_palpites_dezena(milhar_base)
    elif modalidade == "grupo":
        grupos = gerar_palpites_grupos(milhar_base)
        palpites_gerados = [g["nome"] for g in grupos]
    
    # Determinar próximo sorteio
    agora = datetime.utcnow()
    proxima_data = agora.date()
    proximo_horario = "PPT"  # Simplificado - será refinado
    
    # Salvar palpites
    palpite = Palpite(
        user_id=current_user.id,
        modalidade=modalidade,
        numeros=palpites_gerados[:50],  # Limitar quantidade
        data_sorteio=datetime.combine(proxima_data, datetime.min.time()),
        horario_sorteio=proximo_horario
    )
    
    await db.palpites.insert_one(palpite.dict())
    
    # Registrar ação
    audit = AuditLog(
        user_id=current_user.id,
        acao="gerar_palpites",
        detalhes={"modalidade": modalidade, "quantidade": len(palpites_gerados)}
    )
    await db.audit_logs.insert_one(audit.dict())
    
    return {
        "modalidade": modalidade,
        "palpites": palpites_gerados[:50],
        "quantidade": len(palpites_gerados),
        "proximo_sorteio": {
            "data": proxima_data.isoformat(),
            "horario": proximo_horario
        }
    }

@api_router.get("/palpites/historico")
async def get_historico_palpites(current_user: User = Depends(get_current_user)):
    """Busca histórico de palpites do usuário"""
    
    cursor = db.palpites.find({"user_id": current_user.id}).sort("data_geracao", -1)
    
    palpites = []
    async for doc in cursor:
        palpites.append(Palpite(**doc).dict())
    
    return palpites

# ===================
# API ROUTES - RELATÓRIOS
# ===================

@api_router.get("/relatorios/estatisticas")
async def get_estatisticas(current_user: User = Depends(get_current_user)):
    """Estatísticas gerais"""
    
    resultados_30d = await get_ultimos_resultados(30)
    
    # Análise de frequência
    freq_primeiro = analisar_frequencia_digitos(resultados_30d, "primeiro")
    freq_todos = analisar_frequencia_digitos(resultados_30d, "todos")
    
    return {
        "total_resultados": len(resultados_30d),
        "periodo": "30 dias",
        "frequencia_primeiro_digito": dict(freq_primeiro),
        "frequencia_todos_digitos": dict(freq_todos),
        "ultimo_resultado": resultados_30d[0].dict() if resultados_30d else None
    }

# ===================
# ROUTES PRINCIPAIS
# ===================

@api_router.get("/")
async def root():
    return {"message": "🎯 O Mestre do Bicho API - Funcionando!", "version": "1.0.0"}

@api_router.get("/status")
async def status():
    try:
        # Test database connection
        await db.users.find_one()
        return {
            "status": "ok",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error", 
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("🎯 O Mestre do Bicho API iniciado!")
    
    # Criar usuário admin padrão se não existir
    admin_exists = await db.users.find_one({"username": "admin", "nivel": "admin"})
    if not admin_exists:
        admin_user = User(
            username="admin",
            password_hash=hash_password("admin123"),
            nivel="admin"
        )
        await db.users.insert_one(admin_user.dict())
        logger.info("Usuário admin criado: admin/admin123")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()