from app.orchestrator.route_types import IntentType
from openai import AsyncOpenAI
from app.config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, MANAGER_MODEL

# Identifies the user intent from the user prompt
class IntentClassifier:

    # Defining a dictionary for matching the intent of the user based on keywords
    _RULES = {
        IntentType.FIND_COMPETITORS : [
            "competitor", "find competitors", "discover competitors", "who are my competitors",
            "local businesses", "analyze competitors", "other brands", "other companies",
            "find cafes", "find realtors"
        ],
        IntentType.GENERATE_POST_IMAGE : [
            "generate image", "create image", "make a photo", "generate a photo", "ai image",
            "create visual", "post image", "generate an image", "create an image", "make an image"
        ],
        IntentType.GENERATE_CONTENT_IDEAS : [
            "content idea", "post idea", "what should i post", "give me ideas", "generate content",
            "what should i shoot", "camera angle", "suggest content", "content recommendation",
            "instagram ideas", "social media ideas", "ideas for a post", "ideas for instagram",
            "trending content", "photo angle", "generate a post", "create a post", "make a post"
        ],
        IntentType.RESCHEDULE_POST : [
            "reschedule", "move my post", "change the date", "move to", "change post date",
            "shift my post", "postpone", "delay the post"
        ],
        IntentType.SCHEDULE_POST : [
            "schedule", "publish", "post this", "add to calendar", "auto post", "post it",
            "schedule this photo", "post this photo", "plan a post", "publish post"
        ],
        IntentType.ANALYZE_PHOTO : [
            "caption for this", "caption for my photo", "caption for my picture", "what should i caption",
            "analyze my photo", "analyze this photo", "best time for this", "when should i post this",
            "review my photo"
        ],
        IntentType.CONFIRM: [
            "yes", "yeah", "yep", "ok", "okay", "sure", "proceed", "go ahead", "start", "begin", "do it", "let's go", "sounds good"
        ],
        IntentType.CANCEL: [
            "no", "nope", "nah", "cancel", "stop", "don't", "forget it", "never mind", "not now", "skip it"
        ],
    }

    # Initialize an LLM Model, this is going to be used as a fallback mode when the above matching fails
    def __init__(self):
        self._client = AsyncOpenAI(
            api_key=OPENROUTER_API_KEY,
            base_url=OPENROUTER_BASE_URL,
        )
    
    # Matching user prompt with intent based on keywords, if match not found in dictionary, fall back to LLM
    async def classify(self, user_prompt):
        prompt = user_prompt.lower().strip()

        # Identifying intent based on keywords
        for intent, keywords in self._RULES.items():
            if any(keyword in prompt for keyword in keywords):
                return intent

        # Identitfying intent through LLM  
        try:
            response = await self._client.chat.completions.create(
                model=MANAGER_MODEL,
                messages=[
                    {"role": "system", "content": (
                        "You are classifying user messages for LumenIQ, an Instagram growth platform for local businesses.\n"
                        "LumenIQ helps businesses by finding competitors, analyzing trends, and generating content recommendations.\n\n"
                        "When a user wants to grow their following, get more engagement, know what to post, or improve their "
                        "Instagram presence — that is generate_content_ideas.\n\n"
                        "Classify the user message into one of these intents:\n"
                        "1. find_competitors: user wants to discover local competitors for their Instagram accounts\n"
                        "2. generate_content_ideas: user wants content recommendations or a posting plan, wants to grow "
                            "their Instagram following, asks what to post, wants to go viral, wants to create a post, "
                            "wants to generate a post, wants post ideas, wants to boost engagement, or wants a full "
                            "analysis of their niche including photo angles, captions, hashtags and best posting times\n"
                        "3. analyze_photo: user uploaded a photo and wants a caption for it or want to know the best posting time\n"
                        "4. schedule_post: user wants to add a new post to their calendar\n"
                        "5. reschedule_post: user wants to move an existing scheduled post to a different date or time\n"
                        "6. generate_post_image: user wants an AI generated image created for their post\n"
                        "7. confirm: user is agreeing or confirming to proceed with a previously suggested action\n"
                        "8. cancel: user is declining or cancelling a previously suggested action\n"
                        "9. unknown: none of the above fit\n\n"
                        "Return only the intent value without numbers and without colons, nothing else."
                    )},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=30,
                temperature=0       # Removes randomness from LLM response
            )
            result = response.choices[0].message.content.lower().strip()
            return IntentType(result)
        except Exception:
            return IntentType.UNKNOWN 

