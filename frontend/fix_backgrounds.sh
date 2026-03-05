#!/bin/bash
# fix_backgrounds.sh
# Запусти этот скрипт в папке frontend/
# Добавляет полный блок фона (b1-b4, noise-overlay) во все HTML страницы

FULL_BG='  <div class="noise-overlay"></div>\n  <div class="bg-canvas">\n    <div class="bg-blob b1"><\/div>\n    <div class="bg-blob b2"><\/div>\n    <div class="bg-blob b3"><\/div>\n    <div class="bg-blob b4"><\/div>\n    <div class="bg-grid"><\/div>\n  <\/div>'

patch_file() {
  local file="$1"
  echo "Патчим: $file"
  
  # 1. Удаляем старый noise-overlay
  sed -i 's|<div class="noise-overlay"></div>||g' "$file"
  
  # 2. Удаляем старый bg-canvas блок (однострочный)
  sed -i 's|<div class="bg-canvas">.*</div>||g' "$file"
  
  # 3. Убираем пустые строки которые остались после удаления
  # 4. Вставляем новый блок сразу после <body>
  sed -i "s|<body>|<body>\n${FULL_BG}|" "$file"
  
  echo "  ✅ Готово"
}

# Многострочные блоки требуют python
python3 << 'PYEOF'
import re, os, glob

FULL_BG = """  <div class="noise-overlay"></div>
  <div class="bg-canvas">
    <div class="bg-blob b1"></div>
    <div class="bg-blob b2"></div>
    <div class="bg-blob b3"></div>
    <div class="bg-blob b4"></div>
    <div class="bg-grid"></div>
  </div>"""

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Находим где начинается секция фона (между <body> и первым <nav или <div class="admin/chat)
    body_end = html.find('<body>') + len('<body>')
    
    # Ищем первый реальный контент после body
    nav_pos = html.find('<nav ', body_end)
    chat_pos = html.find('<div class="chat-layout"', body_end)
    admin_pos = html.find('<div class="admin-layout"', body_end)
    
    candidates = [p for p in [nav_pos, chat_pos, admin_pos] if p > 0]
    if not candidates:
        print(f"  ⚠️  {path}: не нашли точку вставки")
        return
    
    insert_before = min(candidates)
    
    # Вырезаем всё между <body> и первым nav/layout
    before_body = html[:body_end]
    after_nav   = html[insert_before:]
    
    # Собираем новый HTML
    new_html = before_body + '\n\n' + FULL_BG + '\n\n  ' + after_nav
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    
    # Проверка
    has_b4 = 'bg-blob b4' in new_html
    has_noise = 'noise-overlay' in new_html
    has_b3 = 'bg-blob b3' in new_html
    status = "✅" if (has_b4 and has_noise and has_b3) else "⚠️ "
    print(f"  {status} {os.path.basename(path)} | noise={'✓' if has_noise else '✗'} b3={'✓' if has_b3 else '✗'} b4={'✓' if has_b4 else '✗'}")

html_files = glob.glob('*.html')
if not html_files:
    print("HTML файлы не найдены! Запусти скрипт из папки frontend/")
    exit(1)

print(f"Найдено {len(html_files)} HTML файлов")
print("-" * 50)
for f in sorted(html_files):
    fix_file(f)
print("-" * 50)
print("Готово! Обнови страницу в браузере.")
PYEOF