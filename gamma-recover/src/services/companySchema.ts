import { z } from 'zod';
export const attachmentSchema = z.object({
  name: z.string().trim().min(1).max(180),
  data: z
    .string()
    .max(2666696)
    .regex(
      /^data:application\/pdf;base64,JVBERi0[A-Za-z0-9+/]*={0,2}$/,
      'Anexe um PDF válido de até 2 MB.',
    )
    .refine((data) => {
      try {
        const bytes = atob(data.split(',')[1]);
        return bytes.startsWith('%PDF-') && bytes.length <= 2000000;
      } catch {
        return false;
      }
    }, 'O conteúdo do PDF é inválido.'),
});
export const companyProfileSchema = z.object({
  tradeName: z.string().trim().max(100),
  contactName: z.string().trim().min(3, 'Informe o contato responsável.').max(100),
  phone: z.string().trim().min(8, 'Informe o telefone.').max(30),
  email: z.email('Informe um e-mail válido.').max(150),
  address: z.string().trim().max(300),
  manager: z.string().trim().min(3, 'Informe o responsável interno.').max(100),
  notes: z.string().trim().max(2000),
  contract: z
    .object({
      reference: z.string().trim().max(100),
      startDate: z.union([z.iso.date(), z.literal('')]),
      endDate: z.union([z.iso.date(), z.literal('')]),
      terms: z.string().trim().max(2000),
      attachment: attachmentSchema.optional(),
    })
    .refine((v) => !v.endDate || (!!v.startDate && v.endDate >= v.startDate), {
      message: 'Informe início e término válidos para a vigência.',
      path: ['endDate'],
    }),
});
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export const emptyCompanyProfile: CompanyProfile = {
  tradeName: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  manager: '',
  notes: '',
  contract: { reference: '', startDate: '', endDate: '', terms: '' },
};
export async function readContract(file: File) {
  if (file.size > 2000000 || !file.name.toLowerCase().endsWith('.pdf'))
    throw new Error('Anexe um PDF de até 2 MB.');
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler o contrato.'));
    reader.readAsDataURL(new Blob([file], { type: 'application/pdf' }));
  });
  return attachmentSchema.parse({ name: file.name, data });
}
