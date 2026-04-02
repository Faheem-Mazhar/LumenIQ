import json
from openai import AsyncOpenAI
from app.agents.base_agent import Agent
from app.schemas.business_context import BusinessContext
from app.schemas.agent_results import BusinessProfilerResult
from app.config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, PROFILER_MODEL
from app.db.business_profiler_queries import BusinessProfilerQueries


class BusinessProfilerAgent(Agent):
    def __init__(self, kernel):
        super().__init__(kernel=kernel, name="business_profiler_agent")
        self._client = AsyncOpenAI(
            api_key=OPENROUTER_API_KEY,
            base_url=OPENROUTER_BASE_URL,
        )
        self.business_profiler_queries = BusinessProfilerQueries()

    async def run(self, context: BusinessContext) -> BusinessProfilerResult:

        # validation
        if not all([context.business_name, context.business_type, context.location, context.target_customers]):
            raise ValueError("Business context is missing required fields (business_name, business_type, location, target_customers)")

        system_prompt = (
            "You are an expert Instagram growth strategist for local businesses.\n"
            "Given a business profile, your job is to logically deduce their brand identity and generate highly effective search parameters to find local competitors on Instagram.\n\n"
            "You do NOT have internet access. Do NOT pretend to search the internet or look up their website or Instagram.\n"
            "Use the provided Business Type, Target Customers, and Location to intelligently infer the most likely brand voice, aesthetic, and professional color palette that would appeal to their demographic.\n"
            "If an Instagram handle or Website is provided, use the naming style and formatting of the handle/URL as additional context clues about their brand vibe.\n\n"
            "Return ONLY valid JSON with this exact structure:\n"
            "{\n"
            '  "primary_hashtags": ["list of 3 hyper-local/niche hashtags specific to the city and business type"],\n'
            '  "secondary_hashtags": ["list of 2 broader industry hashtags that are not location-specific"],\n'
            '  "location_keywords": ["list of 2-4 location-based search terms"],\n'
            '  "exclude_accounts": ["list of 2-4 exact Instagram handles of large chain/franchise competitors to filter out"],\n'
            '  "ideal_follower_min": 500,\n'
            '  "ideal_follower_max": 30000,\n'
            '  "brand_voice": "expert recommendation for their brand tone/voice (e.g. casual and friendly, professional and polished)",\n'
            '  "brand_colors": ["expert recommendation of 2-3 specific brand colors or color themes expected for this niche"],\n'
            '  "content_style": "expert recommendation for their visual content style (e.g. lifestyle photography, flat lays, behind-the-scenes)"\n'
            "}\n\n"
            "Guidelines:\n"
            "- Primary hashtags should combine the city/area with the business type (e.g. yyccoffee, calgarycafes). Ensure they are real, commonly used local tags. Avoid making up overly long or complex tags.\n"
            "- Secondary hashtags should be broader niche/industry terms (e.g. latteart, specialtycoffee).\n"
            "- Brand voice, colors, and content style should be your expert recommendation for what will work best to attract their specific target audience.\n"
            "- Exclude accounts MUST be the actual Instagram handles (no @ symbol) of large national/international chains (e.g. starbuckscanada, timhortons, homedepot) that would ruin local competitor analysis.\n"
            "- Follower range should target successful local businesses, not massive global brands (min: 500, max: 30000).\n"
            "- Location keywords should help identify businesses in the same local area.\n"
            "- Return ONLY the JSON object, no markdown, no explanation"
        )

        user_prompt = (
            f"Business Name: {context.business_name}\n"
            f"Business Type: {context.business_type}\n"
            f"Location: {context.location}\n"
            f"Target Customers: {context.target_customers}\n"
            f"Instagram Handle: {context.instagram_handle or 'Not provided'}\n"
            f"Website: {context.website or 'Not provided'}"
        )

        # Call LLM to generate hashtags and search parameters
        try:
            response = await self._client.chat.completions.create(
                model=PROFILER_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.0,
            )
        except Exception as e:
            raise RuntimeError(f"Business Profiler LLM call failed: {e}")

        raw = response.choices[0].message.content
        if not raw:
            raise RuntimeError("Business Profiler received empty response from LLM")

        raw = raw.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            raw = raw.rsplit("```", 1)[0]

        # Parse JSON response
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Business Profiler failed to parse LLM response as JSON: {e}\nRaw response: {raw}")

        # Validate required fields in LLM response
        required_fields = ["primary_hashtags", "secondary_hashtags", "location_keywords", "exclude_accounts"]
        missing = [f for f in required_fields if f not in data]
        if missing:
            raise RuntimeError(f"Business Profiler LLM response missing required fields: {missing}")
        
        profiler_result = BusinessProfilerResult(
            business_id=context.business_id,
            primary_hashtags=data["primary_hashtags"],
            secondary_hashtags=data["secondary_hashtags"],
            location_keywords=data["location_keywords"],
            exclude_accounts=data["exclude_accounts"],
            ideal_follower_min=data.get("ideal_follower_min", 500),
            ideal_follower_max=data.get("ideal_follower_max", 30000),
            brand_voice=data.get("brand_voice"),
            brand_colors=data.get("brand_colors"),
            content_style=data.get("content_style"),
        )
        
        self.business_profiler_queries.save_profiler_result(profiler_result)           # Once its saved to DB Manager will not route to profiler again, so dont save to db if you want to see the profilers response.

        return profiler_result
    
