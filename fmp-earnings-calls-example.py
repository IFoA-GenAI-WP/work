# -*- coding: utf-8 -*-
"""
Created on Thu Aug 15 09:38:28 2024

@author: david
"""
## Import libraries ########

from urllib.request import urlopen

import pandas as pd
import yfinance as yf

import certifi
import json
import ssl

import os

# Key for retrieving data from FMP api - assumes key set up as an environment variable
fmp_key = os.environ.get("FMP_KEY")

# Function to parse earnings call data downloaded from FMP

def get_jsonparsed_data(url):
    
    """
    Receive the content of ``url``, parse it as JSON and return the object.
    
    # Reference to remove warnings
    # https://realpython.com/urllib-request/

    Parameters
    ----------
    url : str

    Returns
    -------
    dict
    """
    
    certifi_context = ssl.create_default_context(cafile=certifi.where())
    response = urlopen(url, context=certifi_context)
        
    #response = urlopen(url, cafile=certifi.where())
    data = response.read().decode("utf-8")
    return json.loads(data)


### Business Descriptions

# Extract stock information from Yahoo Finance for given ticker
ticker='AAPL'
stock_info = yf.Ticker(ticker)
bus_desc = stock_info.info['longBusinessSummary']


# Retrieve earnings call data

# Years to retrieve earnings call data for
all_years = [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024]

# Using last two years
years_to_use = all_years[-2:]

# List to hold results
calls_lst = []

# Loop through years, downloading and parsing earnings call data
for year in years_to_use:
        print(f'Processing ticker: {ticker} for: {year}')
        url = f'https://financialmodelingprep.com/api/v4/batch_earning_call_transcript/{ticker}?year={year}&apikey={fmp_key}'
    
        call_data = get_jsonparsed_data(url)
    
        calls_lst.extend(call_data)


