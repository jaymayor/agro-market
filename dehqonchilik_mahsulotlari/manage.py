#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# Monkey patch to prevent drf_format_suffix duplicate registration error
from django.urls import converters
_original_register = converters.register_converter

def _patched_register(converter, type_name):
    try:
        _original_register(converter, type_name)
    except ValueError:
        pass  # Ignore duplicate registration

converters.register_converter = _patched_register

from decouple import config

def main():
    """Run administrative tasks."""
    # Use development settings by default if DJANGO_SETTINGS_MODULE is not set
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', config('DJANGO_SETTINGS_MODULE', default='config.settings'))
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
