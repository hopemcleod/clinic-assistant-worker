/**
 * Fetches query related data/docs from the vector database. Once retrieved
 * these docs are combined and act as context for the LLM when asked a question
 * by the user.
 * @param {*} docs: Docs in LangChain are rows fetched from a vector database.
 * @returns 
 */
export function combineDocuments(docs){
    return docs.map((doc)=>doc.pageContent).join('\n\n');
}