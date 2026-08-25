"""
Custom exception classes for the Quota Engine service layer.

Using dedicated exception types instead of plain ValueError with string messages
means the router can catch specific exceptions cleanly without fragile
string matching like `if "does not exist" in str(e)`.

Each exception maps to a specific HTTP status code in the router.
"""


class UserNotFoundError(Exception):
    """Raised when a user_id does not match any row in the users table."""
    pass


class QuotaNotFoundError(Exception):
    """Raised when a user exists but has no quota record yet."""
    pass


class InsufficientStorageError(Exception):
    """Raised when a file's size would exceed the user's remaining quota."""
    pass


class QuotaAlreadyExistsError(Exception):
    """Raised when trying to create a second quota for a user who already has one."""
    pass
