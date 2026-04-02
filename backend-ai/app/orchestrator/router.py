from app.schemas.business_context import BusinessContext
from app.orchestrator.route_types import IntentType, RouteType

class Router:

    # Determining value for max age of posts and trends for them to be valid (used when planning to reuse data from previous runs saved in DB)
    POSTS_MAX_AGE_DAYS = 14 # If posts are older than 14 days competitor analysis agent will be re run to fetch latest data
    CONTENT_TRENDS_MAX_AGE_DAYS = 14 # If trend summeries.json are older than 14 days, trend analysis agent will re run to fetch latest data
    PHOTO_TRENDS_MAX_AGE_DAYS = 30 # If trend clusters are over 30 days old, trend analysis agent will re run to generate clusters based on latest trends.


    # This function matches user intent with the correct route. Returns (RouteType, target_agent_name, reason, pipeline_end_at).
    def determine_route(self, intent: IntentType, context: BusinessContext):

        # Find competitors
        if intent == IntentType.FIND_COMPETITORS:
            if context.has_hashtags and context.are_posts_valid(self.POSTS_MAX_AGE_DAYS):
                return(
                    RouteType.FETCH_EXISTING_COMPETITORS,
                    "manager_agent",
                    "Competitor data is already fresh. Fetching existing results from DB.",
                    "manager"
                )
            if context.has_hashtags:
                return(
                    RouteType.COMPETITOR_ANALYSIS_ONLY,
                    "competitor_analysis_agent",
                    "Hashtags exist. Skipping profiler, running competitor analysis only.",
                    "competitor_only"
                )
            return(
                RouteType.PROFILER_AND_COMPETITOR_ONLY,
                "business_profiler_agent",
                "No hashtags found. Running profiler then competitor analysis.",
                "competitor_only"
            )
        
        # Schedule Posts - Contains a lot of edge cases which could break this route, work on it later (Issued described in file: Scheduler edge cases)
        if intent == IntentType.SCHEDULE_POST:
            if not context.has_content_plan:
                return(
                    RouteType.FULL_PIPELINE,
                    "business_profiler_agent",
                    "No content plan found. Running full pipeline first.",
                    "content_generator"
                )
            return (
                RouteType.SCHEDULE_POST,
                "scheduler_agent",
                "Content plan exists. Routing to scheduler.",
                "scheduler"
            )
        
        # Reschedule Posts - Contains a lot of edge cases which could break this route, work on it later (Issues described in file: Scheduler edge cases)
        if intent == IntentType.RESCHEDULE_POST:
            if not context.has_scheduled_posts:
                return(
                    RouteType.FULL_PIPELINE,
                    "business_profiler_agent",
                    "No scheduled posts found. Running full pipeline first.",
                    "content_generator"
                )
            return (
                RouteType.RESCHEDULE_POST,
                "scheduler_agent",
                "User wants to reschedule an existing post.",
                "scheduler"
            )
        
        # Generate content ideas 
        if intent == IntentType.GENERATE_CONTENT_IDEAS:
            if context.are_trends_valid(self.CONTENT_TRENDS_MAX_AGE_DAYS):
                return (
                    RouteType.SKIP_TO_CONTENT_GENERATOR,
                    "content_generator_agent",
                    "Valid trend summary exists. Skipping directly to content generator agent",
                    "content_generator"
                )
            if context.are_posts_valid(self.POSTS_MAX_AGE_DAYS):
                return(
                    RouteType.SKIP_TO_TREND_ANALYSIS,
                    "trend_analysis_agent",
                    "Posts are valid but trend summaries are not valid. Skipping to trend analysis agent",
                    "content_generator"
                )
            if context.has_hashtags:
                return (
                    RouteType.SKIP_TO_COMPETITOR_ANALYSIS,
                    "competitor_analysis_agent",
                    "Hashtags exists but posts are missing or invalid. Skipping to competitor analysis agent",
                    "content_generator"
                )
            return (
                RouteType.FULL_PIPELINE,
                "business_profiler_agent",
                "No data found. Running full pipeline",
                "content_generator"
            )
        
        # Analyze user uploaded photo
        if intent == IntentType.ANALYZE_PHOTO:
            if context.are_trends_valid(self.PHOTO_TRENDS_MAX_AGE_DAYS):
                return (
                    RouteType.ANALYZE_PHOTO,
                    "content_generator_agent",
                    "Valid trend summary exists. Analyzing photo against clusters",
                    "analyze_photo"
                )
            if context.are_posts_valid(self.POSTS_MAX_AGE_DAYS):
                return(
                    RouteType.SKIP_TO_TREND_ANALYSIS,
                    "trend_analysis_agent",
                    "Posts are valid but trend summaries are not valid. Skipping to trend analysis agent",
                    "analyze_photo"
                )
            if context.has_hashtags:
                return (
                    RouteType.SKIP_TO_COMPETITOR_ANALYSIS,
                    "competitor_analysis_agent",
                    "Hashtags exists but posts are missing or invalid. Skipping to competitor analysis agent",
                    "analyze_photo"
                )
            return (
                RouteType.FULL_PIPELINE,
                "business_profiler_agent",
                "No data found. Running full pipeline",
                "analyze_photo"
            )
        
        # Generate post image
        if intent == IntentType.GENERATE_POST_IMAGE:
            if context.are_trends_valid(self.CONTENT_TRENDS_MAX_AGE_DAYS):
                return (
                    RouteType.GENERATE_POST_IMAGE,
                    "content_generator_agent",
                    "Valid trend summary exists. Skipping directly to content generator agent",
                    "generate_image"
                )
            if context.are_posts_valid(self.POSTS_MAX_AGE_DAYS):
                return(
                    RouteType.SKIP_TO_TREND_ANALYSIS,
                    "trend_analysis_agent",
                    "Posts are valid but trend summaries are not valid. Skipping to trend analysis agent",
                    "generate_image"
                )
            if context.has_hashtags:
                return (
                    RouteType.SKIP_TO_COMPETITOR_ANALYSIS,
                    "competitor_analysis_agent",
                    "Hashtags exists but posts are missing or invalid. Skipping to competitor analysis agent",
                    "generate_image"
                )
            return (
                RouteType.FULL_PIPELINE,
                "business_profiler_agent",
                "No data found. Running full pipeline",
                "generate_image"
            )

        # Fallback
        if context.has_trend_summary and not context.has_content_plan:
            return (
                RouteType.SKIP_TO_CONTENT_GENERATOR,
                "content_generator_agent",
                "Trend summary exists. Ready to generate content plan.",
                "content_generator"
            )
        if context.has_top_posts and not context.has_trend_summary:
            return (
                RouteType.SKIP_TO_TREND_ANALYSIS,
                "trend_analysis_agent",
                "Posts exist. Ready to run trend analysis.",
                "content_generator"
            )
        if context.has_hashtags and not context.has_top_posts:
            return (
                RouteType.SKIP_TO_COMPETITOR_ANALYSIS,
                "competitor_analysis_agent",
                "Hashtags exist. Ready to run competitor analysis.",
                "content_generator"
            )
        if context.has_content_plan and not context.has_scheduled_posts:
            return (
                RouteType.SCHEDULE_POST,
                "scheduler_agent",
                "Content plan exists. Ready to schedule a post.",
                "scheduler"
            )
        if not context.has_hashtags:
            return (
                RouteType.PROFILER_AND_COMPETITOR_ONLY,
                "business_profiler_agent",
                "No data found. Starting with competitor discovery.",
                "competitor_only"
            )
        return (
            RouteType.UNKNOWN,
            "manager_agent",
            "Could not determine user intent. Manager will ask for clarification",
            "manager"
        )
