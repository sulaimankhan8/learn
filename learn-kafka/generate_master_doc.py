import os
import re
import json
import urllib.request
import base64
import hashlib
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from PIL import Image, ImageDraw, ImageFont

DIAGRAM_DIR = os.path.join(os.path.dirname(__file__), "generated_diagrams")
os.makedirs(DIAGRAM_DIR, exist_ok=True)

def set_cell_background(cell, fill_color):
    """Sets background color of a table cell (hex without #)."""
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    """Sets cell padding (in dxa: 20 dxa = 1 pt)."""
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def set_cell_left_border(cell, border_color="3B82F6", border_size="24"):
    """Sets a thick left border on a cell for callouts."""
    tcPr = cell._element.get_or_add_tcPr()
    tcBorders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="{border_size}" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(tcBorders)

def set_table_borders(table, border_color="CBD5E1"):
    """Sets subtle light borders for data tables."""
    tblPr = table._element.xpath('w:tblPr')
    if tblPr:
        borders = parse_xml(f'''
            <w:tblBorders {nsdecls("w")}>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>
                <w:left w:val="none"/>
                <w:bottom w:val="single" w:sz="8" w:space="0" w:color="{border_color}"/>
                <w:right w:val="none"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>
                <w:insideV w:val="none"/>
            </w:tblBorders>
        ''')
        tblPr[0].append(borders)

def render_fallback_diagram(title, text_content, out_path):
    """Generates a clean graphical diagram card using Pillow if network rendering is unavailable."""
    width = 900
    lines = text_content.strip().split('\n')
    height = max(300, len(lines) * 26 + 120)
    
    img = Image.new('RGB', (width, height), color='#F8FAFC')
    draw = ImageDraw.Draw(img)
    
    # Border & Header
    draw.rectangle([0, 0, width-1, height-1], outline='#6366F1', width=3)
    draw.rectangle([0, 0, width-1, 50], fill='#1E1B4B')
    
    try:
        font_title = ImageFont.truetype("arial.ttf", 20)
        font_code = ImageFont.truetype("consola.ttf", 15)
    except:
        font_title = ImageFont.load_default()
        font_code = ImageFont.load_default()
        
    draw.text((20, 15), f"ARCHITECTURE DIAGRAM: {title}", fill='#FFFFFF', font=font_title)
    
    y = 70
    for line in lines:
        draw.text((25, y), line, fill='#0F172A', font=font_code)
        y += 24
        
    img.save(out_path, 'PNG')

def sanitize_mermaid(mm_code):
    """Sanitizes mermaid syntax (subgraphs with colons/parentheses, unescaped tags) for strict parsers."""
    lines = mm_code.split('\n')
    sanitized = []
    subgraph_counter = 1
    for line in lines:
        # Match subgraph declarations without square bracket labels: e.g. "subgraph Topic: payments (3 Partitions)"
        subgraph_match = re.match(r'^(\s*subgraph\s+)([^\[\]\n]+)$', line)
        if subgraph_match:
            indent_keyword = subgraph_match.group(1)
            raw_label = subgraph_match.group(2).strip()
            if any(c in raw_label for c in [':', '(', ')', ' ', '-']):
                safe_id = f"subgraph_{subgraph_counter}"
                subgraph_counter += 1
                sanitized.append(f'{indent_keyword}{safe_id} ["{raw_label}"]')
                continue
        # Also clean up node labels with unquoted colons
        sanitized.append(line)
    return '\n'.join(sanitized)

def render_mermaid_diagram(mermaid_code, title="Architecture Diagram"):
    """Fetches rendered PNG from mermaid.ink or creates a styled fallback graphic."""
    clean_code = sanitize_mermaid(mermaid_code).strip()
    code_hash = hashlib.md5(clean_code.encode('utf-8')).hexdigest()
    out_filename = os.path.join(DIAGRAM_DIR, f"diag_{code_hash}.png")
    
    if os.path.exists(out_filename) and os.path.getsize(out_filename) > 1000:
        return out_filename
        
    try:
        mermaid_obj = {
            "code": clean_code,
            "mermaid": {
                "theme": "default",
                "themeVariables": {
                    "primaryColor": "#EEF2FF",
                    "primaryTextColor": "#1E1B4B",
                    "primaryBorderColor": "#6366F1",
                    "lineColor": "#4F46E5",
                    "secondaryColor": "#FEF3C7",
                    "tertiaryColor": "#DCFCE7",
                    "fontSize": "15px"
                }
            }
        }
        encoded = base64.urlsafe_b64encode(json.dumps(mermaid_obj).encode('utf-8')).decode('ascii')
        url = f"https://mermaid.ink/img/{encoded}?type=png"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=12) as res:
            img_data = res.read()
            if len(img_data) > 500:
                with open(out_filename, 'wb') as f:
                    f.write(img_data)
                return out_filename
    except Exception as e:
        print(f"[!] Warning: Mermaid online render failed for '{title}': {e}. Using styled fallback.")
        
    # Fallback to Pillow rendering
    render_fallback_diagram(title, clean_code, out_filename)
    return out_filename


