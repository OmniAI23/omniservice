import inspect
from supabase import create_async_client

print("create_async_client is coroutinefunction?", inspect.iscoroutinefunction(create_async_client))
print("create_async_client is awaitable / callable:", callable(create_async_client))
print("module:", create_async_client.__module__)