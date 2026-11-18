from backend import run_travel_agent
from tools.tavily_tool import tavily_search
from tools.flight_tool import search_flights
#res=search_flights("Plan a 7 days Japan trip from Chennai to Tokyo ")
#print(res)

user_input=input("Enter your travel query: ")
response=run_travel_agent(user_input,thread_id="test_user")
print(response)
print(response["answer"])