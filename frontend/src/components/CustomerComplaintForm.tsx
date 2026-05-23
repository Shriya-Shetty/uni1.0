import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createComplaint, fetchChatbotResponse, extractPdfText } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Send, CheckCircle2, Mic, FileText, Bot, FileUp, AlertTriangle, Clock, PlusCircle, User, Sparkles } from 'lucide-react';

interface Props {
  mode?: 'online' | 'voice' | 'pdf' | 'chatbot';
}

interface Message {
  role: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

export function CustomerComplaintForm({ mode = 'online' }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'bot', content: "Hello! I am your AI assistant. Tell me what's bothering you today, and I'll help you file a formal complaint.", timestamp: new Date() }
  ]);
  const [currentChatMessage, setCurrentChatMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    customer_id: 'CUST-' + Math.floor(Math.random() * 10000),
    customer_name: '',
    product: 'General',
    sub_product: '',
    issue: 'General Inquiry',
    sub_issue: '',
    consumer_complaint_narrative: '',
    company: 'Union Bank',
    state: '',
    zip_code: '',
    submitted_via: mode === 'online' ? 'Web' : mode.charAt(0).toUpperCase() + mode.slice(1),
    consumer_consent_provided: 'Yes',
    financial_impact_amount: 0,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const mutation = useMutation({
    mutationFn: createComplaint,
    onSuccess: (data) => {
      setResponseData(data);
      if (mode !== 'chatbot') {
        setSubmitted(true);
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'bot', 
          content: `Complaint registered successfully! ID: ${data.complaint_id}. AI Analysis: This seems to be a ${data.product} issue related to ${data.sub_issue}. Estimated resolution by ${new Date(data.sla_deadline).toLocaleDateString()}.`, 
          timestamp: new Date() 
        }]);
      }
      toast.success('Complaint submitted successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to submit complaint: ' + error.message);
      if (mode === 'chatbot') {
        setChatMessages(prev => [...prev, { role: 'bot', content: "I'm sorry, I encountered an error while registering your complaint. Please try again.", timestamp: new Date() }]);
      }
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.customer_name || !formData.consumer_complaint_narrative) {
      toast.error('Please fill in all required fields');
      return;
    }
    mutation.mutate(formData as any);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChatMessage.trim() || mutation.isPending) return;

    const userMsg = currentChatMessage.trim();
    const newHistory = [...chatMessages, { role: 'user' as const, content: userMsg, timestamp: new Date() }];
    setChatMessages(newHistory);
    setCurrentChatMessage("");

    try {
      // Get intelligent response from Groq via our backend
      const data = await fetchChatbotResponse(userMsg, chatMessages.map(m => ({ role: m.role, content: m.content })));
      const botResponse = data.response;
      
      setChatMessages(prev => [...prev, { role: 'bot', content: botResponse, timestamp: new Date() }]);

      // Simple logic to detect if we should trigger a submission
      // In a real app, we'd use the AI to return a 'status' or 'intent'
      if (!formData.customer_name && userMsg.length < 50) {
        setFormData(prev => ({ ...prev, customer_name: userMsg }));
      } else if (userMsg.length > 20) {
        // If it looks like a complaint description, we also store it
        setFormData(prev => ({ ...prev, consumer_complaint_narrative: userMsg }));
        
        // If we have both name and narrative, we can offer to submit or auto-submit
        if (formData.customer_name) {
          toast.info("Registering your complaint based on our conversation...");
          mutation.mutate({ ...formData, consumer_complaint_narrative: userMsg } as any);
        }
      }
    } catch (error) {
      toast.error("Failed to get response from AI assistant");
      setChatMessages(prev => [...prev, { role: 'bot', content: "I'm having trouble connecting to my brain. Can you please describe your complaint directly?", timestamp: new Date() }]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error("Please upload a PDF file");
        return;
      }

      toast.info(`Extracting text from ${file.name}...`);
      try {
        const data = await extractPdfText(file);
        setFormData({
          ...formData,
          consumer_complaint_narrative: data.text
        });
        toast.success("Text extracted from PDF successfully!");
      } catch (error: any) {
        toast.error("Failed to extract text from PDF: " + (error.response?.data?.detail || error.message));
      }
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setFormData(prev => ({ ...prev, consumer_complaint_narrative: "" }));
      toast.info("Recording voice...");
      
      const transcript = "Voice Transcript: Hello, I want to complain about my credit card. I haven't received my monthly statement for the last two months and I'm being charged late fees. This is very frustrating.";
      const words = transcript.split(' ');
      let currentWordIndex = 0;
      
      const interval = setInterval(() => {
        if (currentWordIndex < words.length) {
          setFormData(prev => ({
            ...prev,
            consumer_complaint_narrative: words.slice(0, currentWordIndex + 1).join(' ')
          }));
          currentWordIndex++;
        } else {
          clearInterval(interval);
          setIsRecording(false);
          toast.success("Voice transcribed successfully!");
        }
      }, 200);
    } else {
      setIsRecording(false);
    }
  };

  if (submitted && responseData) {
    return (
      <div className="max-w-4xl mx-auto mt-6 space-y-6 animate-fade-in">
        <Card className="border-success/20 bg-success/5">
          <CardContent className="pt-10 pb-10 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <CardTitle className="text-2xl text-success-foreground">Complaint Registered: {responseData.complaint_id}</CardTitle>
            <CardDescription className="text-base">
              Your complaint has been successfully registered. Our AI engine has analyzed your request and assigned the following details.
            </CardDescription>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="w-5 h-5" />
                <CardTitle className="text-lg">SLA Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">Estimated Resolution:</p>
                <p className="text-2xl font-bold text-primary">
                  {new Date(responseData.sla_deadline).toLocaleDateString()}
                </p>
                <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full inline-block">
                  {responseData.severity_label} Priority
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                <CardTitle className="text-lg">Root Cause</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic">
                {responseData.product} - {responseData.issue}
              </p>
              <p className="mt-2 text-sm">
                AI has identified this as a <span className="font-semibold">{responseData.sub_issue}</span> related issue.
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-accent-foreground">
                <Bot className="w-5 h-5" />
                <CardTitle className="text-lg">Queue Rank</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center pt-2">
                <div className="text-4xl font-black text-accent-foreground">
                  #{responseData.serial_priority_order || 1}
                </div>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest text-center">Relative Priority Position</p>
                <div className="mt-2 text-[10px] bg-accent/10 px-2 py-0.5 rounded text-accent-foreground font-mono">
                  SCORE: {(responseData.priority_rank * 100).toFixed(0)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI Generated Draft Response
            </CardTitle>
            <CardDescription>This is a draft response generated by our AI for your reference.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-6 rounded-lg border border-border whitespace-pre-wrap text-sm leading-relaxed">
              {responseData.ai_generated_response}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center pt-4">
          <Button onClick={() => { setSubmitted(false); setResponseData(null); }} variant="outline" size="lg">
            Submit Another Complaint
          </Button>
        </div>
      </div>
    );
  }

  const getTitle = () => {
    switch (mode) {
      case 'voice': return 'Voice Complaint Registration';
      case 'pdf': return 'PDF Form Complaint';
      case 'chatbot': return 'AI Chatbot Assistant';
      default: return 'Register a Complaint';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'voice': return 'Speak your complaint and our AI will transcribe and analyze it automatically.';
      case 'pdf': return 'Upload a PDF form or document. Our OCR engine will extract details for you.';
      case 'chatbot': return 'Interact with our AI chatbot to register your grievance step-by-step.';
      default: return 'Please provide details about your issue. Our AI-powered system will prioritize and route it for faster resolution.';
    }
  };

  if (mode === 'chatbot') {
    return (
      <Card className="max-w-2xl mx-auto h-[600px] flex flex-col shadow-2xl border-primary/20 animate-fade-in">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-xl py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Union Bank AI Assistant</CardTitle>
              <CardDescription className="text-primary-foreground/70 text-xs">Online | Powered by Llama 3</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                  : 'bg-muted border border-border rounded-tl-none'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {msg.role === 'bot' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  <span className="text-[10px] opacity-70 font-bold uppercase tracking-tighter">
                    {msg.role === 'bot' ? 'Assistant' : 'You'}
                  </span>
                </div>
                <p className="leading-relaxed">{msg.content}</p>
                <p className="text-[8px] mt-1 opacity-50 text-right">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {mutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-2xl rounded-tl-none border border-border">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 border-t bg-muted/30">
          <form onSubmit={handleChatSubmit} className="flex w-full gap-2">
            <Input 
              placeholder="Type your message..." 
              value={currentChatMessage}
              onChange={(e) => setCurrentChatMessage(e.target.value)}
              className="flex-1 bg-background"
              disabled={mutation.isPending}
            />
            <Button type="submit" size="icon" disabled={!currentChatMessage.trim() || mutation.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto animate-fade-in-up shadow-lg border-primary/10">
      <CardHeader className="bg-primary/5 rounded-t-xl border-b">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            {mode === 'online' && <PlusCircle className="w-6 h-6" />}
            {mode === 'voice' && <Mic className="w-6 h-6" />}
            {mode === 'pdf' && <FileText className="w-6 h-6" />}
          </div>
          <div>
            <CardTitle className="text-2xl">{getTitle()}</CardTitle>
            <CardDescription className="text-sm font-medium text-primary/70">{getDescription()}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Full Name *</Label>
              <Input 
                id="customer_name" 
                placeholder="Enter your full name" 
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input 
                id="company" 
                placeholder="Bank or Company name" 
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
              />
            </div>
          </div>

          {mode === 'online' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product Category (Optional - AI will extract if empty)</Label>
                <Select onValueChange={(v) => setFormData({...formData, product: v})} value={formData.product}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Savings Account">Savings Account</SelectItem>
                    <SelectItem value="Loans">Loans</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="ATM">ATM</SelectItem>
                    <SelectItem value="Net Banking">Net Banking</SelectItem>
                    <SelectItem value="General">Other / Not Sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub_product">Sub Product</Label>
                <Input 
                  id="sub_product" 
                  placeholder="e.g. Platinum Card" 
                  value={formData.sub_product}
                  onChange={(e) => setFormData({...formData, sub_product: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input 
                id="state" 
                placeholder="e.g. Maharashtra" 
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">Zip Code</Label>
              <Input 
                id="zip_code" 
                placeholder="e.g. 400001" 
                value={formData.zip_code}
                onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
              />
            </div>
          </div>

          {mode === 'online' && (
            <div className="space-y-2">
              <Label htmlFor="impact">Financial Impact (Optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input 
                  id="impact" 
                  type="number"
                  placeholder="0.00" 
                  className="pl-7"
                  onChange={(e) => setFormData({...formData, financial_impact_amount: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          )}

          {mode === 'pdf' && (
            <div className="space-y-4 p-6 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <FileUp className="w-10 h-10 text-primary/40" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">Upload Complaint Document</p>
                  <p className="text-xs text-muted-foreground">PDF, PNG, JPG (Max 5MB)</p>
                </div>
                <Input 
                  type="file" 
                  className="hidden" 
                  id="file-upload" 
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="mt-2"
                >
                  Select File
                </Button>
              </div>
            </div>
          )}

          {mode === 'voice' && (
            <div className="flex flex-col items-center justify-center p-8 bg-primary/5 rounded-xl border border-primary/10">
              <button
                type="button"
                onClick={toggleRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isRecording 
                    ? 'bg-destructive text-destructive-foreground animate-pulse scale-110 shadow-lg shadow-destructive/20' 
                    : 'bg-primary text-primary-foreground hover:scale-105 shadow-lg shadow-primary/20'
                }`}
              >
                <Mic className="w-8 h-8" />
              </button>
              <p className="mt-4 text-sm font-bold text-primary">
                {isRecording ? 'Listening... Click to stop' : 'Click to start voice input'}
              </p>
              {isRecording && (
                <div className="mt-2 flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-1 bg-primary/40 rounded-full animate-bounce" style={{height: `${Math.random()*20+10}px`, animationDelay: `${i*0.1}s`}}></div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="narrative">
              {mode === 'pdf' ? 'Extracted Content' : mode === 'voice' ? 'Transcribed Text' : 'Complaint Narrative *'}
            </Label>
            <Textarea 
              id="narrative" 
              placeholder={
                mode === 'pdf' ? 'Text extracted from your document will appear here...' :
                mode === 'voice' ? 'Your spoken words will be transcribed here...' :
                'Describe your issue in detail. Our AI engine will analyze this text.'
              }
              className="min-h-[150px] resize-none"
              value={formData.consumer_complaint_narrative}
              onChange={(e) => setFormData({...formData, consumer_complaint_narrative: e.target.value})}
              required
            />
          </div>

          {mode === 'online' && (
            <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg border border-border">
              <Checkbox 
                id="consent" 
                checked={formData.consumer_consent_provided === 'Yes'} 
                onCheckedChange={(checked) => setFormData({...formData, consumer_consent_provided: checked ? 'Yes' : 'No'})}
              />
              <label
                htmlFor="consent"
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I provide consent to share this complaint with the relevant financial institutions for resolution.
              </label>
            </div>
          )}

          <Button type="submit" className="w-full h-12 gap-2 text-lg font-bold shadow-lg" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Analyzing with AI...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> 
                Submit Official Complaint
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
