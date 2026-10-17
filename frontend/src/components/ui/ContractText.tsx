import { markdownToHtml } from '@/lib/markdown';

export function ContractText({ text }: { text: string }) {
  return <div className="contract-md text-sm text-gray-700 dark:text-dark-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: markdownToHtml(text) }} />;
}
