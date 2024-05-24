import { openai, supabase } from '../src/config.js';
import podcasts from '../src/content.js';

async function main(input) {
  const data = await Promise.all(
    input.map( async (textChunk) => {
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: textChunk
        });
        return { 
          content: textChunk, 
          embedding: embeddingResponse.data[0].embedding 
        }
    })
  );
  
  // Insert content and embedding into Supabase
  const response = await supabase.from('patients_details_embeddings').insert(data); 
  console.log('Embedding and storing complete!');
}

main(podcasts)