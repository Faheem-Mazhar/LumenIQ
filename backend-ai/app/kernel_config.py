from openai import AsyncOpenAI
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion
from app.config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, MANAGER_MODEL

def kernel_init():
    
    # Initialize the semantic kernel instance
    kernel = Kernel()

    # Initialize the OpenAI client
    client = AsyncOpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url=OPENROUTER_BASE_URL,
    )

    # Create a chat completion service
    chat_completion_service = OpenAIChatCompletion(
        ai_model_id=MANAGER_MODEL,
        async_client=client,
    )

    # Add the service to the kernel
    kernel.add_service(chat_completion_service)
    
    return kernel