$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$tutorialScenes = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scenes.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$tutorialAudioDir = Join-Path $PSScriptRoot 'audio'
New-Item -ItemType Directory -Path $tutorialAudioDir -Force | Out-Null
$tutorialSpeaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $tutorialVoice = $tutorialSpeaker.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq 'pt-BR' } | Select-Object -First 1
  if (-not $tutorialVoice) { throw 'Voz em português não encontrada.' }
  $tutorialSpeaker.SelectVoice($tutorialVoice.VoiceInfo.Name)
  $tutorialSpeaker.Rate = 0
  $tutorialSpeaker.Volume = 100
  Write-Output ('Voz: ' + $tutorialVoice.VoiceInfo.Name)
  foreach ($tutorialScene in $tutorialScenes) {
    $tutorialTarget = Join-Path $tutorialAudioDir ($tutorialScene.id + '.wav')
    $tutorialSpeaker.SetOutputToWaveFile($tutorialTarget)
    $tutorialSpeaker.Speak($tutorialScene.narration)
    $tutorialSpeaker.SetOutputToNull()
    Write-Output ('Narração ' + $tutorialScene.id)
  }
} finally { $tutorialSpeaker.Dispose() }
