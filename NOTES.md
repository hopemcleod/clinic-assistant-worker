Loading data as a CSV from Supabase. 
Was originally going to open a patients.csv file locally within the Cloudflare Worker code and use the LangChain document loader i.e.
```import { CSVLoader } from "langchain/document_loaders/fs/csv"```
However, Cloudflare worker environments are their own environment/sandbox just like a browser environment is sandboxed just like a nodejs environment is sandboxed. A LangChain loader needs access to the computer/server's file system using fs promises (file store Promise objects). But access to the file system is not allowed. nodejs environment, however, would allow access. 

Alternative to reading a CSV file, is to talk to a database (in this case Supabase) and use the Supabase API to get data from DB table(s) and then convert the data retrieved to CSV. That way the Cloudflare Worker environment does not need to access the file system. 

Going to try instructions from https://supabase.com/docs/reference/javascript/db-csv

### A Guide to Using CSV Files with LangChain with CSVChain
https://anakin.ai/blog/langchain-csvchain/

### Build a Chatbot on your CSV Data With LangChain and OpenAI
https://betterprogramming.pub/build-a-chatbot-on-your-csv-data-with-langchain-and-openai-ed121f85f0cd?gi=3db468f76661

### How to use files with LangChain using CsvChain
https://cheatsheet.md/langchain-tutorials/langchain-csvchain.en

### Automating CSV Data Processing with Python and LangChain
https://medium.com/@amarjeetaryan90/automating-csv-data-processing-with-python-and-langchain-d50989d781f1


