import pypdf
import sys

try:
    reader = pypdf.PdfReader('C:\\Users\\abdelrahman shaker\\Downloads\\Hiring Playbook - Coda.pdf')
    text = []
    for i, page in enumerate(reader.pages):
        text.append(f"--- Page {i+1} ---")
        text.append(page.extract_text())

    with open('playbook_text.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(text))
    print("Success: 1")
except Exception as e:
    print(f"Error: {e}")