def format_inline_text(paragraph, text, base_font_name="Segoe UI", base_font_size=10.5, base_color=(30, 41, 59)):
    """Parses markdown inline bold, inline code, and normal text into styled runs."""
    tokens = re.split(r'(\*\*.*?\*\*|`.*?`|\*.*?\*)', text)
    for token in tokens:
        if not token:
            continue
        if token.startswith('**') and token.endswith('**'):
            run = paragraph.add_run(token[2:-2])
            run.bold = True
            run.font.name = base_font_name
            run.font.size = Pt(base_font_size)
            run.font.color.rgb = RGBColor(*base_color)
        elif token.startswith('`') and token.endswith('`'):
            run = paragraph.add_run(token[1:-1])
            run.font.name = 'Consolas'
            run.font.size = Pt(base_font_size * 0.92)
            run.font.color.rgb = RGBColor(194, 65, 12)  # Rust for code
        elif token.startswith('*') and token.endswith('*'):
            run = paragraph.add_run(token[1:-1])
            run.italic = True
            run.font.name = base_font_name
            run.font.size = Pt(base_font_size)
            run.font.color.rgb = RGBColor(*base_color)
        else:
            run = paragraph.add_run(token)
            run.font.name = base_font_name
            run.font.size = Pt(base_font_size)
            run.font.color.rgb = RGBColor(*base_color)

def add_callout(doc, text_lines, callout_type="NOTE"):
    """Adds a stylish callout box."""
    colors = {
        "NOTE": {"bg": "F0F9FF", "border": "0284C7", "title_color": (2, 132, 199), "icon": "💡 NOTE / CONCEPT SUMMARY"},
        "TIP": {"bg": "F0FDF4", "border": "16A34A", "title_color": (22, 163, 74), "icon": "🚀 PRO TIP & BEST PRACTICE"},
        "WARNING": {"bg": "FFFBEB", "border": "D97706", "title_color": (217, 119, 6), "icon": "⚠️ WARNING / PRODUCTION GOTCHA"},
        "IMPORTANT": {"bg": "FEF2F2", "border": "DC2626", "title_color": (220, 38, 38), "icon": "❗ CRITICAL REQUIREMENT"},
        "TAKEAWAY": {"bg": "F5F3FF", "border": "7C3AED", "title_color": (124, 58, 237), "icon": "🏁 KEY ARCHITECTURAL TAKEAWAY"}
    }
    cfg = colors.get(callout_type, colors["NOTE"])
    
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, cfg["bg"])
    set_cell_left_border(cell, cfg["border"], "28")
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    run_title = p.add_run(cfg["icon"] + "\n")
    run_title.bold = True
    run_title.font.name = "Segoe UI"
    run_title.font.size = Pt(10)
    run_title.font.color.rgb = RGBColor(*cfg["title_color"])
    
    for i, line in enumerate(text_lines):
        p_line = cell.add_paragraph() if i > 0 else p
        p_line.paragraph_format.space_before = Pt(0)
        p_line.paragraph_format.space_after = Pt(2)
        format_inline_text(p_line, line, base_font_size=9.5, base_color=(51, 65, 85))

