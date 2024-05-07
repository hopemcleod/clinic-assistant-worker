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

const findUser = async (firstName, lastName, dbClient) => {
	try {
		const { data, error } = await dbClient
			.from('patient_details')
			.select(`*, patient_notes ( created_at, notes )`)
			.eq('first_name', firstName)
			.eq('last_name', lastName);

		if (data.length === 0) {
			console.log('No data found');
			return '';
		}
		else {
			console.log('Data found');
			return data;
		}
	}
	catch (err) {
		console.error(err);
	}
}

const getUserDetails = (requestUrl) => {
	return { firstName: requestUrl.searchParams.get('firstName'), lastName: requestUrl.searchParams.get('lastName') };
}

export default {
	/**
	 * @param {Request} request
	 * @param {Env} env
	 * @param {ExecutionContext} ctx
	 * @returns {Promise<Response>}
	 */

	async fetch(request, env, ctx) {
		// Constants
		let jsonString = "";
		let openai = null;
		const requestUrl = new URL(request.url);

		// createResponse closure
		const createResponse = async (data) => {
			console.log('About to create response');

			chatMessages.push({
				role: 'user',
				content: data
			});

			const response = await openai.chat.completions.create({
				model: 'gpt-4',
				messages: chatMessages,
				temperature: 0.5,
				frequency_penalty: 0.5
			});

			return response;

		}

		// Create a new OpenAI client
		try {
			openai = new OpenAI({
				apiKey: env.OPENAI_API_KEY,
			});

		} catch (err) {
			console.error(err);
		}

		// Process endpoint
		switch (requestUrl?.pathname) {
			case "/summary":
				console.log("Summary endpoint.")
				const { firstName, lastName } = getUserDetails(requestUrl);
				let dbClient = null;

				try {
					dbClient = await createClient('http://localhost:8000', env.SUPABASE_KEY);
				}
				catch (err) {
					console.error(err);
				}

				const data = await findUser(firstName, lastName, dbClient);

				jsonString = JSON.stringify(data);

				if (jsonString !== '') {
					const result = await createResponse(`Please create a summary for the following: ${jsonString}`);

					if (result) {
						chatMessages.push(result.choices[0].message)
						console.log(chatMessages);
					}

				}

				return new Response(chatMessages, {
					headers: {
						'Content-Type': 'application/json',
					},
				});

			case "/chat":
				// check that a summary has been created already  - should have one system message and one user message already
				if (chatMessages.length === 2 || chatMessages.length > 2) {
					console.log(chatMessages);
					console.log(`Request pathname is /chat`)
					try {
						const requestData = await request.clone().json();
						console.log('Request body:', requestData);

						try {
							const result = await createResponse(requestData.userQuestion);
							if (result) {
								chatMessages.push(result.choices[0].message)
								console.log(chatMessages);
							}

							return new Response(result, {
								headers: {
									'Content-Type': 'application/json',
								},
							});
						}
						catch (e) {
							return new Response(e);
						}
					}
					catch (err) {
						console.error(err);
					}
				}
				return new Response(null);
		}
	}
}


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