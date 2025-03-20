import re
import requests

def calculate_apv_savings(regimen, yearly_savings, monthly_income, employment_type):
    """Calculates the tax benefits of APV based on the chosen regimen."""
    UTM_URL = "https://www.sii.cl/valores_y_fechas/utm/utm2025.htm"
    UF_URL = "https://www.sii.cl/valores_y_fechas/uf/uf2025.htm"
    
    utm_value = 68306 # fetch_value_from_sii(UTM_URL)
    uf_value = 38894.11 #fetch_value_from_sii(UF_URL)

    if regimen == "A":
        max_savings = 6 * utm_value  # Max limit for Regimen A
        savings = min(yearly_savings * 0.15, max_savings)
    
    elif regimen == "B":
        max_savings = 600 * uf_value  # Max limit for Regimen B
        savings = min(yearly_savings, max_savings)
        
        # Fetch the tax rate based on employment type and income
        tax_rate = fetch_tax_rate(employment_type, monthly_income)
        savings = savings * tax_rate  # Apply tax rate deduction

    else:
        return {"error": "Invalid Regimen selected"}
    
    return {"regimen": regimen, "tax_savings": savings}

def recommend_best_regimen(yearly_savings, monthly_income, employment_type):
    """
    Compares Regimen A and B and recommends the best option for the user.
    """
    savings_A = calculate_apv_savings("A", yearly_savings, monthly_income, employment_type)['tax_savings']
    savings_B = calculate_apv_savings("B", yearly_savings, monthly_income, employment_type)['tax_savings']
    
    if savings_A > savings_B:
        return {"best_regimen": "A", "savings_higher": savings_A, "savings_lower": savings_B}
    else:
        return {"best_regimen": "B", "savings_higher": savings_B, "savings_lower": savings_A}
    

def fetch_value_from_sii(url):
    """Fetches and extracts the latest value from the SII website."""
    response = requests.get(url)
    if response.status_code == 200:
        # Extracting the numeric value from the response text
        value = extract_value(response.text)
        return value
    return None

def extract_value(html_text):
    """Extracts the most relevant financial value from the given HTML content."""
    match = re.search(r'\d+[.,]?\d*', html_text)
    return float(match.group().replace(',', '.')) if match else None

def fetch_tax_rate(employment_type, monthly_income):
    """Fetches the tax rate based on employment type and taxable income."""
    tax_brackets = {
        "dependent": [(0, 0.04), (2000000, 0.08), (4000000, 0.15), (6000000, 0.25), (8000000, 0.35)],
        "independent": [(0, 0.1), (2000000, 0.15), (4000000, 0.22), (6000000, 0.3), (8000000, 0.4)]
    }
    
    brackets = tax_brackets.get(employment_type.lower(), [])
    applicable_rate = 0
    for income_threshold, rate in brackets:
        if monthly_income >= income_threshold:
            applicable_rate = rate
        else:
            break
    
    return applicable_rate
