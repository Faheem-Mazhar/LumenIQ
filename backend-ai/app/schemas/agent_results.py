from pydantic import BaseModel
from typing import Optional
from datetime import datetime

#------------------------------------------------------- Business Profiler Agent ----------------------------------------------------------

# Pydantic model to format Business Profiler Agent Response 
class BusinessProfilerResult(BaseModel):
    business_id: str

    # Pass contents directly to CompetitorAnalysisAgent cuz payload is small
    primary_hashtags: list[str]
    secondary_hashtags: list[str]
    location_keywords: list[str]
    exclude_accounts: list[str]
    ideal_follower_min: int
    ideal_follower_max: int

    # Brand insights derived from Instagram profile and/or website analysis
    brand_voice: Optional[str] = None           # e.g. "casual and friendly", "professional and polished"
    brand_colors: Optional[list[str]] = None    # e.g. ["earth tones", "warm browns", "cream"]
    content_style: Optional[str] = None         # e.g. "lifestyle photography with minimal text overlays"

# ------------------------------------------------------ Competitor Analysis Agent --------------------------------------------------------

# Pydantic model to format Competitor Analysis Agent Response 
class CompetitorAnalysisResult(BaseModel):
    business_id: str
    success: bool

    # Payload is large so saved directly to DB and only metadata is returned
    competitor_count: int
    post_count: int
    message: str        # Returns message to manager so manager knows what to tell user, for ex "Found 10 competitors and scraped 100 posts."


# ----------------------------------------------------- Trend Analysis Agent ---------------------------------------------------------------

# Pydantic model needed to format Best Combinations, used in TrendSummary & TrendAnalysisResults
class BestCombination(BaseModel):
    rank: int
    engagement_multiplier: float
    image_cluster_id: int
    caption_cluster_id: int
    image_style: str
    image_style_description: Optional[str] = None
    shot_angle: str
    lighting: str
    composition: str
    color_palette: str
    caption_style: str
    caption_tone_summary: Optional[str] = None
    best_hashtags: list[str]
    best_posting_time: str


# Pydantic model needed to format summary in TrendAnalysisResults
class TrendSummary(BaseModel):
    best_combinations: list[BestCombination]        # Used from class above BestCombination(BaseModel)

# Pydantic model to format Trend Analysis Agent Response 
class TrendAnalysisResult(BaseModel):
    business_id: str
    success: bool
    image_cluster_count: int
    caption_cluster_count: int
    message: str        # Returns message to manager then manager returns to user, for ex "Identitifed 10 image clusters and 5 caption clusters"
    summary: Optional[TrendSummary] = None         # Used from class above TrendSummary(BaseModel)


# ---------------------------------------------------- Content Generator Agent ------------------------------------------------------------

# Pydantic model needed to format photo in ContentGeneratorResult
class PhotoDetails(BaseModel):
    angle: str
    composition: Optional[str] = None
    lighting: Optional[str] = None
    props: Optional[list[str]] = None
    color_palette: Optional[list[str]] = None
    instructions: str

# Pydantic model to format caption breakdown
class CaptionDetails(BaseModel):
    hook: Optional[str] = None
    body: Optional[str] = None
    cta: Optional[str] = None
    full_caption: Optional[str] = None
    emoji: Optional[str] = None

# Pydantic model to format hashtag breakdown
class HashtagDetails(BaseModel):
    local: Optional[list[str]] = None
    niche: Optional[list[str]] = None
    all: Optional[list[str]] = None

# Pydantic model to format post settings
class PostSettings(BaseModel):
    best_format: Optional[str] = None
    best_time_to_post: Optional[str] = None
    platform_fit: Optional[list[str]] = None

# Pydantic model to format Content Generator Agent Response
class ContentGeneratorResult(BaseModel):
    business_id: str
    success: bool
    mode: str

    # Default Mode Response
    content_response: Optional[str] = None
    photo: Optional[PhotoDetails] = None
    caption: Optional[CaptionDetails] = None
    hashtags: Optional[HashtagDetails] = None
    post_settings: Optional[PostSettings] = None
    generated_at: Optional[datetime] = None

    # Generate image Mode Response
    image_url: Optional[str] = None

    # Analyze photo Mode Response
    photo_analysis: Optional[str] = None

    def format_for_display(self) -> str:
        """Format the content recommendation for user-facing display."""
        if not self.success:
            return self.content_response or "Content generation failed."

        # Photo analysis mode
        if self.photo_analysis:
            return f"Photo Analysis Results:\n\n{self.photo_analysis}"

        sections = []

        if self.photo:
            photo_lines = [f"**Photo Angle:** {self.photo.angle}"]
            if self.photo.composition:
                photo_lines.append(f"**Composition:** {self.photo.composition}")
            if self.photo.lighting:
                photo_lines.append(f"**Lighting:** {self.photo.lighting}")
            if self.photo.props:
                photo_lines.append(f"**Props:** {', '.join(self.photo.props)}")
            if self.photo.color_palette:
                photo_lines.append(f"**Color Palette:** {', '.join(self.photo.color_palette)}")
            photo_lines.append(f"\n**Shooting Instructions:** {self.photo.instructions}")
            sections.append("\n".join(photo_lines))

        if self.caption:
            caption_lines = []
            if self.caption.hook:
                caption_lines.append(f"**Hook:** {self.caption.hook}")
            if self.caption.body:
                caption_lines.append(f"**Body:** {self.caption.body}")
            if self.caption.cta:
                caption_lines.append(f"**CTA:** {self.caption.cta}")
            if self.caption.full_caption:
                caption_lines.append(f"\n**Full Caption:** {self.caption.full_caption}")
            sections.append("\n".join(caption_lines))

        if self.hashtags:
            hashtag_lines = []
            if self.hashtags.local:
                hashtag_lines.append(f"**Local:** {' '.join('#' + h for h in self.hashtags.local)}")
            if self.hashtags.niche:
                hashtag_lines.append(f"**Niche:** {' '.join('#' + h for h in self.hashtags.niche)}")
            sections.append("\n".join(hashtag_lines))

        if self.post_settings:
            settings_lines = []
            if self.post_settings.best_time_to_post:
                settings_lines.append(f"**Best Time to Post:** {self.post_settings.best_time_to_post}")
            if self.post_settings.best_format:
                settings_lines.append(f"**Best Format:** {self.post_settings.best_format}")
            if self.post_settings.platform_fit:
                settings_lines.append(f"**Platform Fit:** {', '.join(self.post_settings.platform_fit)}")
            sections.append("\n".join(settings_lines))

        return "\n\n---\n\n".join(sections)

# -------------------------------------------------------- Scheduler Agent --------------------------------------------------------------

# Pydantic model to Scheduler Agent Response 
class SchedulerResult(BaseModel):
    business_id: str
    success: bool
    calendar_post_id: Optional[str] = None
    message: str        # Returns message to manager then manager returns to user, for ex "Post Scheduled for 8 am on Tuesday Mar 10th"