def add_code_block(doc, code_text, language="javascript"):
    """Adds a formatted code block with dark/slate background and monospace font."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, "0F172A")  # Slate 900
    set_cell_left_border(cell, "38BDF8", "20")  # Cyan left border
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    
    lang_run = p.add_run(f"// {language.upper()} CODE SNIPPET\n")
    lang_run.font.name = "Consolas"
    lang_run.font.size = Pt(8.5)
    lang_run.font.color.rgb = RGBColor(56, 189, 248)
    lang_run.bold = True
    
    for line in code_text.strip().split('\n'):
        p_code = cell.add_paragraph()
        p_code.paragraph_format.space_before = Pt(0)
        p_code.paragraph_format.space_after = Pt(0)
        p_code.paragraph_format.line_spacing = 1.05
        run = p_code.add_run(line if line else ' ')
        run.font.name = 'Consolas'
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(241, 245, 249)

def add_rendered_diagram_image(doc, diagram_title, mermaid_code):
    """Renders Mermaid diagram to image and embeds it with a styled frame & caption."""
    img_path = render_mermaid_diagram(mermaid_code, diagram_title)
    
    # Table frame container for the rendered image
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, "FFFFFF")
    set_cell_left_border(cell, "6366F1", "24")  # Indigo border
    set_cell_margins(cell, top=140, bottom=140, left=160, right=160)
    
    # Caption / Header
    p_header = cell.paragraphs[0]
    p_header.paragraph_format.space_before = Pt(0)
    p_header.paragraph_format.space_after = Pt(8)
    run_icon = p_header.add_run(f"📊 ARCHITECTURE DIAGRAM: {diagram_title}")
    run_icon.bold = True
    run_icon.font.name = "Segoe UI"
    run_icon.font.size = Pt(10)
    run_icon.font.color.rgb = RGBColor(99, 102, 241)
    
    # Image paragraph
    p_img = cell.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.space_before = Pt(4)
    p_img.paragraph_format.space_after = Pt(6)
    
    # Add picture
    try:
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Inches(5.6))
    except Exception as e:
        p_err = cell.add_paragraph()
        p_err.add_run(f"Diagram preview error: {e}")

def render_table_from_markdown(doc, md_table_lines):
    """Renders a parsed markdown table as a styled docx table."""
    parsed_rows = []
    for line in md_table_lines:
        line = line.strip()
        if not line or line.startswith('|-') or line.startswith('|:-') or line.startswith('| -'):
            continue
        cells = [c.strip() for c in line.strip('|').split('|')]
        parsed_rows.append(cells)
        
    if not parsed_rows:
        return
        
    num_cols = max(len(r) for r in parsed_rows)
    table = doc.add_table(rows=len(parsed_rows), cols=num_cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)
    
    col_width = Inches(6.5 / num_cols)
    
    for row_idx, row_data in enumerate(parsed_rows):
        is_header = (row_idx == 0)
        row = table.rows[row_idx]
        for col_idx in range(num_cols):
            cell = row.cells[col_idx]
            cell.width = col_width
            val = row_data[col_idx] if col_idx < len(row_data) else ""
            
            if is_header:
                set_cell_background(cell, "1E3A8A")  # Deep blue
                set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                run = p.add_run(val)
                run.bold = True
                run.font.name = "Segoe UI"
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(255, 255, 255)
            else:
                bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
                set_cell_background(cell, bg_color)
                set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                format_inline_text(p, val, base_font_size=9, base_color=(30, 41, 59))

def parse_and_append_markdown(doc, md_content, section_prefix=""):
    """Parses full markdown document and appends beautifully formatted Word elements."""
    lines = md_content.split('\n')
    i = 0
    in_code_block = False
    code_lines = []
    code_lang = "text"
    
    table_lines = []
    in_table = False
    
    callout_lines = []
    callout_type = "NOTE"
    in_callout = False
    
    last_heading = "System Flow"
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Handle Code Blocks & Mermaid
        if stripped.startswith('```'):
            if in_code_block:
                in_code_block = False
                code_text = "\n".join(code_lines)
                if code_lang.lower() in ['mermaid', 'flowchart']:
                    add_rendered_diagram_image(doc, last_heading, code_text)
                else:
                    add_code_block(doc, code_text, code_lang)
                code_lines = []
                code_lang = "text"
            else:
                in_code_block = True
                code_lang = stripped[3:].strip() or "text"
                code_lines = []
            i += 1
            continue
            
        if in_code_block:
            code_lines.append(line)
            i += 1
            continue
            
        # Handle Table
        if stripped.startswith('|') and stripped.endswith('|'):
            in_table = True
            table_lines.append(stripped)
            i += 1
            continue
        elif in_table:
            in_table = False
            render_table_from_markdown(doc, table_lines)
            table_lines = []
            
        # Handle Callouts / Blockquotes
        if stripped.startswith('>'):
            content = stripped[1:].strip()
            if content.startswith('[!NOTE]'):
                callout_type = "NOTE"
                content = content[7:].strip()
            elif content.startswith('[!TIP]'):
                callout_type = "TIP"
                content = content[6:].strip()
            elif content.startswith('[!WARNING]'):
                callout_type = "WARNING"
                content = content[10:].strip()
            elif content.startswith('[!IMPORTANT]'):
                callout_type = "IMPORTANT"
                content = content[12:].strip()
            elif content.startswith('[!TAKEAWAY]'):
                callout_type = "TAKEAWAY"
                content = content[11:].strip()
                
            in_callout = True
            if content:
                callout_lines.append(content)
            i += 1
            continue
        elif in_callout:
            in_callout = False
            add_callout(doc, callout_lines, callout_type)
            callout_lines = []
            callout_type = "NOTE"
            
        # Skip empty lines
        if not stripped:
            i += 1
            continue
            
        # Handle Headings
        if stripped.startswith('# '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(18)
            p.paragraph_format.space_after = Pt(8)
            p.paragraph_format.keep_with_next = True
            title_text = stripped[2:].strip()
            last_heading = title_text
            run = p.add_run(f"{section_prefix}{title_text}")
            run.font.name = "Segoe UI"
            run.font.size = Pt(18)
            run.bold = True
            run.font.color.rgb = RGBColor(10, 37, 64)
            
        elif stripped.startswith('## '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            title_text = stripped[3:].strip()
            last_heading = title_text
            run = p.add_run(title_text)
            run.font.name = "Segoe UI"
            run.font.size = Pt(14)
            run.bold = True
            run.font.color.rgb = RGBColor(30, 58, 138)
            
        elif stripped.startswith('### '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            title_text = stripped[4:].strip()
            last_heading = title_text
            run = p.add_run(title_text)
            run.font.name = "Segoe UI"
            run.font.size = Pt(12)
            run.bold = True
            run.font.color.rgb = RGBColor(37, 99, 235)
            
        elif stripped.startswith('#### '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(stripped[5:].strip())
            run.font.name = "Segoe UI"
            run.font.size = Pt(11)
            run.bold = True
            run.font.color.rgb = RGBColor(71, 85, 105)
            
        # Handle Horizontal Rule
        elif stripped in ['---', '***', '___']:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            
        # Handle Bullet List
        elif stripped.startswith('- ') or stripped.startswith('* '):
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            format_inline_text(p, stripped[2:].strip())
            
        # Handle Numbered List
        elif re.match(r'^\d+\.\s+', stripped):
            num_match = re.match(r'^\d+\.\s+', stripped)
            item_text = stripped[num_match.end():].strip()
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            format_inline_text(p, item_text)
            
        # Normal Paragraph
        else:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.15
            format_inline_text(p, stripped)
            
        i += 1
        
    if in_table:
        render_table_from_markdown(doc, table_lines)
    if in_callout:
        add_callout(doc, callout_lines, callout_type)

def add_complete_setup_guide(doc):
    """Adds a crystal-clear, step-by-step installation, environment setup, and roadmap section."""
    setup_md = """
