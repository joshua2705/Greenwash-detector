import os
from langchain.chat_models import init_chat_model
from langchain_openai import OpenAIEmbeddings

import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS

import bs4
from langchain import hub
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import START, StateGraph
from typing_extensions import List, TypedDict

from langchain_community.document_loaders import PyPDFLoader 

##Insert KEYS here and delete them before commiting

os.environ["LANGSMITH_PROJECT"] = "my-first-langsmith-run"
os.environ["LANGSMITH_TRACING"] = "true"


llm = init_chat_model("llama3-8b-8192", model_provider="groq")
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")


embedding_dim = len(embeddings.embed_query("hello world"))
index = faiss.IndexFlatL2(embedding_dim)

vector_store = FAISS(
    embedding_function=embeddings,
    index=index,
    docstore=InMemoryDocstore(),
    index_to_docstore_id={},
)


# Create a sample document
sample_text = """
Artificial Intelligence (AI) is revolutionizing various industries and sectors. 
Machine Learning, a subset of AI, enables systems to learn from data and improve their performance without being explicitly programmed. 
Deep Learning, a more specialized form of Machine Learning, uses neural networks with multiple layers to process complex patterns in data.
Natural Language Processing (NLP) is another important field within AI that focuses on enabling computers to understand and process human language.
"""

docs = [Document(page_content=sample_text)]

# Replace the sample document section with this:
# Load a PDF file
loader = PyPDFLoader("./asset/2024_annual_report.pdf")  # Replace with your actual PDF file path
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
all_splits = text_splitter.split_documents(docs)

# Index chunks
_ = vector_store.add_documents(documents=all_splits)

# Define prompt for question-answering
# N.B. for non-US LangSmith endpoints, you may need to specify
# api_url="https://api.smith.langchain.com" in hub.pull.
prompt = hub.pull("rlm/rag-prompt")


# Define state for application
class State(TypedDict):
    question: str
    context: List[Document]
    answer: str


# Define application steps
def retrieve(state: State):
    retrieved_docs = vector_store.similarity_search(state["question"])
    return {"context": retrieved_docs}


def generate(state: State):
    docs_content = "\n\n".join(doc.page_content for doc in state["context"])
    messages = prompt.invoke({"question": state["question"], "context": docs_content})
    response = llm.invoke(messages)
    return {"answer": response.content}


# Compile application and test
graph_builder = StateGraph(State).add_sequence([retrieve, generate])
graph_builder.add_edge(START, "retrieve")
graph = graph_builder.compile()

print(graph.invoke({"question": "What is the main topic of the blog post?"}))