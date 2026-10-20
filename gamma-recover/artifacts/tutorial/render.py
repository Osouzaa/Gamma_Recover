from pathlib import Path
import sys,json,math,wave,subprocess,re
from PIL import Image,ImageDraw,ImageFont
base=Path(__file__).resolve().parent
sys.path.insert(0,str(base/'tools'))
import imageio_ffmpeg
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
scenes=json.loads((base/'scenes.json').read_text(encoding='utf8'))
for folder in ['frames','segments']: (base/folder).mkdir(exist_ok=True)
navy='#0B1B34'; green='#29C979'; grey='#EAF0F5'
font=lambda size:ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',size)
fb=lambda size:ImageFont.truetype('C:/Windows/Fonts/seguisb.ttf',size)
fps=5; timeline=[]; position=0; audio_params=None
with wave.open(str(base/'narracao-completa.wav'),'wb') as joined:
  for scene in scenes:
    with wave.open(str(base/'audio'/f"{scene['id']}.wav"),'rb') as audio:
      params=(audio.getnchannels(),audio.getsampwidth(),audio.getframerate())
      if audio_params is None:
        audio_params=params;joined.setnchannels(params[0]);joined.setsampwidth(params[1]);joined.setframerate(params[2])
      assert params==audio_params
      frames=audio.getnframes();raw=audio.readframes(frames);spoken=frames/params[2]
      duration=math.ceil((spoken+1.2)*fps)/fps
      padding=round(duration*params[2])-frames
      joined.writeframes(raw+b'\x00'*(padding*params[0]*params[1]))
    scene.update(start=position,duration=duration,spoken=spoken)
    position+=duration;timeline.append(scene)
    image=Image.new('RGB',(1920,1080),grey);draw=ImageDraw.Draw(image)
    if scene['id']=='01':
      image=Image.new('RGB',(1920,1080),navy);draw=ImageDraw.Draw(image)
      draw.text((130,100),'Γ  gamma recover',font=fb(68),fill=green)
      draw.text((130,320),'Como usar o Gamma Recover',font=fb(70),fill='white')
      draw.text((130,425),'Treinamento da equipe interna',font=font(40),fill='white')
      draw.text((130,560),'Empresa → carteira → cobrança → acordo → recebimento',font=font(34),fill=green)
      draw.text((130,700),'Telas reais • Narração em português • Passo a passo',font=font(30),fill='white')
      draw.text((130,920),'Versão demonstrativa • Dados fictícios • Sem portal do devedor',font=font(26),fill='#BDD0E3')
    else:
      draw.rectangle((0,0,1920,115),fill=navy)
      draw.text((80,15),f"GAMMA RECOVER   •   {scene['chapter']}",font=font(21),fill=green)
      draw.text((80,49),scene['title'],font=fb(36),fill='white')
      screenshot=Image.open(base/'screens'/f"{scene['id']}.png").convert('RGB')
      assert screenshot.size==(1600,850)
      image.paste(screenshot,(160,128))
      draw.rectangle((159,127,1760,978),outline='#CCD7E1',width=1)
      draw.text((80,1000),scene['tip'],font=font(25),fill=navy)
      draw.text((1790,1003),f"{int(scene['id']):02}/39",font=fb(23),fill=navy)
      draw.rectangle((0,1072,round(1920*int(scene['id'])/39),1079),fill=green)
    image.save(base/'frames'/f"{scene['id']}.png")
(base/'timeline.json').write_text(json.dumps(timeline,ensure_ascii=False,indent=2),encoding='utf8')
def stamp(t,separator=','):
  ms=round(t*1000); h=ms//3600000; m=(ms//60000)%60;s=(ms//1000)%60
  return f'{h:02}:{m:02}:{s:02}{separator}{ms%1000:03}'
def clock(t):
  sec=int(t);return f'{sec//60:02}:{sec%60:02}'
