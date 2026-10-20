import type { Debtor } from '../types/domain';
import type { MessageChannel, Conversation } from '../types/conversations';
import { contactDestination } from './contactChannels';
export const messageChannels = ['WhatsApp', 'E-mail', 'SMS'] as const;
export const conversationChannel = (conversation: Conversation): MessageChannel =>
  conversation.channel ?? 'WhatsApp';
export function messageDestination(debtor: Debtor, channel: MessageChannel) {
  const destination = contactDestination(debtor, channel === 'SMS' ? 'Telefone' : channel);
  return channel === 'SMS' && !/^55[1-9]\d9\d{8}$/.test(destination) ? '' : destination;
}
export const messageLimit = (channel: MessageChannel) => (channel === 'SMS' ? 160 : 4096);
export const displayDestination = (channel: MessageChannel, destination: string) =>
  channel === 'E-mail' ? destination : `+${destination}`;
