import chainlit as cl
from semantic_kernel import Kernel
from semantic_kernel.agents import ChatCompletionAgent, ChatHistoryAgentThread
from semantic_kernel.connectors.ai.chat_completion_client_base import ChatCompletionClientBase
from semantic_kernel.connectors.ai.open_ai import OpenAIChatPromptExecutionSettings
from app.agents.base_agent import Agent
from app.agents.business_profiler_agent import BusinessProfilerAgent
from app.agents.competitor_analysis_agent import CompetitorAnalysisAgent
from app.agents.trend_analysis_agent import TrendAnalysisAgent
from app.agents.content_generator_agent import ContentGeneratorAgent
from app.agents.scheduler_agent import SchedulerAgent
from app.schemas.business_context import BusinessContext
from app.schemas.manager_decision import ManagerDecision
from app.schemas.user_request import UserRequest
from app.orchestrator.intent_classifier import IntentClassifier
from app.orchestrator.router import Router
from app.orchestrator.route_types import RouteType, IntentType
from app.db.business_profiler_queries import BusinessProfilerQueries

# Retreiving Manager instructions from app/prompts/manager.txt
with open("app/prompts/manager.txt", "r") as f:
    MANAGER_INSTRUCTIONS = f.read()

IMMEDIATE_ROUTES = [
    RouteType.FETCH_EXISTING_COMPETITORS,
    RouteType.ANALYZE_PHOTO,
    RouteType.GENERATE_POST_IMAGE,
    RouteType.SKIP_TO_CONTENT_GENERATOR,
    RouteType.SCHEDULE_POST
]

