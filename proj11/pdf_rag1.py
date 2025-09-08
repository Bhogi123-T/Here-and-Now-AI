from openai import OpenAI
from dotenv import load_dotenv
import os, PyPDF2
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from prompts import bhogiai_system_prompt

load_dotenv()

client = OpenAI(
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    api_key=os.getenv("GEMINI_API_KEY")
)

pdf_chunks = []

with open(os.path.join(os.path.dirname(__file__), "doc.pdf"), "rb") as f:
    reader = PyPDF2.PdfReader(f)
    for page in reader.pages:
        text = page.extract_text()
        if text:
            for i in range(0, len(text), 600):
                pdf_chunks.append(text[i:i+600].strip())

vectorizer = TfidfVectorizer().fit(pdf_chunks)
pdf_vectors = vectorizer.transform(pdf_chunks)

query_cache = {}

def get_relevant_context(q, k=1):  # use top 1 chunk only for speed
    sims = cosine_similarity(vectorizer.transform([q]), pdf_vectors).flatten()
    return "\n".join([pdf_chunks[i] for i in sims.argsort()[-k:][::-1]])

def get_response(message, history):
    if message in query_cache:
        return query_cache[message]
    
    context = get_relevant_context(message)
    system_prompt = f"{bhogiai_system_prompt}\n\n{context}\n\nQ: {message}\nA:"
    messages = [{"role": "system", "content": system_prompt}, *history, {"role": "user", "content": message}]
    
    r = client.chat.completions.create(
        model="gemini-2.5-flash-lite",
        messages=messages,
        max_tokens=100,  # shorter max tokens for faster response
        temperature=0
    )
    
    answer = r.choices[0].message.content
    query_cache[message] = answer
    
    return answer