# 🚀 COMPLETE INSTALLATION & ENVIRONMENT SETUP GUIDE

## 1. System Prerequisites
Before running any Kafka code, ensure the following software is installed on your local development machine:

| Component | Minimum Required Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `v18.0.0+` (LTS recommended) | Runs all Producer, Consumer, Streams, and Benchmark code |
| **Docker Desktop** | `v24.0+` | Runs the Apache Kafka KRaft cluster, Kafka UI, Postgres & Redis |
| **Docker Compose** | `v2.20+` | Orchestrates multi-container local infrastructure |
| **Git** | `v2.30+` | Version control and repository management |
| **VS Code / IDE** | Latest | Recommended editor with Prettier and ESLint extensions |

---

## 2. Step-by-Step Installation

### Step 1: Install Project Dependencies
Open your terminal in the `learn-kafka` directory and install all required Node.js libraries (`kafkajs`, `pg`, `redis`, `dotenv`, `express`, `uuid`):

```bash
# Navigate to the repository root
cd learn-kafka

# Install all npm dependencies
npm install
```

### Step 2: Start the Local Infrastructure (Docker Compose)
Launch the Apache Kafka broker (KRaft mode), Kafka UI web console, PostgreSQL database, and Redis cache with a single command:

```bash
# Start all containers in the background
npm run docker:up
# Or directly: docker compose -f docker/docker-compose.yml up -d
```

