import asyncio
import os
from typing import Any
import requests
from app.agents.base_agent import Agent
from app.schemas.agent_results import CompetitorAnalysisResult
from app.schemas.business_context import BusinessContext
from semantic_kernel import Kernel
from app.agents.competitor_analysis_agent import CompetitorAnalysisAgent
async def main():

    agent = CompetitorAnalysisAgent(Kernel())
    context = BusinessContext(
        user_id="mock-user",
        business_id="54eb934a-83b3-4ca4-9caf-8b3575e5d3ff",
        business_type="local specialty coffee shop",
        location="Toronto, Ontario",
    )

    result = await agent.run(
        context=context,
        primary_hashtags=["torontocoffee", "torontocafes", "torontobrunch"],
        secondary_hashtags=["latteart", "specialtycoffee"],
        location_keywords=["Toronto", "yyz", "Ontario"],
        exclude_accounts=["starbucks", "timhortons", "mcdonaldscanada"],
        business_niche="local specialty coffee shop",
        ideal_follower_min=500,
        ideal_follower_max=30000,
    )

    print(result.model_dump())

if __name__ == "__main__":
    asyncio.run(main())