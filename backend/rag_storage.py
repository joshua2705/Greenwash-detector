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
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader, CSVLoader

def init_environment():
    """Initialize environment variables and models"""
    ##ADD KEYS HERE
    os.environ["LANGSMITH_PROJECT"] = "my-first-langsmith-run"
    os.environ["LANGSMITH_TRACING"] = "true"

    llm = init_chat_model("llama3-8b-8192", model_provider="groq")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
    return llm, embeddings

def create_vector_store(embeddings):
    """Initialize the vector store"""
    embedding_dim = len(embeddings.embed_query("hello world"))
    index = faiss.IndexFlatL2(embedding_dim)
    return FAISS(
        embedding_function=embeddings,
        index=index,
        docstore=InMemoryDocstore(),
        index_to_docstore_id={},
    )

def get_document_loader(file_path: str):
    """
    Get the appropriate document loader based on file extension
    
    Args:
        file_path (str): Path to the file
        
    Returns:
        DocumentLoader: The appropriate loader for the file type
        
    Raises:
        ValueError: If the file type is not supported
    """
    file_extension = Path(file_path).suffix.lower()
    
    if file_extension == '.pdf':
        return PyPDFLoader(file_path)
    elif file_extension == '.csv':
        return CSVLoader(
            file_path,
            source_column="content" if "content" in CSVLoader(file_path).infer_columns() else None
        )
    else:
        raise ValueError(f"Unsupported file type: {file_extension}. Supported types are: .pdf, .csv")

def process_document(file_path: str, vector_store):
    """Process the document and add it to the vector store"""
    # Get the appropriate loader
    loader = get_document_loader(file_path)
    
    # Load the document
    docs = loader.load()
    
    # Split the text into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    all_splits = text_splitter.split_documents(docs)
    
    # Add to vector store
    vector_store.add_documents(documents=all_splits)
    return vector_store

class State(TypedDict):
    question: str
    context: List[Document]
    answer: str

def setup_graph(llm, vector_store):
    """Set up the processing graph"""
    def retrieve(state: State):
        retrieved_docs = vector_store.similarity_search(state["question"])
        return {"context": retrieved_docs}

    def generate(state: State):
        docs_content = "\n\n".join(doc.page_content for doc in state["context"])
        prompt = hub.pull("rlm/rag-prompt")
        messages = prompt.invoke({"question": state["question"], "context": docs_content})
        response = llm.invoke(messages)
        return {"answer": response.content}

    graph_builder = StateGraph(State).add_sequence([retrieve, generate])
    graph_builder.add_edge(START, "retrieve")
    return graph_builder.compile()

def analyze_document(question: str, file_path: str) -> str:
    """
    Main function to analyze a document and answer questions about it.
    
    Args:
        question (str): The question to ask about the document
        file_path (str): Path to the file to analyze (supports .pdf and .csv)
    
    Returns:
        str: The answer to the question based on the document content
        
    Raises:
        ValueError: If the file type is not supported
    """
    # Initialize environment and models
    llm, embeddings = init_environment()
    
    # Create and setup vector store
    vector_store = create_vector_store(embeddings)
    
    # Process the document
    vector_store = process_document(file_path, vector_store)
    
    # Setup and run the graph
    graph = setup_graph(llm, vector_store)
    result = graph.invoke({"question": question})
    
    return result["answer"]

# Example usage
if __name__ == "__main__":
    # Example with PDF
    pdf_question = "What is the main topic of the document?"
    pdf_file = "./asset/2024_annual_report.pdf"
    pdf_answer = analyze_document(pdf_question, pdf_file)
    print(f"PDF Question: {pdf_question}")
    print(f"PDF Answer: {pdf_answer}\n")
    
    # Example with CSV
    csv_question = "What trends do you see in the data?"
    csv_file = "./asset/data.csv"  # Replace with your CSV file path
    try:
        csv_answer = analyze_document(csv_question, csv_file)
        print(f"CSV Question: {csv_question}")
        print(f"CSV Answer: {csv_answer}")
    except FileNotFoundError:
        print("CSV file not found. Please update the path to your CSV file.")