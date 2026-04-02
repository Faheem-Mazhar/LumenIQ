import asyncio
from semantic_kernel import Kernel
from app.agents.trend_analysis_agent import TrendAnalysisAgent
from app.db.business_profiler_queries import BusinessProfilerQueries
from app.schemas.business_context import BusinessContext


async def main():
    kernel = Kernel()
    agent = TrendAnalysisAgent(kernel=kernel) 
    business_profiler_queries = BusinessProfilerQueries()


    context = BusinessContext(
        user_id="mock-user",
        business_id="54eb934a-83b3-4ca4-9caf-8b3575e5d3ff",
        business_type="local specialty coffee shop",
        location="Toronto, Ontario",
    )

    
    result = await agent.run(context)

    print("\nFINAL RESULT:")
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
