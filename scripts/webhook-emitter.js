const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("==========================================");
console.log(" SIMULADOR DE WEBHOOK - ABACATE PAY");
console.log("==========================================\n");

rl.question('Qual é o payment_id retornado no seu terminal Next.js (ex: bill_ABC123)? ', async (paymentId) => {
    if (!paymentId) {
        console.error("ID não fornecido. Saindo.");
        process.exit(1);
    }

    const payload = {
        event: "BILLING_PAID",
        data: {
            id: paymentId,
            status: "PAID",
            amount: 497,
            customer: {
                name: "Test User",
                email: "test@example.com"
            }
        }
    };

    try {
        console.log(`\nEnviando webhook simulado para http://localhost:3000/api/webhook...`);
        const response = await fetch('http://localhost:3000/api/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log(`Status HTTTP da sua API: ${response.status}`);
        console.log(`Resposta da API:`, text);

        if (response.ok) {
            console.log("\n✅ Webhook processado com sucesso! Volte ao seu app e veja se a tela atualizou.");
        }

    } catch (error) {
        console.error("❌ Falha ao enviar requisição. O servidor Next.js está rodando na porta 3000?");
        console.error(error);
    } finally {
        rl.close();
    }
});

