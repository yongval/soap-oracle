from urllib.request import urlopen
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
root=Path('work/fonts-v7')
root.mkdir(parents=True,exist_ok=True)
files={
 'ArchivoBlack-Regular.ttf':'https://raw.githubusercontent.com/google/fonts/main/ofl/archivoblack/ArchivoBlack-Regular.ttf',
 'ArchivoBlack-OFL.txt':'https://raw.githubusercontent.com/google/fonts/main/ofl/archivoblack/OFL.txt',
 'DMSans-Variable.ttf':'https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf',
 'DMSans-OFL.txt':'https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/OFL.txt',
}
def download(item):
 name,url=item
 with urlopen(url,timeout=30) as response:data=response.read()
 if name.endswith('.ttf'):assert data[:4] in (b'\x00\x01\x00\x00',b'OTTO')
 (root/name).write_bytes(data)
 return name,len(data)
with ThreadPoolExecutor(max_workers=4) as pool:
 for result in pool.map(download,files.items()):print(*result)
