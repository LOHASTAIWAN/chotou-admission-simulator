import http.server
import socketserver
import webbrowser
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == '__main__':
    url = f'http://localhost:{PORT}/index.html'
    print('=================================================================')
    print('116學年度中投區免試入學比序互動網頁本機伺服器已啟動！')
    print(f'請在瀏覽器開啟：{url}')
    print('或直接雙擊 index.html 亦可正常使用。')
    print('按 Ctrl + C 可關閉伺服器。')
    print('=================================================================')
    try:
        webbrowser.open(url)
    except Exception:
        pass
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n伺服器已停止。')
