import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI, OpenAIEmbeddings} from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { combineDocuments } from '../utils/combineDocuments.js';

export default {
	/**
	 * Uses LangChain to prepares/augments a default LLM to answer questions about a specific 
	 * domain. In this case, it's responding to questions about patient notes.
	 * The vector database and embeddings are setup using another simple nodejs project. 
	 * So need to run that program before running this if the vector database doesn't already exist
	 * with embeddings. NOTE: The patients being used are fictitious.
	 * To kick of the process of generating an answer, run the GET request in non-specific-entry-point.http
	 * @param {Request} request
	 * @param {Env} env
	 * @param {ExecutionContext} ctx
	 * @returns {Promise<Response>}
	 */

	async fetch(request, env, ctx) {
		try {
			// let chain = undefined;
			const openAIApiKey = env.OPENAI_API_KEY;
			if (!openAIApiKey) throw new Error("Expected OPENAI_API_KEY");

			// create a Supabase client
			const supaBaseApiKey = env.DOCKER_SUPABASE_API_KEY;
			if (!supaBaseApiKey) throw new Error("Expected DOCKER_SUPABASE_API_KEY");

			const supaBaseUrl = env.DOCKER_SUPABASE_URL;
			if (!supaBaseUrl) throw new Error("Expected DOCKER_SUPABASE_URL");

			const client = createClient(supaBaseUrl, supaBaseApiKey);

			const embeddings = new OpenAIEmbeddings({ openAIApiKey });

			// Class to interact with the Supabase database - to interact with the vector database/store
			const vectorStore = new SupabaseVectorStore(embeddings, {
				client,
				tableName: 'documents',
				queryName: 'match_documents'
			});

			////////////////////////////// This is where really use LangChain ////////////////////////////////////////////////////
			const llm = new ChatOpenAI({ openAIApiKey });

			// standalone question setup
			const standaloneQuestionTemplate = 'Given a question, convert it to a standalone question. question: {user_query} standalone question:';

			const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate);

			const standaloneQuestionChain = standaloneQuestionPrompt
				.pipe(llm)
				.pipe(new StringOutputParser());

			const retriever = vectorStore.asRetriever();

			// retriever setup
			const retrieverChain = RunnableSequence.from([
				prevResult => prevResult.question, // need to capture the result from whatever the previous step is going to be. The retriever doesn't have a template or therefore a placeholder. So I think that's why we need to do this.
				retriever,
				combineDocuments
			]);

			// answer setup
			const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about patients based on the context provided. /
		Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner /
		to email support@clinic-assistant.com. Don't try to make up an answer. Always speak as if you were chatting to a colleague.
		context: {context}
		question: {user_query}
		answer: `;

			const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

			const answerChain = answerPrompt
				.pipe(llm)
				.pipe(new StringOutputParser());

			// Linking the sub chains together to form a whole chain that will be used to generate an answer from the user query.
			const chain = RunnableSequence.from([
				{
					question: standaloneQuestionChain, // this 'question' key comes the retrieverChain arrow function above: prevResult => prevResult.question 
					original_input: new RunnablePassthrough() // this stores the original user query which only standaloneQuestionChain has
				},
				{
					context: retrieverChain,
					user_query: ({ original_input }) => original_input.user_query
				},
				answerChain // this needs the context and user_query
			]);

			const response = await chain?.invoke({
				user_query: 'What are the names of patients that have low back pain?'
				// user_query: 'Please tell me about Fermin Dooley'
				// user_query: question
			});

			console.log(response);
		}
		catch (err) {
			console.log(err);
		}

		return new Response("Process complete.");
	}
};