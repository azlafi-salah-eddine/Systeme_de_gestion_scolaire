import { useEffect } from 'react';

interface HeadProps {
  title: string;
  description?: string;
}

const Head: React.FC<HeadProps> = ({ title, description }) => {
  useEffect(() => {
    document.title = `${title} - Système de Gestion École`;
    
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = description;
        document.head.appendChild(meta);
      }
    }
  }, [title, description]);

  return null;
};

export default Head;
