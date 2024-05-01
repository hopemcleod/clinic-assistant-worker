// import summary from "patientSummary.html";
import OpenAI from 'openai';
import { createClient } from "@supabase/supabase-js";

const chatMessages = [{
	role: 'system', // provides instructions to the model
	content: "You have access to patient notes and your role is to provide information about the patient to the clinician. \
	Sometimes the clinician is unable to spend much time reading up on a patient's notes, especially when the \
	patient has lots of notes. Your job is to provide as much information as you can, as succinctly as you can, to the clinician \
	so that they can get up to speed with a patient's details and treatment history. Imagine that a clinician only has 5 minutes \
	to familiarise themselves with a patient who they possibly haven't seen for weeks/months or have never met before because e.g. the patient \
	was under the care of a different clinician. Or, it might be that it is a really \
	busy clinic/medical centre and the clnician can't remember individuals easily. A context will be provided. Only use this context \
	to answer questions unless specifically asked to access knowledge outside this context. You could even ask the clinician if they yu to provide a more general answer \
	based on your knowledge. But if you do not know, then do not make up the answer. Your first task will be to provide a summary \
	in the following format. Note, placeholders have been put inside round brackets: (patient_name) registered on (date). First appointment was (date). \
	He is (age) years old. They have had (number) treatments since registering, with the first being (date) and last was (date). \
	They usually attend the clinic because they have (complaint). Their last appointment was (date). The impression is that their condition was \
	(improving, worse, no change). "
}]

const createSummary = async (data, openai) => {


};

export default {
	/**
	 * @param {Request} request
	 * @param {Env} env
	 * @param {ExecutionContext} ctx
	 * @returns {Promise<Response>}
	 */

	async fetch(request, env, ctx) {
		const jsonRequest = request.json();
		const requestUrl = new URL(request.url);
		console.log(requestUrl);

		if (requestUrl.pathname === '/summary') {

			if (requestUrl.pathname === "/summary") {
				console.log('About to fetch data ...')
				const firstName = requestUrl.searchParams.get('firstName');
				const lastName = requestUrl.searchParams.get('lastName');

				const supabaseUrl = 'http://localhost:8000'
				const supabaseKey = env.SUPABASE_KEY
				const client = createClient(supabaseUrl, supabaseKey)


				// const client = createClient(env.SUPABASE_URL, env.SUPABASE_API_KEY);
				// const { data, error } = await client.from('patient_details')
				// 	.select('*');

				// let { data: patient_details, error } = await client
				// 	.from('patient_details')
				// 	.select('*')

				const { data, error } = await client.from('patient_details').select(`*, patient_notes ( created_at, notes )`).eq('first_name', firstName).eq('last_name', lastName);

				if (error) {
					return new Response(JSON.stringify(error));
				}


				const jsonResult = JSON.stringify(data); //  send back a summary

				try {
					const openai = new OpenAI({
						apiKey: env.OPENAI_API_KEY,
					});

					console.log('About to create summary');

					chatMessages.push({
						role: 'user',
						content: `Please give a summary of ${jsonResult}`
					});

					const response = await openai.chat.completions.create({
						model: 'gpt-4',
						messages: chatMessages,
						temperature: 0.5,
						frequency_penalty: 0.5
					});

					console.log(response.choices[0].message.content);

				} catch (err) {
					console.error(err);
				}

				// const summary = createSummary(jsonResult, openai);
				return new Response(jsonResult, {
					headers: {
						'Content-Type': 'application/json',
					},
				});
			}
		}

		return new Response();
	}
};


/**
You have access to patient notes and your role is to provide information about the patient to the clinician. 
Sometimes the clinician is unable to spend much time reading up on a patient's notes, especially when the 
patient has loads of notes. Your job is to provide as much information as you can, as succinctly as you can, to the clinician
so that they can get up to speed with a patient's details and treatment history. Imagine that a clinician only has 5 minutes 
to familiarise themselves with a patient who they possibly haven't seen for weeks/months. Or, it might be that it is a really
busy clinic/medical centre and the clnician can't remember individuals easily. A context will be provided. Only use this context
to answer questions unless specifically asked to access knowledge outside this context. Your first task will be to provide a summary
 in the following format:

<patient nam> registered on <date>. First appointment was <date>. He is <age> years old.
They have had <number> treatments since registering, with the first being <date> and last was <date>. 
They usually attend the clinic because they have <complaint(s)>. Their last appointment was <date>. The impression is that their condition was 
<improving, worse, no change>.


Then the conversation begins ...
What exercises did I last prescribe?
Have they had any surgery?
Why do you say they were improving? The answer might be that their measured range of motion increased.


In javascript what function or library is used to encode and decode?


In JavaScript, the core functions to encode and decode URL components are:

encodeURIComponent() - Encodes a string into a valid URL component
decodeURIComponent() - Decodes an encoded URL component back into a string
These functions are built into JavaScript and available globally without needing to import any library.

Some examples:

// Encode a string 
const input = "What is your name?";
const encoded = encodeURIComponent(input);

console.log(encoded); 
// "What%20is%20your%20name%3F"

// Decode an encoded string
const decoded = decodeURIComponent(encoded); 

console.log(decoded);
// "What is your name?"



The encodeURIComponent() function replaces special characters with escape sequences like %20 for spaces. This allows the string to be safely used in a URL.

The decodeURIComponent() does the opposite, converting the escape sequences back into the original characters.

Some other notes:

The older encodeURI() and decodeURI() functions only encode a limited set of characters and aren't suitable for encoding URL parameters
The querystring module in Node.js also has stringify() and parse() methods for working with query strings
Libraries like axios handle encoding under the hood when making HTTP requests
So in summary, use the built-in encodeURIComponent() and decodeURIComponent() functions in JavaScript for encoding/decoding URL components.
 */