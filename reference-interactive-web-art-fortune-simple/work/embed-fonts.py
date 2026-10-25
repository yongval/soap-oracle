from pathlib import Path
from shutil import copyfile
root=Path('outputs/soap-oracle/dist')
fonts=root/'fonts'
fonts.mkdir(exist_ok=True)
for source,target in [('ArchivoBlack-Regular.ttf','archivo-black.ttf'),('DMSans-Variable.ttf','dm-sans-variable.ttf'),('ArchivoBlack-OFL.txt','ArchivoBlack-OFL.txt'),('DMSans-OFL.txt','DMSans-OFL.txt')]:copyfile(Path('work/fonts-v7')/source,fonts/target)
p=root/'style.css'
s=p.read_text(encoding='utf-8')
s=s.replace("font-family:Arial,Helvetica,sans-serif",'font-family:"Oracle Sans",sans-serif')
s=s.replace("font-family:'Arial Black',Arial,Helvetica,sans-serif",'font-family:"Oracle Black",sans-serif')
s=s.replace('h2{font-size:24px','h2{font-family:"Oracle Black",sans-serif;font-size:24px')
s='''@font-face{font-family:"Oracle Black";src:url("fonts/archivo-black.ttf") format("truetype");font-style:normal;font-weight:900;font-display:swap}
@font-face{font-family:"Oracle Sans";src:url("fonts/dm-sans-variable.ttf") format("truetype");font-style:normal;font-weight:100 1000;font-display:swap}
'''+s
p.write_text(s,encoding='utf-8')
p=root/'index.html'
s=p.read_text(encoding='utf-8')
s=s.replace('<title>Soap Oracle</title>','<title>Soap Oracle</title>\n  <link rel="preload" href="fonts/archivo-black.ttf" as="font" type="font/ttf" crossorigin>\n  <link rel="preload" href="fonts/dm-sans-variable.ttf" as="font" type="font/ttf" crossorigin>\n  ')
s=s.replace('href="style.css"','href="style.css?v=embedded-fonts-1"')
p.write_text(s,encoding='utf-8')
