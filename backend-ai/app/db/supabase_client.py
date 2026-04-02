from supabase import create_client
from app.config import SUPABASE_URL,SUPABASE_KEY

# Creating supabase client as a centeralized file 
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)