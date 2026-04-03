const BANK_CODES: Record<string, string> = {
  "Access Bank": "044",
  "GTBank": "058",
  "First Bank": "011",
  "UBA": "033",
  "Zenith Bank": "057",
  "Ecobank": "050",
  "Fidelity Bank": "070",
  "Union Bank": "032",
  "Stanbic IBTC": "221",
  "Sterling Bank": "232",
  "Wema Bank": "035",
  "Polaris Bank": "076",
  "Kuda Bank": "50211",
  "Opay": "999992",
  "PalmPay": "999991"
}

export async function createPaystackSubaccount(data: {
  business_name: string
  settlement_bank: string
  account_number: string
  percentage_charge: number
}) {
  const bankCode = BANK_CODES[data.settlement_bank]
  if (!bankCode) throw new Error(`Unsupported bank: ${data.settlement_bank}`)

  const response = await fetch('https://api.paystack.co/subaccount', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      business_name: data.business_name,
      settlement_bank: bankCode,
      account_number: data.account_number,
      percentage_charge: data.percentage_charge,
    }),
  })

  const result = await response.json()
  if (!result.status) {
    throw new Error(result.message || 'Failed to create subaccount')
  }

  return result.data // Contains subaccount_code
}

export async function updatePaystackSubaccount(subaccountCode: string, data: {
  business_name?: string
  settlement_bank?: string
  account_number?: string
}) {
  const payload: any = { ...data }
  if (data.settlement_bank) {
    payload.settlement_bank = BANK_CODES[data.settlement_bank]
  }

  const response = await fetch(`https://api.paystack.co/subaccount/${subaccountCode}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const result = await response.json()
  if (!result.status) {
    throw new Error(result.message || 'Failed to update subaccount')
  }

  return result.data
}
