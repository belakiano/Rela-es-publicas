// Esta é uma "Netlify Function" que atuará como um intermediário seguro (proxy)
// entre o seu simulador e a API do Gemini.

exports.handler = async function(event) {
    // A função só aceita requisições do tipo POST.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        // Pega os dados enviados pelo simulador.
        const { userPrompt, systemPrompt, generationConfig } = JSON.parse(event.body);

        // Pega a API Key da variável de ambiente configurada no Netlify.
        // Este é o passo crucial de segurança. A chave NUNCA fica no código do navegador.
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            // ATUALIZADO: Mensagem de erro mais clara
            console.error('Erro Crítico: Variável de ambiente GEMINI_API_KEY não está definida no Netlify.');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'A API Key do servidor não está configurada. Contacte o administrador.' })
            };
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        // Monta o corpo da requisição para a API do Gemini.
        const payload = {
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: generationConfig
        };

        // Faz a chamada para a API do Gemini a partir do servidor do Netlify.
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // ATUALIZADO: Log mais detalhado em caso de erro da API do Gemini
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Erro na API do Gemini:', response.status, errorBody);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Erro na API do Gemini: ${response.statusText}. Verifique a API Key e as permissões.` })
            };
        }

        const data = await response.json();

        // Retorna a resposta do Gemini para o simulador.
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Erro na função do Netlify:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

