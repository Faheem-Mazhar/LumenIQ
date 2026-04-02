from pydantic import BaseModel

# We are using pydantic models rather than passing dictionaries for better data validation 

class UserRequest(BaseModel):
    user_id: str
    business_id: str
    user_prompt: str