class ManagerAgent(Agent):
    def __init__(self, kernel):
        super().__init__(kernel=kernel, name="manager_agent")

        # Instantitating all agents
        self.business_profiler_agent = BusinessProfilerAgent(kernel)
        self.competitor_analysis_agent = CompetitorAnalysisAgent(kernel)
        self.trend_analysis_agent = TrendAnalysisAgent(kernel)
        self.content_generator_agent = ContentGeneratorAgent(kernel)
        self.scheduler_agent = SchedulerAgent(kernel)

        # Instantiating routes and intents
        self.intent_classifier = IntentClassifier()
        self.router = Router()
        self.business_profiler_queries = BusinessProfilerQueries()

        # Instantiating Manager
        self.agent = ChatCompletionAgent(
            service = kernel.get_service(type=ChatCompletionClientBase),
            name = "Manager_Agent",
            instructions = MANAGER_INSTRUCTIONS
        )

    async def run(self, user_request, business_context, thread, pending_route=None, pending_pipeline_end_at=None):

        # Try to figure out user intent, this function is wrapped in a chainlit step to show thought process on chainlit
        async with cl.Step(name = "Understanding your request...", type="step") as step:
            intent = await self.intent_classifier.classify(user_request.user_prompt)
            step.output = f"Intent detected: {intent}"

        # After identifying intent match intent with correct route, this function is wrapped in a chainlit step to show thought process on chainlit
        async with cl.Step(name = "Planning Route...", type="step") as step:
            route, target_agent, reason, pipeline_end_at = self.router.determine_route(intent, business_context)
            step.output = f"Route determined: {route} \nReason: {reason}"
        
        async with cl.Step(name="Fetching Current State...", type='step' ) as step:
            step.output = (
                f"Pending route: {pending_route or 'None'}\n"
                f"Pending pipeline end at: {pending_pipeline_end_at or 'None'}"
            )
  
        # Debugging
        #print(f"\n\n=== LLM MESSAGE ===\n{user_request.user_prompt}\n")

        # Adding system message to memory thread with pipeline state
        if route in IMMEDIATE_ROUTES:
            determined_route = route
            route_info = (
                f"\nDetermined route for this request: {determined_route}\n"
                f"This route is executing immediately — do NOT ask the user for confirmation.\n"
                f"Do NOT present any results or data in this response — the data is not available yet.\n"
                f"Just briefly acknowledge that you are retrieving the information now.\n"
            )
        elif intent == IntentType.CONFIRM and pending_route:
            determined_route = pending_route
            route_info = (
                f"\nDetermined route for this request: {determined_route}\n"
                f"This is what will execute now that the user has confirmed.\n"
                f"Your response must align with this route, do not suggest a different action.\n"
            )
        elif intent == IntentType.CONFIRM and not pending_route:
            determined_route = None
            route_info = "\nNo pending route to confirm. Nothing will execute.\n"
        elif route not in [RouteType.UNKNOWN]:
            determined_route = route
            route_info = (
                f"\nDetermined route for this request: {determined_route}\n"
                f"This is what will execute when the user confirms.\n"
                f"Your response must align with this route, do not suggest a different action.\n"
            )
        else:
            determined_route = None
            route_info = ""
        

        thread._chat_history.add_system_message(
            f"Current pipeline state:\n"
            f"- has_hashtags: {business_context.has_hashtags}\n"
            f"- has_top_posts: {business_context.has_top_posts}\n"
            f"- has_trend_summary: {business_context.has_trend_summary}\n"
            f"- has_content_plan: {business_context.has_content_plan}\n"
            f"- pending_route: {pending_route or 'None'}\n"
            f"{route_info}"

        )
        
        # Adding user message to memory thread
        thread._chat_history.add_user_message(user_request.user_prompt)

        # Calling the Manager Agent LLM
        response = await self.agent.get_response(
            message = user_request.user_prompt,
            thread = thread,
            settings = OpenAIChatPromptExecutionSettings()  # Replace with OpenAIChatPromptExecutionSettings(function_choice_behavior=FunctionChoiceBehavior.Auto()) when manager tools implemented
        ) 

        # Debugging
        #print(f"\n\n=== LLM RESPONSE ===\n{response.content}\n")

        fallback_msg = "I am not sure how to help you with that, could you please provide some more information?"
        
        await cl.Message(content = str(response.content) if response.content else fallback_msg).send()

        # Execute route 
        final_agent_response = None

        if route in IMMEDIATE_ROUTES:
            final_agent_response = await self.execute_route(route, pipeline_end_at, business_context)
        elif intent == IntentType.CONFIRM and pending_route:
            final_agent_response = await self.execute_route(pending_route, pending_pipeline_end_at, business_context)

        if final_agent_response:
            executed_route = route if route in IMMEDIATE_ROUTES else pending_route

            # Handle image generation to display image directly via Chainlit
            if hasattr(final_agent_response, 'image_url') and final_agent_response.image_url:
                image_element = cl.Image(url=final_agent_response.image_url, name="Generated Post Image", display="inline", size="large")
                await cl.Message(content="Here is your generated post image:", elements=[image_element]).send()
                self.business_profiler_queries.save_content_image(business_context.business_id, final_agent_response.image_url)
            else:
                if hasattr(final_agent_response, 'format_for_display'):
                    display_data = final_agent_response.format_for_display()
                else:
                    display_data = str(final_agent_response)

                thread._chat_history.add_system_message(
                    f"OVERRIDE: The {executed_route} pipeline has finished. The results are now available.\n"
                    f"You MUST present the following data to the user in your next response. Do not omit or replace it with placeholders.\n"
                    f"Result data:\n{display_data}"
                )

                final_manager_message = await self.agent.get_response(
                    message=(
                        f"The action has completed. Present the result data from the system message above to the user naturally. "
                        f"Then suggest the next logical step based on the current pipeline state."
                    ),
                    thread=thread,
                    settings=OpenAIChatPromptExecutionSettings()
                )
                await cl.Message(content=str(final_manager_message.content)).send()

            if hasattr(final_agent_response, 'mode') and final_agent_response.mode == "default" and final_agent_response.success:
                await self.scheduler_agent.run(action="schedule", context=business_context)

        return ManagerDecision(
            intent=intent,
            route=route,
            target_agent=target_agent,
            reason=reason,
            pipeline_end_at=pipeline_end_at,
            manager_response=""
        )

    # Execute Pipelines - This function is called from chainlit_app.py
    async def execute_route(self, route, pipeline_end_at, context):
        if route == RouteType.FULL_PIPELINE:
            async with cl.Step(name="Analyzing your business profile...") as step:
                profiler_agent_result = await self.business_profiler_agent.run(context = context)
                step.output = "Business profile analyzed."

            async with cl.Step(name="Finding your competitors...") as step:
                competitor_analysis_agent_result = await self.competitor_analysis_agent.run(
                    context = context,
                    primary_hashtags = profiler_agent_result.primary_hashtags,
                    secondary_hashtags = profiler_agent_result.secondary_hashtags,
                    location_keywords = profiler_agent_result.location_keywords,
                    exclude_accounts = profiler_agent_result.exclude_accounts
                )
                step.output = competitor_analysis_agent_result.message

            async with cl.Step(name="Identifying best performing trends...") as step:
                trend_analysis_agent_result = await self.trend_analysis_agent.run(context = context)
                step.output = trend_analysis_agent_result.message 

            async with cl.Step(name="Generating content...") as step:
                if pipeline_end_at == "analyze_photo":
                    content_generator_agent_result = await self.content_generator_agent.run(context = context, trend_summary = trend_analysis_agent_result.summary, analyze_photo = True)
                elif pipeline_end_at == "generate_image":
                    content_generator_agent_result = await self.content_generator_agent.run(context = context, trend_summary = trend_analysis_agent_result.summary, generate_image = True)
                else:
                    content_generator_agent_result = await self.content_generator_agent.run(context = context, trend_summary = trend_analysis_agent_result.summary)
                step.output = "Content generated."

            return content_generator_agent_result
        

        elif route == RouteType.SKIP_TO_COMPETITOR_ANALYSIS:
            hashtags = await self.business_profiler_queries.get_competitor_hashtags(context.business_id)
 
            async with cl.Step(name="Finding your competitors...") as step:
                competitor_analysis_agent_result = await self.competitor_analysis_agent.run(
                    context = context,
                    primary_hashtags = hashtags.primary_hashtags,
                    secondary_hashtags = hashtags.secondary_hashtags,
                    location_keywords = hashtags.location_keywords,
                    exclude_accounts = hashtags.exclude_accounts
                )
                step.output = competitor_analysis_agent_result.message
 
            async with cl.Step(name="Identifying best performing trends...") as step:
                trend_analysis_agent_result = await self.trend_analysis_agent.run(context = context)
                step.output = trend_analysis_agent_result.message
 
            async with cl.Step(name="Generating content...") as step:
                if pipeline_end_at == "analyze_photo":
                    content_generator_agent_result = await self.content_generator_agent.run(context = context, trend_summary = trend_analysis_agent_result.summary, analyze_photo = True)
                elif pipeline_end_at == "generate_image":
                    content_generator_agent_result = await self.content_generator_agent.run(context = context, trend_summary = trend_analysis_agent_result.summary, generate_image = True)
                else:
                    content_generator_agent_result = await self.content_generator_agent.run(context = context, trend_summary = trend_analysis_agent_result.summary)
                step.output = "Content generated."
 
            return content_generator_agent_result
 

        elif route == RouteType.SKIP_TO_TREND_ANALYSIS:
            async with cl.Step(name="Identifying best performing trends...") as step:
                trend_analysis_agent_result = await self.trend_analysis_agent.run(context = context)
                step.output = trend_analysis_agent_result.message
 
            async with cl.Step(name="Generating content...") as step:
                if pipeline_end_at == "analyze_photo":
                    content_generator_agent_result = await self.content_generator_agent.run(context = context, trend_summary = trend_analysis_agent_result.summary, analyze_photo = True)
                elif pipeline_end_at == "generate_image":
                    content_generator_agent_result = await self.content_generator_agent.run(context = context, trend_summary = trend_analysis_agent_result.summary, generate_image = True)
                else:
                    content_generator_agent_result = await self.content_generator_agent.run(context = context, trend_summary = trend_analysis_agent_result.summary)
                step.output = "Content generated."
 
            return content_generator_agent_result
 

        elif route == RouteType.SKIP_TO_CONTENT_GENERATOR:
            trend_summary = await self.business_profiler_queries.get_trend_summary(context.business_id)
 
            async with cl.Step(name="Generating content...") as step:
                content_generator_agent_result = await self.content_generator_agent.run(context = context, trend_summary = trend_summary)
                step.output = "Content generated."
 
            return content_generator_agent_result
 

        elif route == RouteType.PROFILER_AND_COMPETITOR_ONLY:
            async with cl.Step(name="Analyzing your business profile...") as step:
                profiler_agent_result = await self.business_profiler_agent.run(context = context)
                step.output = (
                    f"Business profile analyzed.\n\n"
                    f"=== Results ===\n"
                    f"primary_hashtags: {profiler_agent_result.primary_hashtags}\n"
                    f"secondary_hashtags: {profiler_agent_result.secondary_hashtags}\n"
                    f"location_keywords: {profiler_agent_result.location_keywords}\n"
                    f"exclude_accounts: {profiler_agent_result.exclude_accounts}\n"
                    f"Follower Range: {profiler_agent_result.ideal_follower_min} – {profiler_agent_result.ideal_follower_max}\n\n"
                    f"=== Brand Analysis ===\n"
                    f"Brand Voice: {profiler_agent_result.brand_voice or 'N/A'}\n"
                    f"Brand Colors: {profiler_agent_result.brand_colors or 'N/A'}\n"
                    f"Content Style: {profiler_agent_result.content_style or 'N/A'}\n"
                )
 
            async with cl.Step(name="Finding your competitors...") as step:
                competitor_analysis_agent_result = await self.competitor_analysis_agent.run(
                    context = context,
                    primary_hashtags = profiler_agent_result.primary_hashtags,
                    secondary_hashtags = profiler_agent_result.secondary_hashtags,
                    location_keywords = profiler_agent_result.location_keywords,
                    exclude_accounts = profiler_agent_result.exclude_accounts
                )
                step.output = competitor_analysis_agent_result.message
 
            competitors_list = await self.business_profiler_queries.get_competitor_list(context.business_id)
            return competitors_list
 

        elif route == RouteType.COMPETITOR_ANALYSIS_ONLY:
            hashtags = await self.business_profiler_queries.get_competitor_hashtags(context.business_id)
 
            async with cl.Step(name="Finding your competitors...") as step:
                competitor_analysis_agent_result = await self.competitor_analysis_agent.run(
                    context = context,
                    primary_hashtags = hashtags.primary_hashtags,
                    secondary_hashtags = hashtags.secondary_hashtags,
                    location_keywords = hashtags.location_keywords,
                    exclude_accounts = hashtags.exclude_accounts
                )
                step.output = competitor_analysis_agent_result.message
 
            competitors_list = await self.business_profiler_queries.get_competitor_list(context.business_id)
            return competitors_list
 

        elif route == RouteType.FETCH_EXISTING_COMPETITORS:
            async with cl.Step(name="Fetching competitor list...") as step:
                competitors_list = await self.business_profiler_queries.get_competitor_list(context.business_id)
                step.output = f"Found {len(competitors_list)} competitors."

            usernames = [c.get("username", "Unknown") for c in competitors_list[2:7]]
            return f"Found {len(competitors_list)} total competitors. First 5:\n" + "\n".join(f"- @{u}" for u in usernames)
 

        elif route == RouteType.GENERATE_POST_IMAGE:
            trend_summary = await self.business_profiler_queries.get_trend_summary(context.business_id)
 
            async with cl.Step(name="Generating post image...") as step:
                content_generator_agent_result = await self.content_generator_agent.run(context = context, trend_summary = trend_summary, generate_image = True)
                step.output = "Post image generated."
 
            return content_generator_agent_result


        elif route == RouteType.ANALYZE_PHOTO:
            trend_summary = await self.business_profiler_queries.get_trend_summary(context.business_id)
 
            async with cl.Step(name="Analyzing photo...") as step:
                content_generator_agent_result = await self.content_generator_agent.run(context = context, trend_summary = trend_summary, analyze_photo = True)
                step.output = "Photo analysis complete."
 
            return content_generator_agent_result
 

        elif route == RouteType.SCHEDULE_POST:
            async with cl.Step(name="Scheduling post...") as step:
                scheduler_agent_result = await self.scheduler_agent.run(context = context, action = "schedule")
                step.output = scheduler_agent_result.message
 
            return scheduler_agent_result
 

        elif route == RouteType.RESCHEDULE_POST:
            async with cl.Step(name="Rescheduling post...") as step:
                scheduler_agent_result = await self.scheduler_agent.run(context = context, action = "reschedule")
                step.output = scheduler_agent_result.message
 
            return scheduler_agent_result
        
