import { EPGProgram } from '../../types/iptv';

export function parseXMLTVContent(xmlText: string): EPGProgram[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  const programs: EPGProgram[] = [];

  const programmeNodes = xmlDoc.querySelectorAll('programme');
  programmeNodes.forEach((node, index) => {
    const channelId = node.getAttribute('channel') || '';
    const startRaw = node.getAttribute('start') || '';
    const stopRaw = node.getAttribute('stop') || '';

    const titleNode = node.querySelector('title');
    const descNode = node.querySelector('desc');
    const categoryNode = node.querySelector('category');

    const title = titleNode ? titleNode.textContent || 'Sem título' : 'Sem título';
    const desc = descNode ? descNode.textContent || undefined : undefined;
    const category = categoryNode ? categoryNode.textContent || undefined : undefined;

    programs.push({
      id: `xmltv_${index}_${channelId}`,
      channelId,
      title,
      desc,
      start: parseXMLTVDate(startRaw),
      end: parseXMLTVDate(stopRaw),
      category,
    });
  });

  return programs;
}

function parseXMLTVDate(xmltvDateStr: string): string {
  if (!xmltvDateStr || xmltvDateStr.length < 14) {
    return new Date().toISOString();
  }
  // Exemplo: 20240924193000 +0000 -> YYYY-MM-DDTHH:mm:ssZ
  const year = xmltvDateStr.substring(0, 4);
  const month = xmltvDateStr.substring(4, 6);
  const day = xmltvDateStr.substring(6, 8);
  const hour = xmltvDateStr.substring(8, 10);
  const min = xmltvDateStr.substring(10, 12);
  const sec = xmltvDateStr.substring(12, 14);

  const date = new Date(Date.UTC(+year, +month - 1, +day, +hour, +min, +sec));
  return date.toISOString();
}