### Step 3: Verify Container Health
Check that all 4 containers are up and running:

```bash
npm run docker:status
# Or: docker compose -f docker/docker-compose.yml ps
```

Expected running containers:
1. `kafka-node-broker` (Apache Kafka 3.7.0 on port `9092`)
2. `kafka-node-ui` (Kafka UI Management Dashboard on port `8080`)
3. `kafka-node-postgres` (PostgreSQL 16 on port `5432` with user `course_user`)
4. `kafka-node-redis` (Redis 7 on port `6380`)

### Step 4: Run the Automated Cluster Healthcheck
Wait for the Kafka broker to finish KRaft quorum initialization and become fully ready to accept client connections:

```bash
npm run wait:kafka
```

Output:
```text
🔍 Waiting for Kafka broker at localhost:9092 to be ready...
✅ Kafka broker is healthy and ready to accept connections!
```

### Step 5: Access the Web UI Dashboard
Open your browser and navigate to:
🌐 **`http://localhost:8080`**

You will see the **Provectus Kafka-UI** dashboard where you can visually inspect:
- All Topics, Partitions, and Offsets in real-time
- Consumer Groups and live Consumer Lag
- Individual Message Payloads and Headers
- Broker cluster topology and metadata health

---

## 3. Useful Kafka CLI Quick Commands

All Kafka CLI tools are bundled inside the Kafka Docker container. You can run them via `docker exec`:

```bash
# 1. List all active topics
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list

# 2. Create a new topic manually (e.g. 3 partitions, replication factor 1)
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic my-test-topic --partitions 3 --replication-factor 1

# 3. Describe topic partitions, leaders, and replicas
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic my-test-topic

# 4. Produce messages from terminal
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic my-test-topic

# 5. Consume messages from beginning
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic my-test-topic --from-beginning

# 6. Inspect Consumer Groups and live lag
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list
docker exec -it kafka-node-broker /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group my-group
```

---

## 4. Structured Course Learning Path & Execution Guide

Follow this curriculum map to progress from fundamental principles to production architecture:

```mermaid
flowchart LR
    Setup["00. Setup & Docker"] --> Theory["01-04. Architecture & Partitions"]
    Theory --> Clients["05-08. Producers, Consumers & Offsets"]
    Clients --> Resiliency["09-14. Keys, Retries, DLQ & Idempotency"]
    Resiliency --> Advanced["15-18. Schemas, Connect, Streams & EOS"]
    Advanced --> Production["19-23. Performance, Security & Multi-Broker"]
```

### How to Run Hands-On Labs (Labs 01 to 12)
Each lab in `labs/` demonstrates a core architectural pattern with runnable Node.js code:

```bash
# Lab 01: First Producer
npm run lab:01:producer

# Lab 02: First Consumer (Run producer in one terminal, consumer in another)
npm run lab:02:consumer
npm run lab:02:producer

# Lab 03: Topics & Admin API
npm run lab:03:admin

# Lab 04: Partitions & Parallelism
npm run lab:04:producer
npm run lab:04:consumer

# Lab 05: Consumer Groups & Rebalancing
npm run lab:05:producer
npm run lab:05:consumer

# Lab 06: Message Keys & Murmur2 Hashing
npm run lab:06:producer
npm run lab:06:consumer

# Lab 07: Manual Offset Management & Checkpointing
npm run lab:07:producer
npm run lab:07:consumer

# Lab 08: Non-blocking Retries & Exponential Backoff
npm run lab:08:producer
npm run lab:08:consumer

# Lab 09: Dead Letter Queue (DLQ) & Poison Pill Isolation
npm run lab:09:producer
npm run lab:09:consumer
npm run lab:09:dlt-consumer

# Lab 10: Idempotent Consumer (Deduplication via PostgreSQL / Redis)
npm run lab:10:producer
npm run lab:10:consumer

# Lab 11: Exactly-Once Transactions (read-process-write)
npm run lab:11:service

# Lab 12: High-Throughput Performance Benchmark
npm run lab:12:benchmark
```

### How to Run Failure Experiments (Experiments 01 to 08)
Each experiment in `experiments/` proves a specific distributed edge-case by triggering real failures:

