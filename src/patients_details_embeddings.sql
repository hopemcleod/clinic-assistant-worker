-- Create a function to search for patient details
create or replace function match_patients_details (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  similarity float
)
language sql stable
as $$
  select
    patients_details_embeddings.id,
    patients_details_embeddings.content,
    1 - (patients_details_embeddings.embedding <=> query_embedding) as similarity
  from patients_details_embeddings
  where 1 - (patients_details_embeddings.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;