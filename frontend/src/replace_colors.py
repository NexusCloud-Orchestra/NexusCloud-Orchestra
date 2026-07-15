import os
import re

CSS_DIR = r"d:\Nexus\NexusCloud-Orchestra\frontend\src\css"

# Heuristics for replacing based on properties
replacements = [
    (r"background-color:\s*#(FFFFFF|F8FAFC|0A192F|172A45|0F172A|020C1B);", r"background-color: var(--card);"),
    (r"background:\s*#(FFFFFF|F8FAFC|0A192F|172A45|0F172A|020C1B);", r"background: var(--card);"),
    
    (r"color:\s*#(111827|000000|374151|4B5563|FFFFFF);", r"color: var(--text);"),
    (r"color:\s*#(6B7280|9CA3AF|8892B0|CBD5E1);", r"color: var(--secondary-text);"),
    
    (r"border-color:\s*#(E5E7EB|D1D5DB|233554|334155);", r"border-color: var(--border);"),
    (r"border:\s*1px solid #(E5E7EB|D1D5DB|233554|334155);", r"border: 1px solid var(--border);"),
    (r"border-bottom:\s*1px solid #(E5E7EB|D1D5DB|233554|334155);", r"border-bottom: 1px solid var(--border);"),
    (r"border-top:\s*1px solid #(E5E7EB|D1D5DB|233554|334155);", r"border-top: 1px solid var(--border);"),
    (r"border-left:\s*1px solid #(E5E7EB|D1D5DB|233554|334155);", r"border-left: 1px solid var(--border);"),
    (r"border-right:\s*1px solid #(E5E7EB|D1D5DB|233554|334155);", r"border-right: 1px solid var(--border);"),
    
    (r"background-color:\s*#(2563EB|3B82F6);", r"background-color: var(--primary);"),
    (r"background:\s*#(2563EB|3B82F6);", r"background: var(--primary);"),
    
    (r"color:\s*#(DC2626|EF4444);", r"color: var(--danger);"),
    (r"background-color:\s*#(DC2626|EF4444);", r"background-color: var(--danger);"),
    
    (r"color:\s*#(16A34A|22C55E|065F46);", r"color: var(--success);"),
    (r"background-color:\s*#(16A34A|22C55E);", r"background-color: var(--success);"),
    
    (r"color:\s*#(F59E0B|FACC15|92400E);", r"color: var(--warning);"),
    (r"background-color:\s*#(F59E0B|FACC15);", r"background-color: var(--warning);"),
    
    (r"background-color:\s*#(F3F4F6|F9FAFB);", r"background-color: var(--hover);"),
    (r"background:\s*#(F3F4F6|F9FAFB);", r"background: var(--hover);"),
]

for filename in os.listdir(CSS_DIR):
    if filename.endswith(".css") and filename not in ["variables.css", "light-theme.css", "dark-theme.css", "theme-toggle.css", "theme.css", "responsive.css"]:
        filepath = os.path.join(CSS_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for pattern, replacement in replacements:
            new_content = re.sub(pattern, replacement, new_content)
            
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filename}")
