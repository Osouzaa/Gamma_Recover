import asyncio,json,sys,subprocess
from pathlib import Path
base=Path(__file__).resolve().parent
sys.path.insert(0,str(base/'tools'))
import edge_tts,imageio_ffmpeg
out=base/'voz-neural';(out/'audio').mkdir(exist_ok=True)
scenes=json.loads((out/'scenes.json').read_text(encoding='utf8'))
semaphore=asyncio.Semaphore(2)
async def generate(scene):
 async with semaphore:
  mp3=out/'audio'/f"{scene['id']}.mp3"
  for attempt in range(3):
   try:
    await edge_tts.Communicate(scene['narration'],voice='pt-BR-FranciscaNeural',rate='-8%',pitch='-2Hz').save(str(mp3))
    break
   except Exception:
    if attempt==2:raise
    await asyncio.sleep(2)
  subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-hide_banner','-loglevel','error','-y','-i',str(mp3),'-ac','1','-ar','24000','-c:a','pcm_s16le',str(out/'audio'/f"{scene['id']}.wav")],check=True)
  print(f"Voz neural {scene['id']}/39",flush=True)
async def main():await asyncio.gather(*(generate(scene) for scene in scenes))
asyncio.run(main())
(out/'voice.json').write_text(json.dumps({'voice':'pt-BR-FranciscaNeural','rate':'-8%','pitch':'-2Hz'},indent=2),encoding='utf8')
