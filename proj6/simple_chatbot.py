from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import os

load_dotenv()
google_api_key = os.getenv("GEMINI_API_KEY")
model = "gemini-2.5-flash-lite"

def run_simple_chatbot():
    """
    continously prompts the user for input,
    feeds it to the llm and prints the response.
    exits when the user types 'quit'
    """
    llm = ChatGoogleGenerativeAI(model=model, google_api_key=google_api_key)
    
    print("Caramel AI - Chatbot built by HERE AND NOW AI")
    while True:
        user_input = input("You: ")
        if user_input == "quit" :
            break
        response = llm.invoke(user_input)
        print(f"Bot: {response.content}")

if __name__ == "__main__":
    run_simple_chatbot()