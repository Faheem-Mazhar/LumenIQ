import asyncio
from app.agents.content_generator_agent import ContentGeneratorAgent
from app.schemas.business_context import BusinessContext
from semantic_kernel import Kernel


async def main():

    agent = ContentGeneratorAgent(Kernel())
    context = BusinessContext(
        user_id="mock-user",
        business_id="54eb934a-83b3-4ca4-9caf-8b3575e5d3ff",
        business_type="local specialty coffee shop",
        location="Toronto, Ontario",
    )

    # ── Mode 3b: Image-to-Image Generation ───────────────────────────────
    print("=== Mode 3b: Image-to-Image Generation ===")
    result = await agent.run(
        context=context,
        user_prompt="Make me a pic of a coffee flyer with 3 price point 10, 20 , 30 make it very realistic and attactive, add this logo too",
        image_url="https://1000logos.net/wp-content/uploads/2023/08/MrBeast-Logo.png",
        generate_image=True,
    )
    print(result.model_dump())


if __name__ == "__main__":
    asyncio.run(main())
