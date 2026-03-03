import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { nome } = await request.json();

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        transaction_amount: 5.00,
        description: `Roast Musical para ${nome}`,
        payment_method_id: "pix",
        payer: { 
          email: "pix@molda.site", 
          first_name: nome 
        },
      }),
    });

    const data = await response.json();

    return NextResponse.json({ 
      qrCode: data.point_of_interaction.transaction_data.qr_code,
      copyPaste: data.point_of_interaction.transaction_data.qr_code_64,
      id: data.id 
    });

  } catch (error) {
    return NextResponse.json({ error: "Erro ao gerar Pix" }, { status: 500 });
  }
}