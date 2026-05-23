import { useMemo, useState } from 'react';
import { Brain, Database, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { fetchRootCause, fetchComplaints } from '@/api';

interface Complaint {
  _id: string;
  complaint_id?: string;
  product?: string;
  severity_label?: string;
  consumer_complaint_narrative?: string;
  sub_issue?: string;
}

export function RootCausePanel() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('Credit Card');

  const {
    data: complaints = [],
    isLoading: isLoadingComplaints,
  } = useQuery<Complaint[]>({
    queryKey: ['complaints'],
    queryFn: fetchComplaints,
  });

  // Extract unique products safely
  const products = useMemo(() => {
    const extractedProducts = Array.from(
      new Set(
        complaints
          .map((c) => c.product)
          .filter((p): p is string => Boolean(p))
      )
    );

    return extractedProducts.length > 0
      ? extractedProducts
      : [
          'Credit Card',
          'Savings Account',
          'Loans',
          'UPI',
          'ATM',
          'Net Banking',
        ];
  }, [complaints]);

  const handleAnalyze = async (productToAnalyze?: string) => {
    const targetProduct = productToAnalyze || selectedProduct;

    setLoading(true);
    setResult(null);

    try {
      const data = await fetchRootCause(targetProduct);

      setResult(
        data?.root_cause ||
          'No root cause insights were generated.'
      );
    } catch (error) {
      console.error('Root cause analysis failed:', error);

      setResult(
        'Error performing analysis. Please ensure the backend is running and the Groq API key is configured properly.'
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = useMemo(() => {
    return complaints
      .filter((c) => c.product === selectedProduct)
      .slice(0, 10);
  }, [complaints, selectedProduct]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Root Cause AI Analysis
        </h2>

        <p className="text-sm text-muted-foreground mt-1">
          LLM-powered pattern recognition across complaint
          categories
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL */}
        <div className="lg:col-span-2 space-y-6">
          <div className="stat-card">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Generate Insights
            </h3>

            {/* Product Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {products.map((product) => (
                <button
                  key={product}
                  onClick={() => {
                    setSelectedProduct(product);
                    handleAnalyze(product);
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedProduct === product
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {product}
                </button>
              ))}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />

                <p className="text-sm text-muted-foreground animate-pulse text-center">
                  AI is scanning {selectedProduct} complaints
                  for root causes...
                </p>
              </div>
            ) : result ? (
              /* Result */
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 prose prose-sm max-w-none">
                {result.split('\n').map((line, index) => {
                  const cleanedLine = line.replace(/\*\*/g, '');

                  if (
                    line.startsWith('**') ||
                    line.includes(':')
                  ) {
                    return (
                      <p
                        key={index}
                        className="text-sm font-bold text-primary mb-2"
                      >
                        {cleanedLine}
                      </p>
                    );
                  }

                  return line.trim() ? (
                    <p
                      key={index}
                      className="text-xs text-foreground/80 leading-relaxed mb-3"
                    >
                      {cleanedLine}
                    </p>
                  ) : (
                    <div key={index} className="h-2" />
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-xl border border-dashed">
                <Brain className="w-12 h-12 text-muted-foreground/30 mb-3" />

                <p className="text-sm text-muted-foreground font-medium">
                  Select a product above to identify underlying
                  issues
                </p>

                <p className="text-[10px] text-muted-foreground/60 mt-1 max-w-[220px]">
                  The AI will analyze narrative complaint
                  patterns from the database
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">
          <div className="stat-card h-full">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              Source Context: {selectedProduct}
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {isLoadingComplaints ? (
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-muted animate-pulse rounded-lg"
                  />
                ))
              ) : filteredComplaints.length > 0 ? (
                filteredComplaints.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="p-3 bg-muted/40 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-primary">
                        {complaint.complaint_id || 'N/A'}
                      </span>

                      <span
                        className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase font-bold badge-severity-${(
                          complaint.severity_label || 'low'
                        ).toLowerCase()}`}
                      >
                        {complaint.severity_label || 'LOW'}
                      </span>
                    </div>

                    <p className="text-[11px] text-foreground line-clamp-3 leading-relaxed">
                      {complaint.consumer_complaint_narrative ||
                        'No narrative available.'}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-[9px] text-muted-foreground">
                      <AlertCircle className="w-3 h-3" />

                      <span>
                        {complaint.sub_issue ||
                          'General Issue'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-xs text-muted-foreground">
                    No recent complaints found for this
                    product.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}