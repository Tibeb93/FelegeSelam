import { CmsPageDto, CmsMenuDto, SectionAudience } from '@felegeselam/cms-registry';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function getCmsPage(
  slug: string,
  audience?: SectionAudience,
): Promise<CmsPageDto | null> {
  try {
    const url = `${API_BASE}/cms/pages/${slug}${audience ? `?audience=${audience}` : ''}`;
    const res = await fetch(url, {
      next: {
        tags: [`cms-page-${slug}`, 'cms-pages'],
        revalidate: 60,
      },
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    return null;
  }
}

export async function getCmsMenus(): Promise<{ header: CmsMenuDto; footer: CmsMenuDto } | null> {
  try {
    const res = await fetch(`${API_BASE}/cms/menus`, {
      next: {
        tags: ['cms-menus'],
        revalidate: 120,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getCmsTheme(): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(`${API_BASE}/cms/theme`, {
      next: {
        tags: ['cms-theme'],
        revalidate: 300,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getCmsUiStrings(): Promise<{
  am: Record<string, string>;
  en: Record<string, string>;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/cms/ui-strings`, {
      next: {
        tags: ['cms-ui-strings'],
        revalidate: 120,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
