from pathlib import Path
import sys,subprocess,json,re
base=Path(__file__).resolve().parent
sys.path.insert(0,str(base/'tools'))
import imageio_ffmpeg
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe();video=base/'Gamma-Recover-Tutorial-Completo.mp4'
probe=subprocess.run([ffmpeg,'-hide_banner','-i',str(video)],capture_output=True,text=True,encoding='utf8',errors='replace')
info=probe.stderr
checks={'video_h264':'Video: h264' in info,'audio_aac':'Audio: aac' in info,'subtitles':'Subtitle: mov_text' in info,'full_hd':'1920x1080' in info,'39_chapters':len(re.findall(r'Chapter #',info))==39,'duration_31_52':'Duration: 00:31:52' in info,'browser_errors_absent':json.loads((base/'capture-report.json').read_text())['errors']==[]}
print(json.dumps(checks,ensure_ascii=False),flush=True)
if not all(checks.values()):
 (base/'media-info.txt').write_text(info,encoding='utf8');raise RuntimeError('Falha na estrutura do arquivo.')
decode=subprocess.run([ffmpeg,'-hide_banner','-v','error','-i',str(video),'-map','0:v:0','-map','0:a:0','-f','null','-'],capture_output=True,text=True,encoding='utf8',errors='replace')
checks['full_decode_ok']=decode.returncode==0 and not decode.stderr.strip()
if decode.stderr:(base/'decode.log').write_text(decode.stderr,encoding='utf8')
for name,seconds in [('inicio',5),('meio',1000),('fim',1900)]:
 subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-ss',str(seconds),'-i',str(video),'-frames:v','1',str(base/f'qa-{name}.png')],check=True)
report={'checks':checks,'duration':'31:52','resolution':'1920x1080','bytes':video.stat().st_size,'narration':'Microsoft Maria Desktop / pt-BR / voz sintética','subtitle_cues':len(re.findall(r' --> ',(base/'gamma-recover-legendas.srt').read_text(encoding='utf8'))),'chapters':39}
(base/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=False),flush=True)
if not all(checks.values()):raise RuntimeError('Falha na validação do vídeo.')
