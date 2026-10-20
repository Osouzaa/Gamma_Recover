import { describe, expect, it } from 'vitest';
import { answerQuestion, suggestedQuestions } from '../components/Assistant/knowledge';

describe('base demonstrativa do assistente', () => {
  it('reconhece acentos e distingue recebimento de promessa', () => {
    const answer = answerQuestion('Como faço a conciliação?');
    expect(answer.path).toBe('/financeiro');
    expect(answer.text).toContain('Valor divergente mantém a parcela aberta');
  });
  it('não inventa resposta nem navegação para assuntos desconhecidos', () => {
    expect(answerQuestion('previsão do tempo').path).toBeUndefined();
    expect(answerQuestion('previsão do tempo').text).toContain('Não encontrei');
  });
  it('usa a rota da ficha para sugerir ajuda sem ler dados pessoais', () => {
    expect(suggestedQuestions('/devedores/dv-10')[0]).toBe('Como consultar um contribuinte?');
    expect(answerQuestion('Pode enviar WhatsApp?').text).toContain('envio está desabilitado');
  });
});
