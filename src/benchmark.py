import os
import time
import subprocess
import requests
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd

# Endpoints to benchmark
BASE_URL = "http://127.0.0.1:5000"
HANDLE = "tourist"
ENDPOINTS = [
    f"/user/info?handle={HANDLE}",
    f"/user/problem-history?handle={HANDLE}",
    f"/user/weekly-progress?handle={HANDLE}",
    f"/user/rating-history?handle={HANDLE}"
]

RUNS_PER_ENDPOINT = 20

def wait_for_server():
    """Wait until the Flask server is up and responding."""
    for _ in range(30):
        try:
            res = requests.get(f"{BASE_URL}/user/info?handle={HANDLE}")
            if res.status_code == 200:
                time.sleep(1) # Extra buffer
                return True
        except requests.ConnectionError:
            pass
        time.sleep(1)
    return False

def run_benchmark_mode(use_cache):
    """Start the server, run benchmarks, and kill the server."""
    env = os.environ.copy()
    env["USE_CACHE"] = "1" if use_cache else "0"
    env["GEMINI_API_KEY"] = "dummy_key_for_benchmark"
    
    print(f"Starting server with USE_CACHE={env['USE_CACHE']}...")
    # Start flask app
    server_process = subprocess.Popen(
        ["py", "main.py"],
        env=env,
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    
    if not wait_for_server():
        print("Server failed to start!")
        server_process.terminate()
        return {}
    
    print("Server started. Running benchmarks...")
    results = {}
    
    for endpoint in ENDPOINTS:
        url = BASE_URL + endpoint
        print(f"Benchmarking {endpoint}...")
        
        # Warm-up run
        requests.get(url)
        
        latencies = []
        for i in range(RUNS_PER_ENDPOINT):
            start_time = time.time()
            try:
                response = requests.get(url, timeout=10)
                end_time = time.time()
                
                # ensure successful response
                if response.status_code == 200:
                    latencies.append((end_time - start_time) * 1000) # to ms
                else:
                    print(f"Failed request to {endpoint} with status {response.status_code}")
            except requests.RequestException as e:
                print(f"Request to {endpoint} timed out or failed: {e}")
                
            time.sleep(0.1) # Small delay to avoid overwhelming the server/API
            
        results[endpoint] = latencies
        
    print("Stopping server...")
    server_process.terminate()
    server_process.wait()
    return results

def compute_metrics(latencies):
    if not latencies:
        return {"avg": 0, "median": 0, "p95": 0, "min": 0, "max": 0}
    return {
        "avg": np.mean(latencies),
        "median": np.median(latencies),
        "p95": np.percentile(latencies, 95),
        "min": np.min(latencies),
        "max": np.max(latencies)
    }

def main():
    print("=== Benchmarking without Cache ===")
    results_no_cache = run_benchmark_mode(use_cache=False)
    
    time.sleep(2) # Buffer between server restarts
    
    print("\n=== Benchmarking with Cache ===")
    results_with_cache = run_benchmark_mode(use_cache=True)
    
    # Process results
    data = []
    
    # Plotting
    fig, axes = plt.subplots(len(ENDPOINTS), 1, figsize=(10, 5 * len(ENDPOINTS)))
    if len(ENDPOINTS) == 1:
        axes = [axes]
    
    for i, endpoint in enumerate(ENDPOINTS):
        nc_lat = results_no_cache.get(endpoint, [])
        c_lat = results_with_cache.get(endpoint, [])
        
        nc_metrics = compute_metrics(nc_lat)
        c_metrics = compute_metrics(c_lat)
        
        improvement = 0
        if nc_metrics["avg"] > 0:
            improvement = ((nc_metrics["avg"] - c_metrics["avg"]) / nc_metrics["avg"]) * 100
            
        data.append({
            "Endpoint": endpoint.split("?")[0],
            "Before caching avg latency (ms)": f"{nc_metrics['avg']:.2f}",
            "After caching avg latency (ms)": f"{c_metrics['avg']:.2f}",
            "% improvement": f"{improvement:.2f}%"
        })
        
        # Save detailed markdown metrics
        print(f"\n{endpoint.split('?')[0]}")
        print("Without Cache:")
        print(f"  Avg: {nc_metrics['avg']:.2f}ms | Median: {nc_metrics['median']:.2f}ms | p95: {nc_metrics['p95']:.2f}ms | Min/Max: {nc_metrics['min']:.2f}/{nc_metrics['max']:.2f}ms")
        print("With Cache:")
        print(f"  Avg: {c_metrics['avg']:.2f}ms | Median: {c_metrics['median']:.2f}ms | p95: {c_metrics['p95']:.2f}ms | Min/Max: {c_metrics['min']:.2f}/{c_metrics['max']:.2f}ms")
        
        # Plot
        ax = axes[i]
        ax.hist(nc_lat, bins=15, alpha=0.5, label='Cache Disabled', color='red')
        ax.hist(c_lat, bins=15, alpha=0.5, label='Cache Enabled', color='blue')
        ax.set_title(f"Latency Distribution: {endpoint.split('?')[0]}")
        ax.set_xlabel("Latency (ms)")
        ax.set_ylabel("Frequency")
        ax.legend()
        
    # Markdown Table
    df = pd.DataFrame(data)
    md_table = df.to_markdown(index=False)
    
    # Save markdown report
    with open("benchmark_report.md", "w") as f:
        f.write("# API Caching Benchmark Report\n\n")
        f.write("## Overview\n")
        f.write("This report measures the performance impact of caching on the main API endpoints.\n")
        f.write(f"The tests were run with {RUNS_PER_ENDPOINT} requests per endpoint. A warm-up request was excluded from the measurements.\n\n")
        f.write("## Comparison Table\n\n")
        f.write(md_table)
        f.write("\n\n## Latency Distributions\n")
        f.write("See `latency_distribution.png` for histogram plots of the latencies.\n")
        
    # Save plot
    plt.tight_layout()
    plt.savefig("latency_distribution.png")
    print("\nBenchmark completed! Saved 'benchmark_report.md' and 'latency_distribution.png'.")

if __name__ == "__main__":
    main()
