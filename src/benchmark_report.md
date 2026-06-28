# API Caching Benchmark Report

## Overview
This report measures the performance impact of caching on the main API endpoints.
The tests were run with 20 requests per endpoint. A warm-up request was excluded from the measurements.

## Comparison Table

| Endpoint              |   Before caching avg latency (ms) |   After caching avg latency (ms) | % improvement   |
|:----------------------|----------------------------------:|---------------------------------:|:----------------|
| /user/info            |                           2372.06 |                            23.16 | 99.02%          |
| /user/problem-history |                           4978.39 |                            34.19 | 99.31%          |
| /user/weekly-progress |                           5684.83 |                            28.41 | 99.50%          |
| /user/rating-history  |                           7831.99 |                            20.45 | 99.74%          |

## Latency Distributions
See `latency_distribution.png` for histogram plots of the latencies.
