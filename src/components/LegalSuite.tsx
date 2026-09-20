import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  AlertTriangle, 
  Send, 
  Lock, 
  HelpCircle, 
  Copy, 
  Check, 
  ExternalLink,
  Info,
  ChevronRight,
  X,
  ShieldCheck,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export interface TakedownPayload {
  copyrightOwner: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone?: string;
  claimantRole: string;
  workTitle: string;
  infringingWork: string;
  jurisdiction: string;
  goodFaithStatement: boolean;
  accuracyStatement: boolean;
  electronicSignature: string;
}

interface TakedownFormProps {
  initialTrack?: string;
  onSuccess?: (ticketId: string) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const TakedownForm: React.FC<TakedownFormProps> = ({ 
  initialTrack = '', 
  onSuccess,
  isModal = false,
  onClose
}) => {
  const [formData, setFormData] = useState<TakedownPayload>({
    copyrightOwner: '',
    claimantName: '',
    claimantEmail: '',
    claimantPhone: '',
    claimantRole: 'Copyright Owner',
    workTitle: '',
    infringingWork: initialTrack,
    jurisdiction: 'United States / International',
    goodFaithStatement: false,
    accuracyStatement: false,
    electronicSignature: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<{
    ticketId: string;
    receivedAt: string;
    message: string;
    claimantEmail: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const formTopRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.copyrightOwner.trim()) {
      setError('Please state the legal copyright owner or rights holding company.');
      scrollToError();
      return;
    }
    if (!formData.claimantName.trim()) {
      setError('Please provide your full legal name.');
      scrollToError();
      return;
    }
    if (!formData.claimantEmail.trim() || !formData.claimantEmail.includes('@')) {
      setError('Please provide a valid official email address for DMCA communications.');
      scrollToError();
      return;
    }
    if (!formData.workTitle.trim()) {
      setError('Please describe the copyrighted original work (Song Title, Album, or ISRC).');
      scrollToError();
      return;
    }
    if (!formData.infringingWork.trim()) {
      setError('Please provide the Spotiz Track ID, URL, or Title & Artist being reported.');
      scrollToError();
      return;
    }
    if (!formData.goodFaithStatement || !formData.accuracyStatement) {
      setError('You must review and check both legal sworn statements under penalty of perjury.');
      scrollToError();
      return;
    }
    if (!formData.electronicSignature.trim()) {
      setError('Please type your legal name as an electronic signature.');
      scrollToError();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/legal/takedown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || data?.message || 'Failed to submit notice.');
      }
      setTicket(data.data);
      if (onSuccess) {
        onSuccess(data.data.ticketId);
      }
    } catch (err: any) {
      setError(err.message || 'Network error while submitting takedown notice.');
      scrollToError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToError = () => {
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const copyTicketId = () => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (ticket) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-[#141414] border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-left shadow-2xl space-y-6">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-bold text-white tracking-tight">DMCA Takedown Notice Filed</h3>
              <p className="text-xs sm:text-sm text-neutral-400">Logged into official compliance review queue</p>
            </div>
          </div>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Ticket Reference Box */}
        <div className="bg-black/60 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">Notice Ticket Reference</span>
            <button 
              type="button"
              onClick={copyTicketId}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer border border-emerald-500/20 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Ticket ID'}</span>
            </button>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-white tracking-wider break-all select-all">
            {ticket.ticketId}
          </div>
          <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 border-t border-white/5">
            <span>Received: <strong className="text-neutral-200 font-mono">{new Date(ticket.receivedAt).toLocaleString()}</strong></span>
            <span>Contact: <strong className="text-neutral-200">{ticket.claimantEmail}</strong></span>
          </div>
        </div>

        {/* Next Steps & Aggregator Policy */}
        <div className="space-y-3 text-xs sm:text-sm text-neutral-300 leading-relaxed bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 sm:p-5">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>Investigation & Delisting Procedure</span>
          </h4>
          <ul className="space-y-2 text-xs text-neutral-400 pl-1">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <span>Compliance officers inspect the reported track metadata and resolving stream endpoint.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <span>Verified entries are expedited for catalog delisting and stream link blocking within <strong>24 to 48 business hours</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <span>A confirmation record is permanently logged against ticket reference <strong className="text-white font-mono">{ticket.ticketId}</strong>.</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button 
            type="button"
            onClick={() => {
              setTicket(null);
              setFormData({
                copyrightOwner: '',
                claimantName: '',
                claimantEmail: '',
                claimantPhone: '',
                claimantRole: 'Copyright Owner',
                workTitle: '',
                infringingWork: '',
                jurisdiction: 'United States / International',
                goodFaithStatement: false,
                accuracyStatement: false,
                electronicSignature: ''
              });
            }}
            className="w-full sm:w-auto px-6 py-3 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer text-center"
          >
            Submit Another Notice
          </button>
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 bg-white text-black hover:bg-neutral-200 active:scale-95 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer text-center"
            >
              Done & Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={formTopRef} className="w-full max-w-3xl mx-auto">
      <form 
        onSubmit={handleSubmit} 
        className="w-full bg-[#141414] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 text-left shadow-2xl relative"
      >
        {/* Header */}
        <div className="border-b border-white/10 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>DMCA Intake & Takedown Portal</span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Report Copyright Infringement
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 leading-relaxed">
                Submit an official notice of claimed infringement under 17 U.S.C. § 512(c) and international intellectual property legislation.
              </p>
            </div>
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Aggregator & Non-Piracy Notice */}
          <div className="mt-4 p-3.5 sm:p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200 text-xs leading-relaxed space-y-1.5">
            <div className="font-bold uppercase tracking-wider text-amber-300 text-[11px] sm:text-xs flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Official Non-Piracy & Content Aggregation Notice</span>
            </div>
            <p className="text-neutral-300 text-[11px] sm:text-xs">
              Spotiz strictly does <strong>NOT engage in piracy</strong> and does <strong>NOT host, download, copy, rip, or store copyrighted audio media</strong> on its servers. Spotiz operates exclusively as an audio search indexer and client aggregator that displays public metadata and stream links provided by external music platforms and official music APIs where songs are originally hosted. Completing this form initiates swift delisting from our search index and blocks resolving streams.
            </p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 bg-rose-950/50 border border-rose-500/40 rounded-xl text-rose-200 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-rose-300 mb-0.5">Verification Error</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* SECTION 1: Rights Holder & Claimant Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-white/5 pb-1.5">
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">1</span>
            <span>Copyright Holder & Claimant Contact</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Copyright Owner / Organization <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Universal Music Group, Sony, or Artist Name"
                value={formData.copyrightOwner}
                onChange={e => setFormData({ ...formData, copyrightOwner: e.target.value })}
                className="w-full px-3.5 py-2.5 sm:py-3 bg-black/50 border border-white/15 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Your Legal Role <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.claimantRole}
                onChange={e => setFormData({ ...formData, claimantRole: e.target.value })}
                className="w-full px-3.5 py-2.5 sm:py-3 bg-[#1e1e1e] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all"
              >
                <option value="Copyright Owner">Direct Copyright Owner / Creator</option>
                <option value="Authorized Legal Counsel">Authorized Legal Counsel</option>
                <option value="Exclusive Rights Agent">Exclusive Rights Agent / Distributor</option>
                <option value="Publishing Administrator">Publishing Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Claimant Legal Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Full First and Last Name"
                value={formData.claimantName}
                onChange={e => setFormData({ ...formData, claimantName: e.target.value })}
                className="w-full px-3.5 py-2.5 sm:py-3 bg-black/50 border border-white/15 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Official Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="legal@company.com"
                value={formData.claimantEmail}
                onChange={e => setFormData({ ...formData, claimantEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 sm:py-3 bg-black/50 border border-white/15 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.claimantPhone}
                onChange={e => setFormData({ ...formData, claimantPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 sm:py-3 bg-black/50 border border-white/15 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Country / Legal Jurisdiction
              </label>
              <input
                type="text"
                placeholder="e.g. United States, India, EU, Worldwide"
                value={formData.jurisdiction}
                onChange={e => setFormData({ ...formData, jurisdiction: e.target.value })}
                className="w-full px-3.5 py-2.5 sm:py-3 bg-black/50 border border-white/15 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Work Identification */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-white/5 pb-1.5">
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">2</span>
            <span>Work Identification & Source Location</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Original Copyrighted Work Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="Exact Song Title, Artist Name, Album, ISRC, or Link to official authorized release verifying your ownership."
                value={formData.workTitle}
                onChange={e => setFormData({ ...formData, workTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Location on Spotiz (Track Title, Artist, or URL) <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="Paste the Spotiz Track ID, URL, or Title & Artist combination as shown in Spotiz search."
                value={formData.infringingWork}
                onChange={e => setFormData({ ...formData, infringingWork: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Sworn Declarations */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-white/5 pb-1.5">
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">3</span>
            <span>Sworn Legal Declarations</span>
          </div>

          <div className="space-y-2.5">
            <label className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={formData.goodFaithStatement}
                onChange={e => setFormData({ ...formData, goodFaithStatement: e.target.checked })}
                className="mt-1 w-4 h-4 rounded border-white/20 text-[#1DB954] focus:ring-0 focus:ring-offset-0 bg-neutral-900 cursor-pointer flex-shrink-0"
              />
              <span className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                I have a <strong>good-faith belief</strong> that use of the copyrighted material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
              </span>
            </label>

            <label className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={formData.accuracyStatement}
                onChange={e => setFormData({ ...formData, accuracyStatement: e.target.checked })}
                className="mt-1 w-4 h-4 rounded border-white/20 text-[#1DB954] focus:ring-0 focus:ring-offset-0 bg-neutral-900 cursor-pointer flex-shrink-0"
              />
              <span className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                I swear, <strong>under penalty of perjury</strong>, that the information in this notice is accurate and that I am the copyright owner or authorized to act on behalf of the owner.
              </span>
            </label>
          </div>
        </div>

        {/* SECTION 4: Electronic Signature */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-white/5 pb-1.5">
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">4</span>
            <span>Electronic Signature</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Type Full Legal Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="/s/ Full Legal Name"
                value={formData.electronicSignature}
                onChange={e => setFormData({ ...formData, electronicSignature: e.target.value })}
                className="w-full px-3.5 py-2.5 sm:py-3 bg-black/50 border border-white/15 rounded-xl text-sm font-mono text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all"
              />
              <Lock className="w-4 h-4 text-neutral-500 absolute right-3.5 top-3 sm:top-3.5 pointer-events-none" />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Typing your legal name constitutes an electronic signature under the U.S. E-SIGN Act and international digital signature laws.
            </p>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] sm:text-xs text-neutral-400 text-center sm:text-left leading-normal">
            Notices are processed per 17 U.S.C. § 512 and verified within 24-48 business hours.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-full shadow-xl shadow-rose-950/50 hover:shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Notice...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Official DMCA Notice</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export const SecurityReportForm: React.FC = () => {
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterEmail: '',
    reportType: 'vulnerability',
    severity: 'medium',
    description: '',
    stepsToReproduce: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<{ reportId: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.reporterEmail.trim() || !formData.reporterEmail.includes('@')) {
      setError('Please provide a valid contact email address.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please provide a description of the issue or inquiry.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/legal/security-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || data?.message || 'Failed to submit report.');
      }
      setReportResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Network error while submitting report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (reportResult) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-[#141414] border border-[#1DB954]/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-left shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-[#1DB954]">
          <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-bold text-white">Report Successfully Logged</h3>
            <p className="text-sm text-neutral-400">Reference: <span className="font-mono text-white">{reportResult.reportId}</span></p>
          </div>
        </div>
        <p className="text-sm text-neutral-300 leading-relaxed">
          {reportResult.message} We appreciate your partnership in maintaining the integrity and privacy of Spotiz.
        </p>
        <button
          type="button"
          onClick={() => {
            setReportResult(null);
            setFormData({
              reporterName: '',
              reporterEmail: '',
              reportType: 'vulnerability',
              severity: 'medium',
              description: '',
              stepsToReproduce: ''
            });
          }}
          className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
        >
          Submit Another Inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto bg-[#141414] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-5 text-left shadow-xl">
      <div className="border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-cyan-400 mb-1">
          <Lock className="w-4 h-4" />
          <span className="text-xs uppercase font-bold tracking-wider">Responsible Disclosure & Privacy</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white">Security Vulnerability or Privacy Report</h3>
        <p className="text-xs text-neutral-400 mt-0.5">
          Report technical vulnerabilities, data handling inquiries, or local cache deletion requests privately.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Your Name / Handle (Optional)
          </label>
          <input
            type="text"
            placeholder="Security Researcher or Name"
            value={formData.reporterName}
            onChange={e => setFormData({ ...formData, reporterName: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#1DB954]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Contact Email <span className="text-rose-400">*</span>
          </label>
          <input
            type="email"
            required
            placeholder="researcher@example.com"
            value={formData.reporterEmail}
            onChange={e => setFormData({ ...formData, reporterEmail: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#1DB954]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Report Category
          </label>
          <select
            value={formData.reportType}
            onChange={e => setFormData({ ...formData, reportType: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-[#202020] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#1DB954]"
          >
            <option value="vulnerability">Security Vulnerability (XSS, Auth, API)</option>
            <option value="privacy_inquiry">Privacy / Data Handling Inquiry</option>
            <option value="data_request">Account / Cloud Data Deletion Request</option>
            <option value="other_security">Other Security or Infrastructure Finding</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Estimated Severity
          </label>
          <select
            value={formData.severity}
            onChange={e => setFormData({ ...formData, severity: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-[#202020] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#1DB954]"
          >
            <option value="low">Low (Cosmetic, minor header missing)</option>
            <option value="medium">Medium (Potential data leakage, bypass)</option>
            <option value="high">High (Privilege escalation, auth flaw)</option>
            <option value="critical">Critical (Remote code execution)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
          Summary & Technical Description <span className="text-rose-400">*</span>
        </label>
        <textarea
          required
          rows={3}
          placeholder="Describe the flaw, affected endpoint, and theoretical impact..."
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#1DB954] resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
          Steps to Reproduce / Proof of Concept
        </label>
        <textarea
          rows={3}
          placeholder="1. Navigate to... 2. Inspect request... 3. Notice behavior..."
          value={formData.stepsToReproduce}
          onChange={e => setFormData({ ...formData, stepsToReproduce: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-sm font-mono text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#1DB954] resize-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <p className="text-[11px] text-neutral-500">
          All vulnerability disclosures remain strictly private until a fix is published.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs rounded-full shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'Sending...' : 'Submit Report'}</span>
        </button>
      </div>
    </form>
  );
};

export const LegalSuiteManager: React.FC = () => {
  const [takedownContainer, setTakedownContainer] = useState<HTMLElement | null>(null);
  const [securityContainer, setSecurityContainer] = useState<HTMLElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Universal Navigation & Click Handler
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a, button, [role="button"]') as HTMLElement | null;
      if (!target) return;

      const href = target.getAttribute('href') || '';
      const text = (target.textContent || '').trim();
      const id = target.id || '';

      const isDmcaAction = 
        href === '#report-copyright' || 
        id === 'btn-open-dmca-takedown' ||
        text.includes('Open DMCA Takedown Intake Form') || 
        text.includes('Open DMCA Policy') || 
        text.includes('Submit DMCA Notice') ||
        text.includes('Submit Takedown');

      if (isDmcaAction) {
        e.preventDefault();
        e.stopPropagation();

        // 1. Try global navigator
        let navigated = false;
        if (typeof (window as any).__spotizNavigate === 'function') {
          try {
            (window as any).__spotizNavigate({ type: 'info', pageId: 'report-copyright' });
            navigated = true;
          } catch (err) {
            console.warn('__spotizNavigate call failed:', err);
          }
        }

        // 2. Dispatch custom event
        window.dispatchEvent(new CustomEvent('spotiz:navigate', { 
          detail: { type: 'info', pageId: 'report-copyright' } 
        }));

        // 3. Scroll to top/form container smoothly
        setTimeout(() => {
          const mainEl = document.querySelector('main');
          if (mainEl) {
            mainEl.scrollTo({ top: 0, behavior: 'smooth' });
          }
          const formContainer = document.getElementById('takedown-form-container');
          if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (!navigated) {
            // Fallback to overlay modal if not on page
            setIsModalOpen(true);
          }
        }, 120);
      }
    };

    const handleOpenModal = () => {
      setIsModalOpen(true);
    };

    document.addEventListener('click', handleGlobalClick, true);
    window.addEventListener('spotiz:open-dmca-modal', handleOpenModal);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      window.removeEventListener('spotiz:open-dmca-modal', handleOpenModal);
    };
  }, []);

  // Continuous DOM scanner for in-page containers
  useEffect(() => {
    const scanContainers = () => {
      const tc = document.getElementById('takedown-form-container');
      const sc = document.getElementById('security-form-container');
      setTakedownContainer(tc);
      setSecurityContainer(sc);
    };

    scanContainers();
    const observer = new MutationObserver(scanContainers);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* In-page container portal */}
      {takedownContainer && createPortal(<TakedownForm />, takedownContainer)}
      {securityContainer && createPortal(<SecurityReportForm />, securityContainer)}

      {/* Universal Floating Modal Fallback */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto my-auto custom-scrollbar">
            <TakedownForm isModal={true} onClose={() => setIsModalOpen(false)} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
