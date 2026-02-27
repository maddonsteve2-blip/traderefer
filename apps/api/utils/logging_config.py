"""
Centralized logging configuration for TradeRefer API.
Creates separate log files for different types of events.
"""
import logging
import logging.handlers
import os
from pathlib import Path
from datetime import datetime

# Base logs directory
LOGS_DIR = Path(__file__).parent.parent / "logs"

# Ensure logs directories exist
LOG_DIRS = {
    "errors": LOGS_DIR / "errors",
    "emails": LOGS_DIR / "emails",
    "leads": LOGS_DIR / "leads",
    "payments": LOGS_DIR / "payments",
    "auth": LOGS_DIR / "auth",
    "cron": LOGS_DIR / "cron",
    "general": LOGS_DIR,
}

for dir_path in LOG_DIRS.values():
    dir_path.mkdir(parents=True, exist_ok=True)


def setup_logger(name: str, log_file: str, level=logging.INFO, max_bytes=10*1024*1024, backup_count=5):
    """
    Create a logger with file rotation.
    
    Args:
        name: Logger name
        log_file: Path to log file
        level: Logging level
        max_bytes: Max file size before rotation (default 10MB)
        backup_count: Number of backup files to keep
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Avoid adding handlers if they already exist
    if logger.handlers:
        return logger
    
    # File handler with rotation
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding='utf-8'
    )
    file_handler.setLevel(level)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)
    
    # Formatters
    file_formatter = logging.Formatter(
        '%(asctime)s | %(name)s | %(levelname)s | %(message)s | %(pathname)s:%(lineno)d',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(message)s',
        datefmt='%H:%M:%S'
    )
    
    file_handler.setFormatter(file_formatter)
    console_handler.setFormatter(console_formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger


# Main loggers
error_logger = setup_logger(
    "traderefer.errors",
    LOG_DIRS["errors"] / f"errors_{datetime.now().strftime('%Y-%m-%d')}.log",
    level=logging.ERROR
)

email_logger = setup_logger(
    "traderefer.emails",
    LOG_DIRS["emails"] / f"emails_{datetime.now().strftime('%Y-%m-%d')}.log",
    level=logging.INFO
)

lead_logger = setup_logger(
    "traderefer.leads",
    LOG_DIRS["leads"] / f"leads_{datetime.now().strftime('%Y-%m-%d')}.log",
    level=logging.INFO
)

payment_logger = setup_logger(
    "traderefer.payments",
    LOG_DIRS["payments"] / f"payments_{datetime.now().strftime('%Y-%m-%d')}.log",
    level=logging.INFO
)

auth_logger = setup_logger(
    "traderefer.auth",
    LOG_DIRS["auth"] / f"auth_{datetime.now().strftime('%Y-%m-%d')}.log",
    level=logging.INFO
)

cron_logger = setup_logger(
    "traderefer.cron",
    LOG_DIRS["cron"] / f"cron_{datetime.now().strftime('%Y-%m-%d')}.log",
    level=logging.INFO
)

general_logger = setup_logger(
    "traderefer.general",
    LOG_DIRS["general"] / f"general_{datetime.now().strftime('%Y-%m-%d')}.log",
    level=logging.INFO
)

# Daily rotation helper
def get_daily_log_path(base_dir: Path, prefix: str) -> Path:
    """Get log file path with daily rotation."""
    return base_dir / f"{prefix}_{datetime.now().strftime('%Y-%m-%d')}.log"
