import requests
import sys
from datetime import datetime
import json

class MestreDosBichosAPITester:
    def __init__(self, base_url="https://portugues-chat-15.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        if self.token and 'Authorization' not in headers:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_status(self):
        """Test API root and status endpoints"""
        print("\n" + "="*50)
        print("🚀 TESTING API STATUS")
        print("="*50)
        
        # Test root endpoint
        self.run_test("API Root", "GET", "", 200)
        
        # Test status endpoint
        self.run_test("API Status", "GET", "status", 200)

    def test_authentication(self):
        """Test authentication system"""
        print("\n" + "="*50)
        print("🔐 TESTING AUTHENTICATION")
        print("="*50)
        
        # Test login with test user
        success, response = self.run_test(
            "Login with testeuser",
            "POST",
            "login",
            200,
            data={"username": "testeuser", "password": "123456"}
        )
        
        if success and isinstance(response, dict) and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response.get('user', {}).get('id')
            print(f"   ✅ Token obtained successfully")
            
            # Test /me endpoint
            self.run_test("Get Current User Info", "GET", "me", 200)
            
        else:
            print("   ❌ Failed to get token, trying to create test user...")
            
            # Try to register test user
            register_success, _ = self.run_test(
                "Register testeuser",
                "POST", 
                "register",
                200,
                data={"username": "testeuser", "password": "123456", "nivel": "comum"}
            )
            
            if register_success:
                # Try login again
                success, response = self.run_test(
                    "Login after registration",
                    "POST",
                    "login", 
                    200,
                    data={"username": "testeuser", "password": "123456"}
                )
                
                if success and isinstance(response, dict) and 'access_token' in response:
                    self.token = response['access_token']
                    self.user_id = response.get('user', {}).get('id')
                    print(f"   ✅ Token obtained after registration")

        # Test admin login
        admin_success, admin_response = self.run_test(
            "Login with admin",
            "POST",
            "login",
            200,
            data={"username": "admin", "password": "admin123"}
        )

        return self.token is not None

    def test_palpites_generation(self):
        """Test palpites (predictions) generation for all modalities"""
        print("\n" + "="*50)
        print("🎯 TESTING PALPITES GENERATION")
        print("="*50)
        
        if not self.token:
            print("❌ No token available, skipping palpites tests")
            return False
        
        modalidades = ["milhar", "centena", "dezena", "grupo"]
        
        for modalidade in modalidades:
            success, response = self.run_test(
                f"Generate {modalidade} palpites",
                "POST",
                f"palpites/gerar?modalidade={modalidade}",
                200
            )
            
            if success and isinstance(response, dict):
                palpites = response.get('palpites', [])
                print(f"   📊 Generated {len(palpites)} palpites for {modalidade}")
                if palpites:
                    print(f"   🎲 Sample palpites: {palpites[:5]}")

    def test_historico_palpites(self):
        """Test palpites history"""
        print("\n" + "="*50)
        print("📚 TESTING PALPITES HISTORY")
        print("="*50)
        
        if not self.token:
            print("❌ No token available, skipping history tests")
            return False
            
        success, response = self.run_test(
            "Get Palpites History",
            "GET",
            "palpites/historico",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   📊 Found {len(response)} historical palpites")
            if response:
                print(f"   📝 Latest palpite: {response[0].get('modalidade')} - {len(response[0].get('numeros', []))} numbers")

    def test_relatorios(self):
        """Test reports and statistics"""
        print("\n" + "="*50)
        print("📊 TESTING REPORTS & STATISTICS")
        print("="*50)
        
        if not self.token:
            print("❌ No token available, skipping reports tests")
            return False
            
        success, response = self.run_test(
            "Get Statistics",
            "GET",
            "relatorios/estatisticas",
            200
        )
        
        if success and isinstance(response, dict):
            print(f"   📈 Total resultados: {response.get('total_resultados', 0)}")
            print(f"   📅 Período: {response.get('periodo', 'N/A')}")
            freq_primeiro = response.get('frequencia_primeiro_digito', {})
            if freq_primeiro:
                print(f"   🔢 Frequência primeiro dígito: {dict(list(freq_primeiro.items())[:5])}")

    def test_resultados(self):
        """Test results endpoints"""
        print("\n" + "="*50)
        print("🎲 TESTING RESULTADOS")
        print("="*50)
        
        if not self.token:
            print("❌ No token available, skipping resultados tests")
            return False
            
        success, response = self.run_test(
            "Get Resultados (30 days)",
            "GET",
            "resultados?dias=30",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   🎯 Found {len(response)} resultados")
            if response:
                ultimo = response[0]
                print(f"   🏆 Último resultado: {ultimo.get('milhar_1')} - {ultimo.get('horario')}")

    def test_invalid_requests(self):
        """Test error handling"""
        print("\n" + "="*50)
        print("🚫 TESTING ERROR HANDLING")
        print("="*50)
        
        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST",
            "login",
            401,
            data={"username": "invalid", "password": "wrong"}
        )
        
        # Test invalid modalidade
        if self.token:
            self.run_test(
                "Invalid Modalidade",
                "POST",
                "palpites/gerar?modalidade=invalid",
                400
            )
        
        # Test unauthorized access
        old_token = self.token
        self.token = "invalid_token"
        self.run_test(
            "Unauthorized Access",
            "GET",
            "me",
            401
        )
        self.token = old_token

def main():
    print("🎯 INICIANDO TESTES DO MESTRE DOS BICHOS API")
    print("=" * 60)
    
    tester = MestreDosBichosAPITester()
    
    # Run all tests
    tester.test_api_status()
    
    auth_success = tester.test_authentication()
    if not auth_success:
        print("\n❌ Authentication failed, stopping tests")
        return 1
    
    tester.test_palpites_generation()
    tester.test_historico_palpites()
    tester.test_relatorios()
    tester.test_resultados()
    tester.test_invalid_requests()
    
    # Print final results
    print("\n" + "="*60)
    print("📊 RESULTADOS FINAIS DOS TESTES")
    print("="*60)
    print(f"✅ Testes aprovados: {tester.tests_passed}/{tester.tests_run}")
    print(f"📈 Taxa de sucesso: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 TODOS OS TESTES PASSARAM!")
        return 0
    else:
        print("⚠️  ALGUNS TESTES FALHARAM!")
        return 1

if __name__ == "__main__":
    sys.exit(main())