```bash
# Exp 01: Global vs. Partition Ordering Skew
npm run exp:01:ordering

# Exp 02: Consumer Sudden Crash & Resume
npm run exp:02:failure

# Exp 03: Dynamic Rebalancing Live Timeline
npm run exp:03:rebalance

# Exp 04: Crash Before Offset Commit (Duplicate Double-Charge Demo)
npm run exp:04:duplicates

# Exp 05: Transient Error Retry Pipeline
npm run exp:05:retries

# Exp 06: Slow Consumer Lag Accumulation & Measurement
npm run exp:06:lag

# Exp 07: Low-Cardinality Key Skew (Hot Partition Problem)
npm run exp:07:hot-partition

# Exp 08: Uncommitted Offsets Crash & 100% Deterministic Replay
npm run exp:08:uncommitted
```

---
"""
    parse_and_append_markdown(doc, setup_md)

def main():
    base_dir = r"c:\Users\Sulaiman\Desktop\pratice-dev\learn-kafka"
    docs_dir = os.path.join(base_dir, "docs")
    experiments_dir = os.path.join(base_dir, "experiments")
    labs_dir = os.path.join(base_dir, "labs")
    output_docx = os.path.join(base_dir, "Complete_Apache_Kafka_Masterclass_Guide.docx")
    
    doc = Document()
    
    # Configure 1-inch standard margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
    # =========================================================================
    # 🌟 COVER PAGE
    # =========================================================================
    cover_table = doc.add_table(rows=1, cols=1)
    cover_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cover_cell = cover_table.cell(0, 0)
    cover_cell.width = Inches(6.5)
    set_cell_background(cover_cell, "0A2540")  # Enterprise Navy
    set_cell_margins(cover_cell, top=800, bottom=800, left=400, right=400)
    
    p_badge = cover_cell.paragraphs[0]
    p_badge.paragraph_format.space_after = Pt(12)
    badge_run = p_badge.add_run("ENTERPRISE DISTRIBUTED SYSTEMS & EVENT STREAMING")
    badge_run.font.name = "Segoe UI"
    badge_run.font.size = Pt(11)
    badge_run.bold = True
    badge_run.font.color.rgb = RGBColor(56, 189, 248)  # Sky blue
    
    p_title = cover_cell.add_paragraph()
    p_title.paragraph_format.space_after = Pt(16)
    title_run = p_title.add_run("Apache Kafka®\nMaster Architecture & Engineering Guide")
    title_run.font.name = "Segoe UI"
    title_run.font.size = Pt(26)
    title_run.bold = True
    title_run.font.color.rgb = RGBColor(255, 255, 255)
    
    p_sub = cover_cell.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(28)
    sub_run = p_sub.add_run(
        "A Comprehensive Reference Manual: From Storage Internals, Log Compaction & KRaft Consensus "
        "to At-Least-Once Delivery, Non-Blocking Retries, Dead Letter Topics, EOS Transactions & Production Tuning."
    )
    sub_run.font.name = "Segoe UI"
    sub_run.font.size = Pt(12)
    sub_run.font.color.rgb = RGBColor(203, 213, 225)
    
    p_meta = cover_cell.add_paragraph()
    p_meta.paragraph_format.space_after = Pt(0)
    meta_run = p_meta.add_run(
        "📘 Complete Curriculum: Modules 00–23 • 12 Hands-on Labs • 8 Failure Experiments\n"
        "⚡ Code Stack: Node.js / KafkaJS • KRaft Cluster • Docker Compose • Production Ready\n"
        "📊 High-Resolution Rendered Diagrams • Complete Visual Flow Architecture\n"
        "📅 Edition: 2026 Comprehensive Enterprise Edition"
    )
    meta_run.font.name = "Segoe UI"
    meta_run.font.size = Pt(9.5)
    meta_run.font.color.rgb = RGBColor(148, 163, 184)
    
    doc.add_page_break()
    
    # =========================================================================
    # 🚀 MODULE 00: COMPLETE ENVIRONMENT SETUP & INSTALLATION GUIDE
    # =========================================================================
    add_complete_setup_guide(doc)
    doc.add_page_break()
    
    # =========================================================================
    # 📚 MODULE-BY-MODULE THEORY (00 to 23)
    # =========================================================================
    doc_files = sorted([f for f in os.listdir(docs_dir) if f.endswith('.md')])
    
    for idx, filename in enumerate(doc_files):
        filepath = os.path.join(docs_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        print(f"Processing Module {idx+1}/{len(doc_files)}: {filename}...")
        
        parse_and_append_markdown(doc, content)
        doc.add_page_break()
        
    # =========================================================================
    # 🔬 APPENDIX A: ARCHITECTURAL FAILURE EXPERIMENTS (01 to 08)
    # =========================================================================
    p_app_title = doc.add_paragraph()
    p_app_title.paragraph_format.space_before = Pt(18)
    p_app_title.paragraph_format.space_after = Pt(8)
    app_title_run = p_app_title.add_run("Appendix A: 8 Deep-Dive Failure Experiments")
    app_title_run.font.name = "Segoe UI"
    app_title_run.font.size = Pt(20)
    app_title_run.bold = True
    app_title_run.font.color.rgb = RGBColor(10, 37, 64)
    
    p_app_desc = doc.add_paragraph()
    p_app_desc.paragraph_format.space_after = Pt(12)
    format_inline_text(
        p_app_desc,
        "The following laboratory experiments prove real-world distributed systems behavior by deliberately triggering partition ordering skew, consumer crashes, rebalance handovers, duplicate double-charges, transient retry pipelines, lag buildup, hot partitions, and uncommitted replays."
    )
    
    exp_folders = sorted([f for f in os.listdir(experiments_dir) if os.path.isdir(os.path.join(experiments_dir, f))])
    for exp_folder in exp_folders:
        exp_path = os.path.join(experiments_dir, exp_folder)
        readme_path = os.path.join(exp_path, "README.md")
        run_path = os.path.join(exp_path, "run.js")
        
        if os.path.exists(readme_path):
            with open(readme_path, 'r', encoding='utf-8') as f:
                readme_content = f.read()
            parse_and_append_markdown(doc, readme_content)
            
        if os.path.exists(run_path):
            with open(run_path, 'r', encoding='utf-8') as f:
                code_content = f.read()
            add_code_block(doc, code_content, "javascript")
            
        doc.add_paragraph()
        
    # =========================================================================
    # 🛠️ APPENDIX B: 12 HANDS-ON LABS CODE REFERENCE
    # =========================================================================
    doc.add_page_break()
    p_lab_title = doc.add_paragraph()
    p_lab_title.paragraph_format.space_before = Pt(18)
    p_lab_title.paragraph_format.space_after = Pt(8)
    lab_title_run = p_lab_title.add_run("Appendix B: 12 Production Hands-On Labs Reference")
    lab_title_run.font.name = "Segoe UI"
    lab_title_run.font.size = Pt(20)
    lab_title_run.bold = True
    lab_title_run.font.color.rgb = RGBColor(10, 37, 64)
    
    lab_folders = sorted([f for f in os.listdir(labs_dir) if os.path.isdir(os.path.join(labs_dir, f))])
    for lab_folder in lab_folders:
        lab_path = os.path.join(labs_dir, lab_folder)
        readme_path = os.path.join(lab_path, "README.md")
        
        if os.path.exists(readme_path):
            with open(readme_path, 'r', encoding='utf-8') as f:
                readme_content = f.read()
            parse_and_append_markdown(doc, readme_content)
            
        for code_file in sorted(os.listdir(lab_path)):
            if code_file.endswith('.js'):
                code_file_path = os.path.join(lab_path, code_file)
                with open(code_file_path, 'r', encoding='utf-8') as f:
                    code_content = f.read()
                
                p_file_label = doc.add_paragraph()
                p_file_label.paragraph_format.space_before = Pt(6)
                p_file_label.paragraph_format.space_after = Pt(2)
                run = p_file_label.add_run(f"Source Code: labs/{lab_folder}/{code_file}")
                run.bold = True
                run.font.name = "Segoe UI"
                run.font.size = Pt(10)
                run.font.color.rgb = RGBColor(37, 99, 235)
                
                add_code_block(doc, code_content, "javascript")
                
        doc.add_paragraph()
        
    print(f"[+] Saving complete Word document with rendered graphics to: {output_docx}...")
    doc.save(output_docx)
    print("[SUCCESS] Complete Word Document with Rendered Diagrams successfully generated and saved!")

if __name__ == "__main__":
    main()
