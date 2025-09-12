import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// This is a simple AI response simulator.
// TODO: Replace this with a real call to an AI service like OpenAI or Google Gemini.
function getSimpleAIResponse(userMessage: string): string {
    const lowerCaseMessage = userMessage.toLowerCase();
    if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi")) {
        return "Hello there! How are you feeling today?";
    }
    if (lowerCaseMessage.includes("sad") || lowerCaseMessage.includes("depressed")) {
        return "I'm sorry to hear that you're feeling down. Sometimes talking about it can help. What's on your mind?";
    }
    if (lowerCaseMessage.includes("anxious") || lowerCaseMessage.includes("worried")) {
        return "It sounds like you have a lot on your mind. Can you tell me more about what's causing the anxiety?";
    }
    return "Thank you for sharing that with me. It's brave to talk about these things. How can I best support you right now?";
}

Deno.serve(async (req) => {
    // This is needed to handle OPTIONS requests from browsers.
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { message, userId } = await req.json();

        if (!message || !userId) {
            return new Response(JSON.stringify({ error: 'Message and userId are required.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // Create a Supabase client with the user's authorization.
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // 1. Save the user's message to the database.
        await supabaseClient.from('chat_messages').insert({
            user_id: userId,
            sender: 'user',
            message_text: message,
        });

        // 2. Get a response from the AI.
        const aiResponseText = getSimpleAIResponse(message);

        // 3. Save the AI's response to the database.
        await supabaseClient.from('chat_messages').insert({
            user_id: userId,
            sender: 'ai',
            message_text: aiResponseText,
        });

        // 4. Return the AI's response to the frontend.
        return new Response(JSON.stringify({ reply: aiResponseText }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
