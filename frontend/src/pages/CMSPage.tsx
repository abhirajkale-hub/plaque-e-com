import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { mockCMSPages } from '@/data/mockProducts';

interface CMSPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
}

const CMSPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    // Simulate loading delay
    setTimeout(() => {
      const foundPage = mockCMSPages.find(p => p.slug === slug);
      
      if (foundPage) {
        setPage(foundPage);
        
        // Update meta tags
        if (foundPage.meta_title) {
          document.title = foundPage.meta_title;
        }
        if (foundPage.meta_description) {
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute('content', foundPage.meta_description);
        }
      }
      setLoading(false);
    }, 300);
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col noise-texture">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 max-w-4xl">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : page ? (
            <Card className="glass-card">
              <CardContent className="pt-6">
                <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
                <div 
                  className="prose prose-slate max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: page.content }} 
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
                <p className="text-muted-foreground">
                  The page you're looking for doesn't exist.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CMSPage;