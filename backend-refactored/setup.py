"""Setup configuration for Recipe GPT backend."""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="recipe-gpt-backend",
    version="2.0.0",
    author="Recipe GPT Team",
    description="A clean, maintainable FastAPI backend for a cooking assistant",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.4.3",
            "pytest-asyncio>=0.21.1",
            "httpx>=0.25.2",
            "black>=23.11.0",
            "flake8>=6.1.0",
            "mypy>=1.7.1",
            "coverage>=7.3.2",
        ],
    },
    entry_points={
        "console_scripts": [
            "recipe-gpt=src.main:app",
        ],
    },
) 