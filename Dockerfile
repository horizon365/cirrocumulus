FROM continuumio/miniconda3:4.7.12
RUN pip install --upgrade pip && \
    pip install --upgrade cirrocumulus
SHELL ["/bin/bash", "-c"]


