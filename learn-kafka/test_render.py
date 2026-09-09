import urllib.request
import base64
import json
import os
import hashlib

os.makedirs('generated_diagrams', exist_ok=True)

def render_mermaid_to_png(mm_code, out_filename):
    try:
        # Clean mermaid code
        clean_code = mm_code.strip()
        mermaid_obj = {
            "code": clean_code,
            "mermaid": {
                "theme": "default",
                "themeVariables": {
                    "primaryColor": "#E0E7FF",
                    "primaryTextColor": "#1E1B4B",
                    "primaryBorderColor": "#6366F1",
                    "lineColor": "#4F46E5",
                    "secondaryColor": "#FEF3C7",
                    "tertiaryColor": "#DCFCE7"
                }
            }
        }
        encoded = base64.urlsafe_b64encode(json.dumps(mermaid_obj).encode('utf-8')).decode('ascii')
        url = f"https://mermaid.ink/img/{encoded}?type=png"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=12) as res:
            img_data = res.read()
            with open(out_filename, 'wb') as f:
                f.write(img_data)
        print(f"Successfully rendered: {out_filename} ({len(img_data)} bytes)")
        return True
    except Exception as e:
        print(f"Failed to render mermaid: {e}")
        return False

if __name__ == '__main__':
    sample = """
    flowchart TB
        subgraph KafkaCluster [Apache Kafka Cluster]
            Broker1["Broker 1 (Leader P0)"]
            Broker2["Broker 2 (Leader P1)"]
        end
        Producer[Node.js Producer] --> Broker1
        Producer --> Broker2
        Broker1 --> Consumer1[Consumer Worker 1]
        Broker2 --> Consumer2[Consumer Worker 2]
    """
    render_mermaid_to_png(sample, 'generated_diagrams/sample.png')
