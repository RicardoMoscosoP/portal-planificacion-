export type ReviewEmbedProvider = 'google-slides' | 'powerpoint-public-file' | 'office-embed' | 'office-share-link' | 'atlassian' | 'generic' | 'invalid';

export interface ReviewEmbedConfig {
  rawUrl: string;
  iframeUrl: string;
  openUrl: string;
  provider: ReviewEmbedProvider;
  providerLabel: string;
  likelyEmbeddable: boolean;
  guidance: string;
}

export function sanitizeExternalUrl(url?: string): string {
  return url?.trim() ?? '';
}

export function isValidExternalUrl(url?: string): boolean {
  const sanitized = sanitizeExternalUrl(url);
  if (!sanitized) return false;

  try {
    const parsed = new URL(sanitized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildGoogleSlidesEmbedUrl(parsed: URL): string {
  const match = parsed.pathname.match(/\/presentation\/d\/([^/]+)/i);
  if (!match) return parsed.toString();

  const slideFromQuery = parsed.searchParams.get('slide');
  const slideFromHash = parsed.hash.match(/slide=([^&]+)/i)?.[1];
  const slide = slideFromQuery ?? slideFromHash;
  const nextParams = new URLSearchParams();

  nextParams.set('rm', 'minimal');
  if (slide) nextParams.set('slide', slide);

  return `https://docs.google.com/presentation/d/${match[1]}/preview?${nextParams.toString()}`;
}

export function resolveReviewEmbed(url?: string): ReviewEmbedConfig {
  const rawUrl = sanitizeExternalUrl(url);

  if (!isValidExternalUrl(rawUrl)) {
    return {
      rawUrl,
      iframeUrl: '',
      openUrl: rawUrl,
      provider: 'invalid',
      providerLabel: 'URL no válida',
      likelyEmbeddable: false,
      guidance: 'Usa una URL pública http o https para poder ejecutar la review embebida.',
    };
  }

  const parsed = new URL(rawUrl);
  const host = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();

  if (host.includes('docs.google.com') && pathname.includes('/presentation/')) {
    return {
      rawUrl,
      iframeUrl: buildGoogleSlidesEmbedUrl(parsed),
      openUrl: rawUrl,
      provider: 'google-slides',
      providerLabel: 'Google Slides',
      likelyEmbeddable: true,
      guidance: 'Puedes pegar una URL de edición, compartir o publicar de Google Slides. La app la normaliza a una vista previa embebible y mantiene el slide activo cuando viene informado en el enlace.',
    };
  }

  if (host.includes('atlassian.net') || host.includes('jira.')) {
    return {
      rawUrl,
      iframeUrl: rawUrl,
      openUrl: rawUrl,
      provider: 'atlassian',
      providerLabel: 'Atlassian / Jira',
      likelyEmbeddable: false,
      guidance: 'Jira y los paneles de Atlassian normalmente bloquean el modo embebido. Usa este enlace en el campo de panel Jira y deja la fuente principal para una PPT, Google Slides o una vista pública preparada para iframe.',
    };
  }

  if (host.includes('view.officeapps.live.com') && pathname.includes('/op/embed.aspx')) {
    return {
      rawUrl,
      iframeUrl: rawUrl,
      openUrl: rawUrl,
      provider: 'office-embed',
      providerLabel: 'Office Embed',
      likelyEmbeddable: true,
      guidance: 'La review usará directamente el visor embebido de Office.',
    };
  }

  if (/\.(ppt|pptx|pps|ppsx)$/i.test(pathname)) {
    return {
      rawUrl,
      iframeUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(rawUrl)}`,
      openUrl: rawUrl,
      provider: 'powerpoint-public-file',
      providerLabel: 'PowerPoint pública',
      likelyEmbeddable: true,
      guidance: 'Si el archivo PPT es público y descargable, se mostrará dentro de la review usando el visor de Office.',
    };
  }

  if (host.includes('sharepoint.com') || host.includes('onedrive.live.com') || host.includes('powerpoint.live.com') || host.includes('office.com')) {
    return {
      rawUrl,
      iframeUrl: rawUrl,
      openUrl: rawUrl,
      provider: 'office-share-link',
      providerLabel: 'Enlace compartido de Office',
      likelyEmbeddable: false,
      guidance: 'Los enlaces de compartir de PowerPoint, OneDrive o SharePoint suelen bloquear el iframe. Si quieres verla dentro del modo presentación, usa una URL de embeber/publicar o un archivo público directo.',
    };
  }

  return {
    rawUrl,
    iframeUrl: rawUrl,
    openUrl: rawUrl,
    provider: 'generic',
    providerLabel: 'URL pública',
    likelyEmbeddable: true,
    guidance: 'La vista intentará embebir esta URL. Si el sitio no permite iframe, seguirá disponible el acceso para abrirlo en pestaña.',
  };
}