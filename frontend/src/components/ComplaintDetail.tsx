import {
  ArrowLeft,
  Clock,
  User,
  MessageSquare,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

import { useState } from 'react';
import { updateComplaintStatus } from '@/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  complaint: any;
  role: string;
  onBack: () => void;
}

export function ComplaintDetail({ complaint, role, onBack }: Props) {
  const c = complaint;
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';

  const queryClient = useQueryClient();

  const [resolutionText, setResolutionText] = useState(
    c.ai_generated_response || c.ai_draft_response || ''
  );

  const mutation = useMutation({
    mutationFn: ({
      status,
      resolution,
    }: {
      status: string;
      resolution?: string;
    }) => updateComplaintStatus(c._id, status, resolution),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['complaints'],
      });

      toast.success('Complaint status updated successfully');
      onBack();
    },
  });

  const message = c.consumer_complaint_narrative || c.message || c.text_content || '';
  const template = c.ai_generated_response || c.ai_suggested_resolution_template || c.ai_draft_response || '';

  const events = c.communication_history || c.events || [
    {
      type: 'created',
      actor: 'System',
      description: 'Complaint Registered',
      timestamp: c.date_received || c.created_at,
    },
    {
      type: 'ai_analysis',
      actor: 'AI Engine',
      description: 'Categorization and Severity assigned',
      timestamp: c.date_received || c.created_at,
    },
  ];

  const keywords = c.keywords_extracted || c.keywords || [];

  const eventIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <MessageSquare className="w-3.5 h-3.5" />;

      case 'ai_analysis':
        return <Shield className="w-3.5 h-3.5" />;

      case 'escalated':
        return (
          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
        );

      case 'assigned':
        return <User className="w-3.5 h-3.5" />;

      case 'resolution':
        return <CheckCircle className="w-3.5 h-3.5 text-success" />;

      case 'agent_approval':
        return <CheckCircle className="w-3.5 h-3.5 text-success" />;

      case 'agent_review':
        return <User className="w-3.5 h-3.5" />;

      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="stat-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-bold font-mono text-foreground">
                {c.complaint_id}
              </h2>

              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium badge-severity-${(c.severity_label || 'medium').toLowerCase()}`}
              >
                {c.severity_label}
              </span>

              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium channel-badge-${(c.submitted_via || 'web').toLowerCase()}`}
              >
                {c.submitted_via}
              </span>

              <span className="text-xs font-bold text-primary">
                Priority Rank: #{c.serial_priority_order || '-'}
              </span>
            </div>

            <p className="text-sm text-foreground">
              {c.customer_name}{' '}
              <span className="text-muted-foreground">
                ({c.customer_id})
              </span>
            </p>

            {c.state && (
              <p className="text-xs text-muted-foreground mt-0.5">
                📍 {c.state}, {c.zip_code}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              Product / Issue
            </p>

            <p className="text-sm font-semibold text-foreground">
              {c.product} → {c.issue}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Sentiment:{' '}
              {c.sentiment_label === 'Positive'
                ? '�'
                : c.sentiment_label === 'Negative'
                ? '�'
                : '😐'}{' '}
              {c.sentiment_label}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Original Message */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Original Complaint
          </h3>

          <p className="text-sm text-foreground leading-relaxed bg-muted/50 rounded-lg p-4">
            {message}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {keywords.map((k: string) => (
              <span
                key={k}
                className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
              >
                {k}
              </span>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Communication History
          </h3>

          <div className="space-y-3">
            {events.map((e: any, i: number) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {eventIcon(e.type)}
                  </div>

                  {i < events.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>

                <div className="pb-3">
                  <p className="text-xs font-medium text-foreground">
                    {e.description}
                  </p>

                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {e.actor} •{' '}
                    {new Date(e.timestamp).toLocaleString(
                      'en-IN',
                      {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resolution */}
      {(isAdmin || isManager) && (
        <div className="stat-card border-l-4 border-l-success">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            AI Generated Draft Resolution
          </h3>

          <textarea
            className="w-full text-sm text-muted-foreground leading-relaxed bg-muted/30 border border-border rounded-lg p-3 min-h-[120px] focus:outline-none focus:ring-1 focus:ring-success/50"
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
          />

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={() =>
                mutation.mutate({
                  status: 'Resolved',
                  resolution: resolutionText,
                })
              }
              className="px-4 py-2 bg-success text-white text-xs font-semibold rounded-lg hover:bg-success/90 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark as Resolved
            </button>

            <button
              onClick={() =>
                mutation.mutate({
                  status: 'In Progress',
                })
              }
              className="px-4 py-2 bg-warning text-warning-foreground text-xs font-semibold rounded-lg hover:bg-warning/90 transition-colors flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Keep Ongoing
            </button>
          </div>
        </div>
      )}

      {/* Related Complaints */}
      {c.related_complaints &&
        c.related_complaints.length > 0 && (
          <div className="stat-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              🔗 Related / Duplicate Complaints
            </h3>

            <div className="flex flex-wrap gap-2">
              {c.related_complaints.map((id: string) => (
                <span
                  key={id}
                  className="text-xs font-mono px-3 py-1.5 bg-muted rounded-lg text-foreground"
                >
                  {id}
                </span>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground mt-2">
              Identified by AI categorization engine based on
              product-type match and keyword similarity.
            </p>
          </div>
        )}

      {/* SLA */}
      <div className="stat-card">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          SLA Information
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Created
            </p>
            <p className="text-xs font-medium">
              {new Date(c.date_received || c.created_at).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              SLA Deadline
            </p>
            <p className="text-xs font-medium">
              {new Date(c.sla_deadline).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Status
            </p>
            <p className="text-xs font-bold uppercase text-primary">
              {c.status || 'Open'}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Escalation Level
            </p>
            <p className="text-xs font-medium">
              {c.escalation_level || 'None'}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              SLA Status
            </p>
            <p className={`text-xs font-bold uppercase ${c.sla_status === 'Breached' ? 'text-destructive' : 'text-success'}`}>
              {c.sla_status || 'On Track'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}