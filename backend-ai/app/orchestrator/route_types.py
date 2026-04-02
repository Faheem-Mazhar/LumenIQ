from enum import Enum

# Creating Enum classes for Intent types and Route types to reduce typing errors

class IntentType(str, Enum):
    FIND_COMPETITORS       = "find_competitors"        # User says find my competitors on Instagram
    GENERATE_CONTENT_IDEAS = "generate_content_ideas"  # User says give me full content recommendation (full pipeline)
    ANALYZE_PHOTO          = "analyze_photo"           # User uploads photo and asks for caption & best time to schedule
    SCHEDULE_POST          = "schedule_post"           # User asks to schedule a post to calendar
    RESCHEDULE_POST        = "reschedule_post"         # User asks to move a scheduled post to a different date
    GENERATE_POST_IMAGE    = "generate_post_image"     # User asks to generate post image (Not sure if we will have time to implemeent )
    CONFIRM                = "confirm"
    CANCEL                 = "cancel"
    UNKNOWN                = "unknown"  

class RouteType(str, Enum):
    # First run when nothing exists or when data is older than threshold value
    FULL_PIPELINE                 = "full_pipeline"
    # If hashtags exists then skip profiler and run competitor analysis, then trend analysis and then content generator
    SKIP_TO_COMPETITOR_ANALYSIS   = "skip_to_competitor_analysis"
    # If competitors & posts exsit then skip competitor analysis and run trend analysis and then content generator 
    SKIP_TO_TREND_ANALYSIS        = "skip_to_trend_analysis"
    # If trend summeries exists then skip trend analysis and run content generator
    SKIP_TO_CONTENT_GENERATOR     = "skip_to_content_generator"

    # Only dual agent route to response to users who just want to find competitors
    PROFILER_AND_COMPETITOR_ONLY  = "profiler_and_competitor_only"

    # Single agent routes
    COMPETITOR_ANALYSIS_ONLY      = "competitor_analysis_only"
    ANALYZE_PHOTO                 = "analyze_photo"          
    SCHEDULE_POST                 = "schedule_post"         
    RESCHEDULE_POST               = "reschedule_post"         
    GENERATE_POST_IMAGE           = "generate_post_image"

    # Data already exist in DB
    FETCH_EXISTING_COMPETITORS    = "fetch_existing_competitors"

    # Invalid route
    UNKNOWN                       = "unknown"