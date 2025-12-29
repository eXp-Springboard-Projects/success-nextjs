import { useEffect } from 'react';
import { useRouter } from 'next/router';

type PageOverrideProviderProps = {
  children: React.ReactNode;
};

export default function PageOverrideProvider({ children }: PageOverrideProviderProps) {
  const router = useRouter();

  useEffect(() => {
    const applyPageOverrides = async () => {
      const pagePath = router.asPath.split('?')[0].split('#')[0];

      try {
        const response = await fetch(`/api/admin/page-editor?page_path=${encodeURIComponent(pagePath)}`);
        if (!response.ok) return;

        const data = await response.json();
        if (!data.overrides || Object.keys(data.overrides).length === 0) return;

        // Apply CSS overrides dynamically
        let styleElement = document.getElementById('page-overrides-style');
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'page-overrides-style';
          document.head.appendChild(styleElement);
        }

        // Build CSS from overrides
        const cssRules = Object.entries(data.overrides).map(([selector, properties]) => {
          const props = Object.entries(properties as Record<string, string>)
            .map(([prop, value]) => {
              // Convert camelCase to kebab-case for CSS
              const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
              return `  ${cssProp}: ${value} !important;`;
            })
            .join('\n');

          return `${selector} {\n${props}\n}`;
        });

        styleElement.textContent = cssRules.join('\n\n');

      } catch (error) {
        console.error('Failed to apply page overrides:', error);
      }
    };

    applyPageOverrides();
  }, [router.asPath]);

  return <>{children}</>;
}
