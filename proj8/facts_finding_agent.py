from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain import hub
from langchain.tools import tool
from dotenv import load_dotenv
import os
from langchain_core.rate_limiters import InMemoryRateLimiter

load_dotenv()
google_api_key = os.getenv("GEMINI_API_KEY")
model = "gemini-2.0-flash-lite"

FACTS = {
    "capital of France": "Paris",
    "Largest ocean": "Pacific Ocean",
    "inventor of telephone": "Alexander Graham Bell",
    "population of india": "1.45 billion"
}

@tool
def get_fact(query: str) -> str:
    """
    Retrives a fact from a predefined list.
    The query must be an exact match
    to one of the available facts.

    Available facts are:
    -"capital of France"
    -"Largest ocean"
    -"inventor of telephone"
    -"population of india"
    """
    return FACTS.get(query.lower(), "Fact not found")

def run_data_retrieval_agent():
    """
    Creates an agent that can use the get_facts tool.
    """

    rate_limiter = InMemoryRateLimiter(requests_per_second=0.1,check_every_n_seconds=0.1, max_bucket_size=1)

    llm = ChatGoogleGenerativeAI(model=model, google_api_key=google_api_key)
    tools = [get_fact]
    prompt = hub.pull("hwchase17/react")
    agent = create_react_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True)

    responses = []

    print("\n---Query 1: Capital of France ---")
    responses.append(agent_executor.invoke({"input": "What is the capital of France?"}))

    print("\n---Query 2: Largest ocean ---")
    responses.append(agent_executor.invoke({"input": "What is the largest ocean?"}))

    print("\n---Query 3: inventor of telephone ---")
    responses.append(agent_executor.invoke({"input": "Who is the inventor of telephone?"}))

    print("\n---Query 4: population of india ---")
    responses.append(agent_executor.invoke({"input": "What is the population of india?"}))

    print("\n\n---Final Agent Answers --- ")
    for i, response in enumerate(responses, 1):
        print(f"Response {i}: {response['output']}")

if __name__ == "__main__":
    run_data_retrieval_agent()