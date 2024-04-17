/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// USEFUL documents:
// https://developers.cloudflare.com/workers/
// https://developers.cloudflare.com/workers/tutorials/openai-function-calls-workers/

// PostgreSQL database: postgres://postgres.gwlgqvdsleqgtcwpaiup:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:5432/postgres
import OpenAI from 'openai';

const corsHeaders = {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
}

export default {
    async fetch(request, env, ctx) {
        // **OBJECTIVE - to receive request from client, worker send request to supabase, supabase responds, worker send response to client
        // request.name or request.body.name
        // ask supabase to search for the name and return
        // can do a fake response to start - returning firstname, lastname, dob, address, gender, date registered

        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }
        const openai = new OpenAI({
            apiKey: env.OPENAI_API_KEY
            // don't need dangerouslyAllowBrowser anymore because this file lives on Cloudflare's secure server
        });

        try {
            const chatCompletions = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    { role: 'assistant', content: 'You work at the General Osteopathic Council and you are able to answer queries in relation to statistics on osteopaths.' },
                    { role: 'user', content: 'How many osteopath clinics are there in Northampton, Northamptonshire, UK?' }],
                temperature: 0,
                presence_penalty: 0,
                frequency_penalty: 0
            })

            const response = chatCompletions.choices[0].message;
            return new Response(JSON.stringify(response), { headers: corsHeaders });
        } catch (e) {
            return new Response(e, { headers: corsHeaders });
        }
    },
};