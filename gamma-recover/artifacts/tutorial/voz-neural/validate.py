from pathlib import Path
import sys,subprocess,json,re
base=Path(__file__).resolve().parent
sys.path.insert(0,str(base.parent/'tools'))
import imageio_ffmpeg
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe();video=base/'Gamma-Recover-Tutorial-Completo.mp4'
timeline=json.loads((base/'timeline.json').read_text(encoding='utf8'));expected=sum(s['duration'] for s in timeline)
probe=subprocess.run([ffmpeg,'-hide_banner','-i',str(video)],capture_output=True,text=True,encoding='utf8',errors='replace')
info=probe.stderr
m=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',info)
actual=int(m[1])*3600+int(m[2])*60+float(m[3]) if m else -1
checks={'video_h264':'Video: h264' in info,'audio_aac':'Audio: aac' in info,'subtitles':'Subtitle: mov_text' in info,'full_hd':'1920x1080' in info,'39_chapters':len(re.findall(r'Chapter #',info))==39,'duration_matches_timeline':abs(actual-expected)<0.3,'all_neural_audio_files':len(list((base/'audio').glob('*.wav')))==39}
print(json.dumps(checks),flush=True)
if not all(checks.values()):
 (base/'media-info.txt').write_text(info,encoding='utf8');raise RuntimeError('Falha na estrutura do vídeo.')
decode=subprocess.run([ffmpeg,'-hide_banner','-v','error','-i',str(video),'-map','0:v:0','-map','0:a:0','-f','null','-'],capture_output=True,text=True,encoding='utf8',errors='replace')
checks['full_decode_ok']=decode.returncode==0 and not decode.stderr.strip()
if decode.stderr:(base/'decode.log').write_text(decode.stderr,encoding='utf8')
for name,seconds in [('inicio',5),('meio',expected/2),('fim',expected-5)]:
 subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-ss',str(seconds),'-i',str(video),'-frames:v','1',str(base/f'qa-{name}.png')],check=True)
report={'checks':checks,'duration':f'{int(expected)//60}:{int(expected)%60:02}','seconds':expected,'resolution':'1920x1080','bytes':video.stat().st_size,'voice':json.loads((base/'voice.json').read_text()),'chapters':39}
(base/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=False),flush=True)
if not all(checks.values()):raise RuntimeError('Falha na validação do vídeo.')
