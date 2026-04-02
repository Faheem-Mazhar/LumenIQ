import os
from dotenv import load_dotenv  # type: ignore

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

MANAGER_MODEL = os.getenv("MANAGER_MODEL", "openai/gpt-4o")
PROFILER_MODEL = os.getenv("PROFILER_MODEL", "openai/gpt-5.1") 
CLASSIFIER_MODEL = os.getenv("CLASSIFIER_MODEL", "openai/gpt-5.1")
CLUSTER_LABEL_MODEL = os.getenv("CLUSTER_LABEL_MODEL", "openai/gpt-4o")
CONTENT_MODEL = os.getenv("CONTENT_MODEL", "openai/gpt-4o")


TEXT_EMBEDDING_MODEL = "text-embedding-3-small"
CLIP_MODEL = "openai/clip-vit-base-patch32"
#CLIP_MODEL = "openai/clip-vit-large-patch14"


APP_NAME = "LumenIQ"

# --- Scheduler / Posting Agent ---
FACEBOOK_ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN", "")
IG_ACCOUNT_ID = os.getenv("IG_ACCOUNT_ID", "")
FB_API_VERSION = os.getenv("FB_API_VERSION", "v19.0")

# --- n8n Webhook URLs (Competitor Analysis Agent) ---
N8N_COMPETITOR_WEBHOOK_URL = os.getenv("N8N_COMPETITOR_WEBHOOK_URL", "")

# --- n8n Webhook URLs (Content Generator Agent) ---
N8N_CONTENT_WEBHOOK_URL = os.getenv("N8N_CONTENT_WEBHOOK_URL", "")

