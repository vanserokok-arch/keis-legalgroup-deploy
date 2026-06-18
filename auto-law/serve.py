#!/usr/bin/env python3
"""
Простой локальный статический сервер для проекта `auto-law`.
Запускается в корне проекта и автоматически отображает доступные страницы
(корневой `index.html` и подпапки с `index.html`).

Использование:
  python3 serve.py --port 8000

Откройте одну из печатных ссылок в браузере (http://localhost:8000/, /forced-addons/, /dkp/, /accident-help/).
"""

import http.server
import socketserver
import os
import argparse
import socket
from http.server import SimpleHTTPRequestHandler


def find_pages(root):
    pages = []
    # root index
    if os.path.isfile(os.path.join(root, 'index.html')):
        pages.append('/')
    # subdirectories with index.html
    for name in sorted(os.listdir(root)):
        p = os.path.join(root, name)
        if os.path.isdir(p):
            if os.path.isfile(os.path.join(p, 'index.html')):
                pages.append(f'/{name}/')
    return pages


def get_local_ip():
    ip = '127.0.0.1'
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # doesn't actually connect
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass
    return ip


def run(port):
    root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root)

    pages = find_pages(root)
    host_ip = get_local_ip()

    print('\nLocal static server for `auto-law`')
    print('Serving directory:', root)
    print('\nAvailable pages:')
    for p in pages:
        print('  - http://localhost:{port}{p}'.format(port=port, p=p))
        if host_ip and host_ip != '127.0.0.1':
            print('  - http://{host}:{port}{p}'.format(host=host_ip, port=port, p=p))
    print('\nOpen links above in your browser.')
    print('Server will run until you stop it (Ctrl+C).')

    handler = SimpleHTTPRequestHandler
    with socketserver.ThreadingTCPServer(('0.0.0.0', port), handler) as httpd:
        try:
            httpd.allow_reuse_address = True
            print('\nStarting HTTP server on port', port)
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nShutting down server...')
            httpd.shutdown()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', '-p', type=int, default=8000, help='Port to listen on')
    args = parser.parse_args()
    run(args.port)