# Short subtitle cues are proportionally aligned within each narrated scene.
subs=[];cue=1
for scene in timeline:
  words=scene['narration'].split();chunks=[];current=[]
  for word in words:
    current.append(word)
    if len(' '.join(current))>=85 or (word.endswith(('.',':','?')) and len(current)>=7):chunks.append(current);current=[]
  if current:chunks.append(current)
  offset=0
  for chunk in chunks:
    start=scene['start']+scene['spoken']*offset/len(words);offset+=len(chunk)
    end=scene['start']+scene['spoken']*offset/len(words)
    text=' '.join(chunk)
    if len(text)>48:
      midpoint=min(range(1,len(chunk)),key=lambda i:abs(len(' '.join(chunk[:i]))-len(text)/2)) if len(chunk)>1 else 1
      text=' '.join(chunk[:midpoint])+'\n'+' '.join(chunk[midpoint:])
    subs.append(f'{cue}\n{stamp(start)} --> {stamp(end)}\n{text}\n');cue+=1
(base/'gamma-recover-legendas.srt').write_text('\n'.join(subs),encoding='utf8')
metadata=[';FFMETADATA1','title=Gamma Recover - treinamento completo','artist=Gamma Estratégia e Consultoria','comment=Tutorial com capturas reais e voz sintética em português. Dados fictícios.']
for scene in timeline:
  metadata+=['[CHAPTER]','TIMEBASE=1/1000',f"START={round(scene['start']*1000)}",f"END={round((scene['start']+scene['duration'])*1000)}",f"title={scene['id']} - {scene['title']}"]
(base/'chapters.ffmeta').write_text('\n'.join(metadata)+'\n',encoding='utf8')
guide=['# Gamma Recover — tutorial completo','',f'Duração: {clock(position)}. Vídeo em Full HD, narração sintética em português, legendas selecionáveis e capítulos.','',
'Este tutorial usa capturas reais da versão demonstrativa, com empresas, pessoas e documentos fictícios. Não há portal do devedor nesta versão.','',
'Arquivo principal: **Gamma-Recover-Tutorial-Completo.mp4**. Legendas externas: **gamma-recover-legendas.srt**.','',
'As legendas também estão dentro do MP4. Se o reprodutor não mostrar capítulos ou legendas, use os horários abaixo e carregue o arquivo SRT. Os tempos de cada legenda são aproximados dentro da fala de cada etapa.','',
'## Índice de etapas','']
for scene in timeline:guide.append(f"- **{clock(scene['start'])}** — {scene['title']}")
guide+=['','## Roteiro completo','']
for scene in timeline:guide += [f"### {clock(scene['start'])} — {scene['title']}",'',scene['narration'],'']
(base/'Guia-do-Tutorial.md').write_text('\n'.join(guide),encoding='utf8')
log=(base/'render.log').open('w',encoding='utf8')
def run(args):
  result=subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y',*args],stdout=log,stderr=log)
  if result.returncode:raise RuntimeError(f'FFmpeg falhou. Consulte {base / "render.log"}')
for scene in timeline:
  run(['-loop','1','-framerate',str(fps),'-i',str(base/'frames'/f"{scene['id']}.png"),'-frames:v',str(round(scene['duration']*fps)),'-an','-c:v','libx264','-preset','veryfast','-tune','stillimage','-crf','23','-threads','2','-pix_fmt','yuv420p','-video_track_timescale','10240',str(base/'segments'/f"{scene['id']}.mp4")])
  print(f"Renderizado {scene['id']}/39 ({clock(scene['duration'])})",flush=True)
(base/'segments.txt').write_text('\n'.join(f"file 'segments/{s['id']}.mp4'" for s in timeline),encoding='utf8')
run(['-f','concat','-safe','0','-i',str(base/'segments.txt'),'-i',str(base/'narracao-completa.wav'),'-i',str(base/'gamma-recover-legendas.srt'),'-i',str(base/'chapters.ffmeta'),'-map','0:v:0','-map','1:a:0','-map','2:s:0','-map_metadata','3','-map_chapters','3','-c:v','copy','-c:a','aac','-b:a','128k','-c:s','mov_text','-metadata:s:a:0','language=por','-metadata:s:s:0','language=por','-t',str(position),'-movflags','+faststart',str(base/'Gamma-Recover-Tutorial-Completo.mp4')])
(base/'Capa-do-Tutorial.png').write_bytes((base/'frames'/'01.png').read_bytes())
print(json.dumps({'duration_seconds':position,'duration':clock(position),'scenes':len(timeline),'file':str(base/'Gamma-Recover-Tutorial-Completo.mp4'),'bytes':(base/'Gamma-Recover-Tutorial-Completo.mp4').stat().st_size},ensure_ascii=False),flush=True)
