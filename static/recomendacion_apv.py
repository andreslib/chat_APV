import math

def get_best_apv_option(user_inputs):
    # Example input keys: regimen, monthly_contribution, deposit_frequency, withdrawal_age,
    # current_age, income_at_withdrawal, risk_profile, is_insured

    years_invested = user_inputs["withdrawal_age"] - user_inputs["current_age"]
    total_contributions = user_inputs["monthly_contribution"] * 12 * years_invested
    deposit_count = user_inputs["deposit_frequency"] * years_invested

    # Placeholder: expected UTM value for Regimen A tax benefit cap
    utm_value = 65000  # CLP per UTM (this should be fetched dynamically)

    investment_options = {
        "AFP": [
            {
                "company": "AFP Modelo",
                "fund_name": "Fondo C",
                "fixed_cost": 1000,
                "monthly_fee_percent": 0.008,
                "expected_return_percent": {"low": 0.035, "medium": 0.055, "high": 0.07},
                "insurance_cost": 0
            },
            {
                "company": "AFP Habitat",
                "fund_name": "Fondo B",
                "fixed_cost": 1200,
                "monthly_fee_percent": 0.009,
                "expected_return_percent": {"low": 0.04, "medium": 0.06, "high": 0.08},
                "insurance_cost": 0
            }
        ],
        "Insurance": [
            {
                "company": "MetLife",
                "fund_name": "Seguro Ahorro APV",
                "fixed_cost": 1500,
                "monthly_fee_percent": 0.015,
                "expected_return_percent": {"low": 0.03, "medium": 0.05, "high": 0.065},
                "insurance_cost": 4500
            }
        ],
        "Mutual Funds": [
            {
                "company": "BTG Pactual",
                "fund_name": "Fondo Crecimiento",
                "fixed_cost": 800,
                "monthly_fee_percent": 0.012,
                "expected_return_percent": {"low": 0.04, "medium": 0.06, "high": 0.085},
                "insurance_cost": 0
            }
        ]
    }

    def calculate_tax_benefit(regimen, yearly_savings):
        if regimen == "A":
            benefit = min(yearly_savings * 0.15, 6 * utm_value)
        elif regimen == "B":
            # Placeholder logic for Regimen B
            if user_inputs["income_at_withdrawal"] < 800000:
                benefit = yearly_savings * 0.10  # estimated based on lower tax bracket
            else:
                benefit = yearly_savings * 0.05
        else:
            benefit = 0
        return benefit * years_invested

    scored_options = []

    for category, funds in investment_options.items():
        for fund in funds:
            fixed_cost_total = fund["fixed_cost"] * deposit_count
            monthly_fee_total = user_inputs["monthly_contribution"] * fund["monthly_fee_percent"] * 12 * years_invested
            insurance_cost = fund["insurance_cost"] if user_inputs["is_insured"] else 0

            total_costs = fixed_cost_total + monthly_fee_total + insurance_cost

            rate = fund["expected_return_percent"][user_inputs["risk_profile"]]
            future_value = user_inputs["monthly_contribution"] * (((1 + rate) ** years_invested - 1) / rate) * (1 + rate)

            tax_benefit = calculate_tax_benefit(user_inputs["regimen"], user_inputs["monthly_contribution"] * 12)

            net_value = future_value + tax_benefit - total_costs

            scored_options.append({
                "type": category,
                "company": fund["company"],
                "fund_name": fund["fund_name"],
                "score": round(net_value, 2),
                "details": {
                    "return": round(future_value, 0),
                    "costs": round(total_costs, 0),
                    "tax_benefit": round(tax_benefit, 0)
                }
            })

    best = max(scored_options, key=lambda x: x["score"])

    return {
        "best_option": {
            "type": best["type"],
            "company": best["company"],
            "fund_name": best["fund_name"]
        },
        "score": best["score"],
        "summary": f"{best['company']} - {best['fund_name']} ofrece el mayor beneficio ajustado por retorno, costos y beneficios tributarios.",
        "scorecard": scored_options
    }
