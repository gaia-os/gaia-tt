"""
Call this before other scripts to use the techtree logger
"""
import os

from techtree.env import LOG_PATH

# From logging module
CRITICAL = 50
FATAL = CRITICAL
ERROR = 40
WARNING = 30
WARN = WARNING
INFO = 20
DEBUG = 10
NOTSET = 0

_LOG_PATH = LOG_PATH


def validate_log_path(log_path: str):
    # Let's throw error if the parent directory does not exist
    if not os.path.exists(os.path.dirname(log_path)):
        raise FileNotFoundError(f"Parent directory for log path '{log_path}' does not exist.")


def reset_logger(level=INFO):
    """Re-initialize techtree logger with one of the above options"""
    import logging
    # Create a custom logger
    _logger = logging.getLogger("techtree")

    # Remove any existing handlers
    _logger.handlers.clear()

    _logger.setLevel(level)  # Set the minimum level for the logger

    # Add a StreamHandler to the logger
    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(level)  # Set the minimum level for the handler

    # Add formatter for better output
    formatter = logging.Formatter('[ {name}:{levelname} ]\t{message}', style='{')
    stream_handler.setFormatter(formatter)

    # Add the handlers to the logger
    _logger.addHandler(stream_handler)

    return _logger


def get_logger():
    """Initialize techtree logger with one of the above options"""
    import logging
    # Create a custom logger
    _logger = logging.getLogger("techtree")

    # Check if the logger already has handlers attached
    if not _logger.hasHandlers():
        # Init
        return reset_logger()

    return _logger


from typing import Optional

def log_to_file(log_path: Optional[str] = None, level: int = INFO):
    """
    Specify a log file to write to, or initialize the default.
    Also specify a log level
    """
    import logging
    # Create a custom logger
    _logger = logging.getLogger("techtree")

    # Add a FileHandler to the logger
    global _LOG_PATH
    if not log_path:
        # Use existing setting
        log_path = _LOG_PATH

    validate_log_path(log_path)
    file_handler = logging.FileHandler(log_path)
    file_handler.setLevel(level)  # Set the minimum level for the handler

    # Add formatter for better output
    formatter = logging.Formatter('[ {name}:{levelname} ]\t{message}', style='{')
    file_handler.setFormatter(formatter)
    # Add the handlers to the logger
    _logger.addHandler(file_handler)



logger = get_logger()
